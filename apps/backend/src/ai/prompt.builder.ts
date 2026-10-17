import type { AnonymizedAuditContext } from '@equiwage/shared';

export interface BuiltExecutivePrompts {
  systemInstruction: string;
  userPrompt: string;
}

/**
 * Constructs structured executive prompts for the external LLM using ONLY
 * anonymized statistical metrics (zero PII, RF-007).
 */
export function buildExecutiveDiagnosticPrompts(
  context: AnonymizedAuditContext,
  language: 'en' | 'es' = 'en'
): BuiltExecutivePrompts {
  const isEs = language === 'es';

  const systemInstruction = isEs
    ? [
        'Eres un Director Ejecutivo de Compensación y Beneficios (Total Rewards) especializado en auditorías de equidad salarial.',
        'Recibirás únicamente métricas estadísticas agregadas y anonimizadas (sin nombres ni IDs personales).',
        'Debes responder ÚNICAMENTE con un objeto JSON válido (sin bloques markdown ```json) con la siguiente estructura exacta:',
        '{',
        '  "executiveSummary": "Resumen ejecutivo de 2 a 3 oraciones con cifras clave...",',
        '  "keyFindings": [',
        '    { "title": "...", "impact": "high" | "medium" | "low", "description": "...", "metricHighlight": "..." }',
        '  ],',
        '  "departmentRecommendations": [',
        '    { "department": "...", "priority": "critical" | "high" | "moderate", "actionPlan": "...", "estimatedImpact": "..." }',
        '  ],',
        '  "rolloutStrategy": "Recomendación financiera sobre el despliegue trimestral..."',
        '}',
      ].join('\n')
    : [
        'You are a Principal Compensation & Total Rewards Executive Advisor specializing in salary equity audits.',
        'You receive strictly anonymized, aggregated statistical metrics (zero employee names or personal IDs).',
        'Respond ONLY with a valid JSON object (no markdown fences) matching this exact schema:',
        '{',
        '  "executiveSummary": "2-3 sentence executive synthesis referencing exact figures...",',
        '  "keyFindings": [',
        '    { "title": "...", "impact": "high" | "medium" | "low", "description": "...", "metricHighlight": "..." }',
        '  ],',
        '  "departmentRecommendations": [',
        '    { "department": "...", "priority": "critical" | "high" | "moderate", "actionPlan": "...", "estimatedImpact": "..." }',
        '  ],',
        '  "rolloutStrategy": "Actionable financial recommendation for the quarterly rollout..."',
        '}',
      ].join('\n');

  const userPrompt = JSON.stringify(
    {
      task: isEs
        ? 'Generar diagnóstico ejecutivo de equidad salarial y plan de nivelación presupuestal'
        : 'Generate executive compensation equity diagnostic and budget leveling action plan',
      language,
      anonymizedMetrics: context,
    },
    null,
    2
  );

  return {
    systemInstruction,
    userPrompt,
  };
}
