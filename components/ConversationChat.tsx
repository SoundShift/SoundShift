import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ConversationChatProps {
  messages: Message[];
  isTyping: boolean;
}

export default function ConversationChat({ messages, isTyping }: ConversationChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col space-y-4 overflow-y-auto max-h-[400px] p-4">
      {messages.length === 0 && (
        <div className="text-center text-neutral-500 py-8">
          <p>Tell me how your day is going or what you're up to!</p>
          <p className="text-sm mt-2">I'll suggest some music that matches your mood.</p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-lg ${
              message.sender === 'user'
                ? 'bg-[#1DB954] text-black rounded-tr-none'
                : 'bg-neutral-800 rounded-tl-none'
            }`}
          >
            {message.text}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-neutral-800 p-3 rounded-lg rounded-tl-none">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}