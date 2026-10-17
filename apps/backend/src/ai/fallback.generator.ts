import {
  formatCurrency,
  type AiDepartmentRecommendation,
  type AiDiagnosticFinding,
  type AiExecutiveDiagnosticResponse,
  type AnonymizedAuditContext,
} from '@equiwage/shared';

/**
 * Intelligent Deterministic Fallback Generator (Stage 4.4).
 * Produces a rich, data-driven executive narrative, statistical findings, and
 * departmental leveling plan from anonymized metrics when no LLM API key is
 * configured or if external network communication fails.
 */
export function generateFallbackExecutiveDiagnostic(
  context: AnonymizedAuditContext,
  language: 'en' | 'es' = 'en',
  providerLabel = 'local-deterministic-fallback'
): AiExecutiveDiagnosticResponse {
  const isEs = language === 'es';
  const minBudgetFormatted = formatCurrency(context.totalBudgetToBandMinimum);
  const medianBudgetFormatted = formatCurrency(context.totalBudgetToMarketMedian);
  const activeBudgetFormatted = formatCurrency(context.activeSimulationBudget);
  const perQuarterBudget = formatCurrency(
    context.activeSimulationBudget / Math.max(context.activeSimulationRolloutQuarters, 1)
  );

  const compressedLevels = context.bandCompressionMetrics.filter(
    (b) => b.headcount > 0 && (b.belowP25Count > 0 || b.averageCompaRatio < 0.92)
  );
  const compressedLevelLabels =
    compressedLevels.length > 0
      ? compressedLevels.map((b) => `L${b.level}`).join(', ')
      : 'L1–L8';

  const executiveSummary = isEs
    ? `Se auditaron ${context.totalEmployeesAnalyzed} posiciones con una tasa de alineación de banda del ${context.alignedRatePercent}% y una desviación promedio frente a la mediana de mercado de ${context.averageMarketGapPercent}%. Se identificaron ${context.belowBandMinimumCount} colaboradores por debajo del mínimo de banda (P25) y ${context.internalInequityCasesCount} casos de inequidad interna (>10% de dispersión en el mismo rol/nivel), concentrados principalmente en ${context.mostAffectedDepartment}. El presupuesto requerido para eliminar rezagos críticos al P25 es de ${minBudgetFormatted} (o ${medianBudgetFormatted} para competitividad plena en la mediana P50).`
    : `Analyzed ${context.totalEmployeesAnalyzed} positions revealing a ${context.alignedRatePercent}% band alignment rate and an average market median deviation of ${context.averageMarketGapPercent}%. The audit identified ${context.belowBandMinimumCount} employees falling below the P25 band minimum and ${context.internalInequityCasesCount} internal inequity cases (>10% role/level spread), most notably within ${context.mostAffectedDepartment}. Remediating critical below-band gaps to P25 requires ${minBudgetFormatted} (or ${medianBudgetFormatted} to reach full P50 market competitiveness).`;

  const keyFindings: AiDiagnosticFinding[] = [
    {
      title: isEs
        ? 'Exposición a Brechas de Mercado (Bajo P25)'
        : 'Market Competitiveness Exposure (Below P25)',
      impact: context.belowBandMinimumCount > 0 ? 'high' : 'low',
      description: isEs
        ? `${context.belowBandMinimumCount} posiciones operan por debajo del percentil 25 de su banda salarial, generando riesgo de rotación temprana en niveles ${compressedLevelLabels}.`
        : `${context.belowBandMinimumCount} positions currently sit below the 25th percentile of their salary band, creating retention vulnerability across job levels ${compressedLevelLabels}.`,
      metricHighlight: `${context.belowBandMinimumCount} positions • ${minBudgetFormatted} to P25`,
    },
    {
      title: isEs
        ? 'Dispersión e Inequidad Horizontal Interna (>10%)'
        : 'Horizontal Internal Inequity (>10% Peer Spread)',
      impact: context.internalInequityCasesCount > 0 ? 'high' : 'medium',
      description: isEs
        ? `Se detectaron ${context.internalInequityCasesCount} colaboradores en grupos de mismo cargo y nivel cuya brecha entre el salario mínimo y máximo supera el umbral de política del 10%.`
        : `Flagged ${context.internalInequityCasesCount} employees in identical role-and-level cohorts where peer salary dispersion exceeds the 10% HR policy threshold.`,
      metricHighlight: `${context.internalInequityCasesCount} flagged peers`,
    },
    {
      title: isEs
        ? 'Compresión de Bandas y Posicionamiento Compa-Ratio'
        : 'Band Compression & Compa-Ratio Positioning',
      impact: Math.abs(context.averageMarketGapPercent) > 5 ? 'medium' : 'low',
      description: isEs
        ? `La brecha salarial promedio frente a la mediana (P50) se ubica en ${context.averageMarketGapPercent}%, con oportunidades de ajuste progresivo en ${compressedLevelLabels}.`
        : `Organizational average gap against the P50 market median stands at ${context.averageMarketGapPercent}%, with targeted calibration opportunities in ${compressedLevelLabels}.`,
      metricHighlight: `${context.averageMarketGapPercent}% avg gap vs P50`,
    },
  ];

  const topDepts = context.departmentBreakdown.slice(0, 4);
  const departmentRecommendations: AiDepartmentRecommendation[] = topDepts.map((dept) => {
    const priority: 'critical' | 'high' | 'moderate' =
      dept.belowBandCount > 0
        ? 'critical'
        : dept.inequityFlaggedCount > 0 || dept.requiredMedianLevelingBudget > 25000
          ? 'high'
          : 'moderate';

    const minCost = formatCurrency(dept.requiredMinLevelingBudget);
    const medCost = formatCurrency(dept.requiredMedianLevelingBudget);

    return {
      department: dept.department,
      priority,
      actionPlan: isEs
        ? dept.belowBandCount > 0
          ? `Priorizar la nivelación inmediata de ${dept.belowBandCount} colaborador(es) bajo el mínimo P25 (${minCost}) y armonizar ${dept.inequityFlaggedCount} caso(s) de dispersión horizontal.`
          : `Mantener vigilancia de competitividad (${dept.averageGapPercent}% vs P50) y evaluar transición gradual a la mediana con un techo presupuestal de ${medCost}.`
        : dept.belowBandCount > 0
          ? `Prioritize immediate P25 floor remediation for ${dept.belowBandCount} below-band employee(s) (${minCost}) and harmonize ${dept.inequityFlaggedCount} horizontal peer spread case(s).`
          : `Monitor market alignment (${dept.averageGapPercent}% vs P50) and evaluate phased progression toward the P50 median within a ${medCost} allocation.`,
      estimatedImpact: isEs
        ? `P25: ${minCost} | P50: ${medCost}`
        : `P25 Floor: ${minCost} | P50 Median: ${medCost}`,
    };
  });

  const rolloutStrategy = isEs
    ? `Bajo la política activa (${context.activeSimulationTarget === 'minimum' ? 'Mínimo de Banda P25' : 'Mediana de Mercado P50'}) distribuida en ${context.activeSimulationRolloutQuarters} trimestre(s), el presupuesto total de ${activeBudgetFormatted} equivale a un desembolso trimestral de ${perQuarterBudget}. Se recomienda ejecutar el Tramo 1 corrigiendo primero el 100% de los casos críticos bajo P25 (${minBudgetFormatted}) en ${context.mostAffectedDepartment} y diferir los ajustes hacia la mediana P50 en los trimestres subsiguientes.`
    : `Under the active policy (${context.activeSimulationTarget === 'minimum' ? 'Band Minimum P25' : 'Market Median P50'}) phased across ${context.activeSimulationRolloutQuarters} quarter(s), the ${activeBudgetFormatted} total investment translates to ${perQuarterBudget} per quarter. We recommend front-loading Phase 1 to eliminate 100% of below-P25 critical deficits (${minBudgetFormatted}) starting in ${context.mostAffectedDepartment}, followed by progressive P50 median calibration across subsequent quarters.`;

  return {
    generatedAt: new Date().toISOString(),
    provider: providerLabel,
    isFallback: true,
    language,
    executiveSummary,
    keyFindings,
    departmentRecommendations,
    rolloutStrategy,
    privacyGuarantee: isEs
      ? 'Privacidad Verificada: 0 nombres o IDs de empleados transmitidos. Análisis generado exclusivamente con métricas estadísticas agregadas.'
      : 'Privacy Verified: 0 employee names or personal IDs transmitted. Analysis generated exclusively from aggregated statistical metrics.',
    anonymizedMetricsUsed: context,
  };
}
