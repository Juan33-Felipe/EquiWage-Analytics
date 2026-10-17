import {
  hasNoPersonalIdentifiers,
  type AiDepartmentRecommendation,
  type AiDiagnosticFinding,
  type AnonymizedAuditContext,
} from '@equiwage/shared';
import { envConfig } from '../config/env.config.js';
import { buildExecutiveDiagnosticPrompts } from './prompt.builder.js';

export interface LlmParsedDiagnostic {
  executiveSummary: string;
  keyFindings: AiDiagnosticFinding[];
  departmentRecommendations: AiDepartmentRecommendation[];
  rolloutStrategy: string;
}

/**
 * Extracts and parses a JSON object from an LLM text response (handling optional markdown code fences).
 */
function parseJsonFromLlmText(rawText: string): LlmParsedDiagnostic {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  if (
    typeof parsed.executiveSummary !== 'string' ||
    !Array.isArray(parsed.keyFindings) ||
    !Array.isArray(parsed.departmentRecommendations) ||
    typeof parsed.rolloutStrategy !== 'string'
  ) {
    throw new Error('LLM response did not match the expected executive diagnostic JSON schema.');
  }

  return {
    executiveSummary: parsed.executiveSummary,
    keyFindings: parsed.keyFindings as AiDiagnosticFinding[],
    departmentRecommendations: parsed.departmentRecommendations as AiDepartmentRecommendation[],
    rolloutStrategy: parsed.rolloutStrategy,
  };
}

export class LlmClient {
  /**
   * Sends the strictly anonymized statistical context to the configured LLM provider
   * (Gemini or OpenAI-compatible API) and parses the structured executive diagnostic.
   */
  async generateStructuredDiagnostic(
    context: AnonymizedAuditContext,
    language: 'en' | 'es' = 'en'
  ): Promise<LlmParsedDiagnostic> {
    if (!hasNoPersonalIdentifiers(context)) {
      throw new Error('Blocked outbound LLM call: Personal identifier detected in payload.');
    }

    const { systemInstruction, userPrompt } = buildExecutiveDiagnosticPrompts(context, language);
    const provider = envConfig.ai.provider;

    if (provider === 'openai' || provider === 'compatible') {
      return this.callOpenAiCompatible(systemInstruction, userPrompt);
    }

    return this.callGeminiApi(systemInstruction, userPrompt);
  }

  private async callGeminiApi(
    systemInstruction: string,
    userPrompt: string
  ): Promise<LlmParsedDiagnostic> {
    const model = envConfig.ai.model || 'gemini-2.5-flash';
    const baseUrl =
      envConfig.ai.apiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(envConfig.ai.apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(envConfig.ai.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API returned an empty candidate response.');
    }

    return parseJsonFromLlmText(text);
  }

  private async callOpenAiCompatible(
    systemInstruction: string,
    userPrompt: string
  ): Promise<LlmParsedDiagnostic> {
    const baseUrl = envConfig.ai.apiBaseUrl || 'https://api.openai.com/v1';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    const model = envConfig.ai.model || 'gpt-4o-mini';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${envConfig.ai.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(envConfig.ai.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('OpenAI API returned an empty completion response.');
    }

    return parseJsonFromLlmText(text);
  }
}

export const llmClient = new LlmClient();
