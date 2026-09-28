import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { CodingChallenge, CodingSubmission } from '@/lib/supabase';
import {
  Code2, Plus, Play, CheckCircle2, XCircle, Loader2, X, Terminal,
  Lightbulb, Trophy, Clock,
} from 'lucide-react';

const starterChallenges = [
  {
    title: 'Sum of Two Numbers',
    description: 'Write a function `add(a, b)` that returns the sum of two numbers.',
    language: 'javascript',
    difficulty: 'easy' as const,
    starter_code: 'function add(a, b) {\n  // Your code here\n}',
    test_cases: '[{"args":[2,3],"expected":5},{"args":[-1,1],"expected":0},{"args":[0,0],"expected":0}]',
    solution: 'function add(a, b) {\n  return a + b;\n}',
  },
  {
    title: 'Check Even or Odd',
    description: 'Write a function `isEven(n)` that returns true if n is even, false otherwise.',
    language: 'javascript',
    difficulty: 'easy' as const,
    starter_code: 'function isEven(n) {\n  // Your code here\n}',
    test_cases: '[{"args":[4],"expected":true},{"args":[7],"expected":false},{"args":[0],"expected":true}]',
    solution: 'function isEven(n) {\n  return n % 2 === 0;\n}',
  },
  {
    title: 'Reverse a String',
    description: 'Write a function `reverse(str)` that returns the reversed string.',
    language: 'javascript',
    difficulty: 'medium' as const,
    starter_code: 'function reverse(str) {\n  // Your code here\n}',
    test_cases: '[{"args":["hello"],"expected":"olleh"},{"args":["world"],"expected":"dlrow"},{"args":[""],"expected":""}]',
    solution: 'function reverse(str) {\n  return str.split("").reverse().join("");\n}',
  },
  {
    title: 'Find Maximum',
    description: 'Write a function `findMax(arr)` that returns the largest number in an array.',
    language: 'javascript',
    difficulty: 'medium' as const,
    starter_code: 'function findMax(arr) {\n  // Your code here\n}',
    test_cases: '[{"args":[[1,5,3,9,2]],"expected":9},{"args":[[-1,-5,-3]],"expected":-1},{"args":[[42]],"expected":42}]',
    solution: 'function findMax(arr) {\n  return Math.max(...arr);\n}',
  },
];

export default function CodingLab() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, CodingSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CodingChallenge | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);

  // Create form
  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cDifficulty, setCDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [cStarter, setCStarter] = useState('');
  const [cTests, setCTests] = useState('');
  const [cSolution, setCSolution] = useState('');

  useEffect(() => { loadChallenges(); }, []);

  async function loadChallenges() {
    setLoading(true);
    const { data } = await supabase.from('coding_challenges').select('*').order('created_at', { ascending: false });
    setChallenges(data || []);
    if (profile && role === 'student') {
      const { data: subs } = await supabase.from('coding_submissions').select('*').eq('student_id', profile.id);
      const map: Record<string, CodingSubmission> = {};
      (subs || []).forEach((s) => { map[s.challenge_id] = s; });
      setSubmissions(map);
    }
    setLoading(false);
  }

  function runCode() {
    if (!selected || !code.trim()) return;
    setRunning(true);
    setOutput('');
    setPassed(null);

    try {
      const tests = JSON.parse(selected.test_cases || '[]');
      let allPassed = true;
      let results: string[] = [];

      const fn = new Function(`${code}\n; return typeof ${getFunctionName(code)} !== 'undefined' ? ${getFunctionName(code)} : null;`)();

      for (const test of tests) {
        try {
          const result = fn(...test.args);
          const expected = test.expected;
          const pass = JSON.stringify(result) === JSON.stringify(expected);
          if (!pass) allPassed = false;
          results.push(`${pass ? 'PASS' : 'FAIL'}: args=${JSON.stringify(test.args)} → got ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`);
        } catch (e) {
          allPassed = false;
          results.push(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      setOutput(results.join('\n'));
      setPassed(allPassed);

      if (profile) {
        supabase.from('coding_submissions').insert({
          challenge_id: selected.id,
          student_id: profile.id,
          code,
          language: selected.language,
          passed: allPassed,
          output: results.join('\n'),
        }).then(() => loadChallenges());
      }
    } catch (e) {
      setOutput(`Syntax Error: ${e instanceof Error ? e.message : String(e)}`);
      setPassed(false);
    }
    setRunning(false);
  }

  function getFunctionName(code: string): string {
    const match = code.match(/function\s+(\w+)/);
    return match ? match[1] : 'null';
  }

  async function createChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from('coding_challenges').insert({
      title: cTitle,
      description: cDesc,
      language: 'javascript',
      difficulty: cDifficulty,
      starter_code: cStarter,
      test_cases: cTests,
      solution: cSolution,
      created_by: profile.id,
    });
    if (!error) {
      setShowCreate(false);
      setCTitle(''); setCDesc(''); setCDifficulty('easy'); setCStarter(''); setCTests(''); setCSolution('');
      loadChallenges();
    }
  }

  // Seed starter challenges if none exist
  async function seedStarterChallenges() {
    if (!profile || challenges.length > 0) return;
    for (const ch of starterChallenges) {
      await supabase.from('coding_challenges').insert({ ...ch, created_by: profile.id });
    }
    loadChallenges();
  }

  useEffect(() => {
    if (!loading && challenges.length === 0 && profile) {
      seedStarterChallenges();
    }
  }, [loading, challenges.length, profile]);

  const diffColors: Record<string, string> = {
    easy: 'badge-success', medium: 'badge-warning', hard: 'badge-error',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-700/20">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Coding Lab</h1>
            <p className="text-slate-500">Practice coding right in your browser — no setup needed</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Challenge
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="card p-12 text-center">
          <Code2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Loading challenges...</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((ch, i) => {
            const sub = submissions[ch.id];
            return (
              <div key={ch.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`badge ${diffColors[ch.difficulty]}`}>{ch.difficulty}</span>
                    {sub?.passed && <span className="badge badge-success"><CheckCircle2 className="w-3.5 h-3.5" /></span>}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{ch.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{ch.description}</p>
                <button onClick={() => { setSelected(ch); setCode(ch.starter_code || ''); setOutput(''); setPassed(null); }} className="btn-secondary w-full text-sm">
                  {sub ? 'Retry' : 'Solve'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Code editor modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 animate-fade-in flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Code2 className="w-6 h-6 text-blue-400" />
              <h2 className="font-bold text-white">{selected.title}</h2>
              <span className={`badge ${diffColors[selected.difficulty]}`}>{selected.difficulty}</span>
            </div>
            <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-slate-800">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-slate-300 text-sm">{selected.description}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-300">Your Code</span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={12}
                  className="w-full bg-slate-950 text-green-400 font-mono text-sm rounded-xl p-4 border border-slate-700 focus:outline-none focus:border-blue-500 resize-none"
                  spellCheck={false}
                />
              </div>

              <button onClick={runCode} disabled={running || !code.trim()} className="btn-primary flex items-center gap-2">
                {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Run & Test
              </button>

              {output && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {passed ? (
                      <><CheckCircle2 className="w-5 h-5 text-green-500" /><span className="text-sm font-semibold text-green-400">All tests passed!</span></>
                    ) : (
                      <><XCircle className="w-5 h-5 text-red-500" /><span className="text-sm font-semibold text-red-400">Some tests failed</span></>
                    )}
                  </div>
                  <pre className="bg-slate-950 text-slate-300 font-mono text-sm rounded-xl p-4 border border-slate-700 whitespace-pre-line">{output}</pre>
                </div>
              )}

              <div className="bg-slate-800 rounded-xl p-4 flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-semibold mb-1">AI Hint</p>
                  <p>Read the test cases to understand what inputs your function receives and what output is expected. Start with the simplest test case, then handle edge cases.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create challenge modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="font-bold text-slate-900">Create Coding Challenge</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={createChallenge} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Title</label>
                <input type="text" value={cTitle} onChange={(e) => setCTitle(e.target.value)} required className="input-field" placeholder="e.g., FizzBuzz" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Description</label>
                <textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} required rows={3} className="input-field resize-none" placeholder="Describe the problem..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Difficulty</label>
                <select value={cDifficulty} onChange={(e) => setCDifficulty(e.target.value as any)} className="input-field">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
      <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Starter Code</label>
                <textarea value={cStarter} onChange={(e) => setCStarter(e.target.value)} rows={5} className="input-field resize-none font-mono text-sm" placeholder="function solve() {&#10;  // Your code here&#10;}" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Test Cases (JSON)</label>
                <textarea value={cTests} onChange={(e) => setCTests(e.target.value)} rows={4} className="input-field resize-none font-mono text-sm" placeholder='[{"args":[2,3],"expected":5}]' />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Solution</label>
                <textarea value={cSolution} onChange={(e) => setCSolution(e.target.value)} rows={4} className="input-field resize-none font-mono text-sm" placeholder="function solve() { return ... }" />
              </div>
              <button type="submit" className="btn-primary w-full">Create Challenge</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
