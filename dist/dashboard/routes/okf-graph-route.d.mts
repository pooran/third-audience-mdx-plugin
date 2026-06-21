import { NextRequest, NextResponse } from 'next/server';

/** GET /api/third-audience/okf-graph — returns graph JSON for the OKF dashboard viewer */
declare function GET(req: NextRequest): Promise<NextResponse>;

export { GET };
