import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/third-audience/digest
 * Body: { period: 'daily' | 'weekly', force?: boolean }
 *
 * Trigger a digest manually or from a cron job (Vercel Cron, GitHub Actions, etc.)
 * Requires the TA_API_KEY header matching the configured key.
 *
 * Example cron (Vercel vercel.json):
 *   { "path": "/api/third-audience/digest", "schedule": "0 8 * * *" }
 */
declare function POST(req: NextRequest): Promise<NextResponse>;
/** GET — health check / last sent status */
declare function GET(req: NextRequest): Promise<NextResponse>;

export { GET, POST };
