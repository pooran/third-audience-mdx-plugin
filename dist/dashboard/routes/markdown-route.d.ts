import { NextRequest, NextResponse } from 'next/server';

/**
 * Handler for GET /api/third-audience/markdown/[...slug]
 *
 * Install in your Next.js app at:
 *   app/api/third-audience/markdown/[...slug]/route.ts
 */
declare function GET(req: NextRequest, { params }: {
    params: Promise<{
        slug: string[];
    }>;
}): Promise<NextResponse<unknown>>;

export { GET };
