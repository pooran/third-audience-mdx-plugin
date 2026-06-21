import { NextRequest, NextResponse } from 'next/server';

/** GET /api/third-audience/analytics?days=30 */
declare function GET(req: NextRequest): Promise<NextResponse<unknown>>;

export { GET };
