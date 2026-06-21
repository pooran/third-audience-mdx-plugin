import { NextRequest, NextResponse } from 'next/server';

/** GET /api/third-audience/api-key — returns masked key for display */
declare function GET(req: NextRequest): Promise<NextResponse>;
/** POST /api/third-audience/api-key — rotate (regenerate) the API key */
declare function POST(req: NextRequest): Promise<NextResponse>;

export { GET, POST };
