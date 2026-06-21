import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/third-audience/citation
 * Accepts client-side citation reports from citation-tracker.js
 */
declare function POST(req: NextRequest): Promise<NextResponse<unknown>>;
/**
 * GET /api/third-audience/citation
 * Server-side detection — call from page route handlers if needed.
 */
declare function GET(req: NextRequest): Promise<NextResponse<unknown>>;

export { GET, POST };
