import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
  storageKey: 'eduplatform-auth',
  },
});

export type Profile = {
  id: string;
  full_name: string;
  role: 'student' | 'teacher';
  student_id: string | null;
  teacher_id: string | null;
  department: string | null;
  semester: number | null;
  avatar_url: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  code: string;
  description: string | null;
  teacher_id: string;
  department: string | null;
  semester: number | null;
  created_at: string;
};

export type Lecture = {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  ppt_content: string | null;
  ai_summary: string | null;
  video_url: string | null;
  created_by: string;
  created_at: string;
};

export type Assignment = {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  due_date: string | null;
  max_marks: number;
  created_by: string;
  created_at: string;
};

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  grade: number | null;
  feedback: string | null;
  graded_by_ai: boolean;
  submitted_at: string;
};

export type AttendanceSession = {
  id: string;
  course_id: string;
  date: string;
  qr_token: string | null;
  created_by: string;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late';
  marked_at: string;
};

export type VirtualLab = {
  id: string;
  title: string;
  course_id: string;
  instructions: string | null;
  ai_explanation: string | null;
  created_by: string;
  created_at: string;
};

export type LabSubmission = {
  id: string;
  lab_id: string;
  student_id: string;
  content: string | null;
  grade: number | null;
  ai_feedback: string | null;
  submitted_at: string;
};

export type CodingChallenge = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starter_code: string | null;
  test_cases: string | null;
  solution: string | null;
  created_by: string;
  created_at: string;
};

export type CodingSubmission = {
  id: string;
  challenge_id: string;
  student_id: string;
  code: string | null;
  language: string | null;
  passed: boolean;
  output: string | null;
  submitted_at: string;
};

export type LibraryBook = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  cover_url: string | null;
  content_url: string | null;
  read_count: number;
  created_at: string;
};

export type BookRead = {
  id: string;
  book_id: string;
  student_id: string;
  progress: number;
  last_read_at: string;
};

export type Quiz = {
  id: string;
  title: string;
  course_id: string | null;
  lecture_id: string | null;
  created_by: string;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  marks: number;
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: number[];
  score: number;
  completed_at: string;
};

export type Skill = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  icon: string | null;
  created_at: string;
};

export type SkillEnrollment = {
  id: string;
  skill_id: string;
  student_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
};

export type Internship = {
  id: string;
  title: string;
  company: string;
  description: string | null;
  type: 'internship' | 'job' | 'freelance';
  location: string | null;
  apply_url: string | null;
  posted_at: string;
};

export type GateScan = {
  id: string;
  student_id: string;
  scan_time: string;
  vehicle_number: string | null;
  status: 'granted' | 'denied' | 'pending';
  scan_method: 'mobile' | 'camera';
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
};

export type Enrollment = {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
};
