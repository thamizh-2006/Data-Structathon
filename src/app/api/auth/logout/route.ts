import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getCurrentUser } from '@/lib/auth';
import { terminateAllTeamSessions } from '@/lib/store';

export async function POST() {
  const user = await getCurrentUser();
  if (user && user.role === 'team') {
    await terminateAllTeamSessions(user.teamId);
  }

  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);

  return NextResponse.json({ success: true });
}
