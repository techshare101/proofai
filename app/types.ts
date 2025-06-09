export interface SummaryResult {
  summary: string;
  participants?: string[];
  keyEvents?: string[];
  context?: {
    location?: string;
    time?: string;
    environmentalFactors?: string;
  };
  notableQuotes?: string[];
  legallyRelevantDetails?: string[];
  reportRelevance?: {
    legal?: boolean;
    hr?: boolean;
    safety?: boolean;
    explanation: string;
  };
}
