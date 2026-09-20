import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTeamById, getActiveSessionForTeam } from '@/lib/store';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (user.role === 'admin') {
    return NextResponse.json({
      authenticated: true,
      role: 'admin',
      username: user.username,
    });
  }

  // Validate team & session
  const team = await getTeamById(user.teamId);
  if (!team || team.is_disqualified) {
    return NextResponse.json(
      {
        authenticated: false,
        error: team?.disqualification_reason || 'Team disqualified or not found',
        isDisqualified: true,
      },
      { status: 403 }
    );
  }

  // If Supabase is configured and an active session exists with a different session ID, reject
  const { isSupabaseConfigured } = await import('@/lib/supabase');
  if (isSupabaseConfigured) {
    const activeSession = await getActiveSessionForTeam(user.teamId);
    if (activeSession && activeSession.id !== user.sessionId) {
      return NextResponse.json(
        {
          authenticated: false,
          sessionTerminated: true,
          error: 'Your session has been terminated because another device logged in.',
        },
        { status: 401 }
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeTeam } = team;

  return NextResponse.json({
    authenticated: true,
    role: 'team',
    team: safeTeam,
    sessionId: user.sessionId,
  });
}
