'use client';

import { useEffect, useState } from 'react';
import { spotifyClient } from '@/lib/spotify';
import Image from 'next/image';

interface NowPlaying {
  isPlaying: boolean;
  albumArt?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
}

export default function Dashboard() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({
    isPlaying: false
  });
  const [error, setError] = useState<string | null>(null);

  const fetchNowPlaying = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`
        }
      });

      if (response.status === 204) {
        setNowPlaying({ isPlaying: false });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch now playing');
      }

      const data = await response.json();
      setNowPlaying({
        isPlaying: data.is_playing,
        albumArt: data.item?.album.images[0]?.url,
        trackName: data.item?.name,
        artistName: data.item?.artists[0]?.name,
        albumName: data.item?.album.name
      });
    } catch (err) {
      setError('Failed to load now playing data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-neutral-900 to-black text-white p-8">
      <h1 className="text-4xl font-bold mb-12">Now Playing</h1>
      
      {nowPlaying.isPlaying ? (
        <div className="flex flex-col items-center max-w-md w-full">
          {nowPlaying.albumArt && (
            <div className="relative w-64 h-64 mb-8 shadow-2xl">
              <Image
                src={nowPlaying.albumArt}
                alt="Album artwork"
                fill
                className="rounded-lg object-cover"
              />
            </div>
          )}
          <h2 className="text-2xl font-bold mb-2">{nowPlaying.trackName}</h2>
          <p className="text-lg text-gray-300 mb-1">{nowPlaying.artistName}</p>
          <p className="text-sm text-gray-400">{nowPlaying.albumName}</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl text-gray-400">Nothing playing right now</p>
        </div>
      )}
    </div>
  );
}