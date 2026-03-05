import { getSupabase } from '../lib/supabase';
import { generateReply, type ChatMessage } from './ai';
import type { Env } from '../types/env';

type ChatRole = 'system' | 'user' | 'assistant';

type ChatMessageRow = {
  role: ChatRole;
  content: string;
  created_at: string;
};

type SendChatMessageResult = {
  thread_id: string;
  reply: string;
};

const SYSTEM_PROMPT: ChatMessage = {
  role: 'system',
  content:
    'Eres Toni, asistente experto en jardineria domestica. Hablas espanol claro y amable.',
};

const OPENAI_FALLBACK_REPLY =
  'Toni esta teniendo problemas tecnicos. Intenta nuevamente.';

export async function sendChatMessage(
  message: string,
  threadId: string | undefined,
  env: Env,
): Promise<SendChatMessageResult> {
  const supabase = getSupabase(env);

  let effectiveThreadId = threadId;

  if (!effectiveThreadId) {
    const { data: thread, error: createThreadError } = await supabase
      .from('chat_threads')
      .insert({
        profile_id: env.PROFILE_ID,
        title: null,
      })
      .select('id')
      .single();

    if (createThreadError || !thread?.id) {
      throw new Error(
        `Failed to create chat thread: ${createThreadError?.message ?? 'Unknown database error'}`,
      );
    }

    effectiveThreadId = thread.id;
  }

  if (!effectiveThreadId) {
    throw new Error('Failed to resolve chat thread id.');
  }

  const { error: insertUserError } = await supabase.from('chat_messages').insert({
    thread_id: effectiveThreadId,
    role: 'user',
    content: message,
  });

  if (insertUserError) {
    throw new Error(
      `Failed to save user chat message: ${insertUserError.message}`,
    );
  }

  const { data: historyRows, error: historyError } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('thread_id', effectiveThreadId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (historyError) {
    throw new Error(`Failed to load chat history: ${historyError.message}`);
  }

  const history: ChatMessage[] = (historyRows as ChatMessageRow[])
    .slice()
    .reverse()
    .map((row) => ({
      role: row.role,
      content: row.content,
    }));

  const aiMessages: ChatMessage[] = [SYSTEM_PROMPT, ...history];

  let reply: string;

  try {
    reply = await generateReply(aiMessages, env);
  } catch {
    reply = OPENAI_FALLBACK_REPLY;
  }

  const { error: insertAssistantError } = await supabase.from('chat_messages').insert({
    thread_id: effectiveThreadId,
    role: 'assistant',
    content: reply,
  });

  if (insertAssistantError) {
    throw new Error(
      `Failed to save assistant chat message: ${insertAssistantError.message}`,
    );
  }

  return {
    thread_id: effectiveThreadId,
    reply,
  };
}
