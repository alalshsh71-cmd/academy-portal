export type UserRole = 'admin' | 'parent'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type WarningLevel = 'info' | 'warning' | 'critical'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  username: string
  phone: string | null
  is_active: boolean
  must_change_password: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}
export interface Parent {
  id: string
  profile_id: string
  national_id: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
  profile?: Profile
}
export interface Student {
  id: string
  student_number: string
  full_name: string
  date_of_birth: string | null
  grade: string | null
  group_name: string | null
  gender: 'male' | 'female' | null
  is_active: boolean
  photo_url: string | null
  created_at: string
  updated_at: string
}
export interface Subscription {
  id: string
  student_id: string
  plan_name: string
  start_date: string
  end_date: string
  amount: number | null
  status: SubscriptionStatus
  notes: string | null
  created_at: string
  updated_at: string
  student?: Student
  days_remaining?: number
}
export interface Grade {
  id: string
  student_id: string
  subject: string
  exam_name: string
  score: number | null
  max_score: number
  exam_date: string
  notes: string | null
  created_at: string
  student?: Student
}
export interface Warning {
  id: string
  student_id: string
  title: string
  description: string | null
  level: WarningLevel
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
  student?: Student
}
export interface Attendance {
  id: string
  student_id: string
  date: string
  status: AttendanceStatus
  check_in_time: string | null
  notes: string | null
  created_at: string
  student?: Student
}
export interface StudentNote {
  id: string
  student_id: string
  category: string
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  student?: Student
}