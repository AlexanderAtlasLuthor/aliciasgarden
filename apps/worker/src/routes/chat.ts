import { Hono } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import { sendChatMessage } from '../services/chat';
import type { Env } from '../types/env';

type ChatSendInput = {
  message?: unknown;
  thread_id?: unknown;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return value;
}

export const chatRoutes = new Hono<{ Bindings: Env }>();

chatRoutes.post('/chat/send', async (c) => {
  const parsedBody = await safeParseJson(c);
  const body = asObject(parsedBody);
  const input: ChatSendInput = body ?? {};

  const rawMessage = asOptionalString(input.message);
  const message = rawMessage?.trim();

  if (!message) {
    return jsonError(c, 'VALIDATION_ERROR', 'message es requerido', 400);
  }

  const rawThreadId = asOptionalString(input.thread_id);
  const threadId = rawThreadId?.trim() ? rawThreadId.trim() : undefined;

  try {
    const result = await sendChatMessage(message, threadId, c.env);
    return jsonOk(c, {
      thread_id: result.thread_id,
      reply: result.reply,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo enviar el mensaje.', 500, {
      hint: messageText,
    });
  }
});

chatRoutes.get('/chat/threads', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('profile_id', c.env.PROFILE_ID)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return jsonError(c, 'DB_ERROR', 'No se pudieron obtener los threads.', 500, {
        hint: error.message,
      });
    }

    return jsonOk(c, { threads: threads ?? [] });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudieron obtener los threads.', 500, {
      hint: messageText,
    });
  }
});

chatRoutes.get('/chat/threads/:id', async (c) => {
  const threadId = c.req.param('id');

  try {
    const supabase = getSupabase(c.env);

    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('id', threadId)
      .eq('profile_id', c.env.PROFILE_ID)
      .maybeSingle();

    if (threadError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo validar el thread.', 500, {
        hint: threadError.message,
      });
    }

    if (!thread) {
      return jsonError(c, 'NOT_FOUND', 'Thread no encontrado.', 404);
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      return jsonError(c, 'DB_ERROR', 'No se pudieron obtener los mensajes.', 500, {
        hint: error.message,
      });
    }

    return jsonOk(c, { messages: messages ?? [] });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudieron obtener los mensajes.', 500, {
      hint: messageText,
    });
  }
});
