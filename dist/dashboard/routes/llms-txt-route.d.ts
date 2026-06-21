import { NextRequest, NextResponse } from 'next/server';

/** Handler for GET /llms.txt → rewired to /api/third-audience/llms-txt */
declare function GET(req: NextRequest): Promise<NextResponse<unknown>>;

export { GET };
