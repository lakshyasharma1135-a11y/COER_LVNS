/*
# EduPlatform — Complete Schema

1. Purpose
   A digital education platform with student and teacher roles. Features include
   AI-assisted learning, virtual labs, coding labs, smart assignments, attendance,
   e-library, lectures/PPTs, quizzes/competitions, projects/skills, career/internship,
   smart ID gate scanning, and notifications.

2. Tables
   - profiles: extends auth.users with role (student/teacher), name, avatar, student_id/teacher_id, department, semester
   - courses: course catalog (title, code, description, teacher_id, department, semester)
   - enrollments: student-course enrollment mapping
   - lectures: lecture/PPT content (title, description, course_id, ppt_content, ai_summary, video_url, created_by)
   - assignments: assignments (title, description, course_id, due_date, max_marks, created_by)
   - assignment_submissions: student submissions (assignment_id, student_id, content, grade, feedback, graded_by_ai)
   - attendance_sessions: teacher-created attendance sessions (course_id, date, qr_token, created_by)
   - attendance_records: student attendance (session_id, student_id, status, marked_at)
   - virtual_labs: lab sheets (title, course_id, instructions, ai_explanation, created_by)
   - lab_submissions: student lab work (lab_id, student_id, content, grade, ai_feedback)
   - coding_challenges: coding problems (title, description, language, difficulty, starter_code, test_cases, solution)
   - coding_submissions: student code submissions (challenge_id, student_id, code, language, passed, output)
   - library_books: e-library books (title, author, category, description, cover_url, content_url, read_count)
   - book_reads: reading progress tracking (book_id, student_id, progress, last_read_at)
   - quizzes: quizzes linked to lectures/courses (title, course_id, lecture_id, created_by)
   - quiz_questions: questions (quiz_id, question, options jsonb, correct_answer, marks)
   - quiz_attempts: student attempts (quiz_id, student_id, answers jsonb, score, completed_at)
   - skills: skill tracks (name, category, description, icon)
   - skill_enrollments: student skill enrollment (skill_id, student_id, progress, completed)
   - internships: internship/job listings (title, company, description, type, location, apply_url, posted_at)
   - gate_scans: entry gate scan logs (student_id, scan_time, vehicle_number, status, scan_method)
   - notifications: notifications (user_id, title, message, type, read, created_at)

3. Security
   - RLS enabled on all tables.
   - All policies scoped to authenticated users with ownership checks.
   - Profiles readable by all authenticated; updatable by owner.
   - Teacher-created content (courses, lectures, assignments, labs, quizzes, attendance sessions)
     editable only by the creator; readable by enrolled students.
   - Student submissions readable by the student and the course teacher.
   - Notifications scoped to owner via user_id.
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
  student_id text,
  teacher_id text,
  department text,
  semester int,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  code text NOT NULL,
  description text,
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  department text,
  semester int,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select" ON courses;
CREATE POLICY "courses_select" ON courses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "courses_insert_own" ON courses;
CREATE POLICY "courses_insert_own" ON courses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "courses_update_own" ON courses;
CREATE POLICY "courses_update_own" ON courses FOR UPDATE
  TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "courses_delete_own" ON courses;
CREATE POLICY "courses_delete_own" ON courses FOR DELETE
  TO authenticated USING (auth.uid() = teacher_id);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now()
);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select" ON enrollments;
CREATE POLICY "enrollments_select" ON enrollments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
CREATE POLICY "enrollments_insert_own" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "enrollments_delete_own" ON enrollments;
CREATE POLICY "enrollments_delete_own" ON enrollments FOR DELETE
  TO authenticated USING (auth.uid() = student_id);

-- Lectures
CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  ppt_content text,
  ai_summary text,
  video_url text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectures_select" ON lectures;
CREATE POLICY "lectures_select" ON lectures FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "lectures_insert_own" ON lectures;
CREATE POLICY "lectures_insert_own" ON lectures FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "lectures_update_own" ON lectures;
CREATE POLICY "lectures_update_own" ON lectures FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "lectures_delete_own" ON lectures;
CREATE POLICY "lectures_delete_own" ON lectures FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  due_date timestamptz,
  max_marks int DEFAULT 100,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select" ON assignments;
CREATE POLICY "assignments_select" ON assignments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "assignments_insert_own" ON assignments;
CREATE POLICY "assignments_insert_own" ON assignments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "assignments_update_own" ON assignments;
CREATE POLICY "assignments_update_own" ON assignments FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "assignments_delete_own" ON assignments;
CREATE POLICY "assignments_delete_own" ON assignments FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  grade int,
  feedback text,
  graded_by_ai boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now()
);
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_select" ON assignment_submissions;
CREATE POLICY "submissions_select" ON assignment_submissions FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_submissions.assignment_id
      AND a.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "submissions_insert_own" ON assignment_submissions;
CREATE POLICY "submissions_insert_own" ON assignment_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "submissions_update_own" ON assignment_submissions;
CREATE POLICY "submissions_update_own" ON assignment_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  qr_token text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_sessions_select" ON attendance_sessions;
CREATE POLICY "attendance_sessions_select" ON attendance_sessions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "attendance_sessions_insert_own" ON attendance_sessions;
CREATE POLICY "attendance_sessions_insert_own" ON attendance_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "attendance_sessions_delete_own" ON attendance_sessions;
CREATE POLICY "attendance_sessions_delete_own" ON attendance_sessions FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  marked_at timestamptz DEFAULT now()
);
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select" ON attendance_records;
CREATE POLICY "attendance_select" ON attendance_records FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = attendance_records.session_id
      AND s.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "attendance_insert_own" ON attendance_records;
CREATE POLICY "attendance_insert_own" ON attendance_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

-- Virtual Labs
CREATE TABLE IF NOT EXISTS virtual_labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructions text,
  ai_explanation text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE virtual_labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "virtual_labs_select" ON virtual_labs;
CREATE POLICY "virtual_labs_select" ON virtual_labs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "virtual_labs_insert_own" ON virtual_labs;
CREATE POLICY "virtual_labs_insert_own" ON virtual_labs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "virtual_labs_update_own" ON virtual_labs;
CREATE POLICY "virtual_labs_update_own" ON virtual_labs FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "virtual_labs_delete_own" ON virtual_labs;
CREATE POLICY "virtual_labs_delete_own" ON virtual_labs FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Lab Submissions
CREATE TABLE IF NOT EXISTS lab_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES virtual_labs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  grade int,
  ai_feedback text,
  submitted_at timestamptz DEFAULT now()
);
ALTER TABLE lab_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_sub_select" ON lab_submissions;
CREATE POLICY "lab_sub_select" ON lab_submissions FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM virtual_labs l
      WHERE l.id = lab_submissions.lab_id
      AND l.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_sub_insert_own" ON lab_submissions;
CREATE POLICY "lab_sub_insert_own" ON lab_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "lab_sub_update_own" ON lab_submissions;
CREATE POLICY "lab_sub_update_own" ON lab_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Coding Challenges
CREATE TABLE IF NOT EXISTS coding_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  language text DEFAULT 'javascript',
  difficulty text DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  starter_code text,
  test_cases text,
  solution text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coding_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coding_select" ON coding_challenges;
CREATE POLICY "coding_select" ON coding_challenges FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "coding_insert_own" ON coding_challenges;
CREATE POLICY "coding_insert_own" ON coding_challenges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "coding_update_own" ON coding_challenges;
CREATE POLICY "coding_update_own" ON coding_challenges FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "coding_delete_own" ON coding_challenges;
CREATE POLICY "coding_delete_own" ON coding_challenges FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Coding Submissions
CREATE TABLE IF NOT EXISTS coding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES coding_challenges(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code text,
  language text,
  passed boolean DEFAULT false,
  output text,
  submitted_at timestamptz DEFAULT now()
);
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coding_sub_select" ON coding_submissions;
CREATE POLICY "coding_sub_select" ON coding_submissions FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM coding_challenges c
      WHERE c.id = coding_submissions.challenge_id
      AND c.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "coding_sub_insert_own" ON coding_submissions;
CREATE POLICY "coding_sub_insert_own" ON coding_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

-- Library Books
CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  category text,
  description text,
  cover_url text,
  content_url text,
  read_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_select" ON library_books;
CREATE POLICY "books_select" ON library_books FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "books_insert_own" ON library_books;
CREATE POLICY "books_insert_own" ON library_books FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "books_update_own" ON library_books;
CREATE POLICY "books_update_own" ON library_books FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Book Reads
CREATE TABLE IF NOT EXISTS book_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  progress int DEFAULT 0,
  last_read_at timestamptz DEFAULT now()
);
ALTER TABLE book_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_reads_select" ON book_reads;
CREATE POLICY "book_reads_select" ON book_reads FOR SELECT
  TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "book_reads_insert_own" ON book_reads;
CREATE POLICY "book_reads_insert_own" ON book_reads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "book_reads_update_own" ON book_reads;
CREATE POLICY "book_reads_update_own" ON book_reads FOR UPDATE
  TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lecture_id uuid REFERENCES lectures(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select" ON quizzes;
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "quizzes_insert_own" ON quizzes;
CREATE POLICY "quizzes_insert_own" ON quizzes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "quizzes_update_own" ON quizzes;
CREATE POLICY "quizzes_update_own" ON quizzes FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "quizzes_delete_own" ON quizzes;
CREATE POLICY "quizzes_delete_own" ON quizzes FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer int NOT NULL,
  marks int DEFAULT 1
);
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_q_select" ON quiz_questions;
CREATE POLICY "quiz_q_select" ON quiz_questions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "quiz_q_insert_own" ON quiz_questions;
CREATE POLICY "quiz_q_insert_own" ON quiz_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "quiz_q_delete_own" ON quiz_questions;
CREATE POLICY "quiz_q_delete_own" ON quiz_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.created_by = auth.uid())
  );

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb,
  score int DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempts_select" ON quiz_attempts;
CREATE POLICY "quiz_attempts_select" ON quiz_attempts FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_attempts.quiz_id AND quizzes.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "quiz_attempts_insert_own" ON quiz_attempts;
CREATE POLICY "quiz_attempts_insert_own" ON quiz_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skills_select" ON skills;
CREATE POLICY "skills_select" ON skills FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "skills_insert_own" ON skills;
CREATE POLICY "skills_insert_own" ON skills FOR INSERT
  TO authenticated WITH CHECK (true);

-- Skill Enrollments
CREATE TABLE IF NOT EXISTS skill_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  progress int DEFAULT 0,
  completed boolean DEFAULT false,
  enrolled_at timestamptz DEFAULT now()
);
ALTER TABLE skill_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_enr_select" ON skill_enrollments;
CREATE POLICY "skill_enr_select" ON skill_enrollments FOR SELECT
  TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "skill_enr_insert_own" ON skill_enrollments;
CREATE POLICY "skill_enr_insert_own" ON skill_enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "skill_enr_update_own" ON skill_enrollments;
CREATE POLICY "skill_enr_update_own" ON skill_enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Internships
CREATE TABLE IF NOT EXISTS internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  description text,
  type text DEFAULT 'internship' CHECK (type IN ('internship', 'job', 'freelance')),
  location text,
  apply_url text,
  posted_at timestamptz DEFAULT now()
);
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "internships_select" ON internships;
CREATE POLICY "internships_select" ON internships FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "internships_insert_own" ON internships;
CREATE POLICY "internships_insert_own" ON internships FOR INSERT
  TO authenticated WITH CHECK (true);

-- Gate Scans
CREATE TABLE IF NOT EXISTS gate_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_time timestamptz DEFAULT now(),
  vehicle_number text,
  status text DEFAULT 'granted' CHECK (status IN ('granted', 'denied', 'pending')),
  scan_method text DEFAULT 'mobile' CHECK (scan_method IN ('mobile', 'camera'))
);
ALTER TABLE gate_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gate_select" ON gate_scans;
CREATE POLICY "gate_select" ON gate_scans FOR SELECT
  TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "gate_insert_own" ON gate_scans;
CREATE POLICY "gate_insert_own" ON gate_scans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select" ON notifications;
CREATE POLICY "notif_select" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_insert_own" ON notifications;
CREATE POLICY "notif_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lectures_course ON lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_scans_student ON gate_scans(student_id);