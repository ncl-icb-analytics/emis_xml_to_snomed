import { NextRequest, NextResponse } from 'next/server';
import {
  ExpandCodesRequest,
  ExpandCodesResponse,
  ExpandedCodeSet,
  ValueSetGroup,
} from '@/lib/types';
import { buildBatchedEclQuery, buildUkProductEcl } from '@/lib/ecl-builder';
import {
  expandEclQuery,
  translateEmisCodesToSnomed,
  resolveHistoricalConcepts
} from '@/lib/terminology-client';
import { formatForSql } from '@/lib/sql-formatter';
import { generateValueSetHash, generateValueSetFriendlyName, generateValueSetId } from '@/lib/valueset-utils';

export async function POST(request: NextRequest) {
  try {
    const body: ExpandCodesRequest = await request.json();
    const {
      featureId,
      featureName,
      parentCodes,
      displayNames,
      excludedCodes,
      includeChildren,
      isRefset,
      codeSystems,
      valueSetMapping,
    } = body;

    if (!parentCodes || parentCodes.length === 0) {
      return NextResponse.json<ExpandCodesResponse>(
        { success: false, error: 'No parent codes provided' },
        { status: 400 }
      );
    }

    // Strategy: Try ConceptMap translation for ALL codes
    // If translation succeeds -> use translated code
    // If translation fails (404) -> assume already valid SNOMED
    // This handles unreliable codeSystem labels in XML

    console.log(`Attempting ConceptMap translation for all ${parentCodes.length} codes...`);
    const codeToSnomedMap = await translateEmisCodesToSnomed(parentCodes);
    console.log(`ConceptMap results: ${codeToSnomedMap.size} codes translated, ${parentCodes.length - codeToSnomedMap.size} assumed already SNOMED`);

    // Log first few translated mappings
    let loggedMappings = 0;
    codeToSnomedMap.forEach((translatedCode, originalCode) => {
      if (loggedMappings < 5) {
        console.log(`  Translated: ${originalCode} -> ${translatedCode.code} (${translatedCode.display || 'no display'}, equivalence: ${translatedCode.equivalence || 'unknown'})`);
        loggedMappings++;
      }
    });

    // Collect all SNOMED codes (translated or original if translation failed)
    const allSnomedCodes: string[] = [];
    parentCodes.forEach((code) => {
      const translatedCode = codeToSnomedMap.get(code);
      allSnomedCodes.push(translatedCode?.code || code); // Use translated code if available, else original
    });

    // Resolve historical SNOMED concepts to current ones
    const historicalMap = await resolveHistoricalConcepts(allSnomedCodes);

    // Build values array for ECL construction
    const values: Array<{
      code: string;
      originalCode: string;
      displayName: string;
      includeChildren: boolean;
      isRefset: boolean;
    }> = [];

    parentCodes.forEach((originalCode, idx) => {
      // Try translated code first, fallback to original
      const translatedCode = codeToSnomedMap.get(originalCode);
      const snomedCode = translatedCode?.code || originalCode;

      // Get current concept (resolving historical if needed)
      const currentCode = historicalMap.get(snomedCode) || snomedCode;

      values.push({
        code: currentCode, // Use current SNOMED concept ID
        originalCode, // Keep original code for reference
        displayName: displayNames?.[idx] || '',
        includeChildren: includeChildren[idx] || false,
        isRefset: isRefset?.[idx] || false,
      });
    });

    console.log(`Total codes for ECL query: ${values.length}`);

    // CRITICAL FIX: Expand each ValueSet separately to track which child concepts belong to which ValueSet
    // This prevents the bug where all child concepts were added to any ValueSet with includeChildren=true

    const valueSetGroups: ValueSetGroup[] = [];
    const allExcludedCodes = excludedCodes || [];

    // Track all unique concepts across all ValueSets for the combined SQL output
    const allConceptsMap = new Map<string, any>();

    if (valueSetMapping && valueSetMapping.length > 0) {
      // Expand each ValueSet separately
      for (const mapping of valueSetMapping) {
        const vsOriginalParentCodes = mapping.codeIndices.map((idx) => parentCodes[idx]);
        const vsExcludedCodes = mapping.excludedCodes || [];
        const vsExcludedSet = new Set(vsExcludedCodes);

        // Build values array for this specific ValueSet
        const vsValues = mapping.codeIndices.map((idx) => {
          const originalCode = parentCodes[idx];
          const translatedCode = codeToSnomedMap.get(originalCode);
          const snomedCode = translatedCode?.code || originalCode;
          const currentCode = historicalMap.get(snomedCode) || snomedCode;

          return {
            code: currentCode,
            originalCode,
            translatedSnomedCode: translatedCode?.code, // Store the ConceptMap translated code for SCT_CONST
            displayName: displayNames?.[idx] || '',
            includeChildren: includeChildren[idx] || false,
            isRefset: isRefset?.[idx] || false,
            codeSystem: codeSystems?.[idx] || 'EMISINTERNAL',
          };
        });

        // Handle SCT_CONST codes - expand UK Products for substance codes
        const sctConstCodes = vsValues.filter(v => v.codeSystem === 'SCT_CONST');
        let ukProductConcepts: any[] = [];
        // Track which SCT_CONST codes successfully expanded to products (to exclude from failed codes)
        const successfullyExpandedSctConstCodes = new Set<string>();
        
        if (sctConstCodes.length > 0) {
          console.log(`Found ${sctConstCodes.length} SCT_CONST codes, expanding UK Products...`);
          
          for (const sctConstValue of sctConstCodes) {
            // Use the translated SNOMED code from ConceptMap, not the original XML code
            // If no translation exists, fall back to the resolved code
            const substanceCode = sctConstValue.translatedSnomedCode || sctConstValue.code;
            
            if (!sctConstValue.translatedSnomedCode) {
              console.warn(`  SCT_CONST code ${sctConstValue.originalCode} has no ConceptMap translation, using resolved code ${substanceCode}`);
            }
            
            try {
              // Build UK Product ECL query using the translated substance code
              const ukProductEcl = buildUkProductEcl(substanceCode);
              console.log(`  Expanding UK Products for substance ${substanceCode} (original: ${sctConstValue.originalCode}): ${ukProductEcl}`);
              
              // Expand the ECL query
              const products = await expandEclQuery(ukProductEcl);
              console.log(`  -> Found ${products.length} UK Products for substance ${substanceCode}`);
              
              // If we got products, mark this SCT_CONST code as successfully expanded
              if (products.length > 0) {
                successfullyExpandedSctConstCodes.add(sctConstValue.originalCode);
              }
              
              // Mark all products as from terminology server
              products.forEach((product: any) => {
                product.source = 'terminology_server';
                product.excludeChildren = !sctConstValue.includeChildren;
              });
              
              ukProductConcepts.push(...products);
            } catch (error) {
              console.error(`Error expanding UK Products for substance ${substanceCode}:`, error);
              // Continue with other substances
            }
          }
        }

        // Filter out SCT_CONST codes from normal expansion (they're handled separately)
        const nonSctConstValues = vsValues.filter(v => v.codeSystem !== 'SCT_CONST');
        
        // Build ECL query for non-SCT_CONST codes only
        const eclExpression = nonSctConstValues.length > 0 
          ? buildBatchedEclQuery(nonSctConstValues, vsExcludedCodes)
          : '';

        console.log(`Expanding ValueSet ${mapping.valueSetIndex + 1} with ${nonSctConstValues.length} codes (${sctConstCodes.length} SCT_CONST handled separately)...`);

        let vsConcepts: any[] = [];
        
        // Expand normal codes if any
        if (eclExpression) {
          try {
            vsConcepts = await expandEclQuery(eclExpression);
            console.log(`  -> Got ${vsConcepts.length} concepts for ValueSet ${mapping.valueSetIndex + 1}`);
          } catch (error) {
            console.error(`Error expanding ValueSet ${mapping.valueSetIndex + 1}:`, error);
            // Continue with empty concepts for this ValueSet
          }
        }
        
        // Combine normal concepts with UK Product concepts
        vsConcepts = [...vsConcepts, ...ukProductConcepts];

        // Mark parent codes in this ValueSet and set source
        const vsParentConceptIdSet = new Set(vsValues.map(v => v.code));
        vsConcepts.forEach((concept) => {
          concept.source = 'terminology_server';
          if (vsParentConceptIdSet.has(concept.code)) {
            const valueIndex = vsValues.findIndex(v => v.code === concept.code);
            if (valueIndex !== -1) {
              concept.isRefset = vsValues[valueIndex].isRefset;
              concept.excludeChildren = !vsValues[valueIndex].includeChildren;
            }
          }
          // Add to global concepts map
          if (!allConceptsMap.has(concept.code)) {
            allConceptsMap.set(concept.code, { ...concept });
          }
        });

        // Only include codes that were actually returned by the terminology server
        // Do NOT add codes that weren't found - they should appear in failed codes instead
        // This ensures the "terminology_server" source label is accurate

        // Filter out excluded codes
        const filteredConcepts = vsConcepts.filter(
          (c) => !vsExcludedSet.has(c.code)
        );

        // Mark all concepts as from terminology server
        filteredConcepts.forEach((c) => {
          c.source = 'terminology_server';
        });

        // Check if expansion failed for refsets
        const vsIsRefsetFlags = mapping.codeIndices.map((idx) => isRefset?.[idx] || false);
        const allRefsets = vsIsRefsetFlags.length > 0 && vsIsRefsetFlags.every(flag => flag === true);
        // Check if we only got back the original codes (no expansion happened)
        const originalCodeSet = new Set(vsValues.map(v => v.code));
        const hasOnlyOriginalCodes = filteredConcepts.length > 0 && filteredConcepts.every(c => originalCodeSet.has(c.code));
        const expansionError = allRefsets && hasOnlyOriginalCodes
          ? 'Reference set not found. This reference set is not available in the terminology server.'
          : undefined;

        const vsSqlFormatted = formatForSql(filteredConcepts.map((c) => c.code));

        // Build original codes metadata and track failed codes
        const originalCodesMetadata = mapping.codeIndices.map((idx) => {
          const originalCode = parentCodes[idx];
          const translatedCode = codeToSnomedMap.get(originalCode);
          const snomedCode = translatedCode?.code || originalCode;
          const currentCode = historicalMap.get(snomedCode) || snomedCode;

          return {
            originalCode,
            displayName: displayNames?.[idx] || '',
            codeSystem: codeSystems?.[idx] || 'EMISINTERNAL',
            includeChildren: includeChildren[idx] || false,
            isRefset: isRefset?.[idx] || false,
            translatedTo: translatedCode ? currentCode : undefined,
            translatedToDisplay: translatedCode?.display,
          };
        });

        // Track failed codes - codes that don't appear in expanded concepts
        // Exclude SCT_CONST codes that successfully expanded to UK Products
        const expandedCodeSet = new Set(filteredConcepts.map(c => c.code));
        const failedCodes = originalCodesMetadata
          .filter(oc => {
            // Skip SCT_CONST codes that successfully expanded to UK Products
            // (The substance codes themselves won't appear in expanded concepts, only the products will)
            if (oc.codeSystem === 'SCT_CONST' && successfullyExpandedSctConstCodes.has(oc.originalCode)) {
              return false;
            }
            
            // Code failed if it doesn't appear in expanded concepts
            // Check both the translated code (if available) and the original code
            const translatedCode = oc.translatedTo || oc.originalCode;
            const codeFound = expandedCodeSet.has(translatedCode) || expandedCodeSet.has(oc.originalCode);
            
            return !codeFound;
          })
          .map(oc => ({
            originalCode: oc.originalCode,
            displayName: oc.displayName,
            codeSystem: oc.codeSystem,
            reason: oc.translatedTo 
              ? 'Not found in terminology server expansion'
              : 'No translation found from ConceptMap',
          }));

        const vsSnomedParentCodes = vsValues.map(v => v.code);

        // Generate hash from original XML codes (before translation) for duplicate detection
        const xmlCodes = vsOriginalParentCodes.sort();
        const valueSetHash = generateValueSetHash(xmlCodes);
        const valueSetFriendlyName = generateValueSetFriendlyName(featureName, mapping.valueSetIndex);
        // Generate UUID to use as valueset ID
        const valueSetId = generateValueSetId();

        valueSetGroups.push({
          valueSetId,
          valueSetIndex: mapping.valueSetIndex,
          valueSetHash,
          valueSetFriendlyName,
          valueSetUniqueName: valueSetId, // Use UUID as unique name too
          concepts: filteredConcepts,
          sqlFormattedCodes: vsSqlFormatted,
          parentCodes: vsSnomedParentCodes,
          expansionError,
          failedCodes: failedCodes.length > 0 ? failedCodes : undefined,
          originalCodes: originalCodesMetadata,
        });

        // Small delay between ValueSet expansions to avoid rate limiting
        if (mapping !== valueSetMapping[valueSetMapping.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    } else {
      // No ValueSet mapping - expand all codes together (legacy behavior)
      const BATCH_SIZE = 50;
      const expandedConcepts: any[] = [];

      if (values.length > BATCH_SIZE) {
        for (let i = 0; i < values.length; i += BATCH_SIZE) {
          const batch = values.slice(i, i + BATCH_SIZE);
          const eclExpression = buildBatchedEclQuery(batch, allExcludedCodes);

          try {
            const batchConcepts = await expandEclQuery(eclExpression);
            expandedConcepts.push(...batchConcepts);

            if (i + BATCH_SIZE < values.length) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          } catch (error) {
            console.error(`Error expanding batch:`, error);
          }
        }
      } else {
        const eclExpression = buildBatchedEclQuery(values, allExcludedCodes);
        const concepts = await expandEclQuery(eclExpression);
        expandedConcepts.push(...concepts);
      }

      expandedConcepts.forEach((concept) => {
        allConceptsMap.set(concept.code, concept);
      });
    }

    // Get all concepts from the map for combined SQL output
    const concepts = Array.from(allConceptsMap.values());

    // Format for SQL (all codes combined)
    const sqlFormatted = formatForSql(concepts.map((c) => c.code));

    const result: ExpandedCodeSet = {
      featureId,
      featureName,
      concepts,
      totalCount: concepts.length,
      sqlFormattedCodes: sqlFormatted,
      expandedAt: new Date().toISOString(),
      valueSetGroups: valueSetGroups.length > 0 ? valueSetGroups : undefined,
    };

    return NextResponse.json<ExpandCodesResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorDetails = {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      errorCause: error instanceof Error && (error as any).cause ? {
        message: (error as any).cause?.message,
        name: (error as any).cause?.name
      } : null,
      errorStringified: JSON.stringify(error, Object.getOwnPropertyNames(error || {})).substring(0, 1000)
    };
    
    console.error('Code expansion error - Full details:', errorDetails);
    console.error('Error object:', error);
    
    return NextResponse.json<ExpandCodesResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to expand codes',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
