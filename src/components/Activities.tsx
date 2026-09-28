import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Quiz, QuizQuestion, QuizAttempt, Course } from '@/lib/supabase';
import {
  Trophy, Plus, Loader2, X, Play, CheckCircle2, XCircle, Award,
  ChevronRight, Bot, Target,
} from 'lucide-react';

export default function Activities() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; questions: QuizQuestion[] } | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Create form
  const [qTitle, setQTitle] = useState('');
  const [qCourse, setQCourse] = useState('');
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correct: number }[]>([
    { question: '', options: ['', '', '', ''], correct: 0 },
  ]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
    setQuizzes(data || []);
    const { data: cData } = await supabase.from('courses').select('*');
    setCourses(cData || []);
    if (profile && role === 'student') {
      const { data: aData } = await supabase.from('quiz_attempts').select('*').eq('student_id', profile.id);
      const map: Record<string, QuizAttempt> = {};
      (aData || []).forEach((a) => { map[a.quiz_id] = a; });
      setAttempts(map);
    }
    setLoading(false);
  }

  async function startQuiz(quiz: Quiz) {
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
    if (data && data.length > 0) {
      setActiveQuiz({ quiz, questions: data });
      setCurrentQ(0);
      setAnswers([]);
      setShowResult(false);
    }
  }

  function answerQuestion(idx: number) {
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
    if (currentQ < (activeQuiz?.questions.length || 0) - 1) {
      setCurrentQ(currentQ + 1);
    }
  }

  async function finishQuiz() {
    if (!activeQuiz || !profile) return;
    let s = 0;
    activeQuiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) s += q.marks;
    });
    setScore(s);
    setShowResult(true);
    const { data } = await supabase.from('quiz_attempts').insert({
      quiz_id: activeQuiz.quiz.id,
      student_id: profile.id,
      answers,
      score: s,
    }).select().single();
    if (data) {
      setAttempts((prev) => ({ ...prev, [activeQuiz.quiz.id]: data }));
    }
  }

  async function createQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const { data: quiz } = await supabase.from('quizzes').insert({
      title: qTitle,
      course_id: qCourse || undefined,
      created_by: profile.id,
    }).select().single();
    if (quiz) {
      for (const q of questions) {
        if (q.question && q.options.filter((o) => o).length >= 2) {
          await supabase.from('quiz_questions').insert({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options.filter((o) => o),
            correct_answer: q.correct,
            marks: 1,
          });
        }
      }
      setShowCreate(false);
      setQTitle(''); setQCourse(''); setQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
      load();
    }
  }

  function addQuestion() {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct: 0 }]);
  }

  function updateQuestion(idx: number, field: string, value: any) {
    const updated = [...questions];
    (updated[idx] as any)[field] = value;
    setQuestions(updated);
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  }

  const maxScore = activeQuiz?.questions.reduce((sum, q) => sum + q.marks, 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Activities & Competitions</h1>
            <p className="text-slate-500">Quizzes after every lecture — test your knowledge</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Quiz
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : quizzes.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No quizzes yet{role === 'teacher' ? '. Create one to get started!' : '.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q, i) => {
            const attempt = attempts[q.id];
            const course = courses.find((c) => c.id === q.course_id);
            return (
              <div key={q.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-orange-600" />
                  </div>
                  {attempt && <span className="badge badge-success"><Award className="w-3.5 h-3.5" /> {attempt.score} pts</span>}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{q.title}</h3>
                {course && <p className="text-xs text-slate-500 mb-3">{course.code}</p>}
                {role === 'student' && (
                  <button onClick={() => startQuiz(q)} className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5">
                    <Play className="w-4 h-4" /> {attempt ? 'Retry' : 'Start Quiz'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz player */}
      {activeQuiz && !showResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 animate-fade-in flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-900">{activeQuiz.quiz.title}</h2>
              <div className="text-sm text-slate-500">{currentQ + 1} / {activeQuiz.questions.length}</div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full mb-6">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / activeQuiz.questions.length) * 100}%` }} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{activeQuiz.questions[currentQ].question}</h3>
            <div className="space-y-2">
              {activeQuiz.questions[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answerQuestion(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${answers[currentQ] === i ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <span className="font-semibold text-slate-700">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
            {currentQ === activeQuiz.questions.length - 1 && (
              <button onClick={finishQuiz} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                <Target className="w-5 h-5" /> Submit Quiz
              </button>
            )}
            {currentQ < activeQuiz.questions.length - 1 && answers[currentQ] !== undefined && (
              <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                Next <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz result */}
      {activeQuiz && showResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 animate-fade-in flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center animate-scale-in">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${score >= maxScore * 0.7 ? 'bg-green-50' : 'bg-orange-50'}`}>
              {score >= maxScore * 0.7 ? <Trophy className="w-10 h-10 text-green-600" /> : <Target className="w-10 h-10 text-orange-600" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
            <p className="text-3xl font-bold text-orange-600 mb-1">{score} / {maxScore}</p>
            <p className="text-slate-500 mb-6">{score >= maxScore * 0.7 ? 'Great job! You passed!' : 'Keep practicing!'}</p>
            <div className="space-y-2 mb-6 text-left">
              {activeQuiz.questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
                  {answers[i] === q.correct_answer ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <p className="text-slate-700">{q.question}</p>
                    {answers[i] !== q.correct_answer && (
                      <p className="text-xs text-slate-500 mt-1">Correct: {String.fromCharCode(65 + q.correct_answer)}. {q.options[q.correct_answer]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setActiveQuiz(null); setShowResult(false); }} className="btn-primary w-full">Done</button>
          </div>
        </div>
      )}

      {/* Create quiz modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="font-bold text-slate-900">Create Quiz</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={createQuiz} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Quiz Title</label>
                <input type="text" value={qTitle} onChange={(e) => setQTitle(e.target.value)} required className="input-field" placeholder="e.g., Chapter 3 Quiz" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Course (optional)</label>
                <select value={qCourse} onChange={(e) => setQCourse(e.target.value)} className="input-field">
                  <option value="">Select a course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Question {qIdx + 1}</p>
                    <input type="text" value={q.question} onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)} className="input-field" placeholder="Question text" />
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qIdx}`} checked={q.correct === oIdx} onChange={() => updateQuestion(qIdx, 'correct', oIdx)} className="w-4 h-4 accent-orange-500" />
                        <input type="text" value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} className="input-field" placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} />
                      </div>
                    ))}
                    <p className="text-xs text-slate-400">Select the radio button for the correct answer</p>
                  </div>
                ))}
                <button type="button" onClick={addQuestion} className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
              <button type="submit" className="btn-primary w-full">Create Quiz</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
