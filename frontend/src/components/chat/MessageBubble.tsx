import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const assistant = message.role === 'assistant';
  const operationalMetadata = message.metadata
    ? Object.entries(message.metadata).filter(
        ([key, value]) =>
          !['requiresHuman', 'belongsToUser', 'found'].includes(key) &&
          value !== null &&
          typeof value !== 'object',
      )
    : [];
  return <div className={`message-row ${assistant ? 'message-assistant' : 'message-user'}`}><span className="message-avatar">{assistant ? <Bot size={18} /> : <User size={18} />}</span><div className="message-content"><div className="message-meta"><strong>{assistant ? message.worker || 'supportWorker' : 'Usuario 1'}</strong>{assistant && <StatusBadge>Activo</StatusBadge>}<time>{new Date(message.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</time></div><div className="message-bubble"><p>{message.content}</p>{assistant && operationalMetadata.length > 0 && <div className="metadata-grid">{operationalMetadata.map(([key, value]) => <div key={key}><span>{key}</span><strong>{String(value)}</strong></div>)}</div>}{assistant && message.intent && <div className="message-tags"><StatusBadge tone="blue">Intento: {message.intent}</StatusBadge><StatusBadge tone="neutral">{Object.keys(message.metadata || {}).length} metadata</StatusBadge></div>}</div></div></div>;
}
