import Image from 'next/image';
import { spotifyClient } from '@/lib/spotify';

interface Recommendation {
  artist: string;
  track: string;
  albumArt?: string;
  uri?: string;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
  onTrackSelect: (uri: string) => void;
}

export default function Recommendations({ recommendations, onTrackSelect }: RecommendationsProps) {
  return (
    <div className="flex justify-between items-center gap-4 mt-8 overflow-x-auto pb-4">
      {recommendations.map((rec, index) => (
        <div 
          key={index}
          className="bg-neutral-800 p-4 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors flex-shrink-0"
          style={{ width: '200px' }}
          onClick={() => rec.uri && onTrackSelect(rec.uri)}
        >
          {rec.albumArt && (
            <div className="relative w-full aspect-square mb-4">
              <Image
                src={rec.albumArt}
                alt={`${rec.track} album art`}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          )}
          <h3 className="font-bold text-lg truncate">{rec.track}</h3>
          <p className="text-gray-400 truncate">{rec.artist}</p>
        </div>
      ))}
    </div>
  );
} 