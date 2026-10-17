/**
 * Anonymized AI module types (RF-007).
 * PRIVACY RULE: Never include employee full names or personal IDs in any AI payload.
 */

export interface AnonymizedDepartmentMetric {
  department: string;
  headcount: number;
  belowBandCount: number;
  aboveBandCount: number;
  inequityFlaggedCount: number;
  averageGapPercent: number;
  requiredMinLevelingBudget: number;
  requiredMedianLevelingBudget: number;
}

export interface AnonymizedBandCompressionMetric {
  level: number;
  headcount: number;
  minSalary: number;
  medianSalary: number;
  maxSalary: number;
  bandSpreadPercent: number;
  averageCompaRatio: number;
  belowP25Count: number;
}

/**
 * Strictly anonymized statistical snapshot sent to the LLM API.
 * Contains zero PII (no employee names, emails, or personal identifiers).
 */
export interface AnonymizedAuditContext {
  totalEmployeesAnalyzed: number;
  alignedCount: number;
  alignedRatePercent: number;
  belowBandMinimumCount: number;
  aboveBandMaximumCount: number;
  internalInequityCasesCount: number;
  averageMarketGapPercent: number;
  mostAffectedDepartment: string;
  totalBudgetToBandMinimum: number;
  totalBudgetToMarketMedian: number;
  activeSimulationTarget: 'minimum' | 'median';
  activeSimulationRolloutQuarters: number;
  activeSimulationBudget: number;
  departmentBreakdown: AnonymizedDepartmentMetric[];
  bandCompressionMetrics: AnonymizedBandCompressionMetric[];
}

export interface AiDiagnosticFinding {
  title: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  metricHighlight: string;
}

export interface AiDepartmentRecommendation {
  department: string;
  priority: 'critical' | 'high' | 'moderate';
  actionPlan: string;
  estimatedImpact: string;
}

export interface AiExecutiveDiagnosticRequest {
  language?: 'en' | 'es';
  departmentFilter?: string;
  levelFilter?: string | number;
  focusAreas?: string[];
}

export interface AiExecutiveDiagnosticResponse {
  generatedAt: string;
  provider: string;
  isFallback: boolean;
  language: 'en' | 'es';
  executiveSummary: string;
  keyFindings: AiDiagnosticFinding[];
  departmentRecommendations: AiDepartmentRecommendation[];
  rolloutStrategy: string;
  privacyGuarantee: string;
  anonymizedMetricsUsed: AnonymizedAuditContext;
}
