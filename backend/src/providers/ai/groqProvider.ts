import { config } from '../../config';
import { IMeeting } from '../../models/meeting.model';
import { AIProvider, AnalysisResult } from './index';
import { buildAnalysisMessages, fetchWithTimeout, parseProviderResponse, withJsonRetry } from './aiUtils';

export const provider: AIProvider = {
  async analyzeMeeting(meeting: IMeeting): Promise<AnalysisResult> {
    if (!config.groqApiKey) throw { status: 503, message: 'GROQ_API_KEY is not configured' };

    return withJsonRetry(async (retry) => {
      const response = await fetchWithTimeout(`${config.groqBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.groqModel,
          messages: buildAnalysisMessages(meeting, retry),
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      }, 'Groq');

      const payload = await parseProviderResponse(response, 'Groq');
      return String((((payload.choices as any[]) || [])[0]?.message?.content) || '');
    });
  }
};
