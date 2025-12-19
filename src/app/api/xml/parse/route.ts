import { NextRequest, NextResponse } from 'next/server';
import { parseEmisXml } from '@/lib/xml-parser';
import { ParseXmlRequest, ParseXmlResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ParseXmlRequest = await request.json();
    const { xmlContent } = body;

    if (!xmlContent) {
      return NextResponse.json<ParseXmlResponse>(
        { success: false, error: 'No XML content provided' },
        { status: 400 }
      );
    }

    const parsedData = await parseEmisXml(xmlContent);

    return NextResponse.json<ParseXmlResponse>({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error('XML parsing error:', error);
    return NextResponse.json<ParseXmlResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse XML',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
