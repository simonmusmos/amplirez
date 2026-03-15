export interface OptimizeResult {
  originalText: string;
  optimizedText: string;
  jobDescription: string;
  filename: string;
  photo: string | null;
}

export interface ApiError {
  error: string;
  details?: string;
}

export type AppStep = "form" | "loading" | "result";
