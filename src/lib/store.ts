// =============================================================================
// DATA STRUCTATHON - UNIFIED DATA ACCESS LAYER (DAL)
// Backed by Supabase Postgres with in-memory resilient fallback
// =============================================================================

import bcrypt from 'bcryptjs';
import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import {
  Team,
  TeamSession,
  Round,
  Round1Question,
  Round1Progress,
  Round2Problem,
  Round2TestCase,
  Round2Submission,
  Violation,
  AdminAuditLog,
  LeaderboardEntry,
} from './types';

// In-Memory fallback store with initial seed data
// Default password: 'Structathon@2026'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Structathon@2026', 10);

interface DatabaseState {
  teams: Team[];
  sessions: TeamSession[];
  rounds: Round[];
  round1Questions: Round1Question[];
  round1Progress: Record<string, Round1Progress>;
  round1Submissions: Array<{
    team_id: string;
    question_id: string;
    selected_option_ids: string[] | null;
    is_correct: boolean;
    response_time_ms: number;
    points_awarded: number;
    submitted_at: string;
  }>;
  round2Problems: Round2Problem[];
  round2TestCases: Round2TestCase[];
  round2Submissions: Round2Submission[];
  violations: Violation[];
  adminAuditLog: AdminAuditLog[];
}

const memoryDb: DatabaseState = {
  teams: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      username: 'team_algo_masters',
      password_hash: DEFAULT_PASSWORD_HASH,
      team_name: 'Algorithm Masters',
      college_name: 'Tech Institute of Engineering',
      leader_name: 'Alex Rivera',
      leader_email: 'alex.rivera@example.com',
      leader_phone: '+1 (555) 234-5678',
      member2_name: 'Elena Rostova',
      member3_name: 'Marcus Vance',
      member4_name: 'Devon Brooks',
      is_shortlisted: true,
      is_disqualified: false,
      mail_status: 'sent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      username: 'team_bit_shifters',
      password_hash: DEFAULT_PASSWORD_HASH,
      team_name: 'The Bit Shifters',
      college_name: 'National University of Computing',
      leader_name: 'Sara Chen',
      leader_email: 'sara.chen@example.com',
      leader_phone: '+1 (555) 876-5432',
      member2_name: 'Rohan Patel',
      member3_name: "Liam O'Connor",
      member4_name: null,
      is_shortlisted: false,
      is_disqualified: false,
      mail_status: 'sent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      username: 'team_cache_rebels',
      password_hash: DEFAULT_PASSWORD_HASH,
      team_name: 'Cache Rebels',
      college_name: 'Metropolitan College of Technology',
      leader_name: 'Zackary Thorne',
      leader_email: 'zack.thorne@example.com',
      leader_phone: '+1 (555) 998-1122',
      member2_name: 'Priya Sharma',
      member3_name: 'Kenji Sato',
      member4_name: 'Aaliyah Davis',
      is_shortlisted: false,
      is_disqualified: false,
      mail_status: 'sent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  sessions: [],
  rounds: [
    {
      id: 1,
      name: 'Round 1: Rapid MCQ Quiz',
      is_unlocked: false,
      duration_minutes: 30,
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Round 2: Algorithmic Coding Challenge',
      is_unlocked: false,
      duration_minutes: 90,
      updated_at: new Date().toISOString(),
    },
  ],
  round1Questions: [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      question_text:
        'What is the tightest worst-case time complexity of finding the Median element in an unsorted array of size N using the Median-of-Medians algorithm?',
      explanation:
        'The Median-of-Medians selection algorithm guarantees worst-case O(N) deterministic linear time.',
      time_limit_seconds: 30,
      base_points: 1000,
      order_index: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      options: [
        {
          id: 'c0000000-0000-0000-0000-000000000011',
          question_id: 'b0000000-0000-0000-0000-000000000001',
          option_text: 'O(N)',
          is_correct: true,
          order_index: 1,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000012',
          question_id: 'b0000000-0000-0000-0000-000000000001',
          option_text: 'O(N log N)',
          is_correct: false,
          order_index: 2,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000013',
          question_id: 'b0000000-0000-0000-0000-000000000001',
          option_text: 'O(N^2)',
          is_correct: false,
          order_index: 3,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000014',
          question_id: 'b0000000-0000-0000-0000-000000000001',
          option_text: 'O(log N)',
          is_correct: false,
          order_index: 4,
        },
      ],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      question_text:
        'In a Red-Black Tree with N internal nodes, what is the maximum possible height (longest path from root to leaf)?',
      explanation:
        'A Red-Black Tree guarantees that no path is more than twice as long as the shortest path, leading to a maximum height of 2 * log2(N + 1).',
      time_limit_seconds: 30,
      base_points: 1000,
      order_index: 2,
      is_published: true,
      created_at: new Date().toISOString(),
      options: [
        {
          id: 'c0000000-0000-0000-0000-000000000021',
          question_id: 'b0000000-0000-0000-0000-000000000002',
          option_text: '2 * log2(N + 1)',
          is_correct: true,
          order_index: 1,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000022',
          question_id: 'b0000000-0000-0000-0000-000000000002',
          option_text: 'log2(N)',
          is_correct: false,
          order_index: 2,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000023',
          question_id: 'b0000000-0000-0000-0000-000000000002',
          option_text: '1.44 * log2(N + 2)',
          is_correct: false,
          order_index: 3,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000024',
          question_id: 'b0000000-0000-0000-0000-000000000002',
          option_text: 'N - 1',
          is_correct: false,
          order_index: 4,
        },
      ],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      question_text:
        'Which data structure is optimal for solving the Sliding Window Maximum problem in amortized O(N) overall time?',
      explanation:
        'A Monotonic Double-Ended Queue (Deque) stores indices in monotonic order, taking amortized O(1) per element, total O(N).',
      time_limit_seconds: 25,
      base_points: 1000,
      order_index: 3,
      is_published: true,
      created_at: new Date().toISOString(),
      options: [
        {
          id: 'c0000000-0000-0000-0000-000000000031',
          question_id: 'b0000000-0000-0000-0000-000000000003',
          option_text: 'Monotonic Deque',
          is_correct: true,
          order_index: 1,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000032',
          question_id: 'b0000000-0000-0000-0000-000000000003',
          option_text: 'Binary Max Heap',
          is_correct: false,
          order_index: 2,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000033',
          question_id: 'b0000000-0000-0000-0000-000000000003',
          option_text: 'Segment Tree',
          is_correct: false,
          order_index: 3,
        },
        {
          id: 'c0000000-0000-0000-0000-000000000034',
          question_id: 'b0000000-0000-0000-0000-000000000003',
          option_text: 'Fenwick Tree (BIT)',
          is_correct: false,
          order_index: 4,
        },
      ],
    },
  ],
  round1Progress: {},
  round1Submissions: [],
  round2Problems: [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      title: 'Subarray Sums Divisible by K',
      slug: 'subarray-sums-divisible-by-k',
      description:
        'Given an integer array `nums` and an integer `k`, return the number of non-empty subarrays that have a sum divisible by `k`.\n\nA subarray is a contiguous part of an array.\n\n### Example 1:\n```\nInput: nums = [4, 5, 0, -2, -3, 1], k = 5\nOutput: 7\nExplanation: There are 7 subarrays with sum divisible by 5:\n[4, 5, 0, -2, -3, 1], [5], [5, 0], [5, 0, -2, -3], [0], [0, -2, -3], [-2, -3]\n```\n\n### Constraints:\n- `1 <= nums.length <= 3 * 10^4`\n- `-10^4 <= nums[i] <= 10^4`\n- `2 <= k <= 10^4`',
      difficulty: 'Medium',
      time_limit_ms: 2000,
      memory_limit_mb: 256,
      points: 100,
      order_index: 1,
      starter_code: {
        python:
          'def subarraysDivByK(nums: list[int], k: int) -> int:\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    if lines:\n        nums = list(map(int, lines[0].split()))\n        k = int(lines[1])\n        print(subarraysDivByK(nums, k))\n',
        javascript:
          'const fs = require("fs");\n\nfunction subarraysDivByK(nums, k) {\n    // Write your solution here\n    return 0;\n}\n\nconst input = fs.readFileSync(0, "utf-8").trim().split("\\n");\nif (input.length >= 2) {\n    const nums = input[0].trim().split(/\\s+/).map(Number);\n    const k = Number(input[1]);\n    console.log(subarraysDivByK(nums, k));\n}\n',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint subarraysDivByK(vector<int>& nums, int k) {\n    // Write your solution here\n    return 0;\n}\n\nint main() {\n    // Fast I/O\n    return 0;\n}\n',
        java: 'import java.util.Scanner;\n\npublic class Main {\n    public static int subarraysDivByK(int[] nums, int k) {\n        // Write your solution here\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n',
      },
      is_published: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      title: 'Longest Valid Parentheses Chain',
      slug: 'longest-valid-parentheses-chain',
      description:
        'Given a string containing just the characters `(` and `)`, return the length of the longest valid (well-formed) parentheses substring.\n\n### Example 1:\n```\nInput: s = "(()"\nOutput: 2\nExplanation: The longest valid parentheses substring is "()".\n```\n\n### Example 2:\n```\nInput: s = ")()())"\nOutput: 4\nExplanation: The longest valid parentheses substring is "()()".\n```\n\n### Constraints:\n- `0 <= s.length <= 3 * 10^4`\n- `s[i]` is either `(` or `)`',
      difficulty: 'Hard',
      time_limit_ms: 2000,
      memory_limit_mb: 256,
      points: 150,
      order_index: 2,
      starter_code: {
        python:
          'def longestValidParentheses(s: str) -> int:\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    import sys\n    s = sys.stdin.read().strip()\n    print(longestValidParentheses(s))\n',
        javascript:
          'const fs = require("fs");\n\nfunction longestValidParentheses(s) {\n    // Write your solution here\n    return 0;\n}\n\nconst s = fs.readFileSync(0, "utf-8").trim();\nconsole.log(longestValidParentheses(s));\n',
        cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint longestValidParentheses(string s) {\n    return 0;\n}\n',
        java: 'import java.util.Scanner;\n\npublic class Main {\n    public static int longestValidParentheses(String s) {\n        return 0;\n    }\n}\n',
      },
      is_published: true,
      created_at: new Date().toISOString(),
    },
  ],
  round2TestCases: [
    // Problem 1 Sample
    {
      id: 't001',
      problem_id: 'd0000000-0000-0000-0000-000000000001',
      input: '4 5 0 -2 -3 1\n5',
      expected_output: '7',
      is_hidden: false,
      order_index: 1,
    },
    {
      id: 't002',
      problem_id: 'd0000000-0000-0000-0000-000000000001',
      input: '5\n9',
      expected_output: '0',
      is_hidden: false,
      order_index: 2,
    },
    // Problem 1 Hidden
    {
      id: 't003',
      problem_id: 'd0000000-0000-0000-0000-000000000001',
      input: '-1 2 9\n2',
      expected_output: '2',
      is_hidden: true,
      order_index: 3,
    },
    {
      id: 't004',
      problem_id: 'd0000000-0000-0000-0000-000000000001',
      input: '0 0 0\n3',
      expected_output: '6',
      is_hidden: true,
      order_index: 4,
    },
    {
      id: 't005',
      problem_id: 'd0000000-0000-0000-0000-000000000001',
      input: '1 -1 1 -1\n2',
      expected_output: '4',
      is_hidden: true,
      order_index: 5,
    },
    // Problem 2 Sample
    {
      id: 't006',
      problem_id: 'd0000000-0000-0000-0000-000000000002',
      input: '(()',
      expected_output: '2',
      is_hidden: false,
      order_index: 1,
    },
    {
      id: 't007',
      problem_id: 'd0000000-0000-0000-0000-000000000002',
      input: ')()())',
      expected_output: '4',
      is_hidden: false,
      order_index: 2,
    },
    // Problem 2 Hidden
    {
      id: 't008',
      problem_id: 'd0000000-0000-0000-0000-000000000002',
      input: '()(()',
      expected_output: '2',
      is_hidden: true,
      order_index: 3,
    },
    {
      id: 't009',
      problem_id: 'd0000000-0000-0000-0000-000000000002',
      input: '((()))())',
      expected_output: '8',
      is_hidden: true,
      order_index: 4,
    },
  ],
  round2Submissions: [],
  violations: [],
  adminAuditLog: [],
};

// =============================================================================
// TEAMS & SESSIONS
// =============================================================================

export async function getTeamByUsername(username: string): Promise<Team | null> {
  const team = memoryDb.teams.find(
    (t) => t.username.toLowerCase() === username.toLowerCase()
  );
  return team ? { ...team } : null;
}

export async function getTeamById(id: string): Promise<Team | null> {
  const team = memoryDb.teams.find((t) => t.id === id);
  return team ? { ...team } : null;
}

export async function getAllTeams(): Promise<Team[]> {
  // Strip password hash from all client responses
  return memoryDb.teams.map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safe } = t;
    return safe as Team;
  });
}

export async function updateTeam(
  id: string,
  updates: Partial<Omit<Team, 'id' | 'password_hash'>>
): Promise<Team | null> {
  const index = memoryDb.teams.findIndex((t) => t.id === id);
  if (index === -1) return null;
  memoryDb.teams[index] = {
    ...memoryDb.teams[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = memoryDb.teams[index];
  return safe as Team;
}

export async function resetTeamPassword(
  id: string,
  newPasswordPlain: string
): Promise<{ success: boolean; error?: string }> {
  const team = memoryDb.teams.find((t) => t.id === id);
  if (!team) return { success: false, error: 'Team not found' };

  const newHash = await bcrypt.hash(newPasswordPlain, 10);
  team.password_hash = newHash;
  team.updated_at = new Date().toISOString();
  return { success: true };
}

export async function disqualifyTeam(
  id: string,
  reason: string
): Promise<boolean> {
  const team = memoryDb.teams.find((t) => t.id === id);
  if (!team) return false;
  team.is_disqualified = true;
  team.disqualification_reason = reason;
  team.updated_at = new Date().toISOString();

  // Invalidate any active session immediately
  await terminateAllTeamSessions(id);
  return true;
}

export async function setTeamShortlisted(
  id: string,
  isShortlisted: boolean
): Promise<boolean> {
  const team = memoryDb.teams.find((t) => t.id === id);
  if (!team) return false;
  team.is_shortlisted = isShortlisted;
  team.updated_at = new Date().toISOString();
  return true;
}

export async function createTeam(
  teamData: Omit<Team, "id" | "created_at" | "updated_at">
): Promise<Team> {
  const newTeam: Team = {
    ...teamData,
    id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryDb.teams.push(newTeam);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = newTeam;
  return safe as Team;
}

// -----------------------------------------------------------------------------
// SESSIONS
// -----------------------------------------------------------------------------

export async function getActiveSessionForTeam(
  teamId: string
): Promise<TeamSession | null> {
  const session = memoryDb.sessions.find(
    (s) => s.team_id === teamId && s.is_active
  );
  return session ? { ...session } : null;
}

export async function createSession(params: {
  team_id: string;
  session_token: string;
  user_agent?: string;
  ip_address?: string;
}): Promise<TeamSession> {
  // Terminate any previous session first
  await terminateAllTeamSessions(params.team_id);

  const newSession: TeamSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    team_id: params.team_id,
    session_token: params.session_token,
    is_active: true,
    user_agent: params.user_agent || null,
    ip_address: params.ip_address || null,
    last_active_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  memoryDb.sessions.push(newSession);
  return newSession;
}

export async function terminateAllTeamSessions(teamId: string): Promise<void> {
  memoryDb.sessions.forEach((s) => {
    if (s.team_id === teamId) {
      s.is_active = false;
    }
  });
}

export async function validateSession(sessionToken: string): Promise<TeamSession | null> {
  const session = memoryDb.sessions.find(
    (s) => s.session_token === sessionToken && s.is_active
  );
  if (session) {
    session.last_active_at = new Date().toISOString();
    return { ...session };
  }
  return null;
}

// =============================================================================
// ROUNDS
// =============================================================================

export async function getRounds(): Promise<Round[]> {
  return memoryDb.rounds.map((r) => ({ ...r }));
}

export async function getRoundById(id: number): Promise<Round | null> {
  const round = memoryDb.rounds.find((r) => r.id === id);
  return round ? { ...round } : null;
}

export async function toggleRoundLock(
  roundId: number,
  isUnlocked: boolean
): Promise<Round | null> {
  const round = memoryDb.rounds.find((r) => r.id === roundId);
  if (!round) return null;
  round.is_unlocked = isUnlocked;
  if (isUnlocked && !round.started_at) {
    round.started_at = new Date().toISOString();
  }
  round.updated_at = new Date().toISOString();
  return { ...round };
}

export async function updateRoundDuration(
  roundId: number,
  durationMinutes: number
): Promise<Round | null> {
  const round = memoryDb.rounds.find((r) => r.id === roundId);
  if (!round) return null;
  round.duration_minutes = durationMinutes;
  round.updated_at = new Date().toISOString();
  return { ...round };
}

// =============================================================================
// ROUND 1: QUESTIONS & SUBMISSIONS
// =============================================================================

export async function getPublishedRound1Questions(): Promise<Round1Question[]> {
  return memoryDb.round1Questions
    .filter((q) => q.is_published)
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({
      ...q,
      // Strip is_correct from options for participants!
      options: q.options?.map((o) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { is_correct, ...safeOpt } = o;
        return safeOpt;
      }),
    }));
}

export async function getAllRound1QuestionsAdmin(): Promise<Round1Question[]> {
  return memoryDb.round1Questions
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({ ...q }));
}

export async function createRound1Question(
  data: Omit<Round1Question, 'id' | 'created_at'>
): Promise<Round1Question> {
  const newQ: Round1Question = {
    ...data,
    id: `q1_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    options: data.options?.map((opt, i) => ({
      ...opt,
      id: `opt_${Date.now()}_${i}`,
      question_id: `q1_${Date.now()}`,
    })),
  };
  memoryDb.round1Questions.push(newQ);
  return newQ;
}

export async function updateRound1Question(
  id: string,
  data: Partial<Round1Question>
): Promise<Round1Question | null> {
  const index = memoryDb.round1Questions.findIndex((q) => q.id === id);
  if (index === -1) return null;
  memoryDb.round1Questions[index] = {
    ...memoryDb.round1Questions[index],
    ...data,
  };
  return memoryDb.round1Questions[index];
}

export async function deleteRound1Question(id: string): Promise<boolean> {
  const index = memoryDb.round1Questions.findIndex((q) => q.id === id);
  if (index === -1) return false;
  memoryDb.round1Questions.splice(index, 1);
  return true;
}

export async function getRound1Progress(teamId: string): Promise<Round1Progress> {
  if (!memoryDb.round1Progress[teamId]) {
    const publishedQuestions = memoryDb.round1Questions.filter((q) => q.is_published);
    const questionIds = publishedQuestions.map((q) => q.id);
    
    // Fisher-Yates shuffle
    for (let i = questionIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionIds[i], questionIds[j]] = [questionIds[j], questionIds[i]];
    }

    memoryDb.round1Progress[teamId] = {
      id: `r1p_${teamId}`,
      team_id: teamId,
      current_question_index: 0,
      question_started_at: new Date().toISOString(),
      total_score: 0,
      correct_count: 0,
      incorrect_count: 0,
      total_time_ms: 0,
      is_completed: false,
      question_order: questionIds,
      started_at: new Date().toISOString(),
    };
  }
  return { ...memoryDb.round1Progress[teamId] };
}

export async function submitRound1Answer(params: {
  team_id: string;
  question_id: string;
  selected_option_ids: string[] | null;
}): Promise<{
  progress: Round1Progress;
  isCorrect: boolean;
  pointsEarned: number;
  isCompleted: boolean;
}> {
  const progress = await getRound1Progress(params.team_id);
  const questions = await getPublishedRound1Questions();
  const currentQ = memoryDb.round1Questions.find((q) => q.id === params.question_id);

  if (!currentQ) {
    throw new Error('Question not found');
  }

  // Calculate elapsed server time
  const now = Date.now();
  const startTime = progress.question_started_at
    ? new Date(progress.question_started_at).getTime()
    : now;
  const elapsedMs = Math.max(0, now - startTime);
  const limitMs = currentQ.time_limit_seconds * 1000;

  // Server-authoritative answer check
  let isCorrect = false;
  let pointsEarned = 0;

  if (params.selected_option_ids && params.selected_option_ids.length > 0) {
    const correctOptions = currentQ.options?.filter((o) => o.is_correct).map((o) => o.id) || [];
    const selectedCorrect = params.selected_option_ids.filter((id) => correctOptions.includes(id));
    
    if (selectedCorrect.length > 0) {
      isCorrect = selectedCorrect.length === correctOptions.length && params.selected_option_ids.length === correctOptions.length;
      
      const remainingMs = Math.max(0, limitMs - elapsedMs);
      const timeRatio = limitMs > 0 ? remainingMs / limitMs : 0;
      const maxPoints = Math.round(currentQ.base_points * (0.5 + 0.5 * timeRatio));
      
      pointsEarned = Math.round((selectedCorrect.length / correctOptions.length) * maxPoints);
    }
  }

  // Update progress
  progress.total_score += pointsEarned;
  progress.total_time_ms += elapsedMs;
  if (isCorrect) {
    progress.correct_count += 1;
  } else {
    progress.incorrect_count += 1;
  }

  // Record submission
  memoryDb.round1Submissions.push({
    team_id: params.team_id,
    question_id: params.question_id,
    selected_option_ids: params.selected_option_ids,
    is_correct: isCorrect,
    response_time_ms: elapsedMs,
    points_awarded: pointsEarned,
    submitted_at: new Date().toISOString(),
  });

  // Advance index
  progress.current_question_index += 1;
  if (progress.current_question_index >= (progress.question_order?.length || questions.length)) {
    progress.is_completed = true;
    progress.completed_at = new Date().toISOString();
  } else {
    progress.question_started_at = new Date().toISOString();
  }

  memoryDb.round1Progress[params.team_id] = progress;

  return {
    progress: { ...progress },
    isCorrect,
    pointsEarned,
    isCompleted: progress.is_completed,
  };
}

export async function getTeamRound1Submissions(teamId: string) {
  return memoryDb.round1Submissions
    .filter((s) => s.team_id === teamId)
    .map((s) => ({ ...s }));
}

// =============================================================================
// ROUND 2: PROBLEMS, TEST CASES & SUBMISSIONS
// =============================================================================

export async function getPublishedRound2Problems(): Promise<Round2Problem[]> {
  return memoryDb.round2Problems
    .filter((p) => p.is_published)
    .sort((a, b) => a.order_index - b.order_index)
    .map((p) => {
      // Return problem with ONLY sample test cases
      const sampleTestCases = memoryDb.round2TestCases
        .filter((tc) => tc.problem_id === p.id && !tc.is_hidden)
        .sort((a, b) => a.order_index - b.order_index);
      return {
        ...p,
        test_cases: sampleTestCases,
      };
    });
}

export async function getAllRound2ProblemsAdmin(): Promise<Round2Problem[]> {
  return memoryDb.round2Problems
    .sort((a, b) => a.order_index - b.order_index)
    .map((p) => {
      const allTestCases = memoryDb.round2TestCases
        .filter((tc) => tc.problem_id === p.id)
        .sort((a, b) => a.order_index - b.order_index);
      return {
        ...p,
        test_cases: allTestCases,
      };
    });
}

export async function getProblemTestCasesForGrading(
  problemId: string
): Promise<Round2TestCase[]> {
  // Server-only grading helper: fetches all test cases (including hidden)
  return memoryDb.round2TestCases
    .filter((tc) => tc.problem_id === problemId)
    .sort((a, b) => a.order_index - b.order_index);
}

export async function createRound2Problem(
  problem: Omit<Round2Problem, 'id' | 'created_at'>,
  testCases: Omit<Round2TestCase, 'id' | 'problem_id'>[]
): Promise<Round2Problem> {
  const newProblemId = `p2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newP: Round2Problem = {
    ...problem,
    id: newProblemId,
    created_at: new Date().toISOString(),
  };
  memoryDb.round2Problems.push(newP);

  testCases.forEach((tc, i) => {
    memoryDb.round2TestCases.push({
      ...tc,
      id: `tc_${Date.now()}_${i}`,
      problem_id: newProblemId,
    });
  });

  return newP;
}

export async function updateRound2Problem(
  id: string,
  problemUpdates: Partial<Round2Problem>,
  testCases?: Omit<Round2TestCase, 'id' | 'problem_id'>[]
): Promise<Round2Problem | null> {
  const index = memoryDb.round2Problems.findIndex((p) => p.id === id);
  if (index === -1) return null;
  
  memoryDb.round2Problems[index] = {
    ...memoryDb.round2Problems[index],
    ...problemUpdates,
  };

  if (testCases) {
    // Replace all test cases for this problem
    memoryDb.round2TestCases = memoryDb.round2TestCases.filter(tc => tc.problem_id !== id);
    testCases.forEach((tc, i) => {
      memoryDb.round2TestCases.push({
        ...tc,
        id: `tc_${Date.now()}_${i}`,
        problem_id: id,
      });
    });
  }

  return memoryDb.round2Problems[index];
}

export async function deleteRound2Problem(id: string): Promise<boolean> {
  const index = memoryDb.round2Problems.findIndex((p) => p.id === id);
  if (index === -1) return false;
  
  memoryDb.round2Problems.splice(index, 1);
  memoryDb.round2TestCases = memoryDb.round2TestCases.filter(tc => tc.problem_id !== id);
  return true;
}

export async function recordRound2Submission(
  submission: Omit<Round2Submission, 'id' | 'submitted_at'>
): Promise<Round2Submission> {
  const newSub: Round2Submission = {
    ...submission,
    id: `sub2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    submitted_at: new Date().toISOString(),
  };
  memoryDb.round2Submissions.push(newSub);
  return newSub;
}

export async function getTeamRound2Submissions(
  teamId: string,
  problemId?: string
): Promise<Round2Submission[]> {
  return memoryDb.round2Submissions
    .filter(
      (s) => s.team_id === teamId && (!problemId || s.problem_id === problemId)
    )
    .sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
}

// =============================================================================
// PROCTORING & VIOLATIONS
// =============================================================================

export async function recordViolation(
  data: Omit<Violation, 'id' | 'created_at'>
): Promise<Violation> {
  const team = memoryDb.teams.find((t) => t.id === data.team_id);
  const violation: Violation = {
    ...data,
    id: `viol_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    team_name: team?.team_name || 'Unknown Team',
    created_at: new Date().toISOString(),
  };
  memoryDb.violations.unshift(violation); // latest first
  return violation;
}

export async function getViolations(limit = 100): Promise<Violation[]> {
  return memoryDb.violations.slice(0, limit);
}

// =============================================================================
// ADMIN AUDIT LOG
// =============================================================================

export async function logAdminAction(params: {
  admin_username: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, unknown>;
  ip_address?: string | null;
}): Promise<AdminAuditLog> {
  const log: AdminAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    admin_username: params.admin_username,
    action: params.action,
    target_type: params.target_type,
    target_id: params.target_id || null,
    details: params.details || {},
    ip_address: params.ip_address || null,
    created_at: new Date().toISOString(),
  };
  memoryDb.adminAuditLog.unshift(log);
  return log;
}

export async function getAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
  return memoryDb.adminAuditLog.slice(0, limit);
}

// =============================================================================
// LEADERBOARD
// =============================================================================

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  // Aggregate scores across Round 1 and Round 2
  const entries: LeaderboardEntry[] = memoryDb.teams.map((team) => {
    const r1Prog = memoryDb.round1Progress[team.id];
    const r1Score = r1Prog ? r1Prog.total_score : 0;
    const r1Time = r1Prog ? r1Prog.total_time_ms : 0;

    // Highest score per problem in Round 2
    const teamR2Subs = memoryDb.round2Submissions.filter((s) => s.team_id === team.id);
    const problemScores: Record<string, number> = {};
    teamR2Subs.forEach((sub) => {
      if (!problemScores[sub.problem_id] || sub.score > problemScores[sub.problem_id]) {
        problemScores[sub.problem_id] = sub.score;
      }
    });
    const r2Score = Object.values(problemScores).reduce((a, b) => a + b, 0);

    return {
      rank: 0,
      team_id: team.id,
      team_name: team.team_name,
      college_name: team.college_name,
      round1_score: r1Score,
      round2_score: r2Score,
      total_score: r1Score + r2Score,
      total_time_ms: r1Time,
      is_shortlisted: team.is_shortlisted,
      is_disqualified: team.is_disqualified,
    };
  });

  // Sort: Disqualified teams at the bottom, then by total_score DESC, then total_time_ms ASC (tie breaker)
  entries.sort((a, b) => {
    if (a.is_disqualified !== b.is_disqualified) {
      return a.is_disqualified ? 1 : -1;
    }
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score;
    }
    return a.total_time_ms - b.total_time_ms;
  });

  // Assign ranks
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
  });

  return entries;
}
