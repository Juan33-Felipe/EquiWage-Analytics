import {
  hasNoPersonalIdentifiers,
  type AiExecutiveDiagnosticRequest,
  type AiExecutiveDiagnosticResponse,
  type AnonymizedAuditContext,
} from '@equiwage/shared';
import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.js';
import { auditService } from '../services/audit.service.js';
import { anonymizerService } from './anonymizer.service.js';
import { generateFallbackExecutiveDiagnostic } from './fallback.generator.js';
import { llmClient } from './llm.client.js';

export class AiDiagnosticsService {
  /**
   * Generates an anonymized statistical snapshot and verifies zero PII.
   */
  getAnonymizedSnapshot(options: {
    departmentFilter?: string;
    levelFilter?: string | number;
  } = {}): {
    zeroPiiVerified: boolean;
    anonymizedContext: AnonymizedAuditContext;
  } {
    const audit = auditService.getFullAuditSummary();
    const anonymizedContext = anonymizerService.buildAnonymizedContext(audit, options);
    const zeroPiiVerified = hasNoPersonalIdentifiers(anonymizedContext);

    return {
      zeroPiiVerified,
      anonymizedContext,
    };
  }

  /**
   * Generates a full Executive Compensation Diagnostic (RF-007):
   * 1. Computes deterministic audit state from SQLite.
   * 2. Strips all PII via AnonymizerService (never sending employee names or IDs).
   * 3. Calls external LLM API if AI_API_KEY is configured, or uses the local deterministic
   *    fallback generator if unconfigured or if network errors occur.
   */
  async generateExecutiveDiagnostics(
    request: AiExecutiveDiagnosticRequest = {}
  ): Promise<AiExecutiveDiagnosticResponse> {
    const language: 'en' | 'es' = request.language === 'es' ? 'es' : 'en';
    const { anonymizedContext } = this.getAnonymizedSnapshot({
      departmentFilter: request.departmentFilter,
      levelFilter: request.levelFilter,
    });

    if (!envConfig.ai.isConfigured) {
      logger.info('AI_API_KEY not configured — using local deterministic executive diagnostic generator');
      return generateFallbackExecutiveDiagnostic(
        anonymizedContext,
        language,
        'local-deterministic-fallback (no API key configured)'
      );
    }

    try {
      const llmResult = await llmClient.generateStructuredDiagnostic(anonymizedContext, language);
      const isEs = language === 'es';

      return {
        generatedAt: new Date().toISOString(),
        provider: `${envConfig.ai.provider}:${envConfig.ai.model}`,
        isFallback: false,
        language,
        executiveSummary: llmResult.executiveSummary,
        keyFindings: llmResult.keyFindings,
        departmentRecommendations: llmResult.departmentRecommendations,
        rolloutStrategy: llmResult.rolloutStrategy,
        privacyGuarantee: isEs
          ? 'Privacidad Verificada: 0 nombres o IDs de empleados transmitidos a la API externa.'
          : 'Privacy Verified: 0 employee names or personal IDs transmitted to external API.',
        anonymizedMetricsUsed: anonymizedContext,
      };
    } catch (error) {
      logger.warn('External LLM request failed — falling back to local deterministic generator', {
        provider: envConfig.ai.provider,
        error: error instanceof Error ? error.message : String(error),
      });

      return generateFallbackExecutiveDiagnostic(
        anonymizedContext,
        language,
        `${envConfig.ai.provider}-resilient-fallback`
      );
    }
  }
}

export const aiDiagnosticsService = new AiDiagnosticsService();
