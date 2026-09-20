import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import {
  getTeamByUsername,
  getActiveSessionForTeam,
  createSession,
  terminateAllTeamSessions,
} from '@/lib/store';
import { createAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { eventBus } from '@/lib/realtime';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Structathon2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, force } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const trimmedUsername = username.trim();

    // 1. Check for Admin Login
    if (trimmedUsername.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const token = await createAuthToken({
        teamId: 'admin',
        username: ADMIN_USERNAME,
        role: 'admin',
        sessionId: `admin_sess_${Date.now()}`,
      });

      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return NextResponse.json({
        success: true,
        role: 'admin',
        username: ADMIN_USERNAME,
      });
    }

    // 2. Participant Team Login
    const team = await getTeamByUsername(trimmedUsername);
    if (!team || !team.password_hash) {
      // Always generic message to prevent username enumeration
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, team.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (team.is_disqualified) {
      return NextResponse.json(
        {
          error:
            team.disqualification_reason ||
            'This team has been disqualified from participating in the event.',
        },
        { status: 403 }
      );
    }

    // 3. Single Active Session Check
    const activeSession = await getActiveSessionForTeam(team.id);
    if (activeSession && !force) {
      return NextResponse.json(
        {
          requiresConfirmation: true,
          message:
            'Another session is currently active for this team. Close it and log in here?',
          activeSessionId: activeSession.id,
        },
        { status: 409 }
      );
    }

    // If force is confirmed or no active session:
    if (activeSession && force) {
      // Invalidate existing session
      await terminateAllTeamSessions(team.id);
      // Notify previous active tab via Realtime
      eventBus.emit(`team-session:${team.id}`, {
        type: 'SESSION_TERMINATED',
        teamId: team.id,
        reason: 'Account was logged into from another browser or device.',
        timestamp: new Date().toISOString(),
      });
    }

    // Create new active session
    const sessionToken = `st_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    const newSession = await createSession({
      team_id: team.id,
      session_token: sessionToken,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    const token = await createAuthToken({
      teamId: team.id,
      username: team.username,
      role: 'team',
      sessionId: newSession.id,
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    // Strip password hash from returned team object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeTeam } = team;

    return NextResponse.json({
      success: true,
      role: 'team',
      team: safeTeam,
      sessionId: newSession.id,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
