import { AIProvider, AnalysisResult } from './index';
import { IMeeting } from '../../models/meeting.model';
import { config } from '../../config';
import { buildAnalysisMessages, fetchWithTimeout, parseProviderResponse, withJsonRetry } from './aiUtils';

export const provider: AIProvider = {
  async analyzeMeeting(meeting: IMeeting): Promise<AnalysisResult> {
    if (!config.geminiApiKey) throw { status: 503, message: 'GEMINI_API_KEY is not configured' };

    const url = `${config.geminiBaseUrl}/models/${config.geminiModel}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;

    return withJsonRetry(async (retry) => {
      const messages = buildAnalysisMessages(meeting, retry);
      const prompt = messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join('\n\n');
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      }, 'Gemini');

      const payload = await parseProviderResponse(response, 'Gemini');
      return String(
        (((payload.candidates as any[]) || [])[0]?.content?.parts || [])
          .map((part: { text?: string }) => part.text || '')
          .join('')
      );
    });
  }
};
