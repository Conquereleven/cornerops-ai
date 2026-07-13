import { useState } from 'react';
import { sendChatMessage } from '../lib/api';
import type { ChatMessage } from '../lib/types';

const initialMessages: ChatMessage[] = [];

export function useChat() {
  const [messages, setMessages] = useState(initialMessages);
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const send = async (content: string) => {
    const cleanContent = content.trim();
    if (!cleanContent || loading) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: cleanContent, timestamp: new Date().toISOString() }]);
    setLoading(true);
    setError('');
    try {
      const response = await sendChatMessage({
        userId: 'internal-operator',
        message: cleanContent,
        conversationId,
        requestId: crypto.randomUUID(),
        channel: 'web',
      });
      setConversationId(response.conversationId);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: response.reply, worker: response.worker, intent: response.intent, metadata: response.metadata, conversationId: response.conversationId, timestamp: new Date().toISOString() }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible enviar el mensaje.');
    } finally {
      setLoading(false);
    }
  };
  return { messages, conversationId, loading, error, send };
}
