import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi';

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

interface ConversationInputProps {
  onMessageSent: (message: string) => void;
  isProcessing: boolean;
}

export default function ConversationInput({ onMessageSent, isProcessing }: ConversationInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech Recognition not supported");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => prev + ' ' + transcript);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }

    setIsListening((prev) => !prev);
  };

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
        type="button"
        onClick={toggleListening}
        className={`p-3 rounded-full ${
          isListening ? 'bg-red-600 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'
        }`}
      >
        {isListening ? <FiMicOff size={20} /> : <FiMic size={20} />}
      </button>
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
