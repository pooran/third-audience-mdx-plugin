import { NextRequest, NextResponse } from 'next/server';

/** GET /api/third-audience/benchmark?competitor_url=&ai_platform=&sinceDate=&limit=&offset= */
declare function GET(req: NextRequest): Promise<NextResponse>;
/** POST /api/third-audience/benchmark */
declare function POST(req: NextRequest): Promise<NextResponse>;

export { GET, POST };
