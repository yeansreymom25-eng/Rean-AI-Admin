/**
 * Consumer-facing mirror of the backend's v1 integration contract.
 * The backend Zod schemas are the runtime source of truth; this file gives the
 * Admin UI safe compile-time DTOs before the lifecycle endpoints are added.
 */
export const ADMIN_AI_TUTOR_INTEGRATION_CONTRACT_VERSION = 1 as const;

export type CurriculumVersionStatus =
  | "draft"
  | "in_review"
  | "published"
  | "archived";

export type CurriculumVersionDto = {
  schema_version: typeof ADMIN_AI_TUTOR_INTEGRATION_CONTRACT_VERSION;
  curriculum_version_id: string;
  grade_level_id: string;
  subject_id: string;
  label: string;
  status: CurriculumVersionStatus;
  content_revision_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type TutorCurriculumSourceReferenceDto = {
  schema_version: typeof ADMIN_AI_TUTOR_INTEGRATION_CONTRACT_VERSION;
  curriculum_version_id: string;
  curriculum_chunk_id: string;
  source_content_id: string;
  grade_level_id: string;
  subject_id: string;
  topic_id: string;
};

export type AiReviewQueueItemDto = {
  schema_version: typeof ADMIN_AI_TUTOR_INTEGRATION_CONTRACT_VERSION;
  review_id: string;
  tutor_session_id: string;
  tutor_turn_id: string | null;
  student_reference_id: string;
  grade_level_id: string | null;
  subject_id: string | null;
  topic_id: string | null;
  severity: "amber" | "red";
  status: "open" | "in_review" | "resolved" | "escalated";
  reason_code: string;
  redacted_evidence: string;
  created_at: string;
  updated_at: string;
};
