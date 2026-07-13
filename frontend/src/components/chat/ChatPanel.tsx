import { LoaderCircle, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';

const prompts = ['Resume el estado operativo', '¿Qué fuentes están disponibles?', 'Muestra las capacidades bloqueadas', '¿Qué requiere aprobación humana?'];

export function ChatPanel({ compact = false, onCompleted }: { compact?: boolean; onCompleted?: () => void | Promise<void> }) {
  const [input, setInput] = useState('');
  const { messages, conversationId, loading, error, send } = useChat();
  const runPrompt = async (value: string) => {
    await send(value);
    await onCompleted?.();
  };
  const submit = (attachmentName?: string) => {
    const content = attachmentName
      ? `${input}\n[Referencia de archivo: ${attachmentName}]`
      : input;
    void runPrompt(content);
    setInput('');
  };
  return <section className={`panel chat-panel ${compact ? 'chat-compact' : ''}`}>
    <div className="chat-heading"><div><span className="eyebrow">Core workspace</span><h2>AI Chat Center <span className="live-label"><i /> En vivo</span></h2></div><div className="conversation-label"><span>Conversación</span><strong>{conversationId || 'Nueva sesión'}</strong><Maximize2 size={15} /></div></div>
    <div className="chat-context"><span>Operador: <strong>internal</strong></span><span>Canal: <strong>Web</strong></span><span>Modo: <strong>controlled</strong></span></div>
    <div className="messages" aria-live="polite">{messages.length===0&&<div className="module-empty"><strong>New authenticated conversation</strong><p>No sample conversation is injected. Enter a real internal request to begin.</p></div>}{messages.map((message) => <MessageBubble key={message.id} message={message} />)}{loading && <div className="typing"><LoaderCircle className="spin" size={17} /> Worker procesando solicitud…</div>}</div>
    {error && <div className="chat-error">{error}</div>}
    <ChatInput value={input} loading={loading} onChange={setInput} onSubmit={submit} />
    <div className="prompt-row">{prompts.map((prompt) => <button key={prompt} disabled={loading} onClick={() => void runPrompt(prompt)}>{prompt}</button>)}</div>
  </section>;
}
