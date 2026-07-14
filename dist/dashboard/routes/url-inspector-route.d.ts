import { NextRequest, NextResponse } from 'next/server';

/** GET /api/third-audience/url-inspector?url=&date_from=&date_to=&date= */
declare function GET(req: NextRequest): Promise<NextResponse>;

export { GET };
