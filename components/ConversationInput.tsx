import { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';

interface ConversationInputProps {
  onMessageSent: (message: string) => void;
  isProcessing: boolean;
}

export default function ConversationInput({ onMessageSent, isProcessing }: ConversationInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      onMessageSent(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 mt-4">
      <textarea
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell me about your day or how you're feeling..."
        className="flex-grow p-3 bg-neutral-800 rounded-lg resize-none min-h-[50px] max-h-[150px] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
        rows={1}
        disabled={isProcessing}
      />
      <button
        type="submit"
        disabled={!message.trim() || isProcessing}
        className={`p-3 rounded-full ${
          !message.trim() || isProcessing
            ? 'bg-neutral-700 text-neutral-500'
            : 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
        }`}
      >
        <FiSend size={20} />
      </button>
    </form>
  );
}