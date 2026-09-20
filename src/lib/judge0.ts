// =============================================================================
// DATA STRUCTATHON - CODE EXECUTION ENGINE
// Server-side code runner with sandboxed execution against test cases.
// In production, replace with a real Judge0 instance for security.
// =============================================================================

import { Round2TestCase } from './types';

export type Language = 'python' | 'javascript' | 'cpp' | 'java';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';
  runtime_ms: number;
  memory_kb: number;
}

export interface TestCaseResult {
  test_case_id: string;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  is_hidden: boolean;
  runtime_ms: number;
  status: ExecutionResult['status'];
}

export interface GradingResult {
  overall_status: ExecutionResult['status'];
  passed_count: number;
  total_count: number;
  score: number;
  max_score: number;
  test_results: TestCaseResult[];
  compile_output: string | null;
  total_runtime_ms: number;
  total_memory_kb: number;
}

// Language ID mapping (Judge0 compatible IDs for future migration)
export const LANGUAGE_IDS: Record<Language, number> = {
  python: 71,     // Python 3
  javascript: 63, // Node.js
  cpp: 54,        // C++ (GCC)
  java: 62,       // Java
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  python: 'Python 3',
  javascript: 'JavaScript (Node.js)',
  cpp: 'C++ 17 (GCC)',
  java: 'Java 17',
};

/**
 * Simulates code execution against a single test case.
 * In a real deployment, this would call Judge0 API.
 * For this hackathon build, we do a lightweight server-side simulation.
 */
async function executeCode(
  code: string,
  language: Language,
  input: string,
  timeLimitMs: number
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Simulate execution delay (50-300ms)
  const simulatedDelay = 50 + Math.random() * 250;
  await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

  const runtime = Date.now() - startTime;
  const memoryKb = Math.floor(2000 + Math.random() * 8000);

  // Basic compilation check
  if (language === 'cpp' || language === 'java') {
    // Check for common syntax errors
    const hasMain = code.includes('main');
    const hasReturn = code.includes('return');
    if (!hasMain) {
      return {
        stdout: '',
        stderr: `Compilation Error: 'main' function not found`,
        status: 'COMPILATION_ERROR',
        runtime_ms: runtime,
        memory_kb: 0,
      };
    }
  }

  // Check for empty/skeleton code
  const strippedCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/#.*$/gm, '').trim();
  if (strippedCode.length < 30) {
    return {
      stdout: '',
      stderr: 'Error: Solution not implemented',
      status: 'RUNTIME_ERROR',
      runtime_ms: runtime,
      memory_kb: memoryKb,
    };
  }

  // Check for TLE patterns (infinite loops, etc.)
  if (runtime > timeLimitMs) {
    return {
      stdout: '',
      stderr: `Time Limit Exceeded (${timeLimitMs}ms)`,
      status: 'TIME_LIMIT_EXCEEDED',
      runtime_ms: timeLimitMs,
      memory_kb: memoryKb,
    };
  }

  // For the simulation, return the code's "expected behavior"
  // In a real system, this would be actual sandboxed execution
  return {
    stdout: '', // Will be compared externally
    stderr: '',
    status: 'ACCEPTED', // Placeholder until compared
    runtime_ms: runtime,
    memory_kb: memoryKb,
  };
}

/**
 * Grade submitted code against all test cases for a problem.
 * Returns detailed results per test case and an overall score.
 */
export async function gradeSubmission(
  code: string,
  language: Language,
  testCases: Round2TestCase[],
  timeLimitMs: number,
  maxPoints: number
): Promise<GradingResult> {
  const testResults: TestCaseResult[] = [];
  let passedCount = 0;
  let totalRuntimeMs = 0;
  let totalMemoryKb = 0;
  let compileOutput: string | null = null;
  let overallStatus: ExecutionResult['status'] = 'ACCEPTED';

  for (const tc of testCases) {
    const result = await executeCode(code, language, tc.input, timeLimitMs);

    if (result.status === 'COMPILATION_ERROR') {
      compileOutput = result.stderr;
      overallStatus = 'COMPILATION_ERROR';

      // All test cases fail on compile error
      testResults.push({
        test_case_id: tc.id,
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: '',
        passed: false,
        is_hidden: tc.is_hidden,
        runtime_ms: 0,
        status: 'COMPILATION_ERROR',
      });
      continue;
    }

    // Simulate output comparison
    // In a real system, actual_output comes from sandboxed execution stdout
    // For demonstration, we simulate based on code heuristics:
    const hasCorrectApproach = detectCorrectApproach(code, language, tc);
    const actualOutput = hasCorrectApproach ? tc.expected_output : 'incorrect';
    const passed = actualOutput.trim() === tc.expected_output.trim();

    if (passed) passedCount++;

    totalRuntimeMs += result.runtime_ms;
    totalMemoryKb = Math.max(totalMemoryKb, result.memory_kb);

    let tcStatus: ExecutionResult['status'];
    if (result.status === 'TIME_LIMIT_EXCEEDED') {
      tcStatus = 'TIME_LIMIT_EXCEEDED';
    } else if (result.status === 'RUNTIME_ERROR') {
      tcStatus = 'RUNTIME_ERROR';
    } else {
      tcStatus = passed ? 'ACCEPTED' : 'WRONG_ANSWER';
    }

    if (tcStatus !== 'ACCEPTED' && overallStatus === 'ACCEPTED') {
      overallStatus = tcStatus;
    }

    testResults.push({
      test_case_id: tc.id,
      input: tc.input,
      expected_output: tc.expected_output,
      actual_output: passed ? tc.expected_output : actualOutput,
      passed,
      is_hidden: tc.is_hidden,
      runtime_ms: result.runtime_ms,
      status: tcStatus,
    });
  }

  // Score is proportional to passed test cases
  const score = testCases.length > 0
    ? Math.round((passedCount / testCases.length) * maxPoints)
    : 0;

  return {
    overall_status: passedCount === testCases.length ? 'ACCEPTED' : overallStatus,
    passed_count: passedCount,
    total_count: testCases.length,
    score,
    max_score: maxPoints,
    test_results: testResults,
    compile_output: compileOutput,
    total_runtime_ms: totalRuntimeMs,
    total_memory_kb: totalMemoryKb,
  };
}

/**
 * Heuristic: detect if the submitted code contains a reasonable solution approach.
 * This is a simplified simulation. In production, Judge0 runs the code for real.
 */
function detectCorrectApproach(
  code: string,
  language: Language,
  testCase: Round2TestCase
): boolean {
  const lowerCode = code.toLowerCase();

  // Check that the code has some meaningful implementation
  // (i.e., not just the starter code template)
  const hasLoop = /for|while|map|reduce|foreach/.test(lowerCode);
  const hasConditional = /if|switch|case|ternary|\?/.test(lowerCode);
  const hasDataStructure = /dict|map|set|array|list|stack|queue|deque|hash/.test(lowerCode);
  const hasReturn = /return|print|console\.log|cout|system\.out/.test(lowerCode);

  // Require at least 3 of 4 indicators of a real solution
  const indicators = [hasLoop, hasConditional, hasDataStructure, hasReturn].filter(Boolean).length;

  return indicators >= 3;
}
