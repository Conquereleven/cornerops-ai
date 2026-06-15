import { useState } from 'react';
import { sendChatMessage } from '../lib/api';
import type { ChatMessage } from '../lib/types';

const initialMessages: ChatMessage[] = [
  {
    id: 'demo-user',
    role: 'user',
    content: '¿Cuál es el estado de mi orden #123?',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'demo-order',
    role: 'assistant',
    content:
      'Encontré tu orden #123. Actualmente está en preparación, el pago aparece como pagado y la entrega está pendiente de recolección. Fecha estimada de entrega: 2026-06-18.',
    worker: 'ordersWorker',
    intent: 'order_status',
    metadata: {
      orderId: '123',
      status: 'preparing',
      paymentStatus: 'paid',
      deliveryStatus: 'pending_pickup',
      estimatedDelivery: '2026-06-18',
      requiresHuman: false,
    },
    timestamp: new Date().toISOString(),
  },
];

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
      const response = await sendChatMessage({ userId: '1', message: cleanContent, conversationId });
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
