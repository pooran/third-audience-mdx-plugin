import { NextRequest, NextResponse } from 'next/server';

/**
 * Internal route — called by thirdAudienceMiddleware for every bot HTML request.
 * Runs in Node.js runtime so geoip and DB writes are available.
 *
 * Install at:
 *   app/api/third-audience/track/route.ts
 *   export { GET } from 'third-audience-mdx/routes/track'
 */
declare function GET(req: NextRequest): Promise<NextResponse<unknown>>;

export { GET };
