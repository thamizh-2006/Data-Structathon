-- =============================================================================
-- DATA STRUCTATHON - SAMPLE SEED DATA
-- Default sample password for all demo teams is: 'Structathon@2026'
-- Bcrypt hash of 'Structathon@2026' with 10 salt rounds:
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (or generated bcrypt)
-- =============================================================================

-- Seed Teams
INSERT INTO teams (
    id, username, password_hash, team_name, college_name,
    leader_name, leader_email, leader_phone,
    member2_name, member3_name, member4_name,
    is_shortlisted, is_disqualified, mail_status
) VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'team_algo_masters',
    '$2a$10$eO0.cQyZ8d2fNvx0K06cIeR0n7Hk4B3A8eT5t8p4F9w1y3r7e5t6y', -- 'Structathon@2026'
    'Algorithm Masters',
    'Tech Institute of Engineering',
    'Alex Rivera',
    'alex.rivera@example.com',
    '+1 (555) 234-5678',
    'Elena Rostova',
    'Marcus Vance',
    'Devon Brooks',
    TRUE,
    FALSE,
    'sent'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'team_bit_shifters',
    '$2a$10$eO0.cQyZ8d2fNvx0K06cIeR0n7Hk4B3A8eT5t8p4F9w1y3r7e5t6y',
    'The Bit Shifters',
    'National University of Computing',
    'Sara Chen',
    'sara.chen@example.com',
    '+1 (555) 876-5432',
    'Rohan Patel',
    'Liam O''Connor',
    NULL,
    FALSE,
    FALSE,
    'sent'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'team_cache_rebels',
    '$2a$10$eO0.cQyZ8d2fNvx0K06cIeR0n7Hk4B3A8eT5t8p4F9w1y3r7e5t6y',
    'Cache Rebels',
    'Metropolitan College of Technology',
    'Zackary Thorne',
    'zack.thorne@example.com',
    '+1 (555) 998-1122',
    'Priya Sharma',
    'Kenji Sato',
    'Aaliyah Davis',
    FALSE,
    FALSE,
    'sent'
)
ON CONFLICT (username) DO NOTHING;

-- Seed Round 1 Questions
INSERT INTO round1_questions (id, question_text, explanation, time_limit_seconds, base_points, order_index, is_published)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'What is the tightest worst-case time complexity of finding the Median element in an unsorted array of size N using the Median-of-Medians algorithm?',
    'The Median-of-Medians selection algorithm guarantees worst-case O(N) deterministic linear time.',
    30,
    1000,
    1,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'In a Red-Black Tree with N internal nodes, what is the maximum possible height (longest path from root to leaf)?',
    'A Red-Black Tree guarantees that no path is more than twice as long as the shortest path, leading to a maximum height of 2 * log2(N + 1).',
    30,
    1000,
    2,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000003',
    'Which data structure is optimal for solving the Sliding Window Maximum problem in amortized O(N) overall time?',
    'A Monotonic Double-Ended Queue (Deque) stores indices in monotonic order, taking amortized O(1) per element, total O(N).',
    25,
    1000,
    3,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000004',
    'What is the amortized time complexity per operation in a Disjoint Set Union (DSU) structure using both Union by Rank and Path Compression?',
    'Using both heuristics achieves O(alpha(N)) amortized time, where alpha is the extremely slowly growing Inverse Ackermann function.',
    20,
    1000,
    4,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Seed Options for Question 1
INSERT INTO round1_options (id, question_id, option_text, is_correct, order_index) VALUES
('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'O(N)', TRUE, 1),
('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'O(N log N)', FALSE, 2),
('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'O(N^2)', FALSE, 3),
('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'O(log N)', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Options for Question 2
INSERT INTO round1_options (id, question_id, option_text, is_correct, order_index) VALUES
('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000002', '2 * log2(N + 1)', TRUE, 1),
('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000002', 'log2(N)', FALSE, 2),
('c0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000002', '1.44 * log2(N + 2)', FALSE, 3),
('c0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000002', 'N - 1', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Options for Question 3
INSERT INTO round1_options (id, question_id, option_text, is_correct, order_index) VALUES
('c0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000003', 'Monotonic Deque', TRUE, 1),
('c0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000003', 'Binary Max Heap', FALSE, 2),
('c0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000003', 'Segment Tree', FALSE, 3),
('c0000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000003', 'Fenwick Tree (BIT)', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Options for Question 4
INSERT INTO round1_options (id, question_id, option_text, is_correct, order_index) VALUES
('c0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000004', 'O(alpha(N)) (Inverse Ackermann)', TRUE, 1),
('c0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000004', 'O(log N)', FALSE, 2),
('c0000000-0000-0000-0000-000000000043', 'b0000000-0000-0000-0000-000000000004', 'O(1) strict worst-case', FALSE, 3),
('c0000000-0000-0000-0000-000000000044', 'b0000000-0000-0000-0000-000000000004', 'O(log*(N))', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Round 2 Problems (LeetCode Style)
INSERT INTO round2_problems (
    id, title, slug, description, difficulty, time_limit_ms, memory_limit_mb, points, order_index, starter_code, is_published
) VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'Subarray Sums Divisible by K',
    'subarray-sums-divisible-by-k',
    'Given an integer array nums and an integer k, return the number of non-empty subarrays that have a sum divisible by k. A subarray is a contiguous part of an array.\n\n### Example 1:\nInput: nums = [4,5,0,-2,-3,1], k = 5\nOutput: 7\nExplanation: There are 7 subarrays with a sum divisible by k = 5: [4, 5, 0, -2, -3, 1], [5], [5, 0], [5, 0, -2, -3], [0], [0, -2, -3], [-2, -3]\n\n### Constraints:\n* 1 <= nums.length <= 3 * 10^4\n* -10^4 <= nums[i] <= 10^4\n* 2 <= k <= 10^4',
    'Medium',
    2000,
    256,
    100,
    1,
    '{
        "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int subarraysDivByK(vector<int>& nums, int k) {\n        // Your code here\n        return 0;\n    }\n};",
        "python": "class Solution:\n    def subarraysDivByK(self, nums: list[int], k: int) -> int:\n        # Your code here\n        return 0",
        "java": "class Solution {\n    public int subarraysDivByK(int[] nums, int k) {\n        // Your code here\n        return 0;\n    }\n}",
        "javascript": "function subarraysDivByK(nums, k) {\n    // Your code here\n    return 0;\n}"
    }'::jsonb,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Longest Valid Parentheses Chain',
    'longest-valid-parentheses-chain',
    'Given a string containing just the characters ''('' and '')'', return the length of the longest valid (well-formed) parentheses substring.\n\n### Example 1:\nInput: s = "(()"\nOutput: 2\nExplanation: The longest valid parentheses substring is "()".\n\n### Example 2:\nInput: s = ")()())"\nOutput: 4\nExplanation: The longest valid parentheses substring is "()()".\n\n### Constraints:\n* 0 <= s.length <= 3 * 10^4\n* s[i] is ''('', or '')''.',
    'Hard',
    2000,
    256,
    150,
    2,
    '{
        "cpp": "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestValidParentheses(string s) {\n        // Your code here\n        return 0;\n    }\n};",
        "python": "class Solution:\n    def longestValidParentheses(self, s: str) -> int:\n        # Your code here\n        return 0",
        "java": "class Solution {\n    public int longestValidParentheses(String s) {\n        // Your code here\n        return 0;\n    }\n}",
        "javascript": "function longestValidParentheses(s) {\n    // Your code here\n    return 0;\n}"
    }'::jsonb,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample and Hidden Test Cases for Problem 1
INSERT INTO round2_test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
-- Sample (visible)
('d0000000-0000-0000-0000-000000000001', '4 5 0 -2 -3 1\n5', '7', FALSE, 1),
('d0000000-0000-0000-0000-000000000001', '5\n9', '0', FALSE, 2),
-- Hidden (used for server-side scoring only!)
('d0000000-0000-0000-0000-000000000001', '-1 2 9\n2', '2', TRUE, 3),
('d0000000-0000-0000-0000-000000000001', '0 0 0\n3', '6', TRUE, 4),
('d0000000-0000-0000-0000-000000000001', '1 -1 1 -1\n2', '4', TRUE, 5)
ON CONFLICT DO NOTHING;

-- Seed Sample and Hidden Test Cases for Problem 2
INSERT INTO round2_test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
-- Sample (visible)
('d0000000-0000-0000-0000-000000000002', '(()', '2', FALSE, 1),
('d0000000-0000-0000-0000-000000000002', ')()())', '4', FALSE, 2),
-- Hidden
('d0000000-0000-0000-0000-000000000002', '""', '0', TRUE, 3),
('d0000000-0000-0000-0000-000000000002', '()(()', '2', TRUE, 4),
('d0000000-0000-0000-0000-000000000002', '((()))())', '8', TRUE, 5)
ON CONFLICT DO NOTHING;
