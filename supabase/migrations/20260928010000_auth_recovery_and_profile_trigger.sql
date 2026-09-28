-- COER LVNS authentication hardening
-- Creates a profile automatically after signup, including when email confirmation is enabled.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, role, student_id, teacher_id, department, semester
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(COALESCE(NEW.email, 'User'), '@', 1)),
    CASE WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'teacher') THEN NEW.raw_user_meta_data->>'role' ELSE 'student' END,
    NULLIF(NEW.raw_user_meta_data->>'student_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'teacher_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    CASE WHEN (NEW.raw_user_meta_data->>'semester') ~ '^\d+$' THEN (NEW.raw_user_meta_data->>'semester')::int ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    student_id = EXCLUDED.student_id,
    teacher_id = EXCLUDED.teacher_id,
    department = EXCLUDED.department,
    semester = EXCLUDED.semester;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
