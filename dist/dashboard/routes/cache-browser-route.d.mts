import { NextRequest, NextResponse } from 'next/server';

/** GET /api/third-audience/cache-browser?search=&limit=50&offset=0 */
declare function GET(req: NextRequest): Promise<NextResponse>;
/** POST /api/third-audience/cache-browser */
declare function POST(req: NextRequest): Promise<NextResponse>;

export { GET, POST };
