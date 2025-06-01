export interface SummaryResult {
  success: boolean;
  summary: string;
  participants: string[];
  keyEvents: string[];
  context: {
    time: string;
    location: string;
    environmentalFactors: string;
    source: string;
  };
  notableQuotes: string[];
  reportRelevance: {
    legal: boolean;
    hr: boolean;
    safety: boolean;
    explanation: string;
  };
  videoUrl?: string;
  error?: string;
}
