import { NextRequest, NextResponse } from 'next/server';

/** Handler for GET /sitemap-ai.xml → rewired to /api/third-audience/sitemap-ai */
declare function GET(req: NextRequest): Promise<NextResponse<unknown>>;

export { GET };
