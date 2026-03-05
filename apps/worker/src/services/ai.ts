import type { Env } from '../types/env';

export type ChatMessageRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
};

type OpenAiErrorResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

type OpenAiSuccessResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export async function generateReply(messages: ChatMessage[], env: Env): Promise<string> {
  if (!env.AI_API_KEY) {
    throw new Error('AI_API_KEY is missing in worker bindings.');
  }

  let response: Response;

  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fetch error';
    throw new Error(`OpenAI request failed: ${message}`);
  }

  if (!response.ok) {
    let errorMessage = `OpenAI API returned status ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as OpenAiErrorResponse;
      const apiMessage = errorPayload.error?.message;
      if (apiMessage) {
        errorMessage = `OpenAI API error: ${apiMessage}`;
      }
    } catch {
      // Keep the default status-based message when response body is not JSON.
    }

    throw new Error(errorMessage);
  }

  let data: OpenAiSuccessResponse;

  try {
    data = (await response.json()) as OpenAiSuccessResponse;
  } catch {
    throw new Error('OpenAI API returned a non-JSON response.');
  }

  const reply = data.choices?.[0]?.message?.content;

  if (typeof reply !== 'string' || reply.trim().length === 0) {
    throw new Error('OpenAI API returned an empty or invalid assistant reply.');
  }

  return reply;
}
