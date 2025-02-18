import { useState } from 'react';

interface KeywordsProps {
  onSelect: (keyword: string) => void;
}

export default function Keywords({ onSelect }: KeywordsProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  
  const keywords = [
    'Happy', 'Energetic', 'Focused', 'Relaxed', 
    'Melancholic', 'Party', 'Workout'
  ];

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    onSelect(keyword);
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 mb-8">
      {keywords.map((keyword) => (
        <button
          key={keyword}
          onClick={() => handleKeywordClick(keyword)}
          className={`px-6 py-3 rounded-full transition-colors ${
            selectedKeyword === keyword 
              ? 'bg-[#1DB954] hover:bg-[#1ed760]' 
              : 'bg-neutral-800 hover:bg-neutral-700'
          }`}
        >
          {keyword}
        </button>
      ))}
    </div>
  );
} 