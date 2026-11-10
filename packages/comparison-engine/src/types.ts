export interface ComparisonDimension {
  name: string;
  category: "coverage" | "complexity" | "reliability" | "data" | "operational";
  description: string;
  values: Record<string, string | number>;
  advantageAlternativeId?: string;
  tradeOffNote: string;
}

export interface AlternativeComparisonResult {
  project: string;
  alternativesCompared: Array<{
    id: string;
    name: string;
    passed: boolean;
  }>;
  dimensions: ComparisonDimension[];
  conditionalRecommendation: string;
  uncertaintyNotes: string[];
}

