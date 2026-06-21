import { NextRequest, NextResponse } from 'next/server';

declare function checkApiAuth(req: NextRequest): Promise<boolean>;
declare function checkDashboardAuth(req: NextRequest): boolean;
declare function unauthorizedResponse(): NextResponse;

export { checkApiAuth, checkDashboardAuth, unauthorizedResponse };
