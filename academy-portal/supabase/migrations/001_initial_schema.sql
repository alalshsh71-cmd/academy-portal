-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'parent');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE warning_level AS ENUM ('info', 'warning', 'critical');

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'parent',
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- PARENTS
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  national_id TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  grade TEXT,
  group_name TEXT,
  gender TEXT CHECK (gender IN ('male','female')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
CREATE SEQUENCE student_number_seq START 10001;
ALTER TABLE students ALTER COLUMN student_number SET DEFAULT 'ST-' || nextval('student_number_seq');

-- PARENT <-> STUDENT
CREATE TABLE parent_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'guardian',
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'شهري',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount NUMERIC(10,2),
  status subscription_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- GRADES
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  score NUMERIC(5,2),
  max_score NUMERIC(5,2) DEFAULT 100,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- WARNINGS
CREATE TABLE warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  level warning_level NOT NULL DEFAULT 'warning',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ATTENDANCE
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  check_in_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(student_id, date)
);

-- STUDENT NOTES
CREATE TABLE student_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- AUDIT LOG
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','parents','students','subscriptions','grades','warnings','attendance','student_notes']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- INDEXES
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student ON parent_students(student_id);
CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_warnings_student ON warnings(student_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_student_notes_student ON student_notes(student_id);

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION my_student_ids()
RETURNS SETOF UUID AS $$
  SELECT ps.student_id FROM parent_students ps
  JOIN parents p ON p.id = ps.parent_id
  WHERE p.profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "parent_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- parents
CREATE POLICY "admin_all_parents" ON parents FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_record" ON parents FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- students
CREATE POLICY "admin_all_students" ON students FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_children" ON students FOR SELECT TO authenticated USING (id IN (SELECT my_student_ids()));

-- parent_students
CREATE POLICY "admin_all_ps" ON parent_students FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_links" ON parent_students FOR SELECT TO authenticated USING (parent_id IN (SELECT id FROM parents WHERE profile_id = auth.uid()));

-- subscriptions
CREATE POLICY "admin_all_subs" ON subscriptions FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_subs" ON subscriptions FOR SELECT TO authenticated USING (student_id IN (SELECT my_student_ids()));

-- grades
CREATE POLICY "admin_all_grades" ON grades FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_grades" ON grades FOR SELECT TO authenticated USING (student_id IN (SELECT my_student_ids()));

-- warnings
CREATE POLICY "admin_all_warnings" ON warnings FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_warnings" ON warnings FOR SELECT TO authenticated USING (student_id IN (SELECT my_student_ids()));

-- attendance
CREATE POLICY "admin_all_attendance" ON attendance FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_own_attendance" ON attendance FOR SELECT TO authenticated USING (student_id IN (SELECT my_student_ids()));

-- student_notes
CREATE POLICY "admin_all_notes" ON student_notes FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "parent_read_notes" ON student_notes FOR SELECT TO authenticated USING (student_id IN (SELECT my_student_ids()) AND is_private = FALSE);
CREATE POLICY "parent_insert_notes" ON student_notes FOR INSERT TO authenticated WITH CHECK (student_id IN (SELECT my_student_ids()));
CREATE POLICY "parent_update_own_notes" ON student_notes FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- audit_logs
CREATE POLICY "admin_all_logs" ON audit_logs FOR ALL TO authenticated USING (is_admin());

-- VIEW: أيام الاشتراك المتبقية
CREATE OR REPLACE VIEW subscription_status_view AS
SELECT s.*, st.full_name AS student_name, st.grade,
  GREATEST(0, (s.end_date - CURRENT_DATE)) AS days_remaining,
  CASE
    WHEN s.end_date < CURRENT_DATE THEN 'expired'
    WHEN (s.end_date - CURRENT_DATE) <= 7 THEN 'expiring_soon'
    ELSE 'active'
  END AS computed_status
FROM subscriptions s JOIN students st ON st.id = s.student_id;