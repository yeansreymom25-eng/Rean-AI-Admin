import { signInWithPopup } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "./firebaseClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:4000/api/v1";

const ACCESS_TOKEN_KEY = "rean_admin_access_token";
const REFRESH_TOKEN_KEY = "rean_admin_refresh_token";
const ADMIN_USER_KEY = "rean_admin_user";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type AdminUser = {
  user_id?: string;
  firebase_uid?: string;
  email?: string;
  full_name?: string;
  role?: string;
  profile_image_url?: string | null;
  preferred_language?: string | null;
};

export type DashboardMetric = {
  value: number;
  display: string;
  accent: string;
};

export type AdminDashboardData = {
  admin: AdminUser;
  metrics: {
    total_students: DashboardMetric;
    active_ai_sessions: DashboardMetric;
    curriculum_progress: DashboardMetric;
    ai_quality_score: DashboardMetric;
  };
  insights: {
    student_activity: {
      last_7_days: StudentActivityPoint[];
      last_30_days: StudentActivityPoint[];
    };
    curriculum_status: {
      overall_progress: number;
      subjects: CurriculumStatusItem[];
    };
    flagged_ai_sessions: FlaggedAiSession[];
    notifications: DashboardNotification[];
  };
};

export type StudentActivityPoint = {
  label: string;
  value: number;
};

export type CurriculumStatusItem = {
  subject_id: string;
  label: string;
  selected_students: number;
  average_progress: number;
  value: number;
  color: string;
};

export type FlaggedAiSession = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  reason: string;
  status: "Amber" | "Red";
  time: string;
};

export type DashboardNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: "amber" | "rose" | "blue";
};

export type AdminStudentStatus = "Active" | "Needs Review" | "At Risk";

export type AdminStudent = {
  id: string;
  name: string;
  grade: string;
  focus: string;
  progress: number;
  sessions: number;
  status: AdminStudentStatus;
  lastSeen: string;
};

export type AdminStudentsData = {
  metrics: {
    total_students: DashboardMetric;
    active_today: DashboardMetric;
    average_progress: DashboardMetric;
    need_review: DashboardMetric;
  };
  students: AdminStudent[];
  filters: {
    grades: string[];
    statuses: string[];
  };
};

export type AdminSettingsData = {
  profile: {
    full_name: string;
    email: string;
    role: string;
    role_label: string;
    organization: string;
    profile_image_url: string | null;
    preferred_language: string | null;
  };
  workspace: {
    language: string;
    timezone: string;
  };
  settings: {
    ai_review: Record<string, boolean>;
    student_access: Record<string, boolean>;
  };
  security: {
    two_factor_authentication: string;
    last_password_update: string;
    audit_logs: string;
  };
};

export type AdminGradeStatus = "Active" | "Inactive";

export type AdminGradeLevel = {
  id: string;
  grade_level_id: string;
  name: string;
  khmer: string;
  number: string;
  description: string;
  status: AdminGradeStatus;
};

export type AdminGradeLevelInput = {
  name: string;
  number: string;
  description: string;
  status: AdminGradeStatus;
};

export type AdminSubjectStatus = "Active" | "Draft" | "Inactive";

export type AdminSubject = {
  id: string;
  subject_id: string;
  grade_level_id: string;
  grade: string;
  name: string;
  khmer: string;
  code: string;
  icon: string;
  description: string;
  order: string;
  status: AdminSubjectStatus;
};

export type AdminSubjectInput = {
  grade_level_id: string;
  name: string;
  khmer?: string;
  code: string;
  icon?: string;
  description: string;
  order: string;
  status: AdminSubjectStatus;
};

export type AdminCurriculumTopic = {
  id: string;
  topic_id: string;
  grade_level_id: string;
  subject_id: string;
  grade: string;
  subject: string;
  name: string;
  code: string;
  status: "Active" | "Inactive";
};

export type AdminCurriculumContentKind = "Formula" | "Concept" | "Example" | "Exercise";
export type AdminCurriculumContentStatus = "Published" | "Draft";

export type AdminCurriculumContent = {
  id: string;
  content_id: string;
  kind: AdminCurriculumContentKind;
  grade_level_id: string;
  subject_id: string;
  topic_id: string;
  grade: string;
  subject: string;
  lesson: string;
  title: string;
  summary: string;
  body: string;
  expression: string;
  description: string;
  variables: unknown[];
  steps: unknown[];
  khmerTerms: unknown[];
  prerequisites: string[];
  tags: string[];
  status: AdminCurriculumContentStatus;
};

export type AdminCurriculumContentInput = Omit<AdminCurriculumContent, "id" | "content_id">;

type AuthResponse = {
  user: AdminUser;
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in_seconds: number;
  };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? "Request failed");
  }

  return (payload.data ?? ({} as T)) as T;
}

export async function adminLogin(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  storeAdminSession(data);
  return data;
}

export async function adminRegister(
  fullName: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/admin/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
      preferred_language: null,
    }),
  });
  storeAdminSession(data);
  return data;
}

export async function adminLoginWithGoogle(): Promise<AuthResponse> {
  const credential = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
  const idToken = await credential.user.getIdToken();
  const data = await request<AuthResponse>("/admin/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
  storeAdminSession(data);
  return data;
}

export async function requestAdminPasswordReset(email: string): Promise<{ reset_token?: string }> {
  return request<{ reset_token?: string }>("/admin/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmAdminPasswordReset(token: string, password: string): Promise<void> {
  await request("/admin/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function adminLogout(): Promise<void> {
  const refreshToken = getRefreshToken();
  clearAdminSession();
  if (!refreshToken) return;

  try {
    await request("/admin/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Local storage is already cleared; a failed revoke should not trap the user.
  }
}

export async function verifyAdminSession(): Promise<AdminUser> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  const data = await request<{ user: AdminUser }>("/admin/auth/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  return data.user;
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminDashboardData>("/admin/dashboard", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
}

export async function loadAdminStudents(): Promise<AdminStudentsData> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminStudentsData>("/admin/students", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
}

export async function loadAdminSettings(): Promise<AdminSettingsData> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminSettingsData>("/admin/settings", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
}

export async function updateAdminSettings(
  settings: AdminSettingsData,
): Promise<AdminSettingsData> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminSettingsData>("/admin/settings", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(settings),
  });
}

export async function loadAdminGrades(): Promise<AdminGradeLevel[]> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  const data = await request<{ grades: AdminGradeLevel[] }>("/admin/curriculum/grades", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  return data.grades;
}

export async function createAdminGrade(
  grade: AdminGradeLevelInput,
): Promise<AdminGradeLevel> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminGradeLevel>("/admin/curriculum/grades", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(grade),
  });
}

export async function updateAdminGrade(
  gradeLevelId: string,
  grade: Partial<AdminGradeLevelInput>,
): Promise<AdminGradeLevel> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminGradeLevel>(`/admin/curriculum/grades/${gradeLevelId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(grade),
  });
}

export async function loadAdminSubjects(gradeLevelId?: string): Promise<AdminSubject[]> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  const query = gradeLevelId ? `?grade_level_id=${encodeURIComponent(gradeLevelId)}` : "";
  const data = await request<{ subjects: AdminSubject[] }>(`/admin/curriculum/subjects${query}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  return data.subjects;
}

export async function createAdminSubject(
  subject: AdminSubjectInput,
): Promise<AdminSubject> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminSubject>("/admin/curriculum/subjects", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(subject),
  });
}

export async function updateAdminSubject(
  subjectId: string,
  subject: Partial<AdminSubjectInput>,
): Promise<AdminSubject> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminSubject>(`/admin/curriculum/subjects/${subjectId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(subject),
  });
}

export async function loadAdminTopics(params: {
  grade_level_id?: string;
  subject_id?: string;
} = {}): Promise<AdminCurriculumTopic[]> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  const query = new URLSearchParams();
  if (params.grade_level_id) query.set("grade_level_id", params.grade_level_id);
  if (params.subject_id) query.set("subject_id", params.subject_id);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await request<{ topics: AdminCurriculumTopic[] }>(`/admin/curriculum/topics${suffix}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  return data.topics;
}

export async function loadAdminCurriculumContent(params: {
  grade_level_id?: string;
  subject_id?: string;
  topic_id?: string;
} = {}): Promise<AdminCurriculumContent[]> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  const query = new URLSearchParams();
  if (params.grade_level_id) query.set("grade_level_id", params.grade_level_id);
  if (params.subject_id) query.set("subject_id", params.subject_id);
  if (params.topic_id) query.set("topic_id", params.topic_id);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await request<{ content: AdminCurriculumContent[] }>(`/admin/curriculum/content${suffix}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  return data.content;
}

export async function createAdminCurriculumContent(
  content: AdminCurriculumContentInput,
): Promise<AdminCurriculumContent> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminCurriculumContent>("/admin/curriculum/content", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(content),
  });
}

export async function updateAdminCurriculumContent(
  contentId: string,
  content: Partial<AdminCurriculumContentInput>,
): Promise<AdminCurriculumContent> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  return request<AdminCurriculumContent>(`/admin/curriculum/content/${contentId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(content),
  });
}

export async function deleteAdminCurriculumContent(contentId: string): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Admin session not found");
  }

  await request(`/admin/curriculum/content/${contentId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function storeAdminSession(data: AuthResponse): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh_token);
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_USER_KEY);
}
