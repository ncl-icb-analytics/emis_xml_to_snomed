import { NextRequest, NextResponse } from 'next/server';
import { getRefsetMembersFromRf2, getRefsetDisplayName } from '@/lib/rf2-refset-parser';
import { Rf2RefsetResponse } from '@/lib/types';

/**
 * Checks which refset IDs exist in the bundled RF2 files and returns their
 * members with RF2 display names. Local file access only — no terminology
 * server calls. Members without an RF2 description have an empty display;
 * the client resolves those via /api/terminology/resolve-historical.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refsetIds } = body;

    if (!Array.isArray(refsetIds) || refsetIds.length === 0) {
      return NextResponse.json<Rf2RefsetResponse>(
        { success: false, error: 'No refset IDs provided' },
        { status: 400 }
      );
    }

    const refsets: Record<string, { members: { code: string; display: string }[]; displayName: string }> = {};

    for (const refsetId of [...new Set(refsetIds as string[])]) {
      const members = getRefsetMembersFromRf2(refsetId);
      if (members) {
        refsets[refsetId] = {
          members: members.map((m) => ({ code: m.code, display: m.display })),
          displayName: getRefsetDisplayName(refsetId),
        };
      }
    }

    return NextResponse.json<Rf2RefsetResponse>({ success: true, refsets });
  } catch (error) {
    console.error('RF2 refset lookup error:', error);
    return NextResponse.json<Rf2RefsetResponse>(
      { success: false, error: error instanceof Error ? error.message : 'RF2 refset lookup failed' },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
