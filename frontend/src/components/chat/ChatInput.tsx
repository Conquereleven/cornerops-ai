import { ArrowUp, Command, Paperclip } from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';

export function ChatInput({
  value,
  loading,
  onChange,
  onSubmit,
}: {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: (attachmentName?: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim() && !loading) {
      onSubmit(attachmentName || undefined);
      setAttachmentName('');
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <>
      <form className="chat-form" onSubmit={submit}>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          aria-label="Seleccionar archivo"
          onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || '')}
        />
        <button type="button" className="icon-button" aria-label="Adjuntar archivo" onClick={() => fileInput.current?.click()}>
          <Paperclip size={18} />
        </button>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Escribe tu mensaje para CórnerOps AI…"
          aria-label="Mensaje"
        />
        <span className="shortcut"><Command size={13} /> ↵</span>
        <button className="send-button" disabled={!value.trim() || loading} aria-label="Enviar">
          <ArrowUp size={18} />
        </button>
      </form>
      {attachmentName && <div className="attachment-chip"><Paperclip size={12} /> {attachmentName}<span>referencia local</span><button type="button" onClick={() => setAttachmentName('')} aria-label="Quitar adjunto">×</button></div>}
    </>
  );
}
