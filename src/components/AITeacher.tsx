import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, BookOpen, Lightbulb, Loader2, User } from 'lucide-react';

type Message = { role: 'user' | 'ai'; content: string };

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Biology', 'English', 'History', 'Economics'];

const aiResponses: Record<string, string[]> = {
  default: [
    "Great question! Let me break this down step by step so it's easy to understand.",
    "I'm your AI teacher — I can explain any concept in simple terms. What topic would you like to explore?",
    "Let me explain this with a real-world example to make it crystal clear.",
  ],
};

function generateAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm your AI Teacher. I can help you understand any topic — from math and physics to programming and history. What would you like to learn today?";
  }
  if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra')) {
    return `Math is all about patterns and logic. Let me explain:\n\n1. Start with the fundamentals — understand what the symbols mean.\n2. Work through examples step by step.\n3. Practice regularly — math is a skill that builds on itself.\n\nWhat specific math topic would you like me to explain? For example: "Explain derivatives" or "How do I solve quadratic equations?"`;
  }
  if (lower.includes('physics')) {
    return `Physics explains how the universe works! Here's how to approach it:\n\n1. Understand the core concepts (force, energy, motion).\n2. Learn the formulas and what each variable represents.\n3. Solve problems by identifying what's given and what's asked.\n\nWhat physics topic interests you? I can explain mechanics, electricity, thermodynamics, and more.`;
  }
  if (lower.includes('code') || lower.includes('programming') || lower.includes('python') || lower.includes('javascript')) {
    return `Programming is like learning a new language! Here's my advice:\n\n1. Start with a beginner-friendly language like Python.\n2. Practice every day — even 30 minutes helps.\n3. Build small projects to apply what you learn.\n4. Don't be afraid of errors — they're how you learn!\n\nWhat programming concept would you like me to explain?`;
  }
  if (lower.includes('chemistry')) {
    return `Chemistry is the science of matter and its transformations. Let me help:\n\n1. Master the periodic table — it's your roadmap.\n2. Understand atoms, molecules, and bonds.\n3. Balance chemical equations step by step.\n\nWhat chemistry topic would you like to explore?`;
  }
  if (lower.includes('explain') || lower.includes('what') || lower.includes('how')) {
    return `I'd love to explain that! Here's a clear breakdown:\n\n• Every complex topic is built from simpler concepts.\n• Let's start with the basics and build up.\n• I'll use examples and analogies to make it click.\n\nCould you tell me a bit more about what specific part you're struggling with? That way I can give you the most helpful explanation.`;
  }
  const responses = aiResponses.default;
  return responses[Math.floor(Math.random() * responses.length)];
}

export default function AITeacher() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm your AI Teacher. I can explain any subject in simple, easy-to-understand terms. What would you like to learn today?" },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function send() {
    if (!input.trim() || thinking) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', content: generateAIResponse(userMsg) }]);
      setThinking(false);
    }, 800 + Math.random() * 600);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Teacher</h1>
          <p className="text-slate-500">Your personal AI tutor — ask anything, learn everything</p>
        </div>
      </div>

      {/* Subject chips */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setInput(`Explain ${s} basics`)}
            className="badge badge-neutral hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {s}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="card flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                {msg.role === 'ai' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-slate-600" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'ai' ? 'bg-blue-50 text-slate-800' : 'bg-slate-800 text-white'}`}>
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask me anything..."
              className="input-field flex-1"
              disabled={thinking}
            />
            <button onClick={send} disabled={thinking || !input.trim()} className="btn-primary flex items-center gap-2">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-powered explanations for every subject</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Tips for best results
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
          <p>Ask specific questions like "Explain photosynthesis step by step"</p>
          <p>Request examples: "Give me a real-world example of Newton's laws"</p>
          <p>Ask for summaries: "Summarize the key points of World War II"</p>
          <p>Request practice: "Give me 3 practice problems on fractions"</p>
        </div>
      </div>
    </div>
  );
}
