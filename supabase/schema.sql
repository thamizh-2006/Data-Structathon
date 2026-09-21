-- =============================================================================
-- DATA STRUCTATHON PROCTORED EXAM PLATFORM - DATABASE SCHEMA & RLS POLICIES
-- Target Concurrency: ~700 Teams
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TEAMS TABLE
-- Stores credentials (hashed), registration info, qualification, and status.
-- Passwords are hashed with bcrypt and never exposed to client queries.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    college_name VARCHAR(150) NOT NULL,
    
    -- Leader info (visually distinguished on participant dashboard)
    leader_name VARCHAR(100) NOT NULL,
    leader_email VARCHAR(150) NOT NULL,
    leader_phone VARCHAR(20) NOT NULL,
    
    -- Team members (up to 3 additional members)
    member2_name VARCHAR(100),
    member3_name VARCHAR(100),
    member4_name VARCHAR(100),
    
    -- Qualification & Status
    is_shortlisted BOOLEAN NOT NULL DEFAULT FALSE,      -- Round 2 eligibility
    is_disqualified BOOLEAN NOT NULL DEFAULT FALSE,     -- Blocked from further round actions
    disqualification_reason TEXT,
    mail_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-frequency login and leaderboard queries
CREATE INDEX IF NOT EXISTS idx_teams_username ON teams(username);
CREATE INDEX IF NOT EXISTS idx_teams_shortlisted ON teams(is_shortlisted);
CREATE INDEX IF NOT EXISTS idx_teams_disqualified ON teams(is_disqualified);

-- -----------------------------------------------------------------------------
-- 2. TEAM SESSIONS TABLE (Single Active Session Enforcement)
-- Only one session is active (is_active = true) per team at any time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_agent TEXT,
    ip_address VARCHAR(50),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_sessions_team_active ON team_sessions(team_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON team_sessions(session_token);

-- -----------------------------------------------------------------------------
-- 3. ROUNDS TABLE
-- Authoritative server control for global round locking and timing.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rounds (
    id INT PRIMARY KEY, -- 1: Quiz, 2: Coding
    name VARCHAR(50) NOT NULL,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    duration_minutes INT NOT NULL DEFAULT 45,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Round 1 & Round 2 (Locked by default)
INSERT INTO rounds (id, name, is_unlocked, duration_minutes)
VALUES 
    (1, 'Round 1: Rapid MCQ Quiz', FALSE, 30),
    (2, 'Round 2: Algorithmic Coding Challenge', FALSE, 90)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. ROUND 1: QUESTIONS & OPTIONS (Quizizz Style)
-- Option correct status is guarded; NEVER transmitted to participant clients.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS round1_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    explanation TEXT,
    time_limit_seconds INT NOT NULL DEFAULT 30,
    base_points INT NOT NULL DEFAULT 1000,
    order_index INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    question_type VARCHAR(10) NOT NULL DEFAULT 'single' CHECK (question_type IN ('single', 'multi')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_r1_questions_order ON round1_questions(order_index) WHERE is_published = TRUE;

CREATE TABLE IF NOT EXISTS round1_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES round1_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE, -- Server only!
    order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_r1_options_question ON round1_options(question_id);

-- -----------------------------------------------------------------------------
-- 5. ROUND 1: PROGRESS & SUBMISSIONS (Server-Authoritative Resume & Timing)
-- Tracks active time, question index, and points per question per team.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS round1_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
    current_question_index INT NOT NULL DEFAULT 0,
    question_started_at TIMESTAMPTZ,
    total_score INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    total_time_ms BIGINT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    question_order JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_r1_progress_score ON round1_progress(total_score DESC, total_time_ms ASC);

CREATE TABLE IF NOT EXISTS round1_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES round1_questions(id) ON DELETE CASCADE,
    selected_option_ids JSONB,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    response_time_ms INT NOT NULL DEFAULT 0,
    points_awarded INT NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_team_question UNIQUE (team_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_r1_submissions_team ON round1_submissions(team_id);

-- -----------------------------------------------------------------------------
-- 6. ROUND 2: PROBLEMS & TEST CASES (LeetCode Style)
-- Hidden test cases are strictly server-side; NEVER sent to client.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS round2_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    points INT NOT NULL DEFAULT 100,
    order_index INT NOT NULL DEFAULT 0,
    starter_code JSONB NOT NULL DEFAULT '{"cpp":"","java":"","python":"","javascript":""}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_r2_problems_order ON round2_problems(order_index) WHERE is_published = TRUE;

CREATE TABLE IF NOT EXISTS round2_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES round2_problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE, -- Crucial: TRUE never exposed to client
    order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_r2_test_cases_problem ON round2_test_cases(problem_id);

-- -----------------------------------------------------------------------------
-- 7. ROUND 2: PROGRESS & SUBMISSIONS (Judge0 Execution Results)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS round2_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES round2_problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(30) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', 
    -- 'PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'RUNTIME_ERROR'
    passed_test_cases INT NOT NULL DEFAULT 0,
    total_test_cases INT NOT NULL DEFAULT 0,
    score INT NOT NULL DEFAULT 0,
    runtime_ms INT,
    memory_kb INT,
    compile_output TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_r2_submissions_team ON round2_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_r2_submissions_problem ON round2_submissions(problem_id);

-- -----------------------------------------------------------------------------
-- 8. PROCTORING & VIOLATIONS TABLE
-- Event listeners push violations instantly; attached compressed screen snapshot
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    round_id INT NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    -- 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'COPY_PASTE', 'BLOCKED_SHORTCUT', 'WINDOW_BLUR', 'DEVTOOLS_ATTEMPT'
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
    snapshot_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_team ON violations(team_id);
CREATE INDEX IF NOT EXISTS idx_violations_created ON violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON violations(severity);

-- -----------------------------------------------------------------------------
-- 9. ADMIN AUDIT LOG
-- Records all high-trust destructive admin actions (who, what, when)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL, 
    -- 'EDIT_TEAM', 'DISQUALIFY_TEAM', 'RESET_PASSWORD', 'UNLOCK_ROUND', 'LOCK_ROUND', 'PUBLISH_QUESTION'
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- -----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict least-privilege enforcement
-- -----------------------------------------------------------------------------

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round1_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE round1_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE round1_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE round1_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE round2_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE round2_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE round2_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Rounds: Readable by everyone (unlocked/locked flags)
CREATE POLICY "Allow public read on rounds" 
    ON rounds FOR SELECT 
    USING (true);

-- Round 1 Published Questions: Readable if published
CREATE POLICY "Allow read published r1 questions" 
    ON round1_questions FOR SELECT 
    USING (is_published = true);

-- Round 1 Options: Readable by participants WITHOUT leaking is_correct
-- (API routes filter or project columns, RLS allows select of options for published questions)
CREATE POLICY "Allow read options for published questions" 
    ON round1_options FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM round1_questions q 
            WHERE q.id = round1_options.question_id AND q.is_published = true
        )
    );

-- Round 2 Problems: Readable if published
CREATE POLICY "Allow read published r2 problems" 
    ON round2_problems FOR SELECT 
    USING (is_published = true);

-- Round 2 Sample Test Cases: ONLY sample test cases (is_hidden = false) readable by participants!
-- Hidden test cases are completely blocked from participant SELECT.
CREATE POLICY "Allow read sample test cases only" 
    ON round2_test_cases FOR SELECT 
    USING (is_hidden = false);

-- Violations: Insertable by participant service/client
CREATE POLICY "Allow insert violations" 
    ON violations FOR INSERT 
    WITH CHECK (true);

-- Service role bypasses all RLS automatically for secure server-side execution.
