import { NextRequest, NextResponse } from 'next/server';

declare function GET(req: NextRequest): Promise<NextResponse>;
declare function POST(req: NextRequest): Promise<NextResponse>;

export { GET, POST };
