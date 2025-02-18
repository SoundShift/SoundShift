'use client';

import { useEffect, useState } from 'react';
import { spotifyClient } from '@/lib/spotify';
import Image from 'next/image';
import Keywords from '@/components/Keywords';
import { useAuth } from '@/providers/AuthProvider';
import Recommendations from '@/components/Recommendations';
import Loading from '@/components/Loading';

interface NowPlaying {
  isPlaying: boolean;
  albumArt?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
}

interface Recommendation {
  artist: string;
  track: string;
  albumArt?: string;
  uri?: string;
}

export default function Dashboard() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({
    isPlaying: false
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

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

  const handleKeywordSelect = async (keyword: string) => {
    try {
      setIsLoading(true);
      setRecommendations([]);
      
      const accessToken = localStorage.getItem('spotify_access_token');
      if (!accessToken) {
        setError('No access token found');
        return;
      }

      const response = await fetch(
        `http://localhost:8000/recommendations?mood=${keyword}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (response.status === 403) {
        window.location.href = "http://localhost:8000/auth/spotify/login";
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      const enrichedRecommendations = await Promise.all(
        data.map(async (rec: Recommendation) => {
          const trackInfo = await spotifyClient.searchTrack(`${rec.track} ${rec.artist}`);
          return {
            ...rec,
            albumArt: trackInfo?.album?.images[0]?.url,
            uri: trackInfo?.uri
          };
        })
      );
      
      setRecommendations(enrichedRecommendations);
    } catch (error) {
      setError('Failed to fetch recommendations');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackSelect = async (uri: string) => {
    try {
      await spotifyClient.playTrack(uri);
      setTimeout(fetchNowPlaying, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to play track');
      console.error('Track select error:', error);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Use the AuthContext logout
    logout();
    
    // Redirect home
    window.location.href = '/';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SoundShift</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            Logout
          </button>
        </div>
        
        <Keywords onSelect={handleKeywordSelect} />

        {isLoading ? (
          <Loading message="Finding recommendations..." />
        ) : (
          recommendations.length > 0 && (
            <Recommendations 
              recommendations={recommendations}
              onTrackSelect={handleTrackSelect}
            />
          )
        )}

        <div className="mt-6">
          {nowPlaying.isPlaying ? (
            <div className="flex flex-col items-center max-w-md mx-auto">
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
          ) : recommendations.length > 0 ? (
            <div className="text-center">
              <p className="text-sm text-gray-400">Open Spotify on any device and click on a recommendation to play it.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}