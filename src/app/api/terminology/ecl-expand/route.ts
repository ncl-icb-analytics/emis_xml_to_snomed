import { NextRequest, NextResponse } from 'next/server';
import { expandEclPage } from '@/lib/terminology-client';
import { isFhirApiError } from '@/lib/fhir-error-handler';
import { EclExpandResponse } from '@/lib/types';

// One $expand page per invocation — bounded duration and response size.
// ~10k concepts ≈ 1.3MB JSON, well under the 4.5MB function response cap.
const MAX_COUNT = 10000;
const DEFAULT_COUNT = 5000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ecl, offset = 0, count = DEFAULT_COUNT } = body;

    if (!ecl || typeof ecl !== 'string' || !ecl.trim()) {
      return NextResponse.json<EclExpandResponse>(
        { success: false, error: 'No ECL expression provided' },
        { status: 400 }
      );
    }

    const safeCount = Math.min(Math.max(1, Number(count) || DEFAULT_COUNT), MAX_COUNT);
    const safeOffset = Math.max(0, Number(offset) || 0);

    // One retry server-side; the client owns retry policy
    const { concepts, total } = await expandEclPage(ecl, safeOffset, safeCount, 1);

    return NextResponse.json<EclExpandResponse>({
      success: true,
      concepts,
      total,
      offset: safeOffset,
    });
  } catch (error) {
    console.error('ECL expand error:', error);

    // Propagate upstream status so the client classifies retries correctly
    if (isFhirApiError(error)) {
      return NextResponse.json<EclExpandResponse>(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : 'ECL expansion failed';
    const status = /timeout|overloaded|rate limited/i.test(message) ? 504 : 500;
    return NextResponse.json<EclExpandResponse>(
      { success: false, error: message },
      { status }
    );
  }
}

export const maxDuration = 60;
