// API Configuration
// This file centralizes API base URL configuration for the application

// Get API base URL from environment variable or use default
const getApiBaseUrl = (): string => {
  // Check if we're in a browser environment and have access to the global
  if (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) {
    return (window as any).__API_BASE_URL__;
  }
  
  // Use environment-specific API URLs
  const env = import.meta.env.MODE;
  if (env === 'production') {
    return import.meta.env.VITE_API_BASE_URL || 'https://api.synapsyx.tn';
  } else {
    // For development and local environments
    return import.meta.env.VITE_API_BASE_URL || 'https://dev-api.synapsyx.tn';
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// API Endpoints based on OpenAPI specification
export const API_ENDPOINTS = {
  // Authentication endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  USER_PROFILE: '/api/auth/user',
  RESEND_VERIFICATION: '/api/auth/resend-verification',
  CONFIRM_VERIFICATION: '/api/auth/confirm-verification',
  DISABLE_USER: '/api/auth/user/disable',
  
  // User endpoints
  USER_PREFERENCES: '/api/users/preferences',
  USER_STATISTICS: '/api/users/statistics',
  
  // Course endpoints
  COURSES: '/api/courses/',
  COURSES_SEARCH: '/api/courses/search',
  COURSE_DETAILS: (courseId: string) => `/api/courses/${courseId}`,
  COURSE_RANDOM_QUESTIONS: (courseId: string) => `/api/courses/${courseId}/questions/random`,
  COURSE_STATISTICS: (courseId: string) => `/api/courses/${courseId}/statistics`,
  COURSE_PDF_URL: (courseId: string) => `/api/courses/${courseId}/pdf-url`,
  COURSE_INTERACTIVE_CONTENT: (courseId: string) => `/api/courses/${courseId}/interactive-content`,
  
  // Course section endpoints
  COURSE_SECTIONS: '/api/course-sections/',
  COURSE_SECTIONS_SEARCH: '/api/course-sections/search',
  COURSE_SECTIONS_SEARCH_BY_FILE_PATH: '/api/course-sections/search-by-file-path',
  COURSE_SECTION_DETAILS: (sectionId: string) => `/api/course-sections/${sectionId}`,
  COURSE_SECTION_PDF_URL: (sectionId: string) => `/api/course-sections/${sectionId}/pdf-url`,
  COURSE_SECTION_QUESTIONS: (sectionId: string) => `/api/course-sections/${sectionId}/questions`,
  COURSE_SECTION_STATISTICS: (sectionId: string) => `/api/course-sections/${sectionId}/statistics`,
  COURSE_SECTION_CHUNKS: (sectionId: string) => `/api/course-sections/${sectionId}/chunks`,
  COURSE_SECTION_GENERATE_SUMMARY: (sectionId: string) => `/api/course-sections/${sectionId}/generate-summary`,
  COURSE_SECTION_INTERACTIVE_CONTENT: (courseId: string, sectionId: string) => `/api/courses/${courseId}/sections/${sectionId}/interactive-content`,
  
  // Question endpoints
  QUESTIONS: '/api/questions/',
  QUESTION_GENERATE: '/api/questions/generate',
  QUESTION_IMAGE_URL: (questionId: string) => `/api/questions/${questionId}/image-url`,
  
  // Quiz endpoints
  QUIZ_SUBMIT: '/api/questions/quiz/submit',
  
  // Progress endpoints
  PROGRESS: '/api/progress/',
  COURSE_PROGRESS: (courseId: string) => `/api/progress/course/${courseId}`,
  ACHIEVEMENTS: '/api/progress/achievements',
  
  // AI endpoints
  AI_CHAT: '/api/ai/chat',
  AI_CHAT_SESSION: '/api/ai/chat/session',
  AI_CHAT_SESSION_DETAILS: (sessionId: string) => `/api/ai/chat/session/${sessionId}`,
  AI_SIMILARITY_SEARCH: '/api/ai/similarity-search',
  AI_CREDITS: '/api/ai/credits',
  
  // Subscription endpoints
  SUBSCRIPTION: '/api/subscriptions/',
  SUBSCRIPTION_DETAILS: (subscriptionId: string) => `/api/subscriptions/${subscriptionId}`,
  SUBSCRIPTION_HISTORY: '/api/subscriptions/history',
  
  // System endpoints
  HEALTH: '/health',
  ROOT: '/',
  
  // Adobe PDF Viewer configuration
  ADOBE_CONFIG: '/api/adobe/config',
  
  // PDF Annotations endpoints
  PDF_ANNOTATIONS: '/api/pdf-annotations/',
  PDF_ANNOTATION_DETAILS: (annotationId: string) => `/api/pdf-annotations/${annotationId}`,
  PDF_ANNOTATIONS_BULK: '/api/pdf-annotations/bulk',
} as const;

// API Response Types based on OpenAPI schema
export interface CognitoRegistrationRequest {
  aud: string;
  cognito_username: string;
  email: string;
  email_verified: string;
  exp: number;
  family_name?: string | null;
  given_name?: string | null;
  iat: number;
  iss: string;
  sub: string;
  token_use: string;
  username: string;
  name?: string | null;
  picture?: string | null;
  cognito_groups?: string[] | null;
  identities?: string | null;
  origin_jti?: string | null;
  event_id?: string | null;
}

export interface UserResponse {
  user_id: string;
  cognito_user_id: string;
  auth_provider: 'email' | 'cognito' | 'google' | 'facebook' | 'apple' | 'system';
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_image_url?: string;
  tags?: string[];
  suspended: boolean;
  suspended_reason?: string;
  verified: boolean;
  is_deleted: boolean;
  last_login?: string;
  university?: string;
  level?: 'PCEM1' | 'PCEM2' | 'DCEM1' | 'DCEM2' | 'DCEM3' | 'INTERNE' | 'AUTRE';
  level_other?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStatisticsResponse {
  total_courses: number;
  completed_courses: number;
  total_questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  total_study_time: number;
  achievements_count: number;
  current_streak: number;
}

export interface CourseResponse {
  course_id: string;
  course_name: string;
  description?: string;
  university?: string;
  theme?: string;
  pdf_path?: string;
  type: 'University' | 'ECN' | 'Professional';
  cls?: string;
  semester?: string;
  version?: string;
  theme_number?: number;
  theme_roman?: string;
  file_storage?: string;
  created_at: string;
  sections_count?: number;
  questions_count?: number;
  sections?: CourseSectionResponse[];
}

export interface CourseSectionResponse {
  section_id: string;
  course_id: string;
  section_name: string;
  file_storage: string;
  file_path: string;
  section_start?: number;
  section_end?: number;
  split_page_count?: number;
  original_total_pages?: number;
  file_description?: string;
  summary_file_path?: string;
  size?: number;
  is_full_document: boolean;
  is_free: boolean;
  created_at: string;
  updated_at: string;
  summaries_count?: number;
  questions_count?: number;
  course?: CourseInfo;
}

export interface CourseInfo {
  course_id: string;
  course_name: string;
  description?: string;
  university?: string;
  theme?: string;
  type: 'University' | 'ECN' | 'Professional';
  cls?: string;
  semester?: string;
  theme_number?: number;
  file_storage?: string;
  created_at: string;
}

export interface CourseSectionSummaryResponse {
  summary_id: string;
  section_id: string;
  content: string;
  confidence?: number;
  timestamp: string;
  references?: string[];
}

export interface CourseListResponse {
  courses: CourseResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface QuestionResponse {
  question_id: string;
  course_id?: string;
  course_section_id?: string;
  course_section_chunk_id?: string;
  related_entity_type: 'course' | 'section' | 'chunk';
  related_entity_id: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'llm' | 'human' | 'exam' | 'serie';
  review_status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface QuestionListResponse {
  questions: QuestionResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface QuizSubmissionRequest {
  questions: any[];
  course_id?: string;
  time_taken?: number;
}

export interface QuizSubmissionResponse {
  quiz_id: string;
  total_questions: number;
  correct_answers: number;
  accuracy_percentage: number;
  time_taken?: number;
  submitted_at: string;
  results: any[];
}

export interface ProgressResponse {
  progress_id: string;
  user_id: string;
  course_id?: string;
  course_section_id?: string;
  progress_percentage: number;
  completed_at?: string;
  last_accessed: string;
  study_time: number;
}

export interface CourseProgressResponse {
  course_id: string;
  user_id: string;
  total_sections: number;
  completed_sections: number;
  progress_percentage: number;
  total_study_time: number;
  last_accessed: string;
  sections_progress: any[];
}

export interface ChatMessageRequest {
  content: string;
  context?: string;
  attachments?: string[];
  session_id?: string;
  history_limit?: number;
  search_top_k?: number;
  course_section_ids?: string[];
  search_index_name?: string;
}

export interface ChatMessageResponse {
  message_id: string;
  session_id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  context?: string;
  attachments?: string[];
  confidence?: number;
  timestamp: string;
  search_metadata?: any;
}

export interface ChatSessionResponse {
  session_id: string;
  user_id: string;
  course_section_ids?: string[];
  university?: string;
  level?: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessageResponse[];
}

export interface ChatHistoryResponse {
  sessions: ChatSessionResponse[];
  total: number;
}

export interface ChatSessionWithoutMessages {
  session_id: string;
  user_id: string;
  course_section_ids?: string[];
  university?: string;
  level?: string;
  created_at: string;
  updated_at: string;
  last_message?: LastMessageResponse;
}

export interface LastMessageResponse {
  message_id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatHistoryWithoutMessagesResponse {
  sessions: ChatSessionWithoutMessages[];
  total: number;
}

export interface ChatSessionCreationRequest {
  course_section_ids?: string[];
  university?: string;
  level?: string;
}

export interface ChatSessionUpdateRequest {
  course_section_ids: string[];
}

export interface SimilaritySearchRequest {
  query?: string;
  query_text?: string;
  top_k?: number;
  include_images?: boolean;
  s3_paths?: string[];
  course_section_ids?: string[];
  index_name?: string;
}

export interface SearchMatch {
  score: number;
  metadata: {
    text: string;
    page?: number;
    type?: string;
    original_s3_path?: string;
    course_section?: any;
  };
}

export interface SimilaritySearchResponse {
  query: string;
  total_matches: number;
  matches: SearchMatch[];
  filters_applied?: {
    s3_paths?: string[];
    include_images?: boolean;
  };
  search_time_ms?: number;
  index_name?: string;
  timestamp: string;
}

export interface SummaryResponse {
  summary_id: string;
  course_id?: string;
  course_section_id?: string;
  course_section_chunk_id?: string;
  file_storage: string;
  file_path?: string;
  content: string;
  confidence?: number;
  timestamp: string;
  references?: string[];
}

export interface UserSubscriptionResponse {
  subscription_id: string;
  user_id: string;
  subscription_tier: 'free' | 'standard' | 'premium';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PDFUrlResponse {
  presignedUrl: string;
}

export interface UserPreferencesResponse {
  session_preferences_id: string;
  user_id: string;
  preferences: any;
  created_at: string;
  updated_at: string;
}

export interface AchievementResponse {
  achievement_id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  icon_url?: string;
  earned_at: string;
  points: number;
}

export interface CourseStatisticsResponse {
  course_id: string;
  total_sections: number;
  completed_sections: number;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  accuracy_percentage: number;
  study_time: number;
  last_accessed: string | null;
}

export interface CourseSectionStatisticsResponse {
  section_id: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  accuracy_percentage: number;
  study_time: number;
  last_accessed: string | null;
  completion_percentage: number;
  has_summary: boolean;
}

// New types based on OpenAPI specification
export interface CourseListResponse {
  courses: CourseResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface CourseSectionListResponse {
  sections: CourseSectionResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface FilePathSearchResponse {
  courses: CourseResponse[];
  sections: CourseSectionResponse[];
  total_courses: number;
  total_sections: number;
}

export interface InteractiveContentResponse {
  interactive_content_id: string;
  course_section_id: string;
  content_type: string;
  content: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InteractiveContentCreationRequest {
  content_type: string;
  content: string;
  order?: number;
}

export interface AnnotationData {
  '@context'?: string[];
  type?: string;
  id: string;
  bodyValue?: string;
  motivation?: string;
  target?: AnnotationTarget;
  creator?: AnnotationCreator;
  created?: string;
  modified?: string;
  stylesheet?: any;
}

export interface AnnotationTarget {
  source: string;
  selector?: any;
}

export interface AnnotationCreator {
  type?: string;
  name: string;
}

export interface PdfAnnotationResponse {
  annotation_id: string;
  user_id: string;
  course_section_id: string;
  is_summary: boolean;
  annotation: AnnotationData;
  created_at: string;
  updated_at: string;
}

export interface PdfAnnotationCreateRequest {
  course_section_id: string;
  is_summary?: boolean;
  annotation: AnnotationData;
}

export interface PdfAnnotationUpdateRequest {
  annotation: AnnotationData;
}

export interface PdfAnnotationBulkCreateRequest {
  course_section_id: string;
  is_summary?: boolean;
  annotations: AnnotationData[];
}

export interface PdfAnnotationBulkUpdateRequest {
  annotations: any[];
}

export interface PdfAnnotationListResponse {
  annotations: PdfAnnotationResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UserProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_image_url?: string;
  university?: string;
  level?: 'PCEM1' | 'PCEM2' | 'DCEM1' | 'DCEM2' | 'DCEM3' | 'INTERNE' | 'AUTRE';
  level_other?: string;
}

export interface UserPreferencesUpdateRequest {
  preferences: any;
}

export interface AccountDisableRequest {
  reason: string;
}

export interface VerificationRequest {
  email: string;
  verification_code: string;
}

export interface CourseCreationRequest {
  course_name: string;
  description?: string;
  university?: string;
  theme?: string;
  type?: 'University' | 'ECN' | 'Professional';
  cls?: string;
  semester?: string;
  version?: string;
  theme_number?: number;
  theme_roman?: string;
  file_storage?: string;
}

export interface CourseSectionCreationRequest {
  course_id: string;
  section_name: string;
  file_path: string;
  section_start?: number;
  section_end?: number;
  split_page_count?: number;
  original_total_pages?: number;
  file_description?: string;
  summary_file_path?: string;
  size?: number;
  is_full_document?: boolean;
  is_free?: boolean;
}

export interface QuestionCreationRequest {
  course_section_id?: string;
  related_entity_type?: 'course' | 'section';
  related_entity_id: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  source?: 'llm' | 'human' | 'exam' | 'serie';
}

export interface QuestionGenerationRequest {
  course_section_id?: string;
  related_entity_type?: 'course' | 'section';
  related_entity_id: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface QuestionImageUrlRequest {
  image_type: string;
  image_format?: string;
}

export interface QuestionImageUrlResponse {
  presigned_url: string;
  image_url: string;
}

export interface ProgressUpdateRequest {
  course_id?: string;
  course_section_id?: string;
  progress_percentage: number;
  study_time?: number;
}

export interface SubscriptionCreationRequest {
  subscription_tier: 'free' | 'standard' | 'premium';
  start_date: string;
  end_date: string;
}

export interface SubscriptionUpdateRequest {
  subscription_tier?: 'free' | 'standard' | 'premium';
  end_date?: string;
  is_active?: boolean;
}

// Additional types for new API endpoints
export interface FiltersApplied {
  s3_paths?: string[];
  include_images?: boolean;
}

export interface SimilaritySearchResponse {
  query: string;
  total_matches: number;
  matches: SearchMatch[];
  filters_applied?: FiltersApplied;
  search_time_ms?: number;
  index_name?: string;
  timestamp: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
}
