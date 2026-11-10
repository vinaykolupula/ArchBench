export interface LearningCard {
  id: string;
  concept: string;
  title: string;
  summary: string;
  whyItMatters: string;
  concreteFailureExample: string;
  mitigationOptions: string[];
  verificationApproach: string;
  furtherReading?: string[];
  ruleIds?: string[];
}

export type ExplanationMode = "guided" | "quick" | "interview";

