// =============================================================================
// DATA STRUCTATHON - CORE TYPES & DATA CONTRACTS
// =============================================================================

export interface Team {
  id: string;
  username: string;
  password_hash?: string; // Excluded from client responses
  team_name: string;
  college_name: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  member2_name?: string | null;
  member3_name?: string | null;
  member4_name?: string | null;
  is_shortlisted: boolean;
  is_disqualified: boolean;
  disqualification_reason?: string | null;
  mail_status: 'pending' | 'sent' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface TeamSession {
  id: string;
  team_id: string;
  session_token: string;
  is_active: boolean;
  user_agent?: string | null;
  ip_address?: string | null;
  last_active_at: string;
  created_at: string;
}

export interface Round {
  id: number; // 1 or 2
  name: string;
  is_unlocked: boolean;
  duration_minutes: number;
  started_at?: string | null;
  ended_at?: string | null;
  updated_at: string;
}

export interface Round1Question {
  id: string;
  question_text: string;
  explanation?: string | null;
  time_limit_seconds: number;
  base_points: number;
  order_index: number;
  is_published: boolean;
  question_type?: 'single' | 'multi';
  created_at: string;
  options?: Round1Option[];
}

export interface Round1Option {
  id: string;
  question_id: string;
  option_text: string;
  is_correct?: boolean; // Server-only! Never exposed in participant payloads
  order_index: number;
}

export interface Round1Progress {
  id: string;
  team_id: string;
  current_question_index: number;
  question_started_at: string | null;
  total_score: number;
  correct_count: number;
  incorrect_count: number;
  total_time_ms: number;
  is_completed: boolean;
  question_order?: string[] | null;
  started_at: string;
  completed_at?: string | null;
}

export interface Round1Submission {
  id: string;
  team_id: string;
  question_id: string;
  selected_option_ids: string[] | null;
  is_correct: boolean;
  response_time_ms: number;
  points_awarded: number;
  submitted_at: string;
}

export interface Round2Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time_limit_ms: number;
  memory_limit_mb: number;
  points: number;
  order_index: number;
  starter_code: Record<string, string>;
  is_published: boolean;
  created_at: string;
  test_cases?: Round2TestCase[];
}

export interface Round2TestCase {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean; // Server-only when TRUE
  order_index: number;
}

export interface Round2Submission {
  id: string;
  team_id: string;
  problem_id: string;
  code: string;
  language: string;
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'TIME_LIMIT_EXCEEDED'
    | 'MEMORY_LIMIT_EXCEEDED'
    | 'COMPILATION_ERROR'
    | 'RUNTIME_ERROR';
  passed_test_cases: number;
  total_test_cases: number;
  score: number;
  runtime_ms?: number | null;
  memory_kb?: number | null;
  compile_output?: string | null;
  submitted_at: string;
}

export type ViolationType =
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'COPY_PASTE'
  | 'BLOCKED_SHORTCUT'
  | 'WINDOW_BLUR'
  | 'DEVTOOLS_ATTEMPT';

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Violation {
  id: string;
  team_id: string;
  team_name?: string;
  round_id: number;
  violation_type: ViolationType;
  severity: ViolationSeverity;
  snapshot_url?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_username: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  college_name: string;
  round1_score: number;
  round2_score: number;
  total_score: number;
  total_time_ms: number;
  is_shortlisted: boolean;
  is_disqualified: boolean;
}
