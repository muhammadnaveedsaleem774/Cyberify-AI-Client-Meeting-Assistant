import { AIProvider, AnalysisResult } from './index';
import { IMeeting } from '../../models/meeting.model';
import { config } from '../../config';
import { buildAnalysisMessages, fetchWithTimeout, parseProviderResponse, withJsonRetry } from './aiUtils';

export const provider: AIProvider = {
  async analyzeMeeting(meeting: IMeeting): Promise<AnalysisResult> {
    if (!config.openaiApiKey) throw { status: 503, message: 'OPENAI_API_KEY is not configured' };

    return withJsonRetry(async (retry) => {
      const response = await fetchWithTimeout(`${config.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.openaiModel,
          messages: buildAnalysisMessages(meeting, retry),
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      }, 'OpenAI');

      const payload = await parseProviderResponse(response, 'OpenAI');
      return String((((payload.choices as any[]) || [])[0]?.message?.content) || '');
    });
  }
};
