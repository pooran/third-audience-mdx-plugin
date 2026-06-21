import { NextRequest, NextResponse } from 'next/server';

/**
 * Handler for /okf/ and /okf/[...slug].md
 * Rewired from middleware to /api/third-audience/okf/[...path]
 */
declare function GET(req: NextRequest, { params }: {
    params: Promise<{
        path?: string[];
    }>;
}): Promise<NextResponse<unknown>>;

export { GET };
