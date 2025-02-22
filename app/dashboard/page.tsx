"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import Popup from "@/components/Popup";

interface NowPlaying {
  isPlaying: boolean;
  albumArt?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  uri?: string;
  id?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const { authenticated, authLoaded, spotifyToken, logout } = useAuth();

  useEffect(() => {
    if (authLoaded && authenticated) {
      setShowPopup(true);
    }
  }, [authLoaded, authenticated]);
  
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleLogout = () => {
    if (player) {
      player.disconnect();
      setPlayer(null);
    }

    const script = document.querySelector(
      "script[src='https://sdk.scdn.co/spotify-player.js']"
    );
    if (script) {
      script.remove();
    }

    setNowPlaying(null);
    setDeviceId(null);

    logout();
  };

  useEffect(() => {
    if (authLoaded && !authenticated) {
      router.push("/");
    }
  }, [authLoaded, authenticated, router]);

  useEffect(() => {
    if (!authenticated || !spotifyToken) return;

    // maybe add loading state until player is fully loaded

    const loadSpotifySDK = () => {
      return new Promise<void>((resolve) => {
        if (window.Spotify) {
          resolve();
        } else {
          window.onSpotifyWebPlaybackSDKReady = () => resolve();

          const script = document.createElement("script");
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          document.body.appendChild(script);
        }
      });
    };

    loadSpotifySDK().then(() => {
      const newPlayer = new window.Spotify.Player({
        name: "My Web Player",
        getOAuthToken: (cb: any) => cb(spotifyToken),
        volume: volume / 100,
      });

      newPlayer.addListener(
        "ready",
        async ({ device_id }: { device_id: string }) => {
          setDeviceId(device_id);

          await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${spotifyToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ device_ids: [device_id], play: false }),
          });
        }
      );

      newPlayer.addListener(
        "not_ready",
        ({ device_id }: { device_id: string }) => {
          setDeviceId(null);
        }
      );

      newPlayer.addListener("player_state_changed", async (state: any) => {
        if (!state) return;

        console.log("Player State Changed:", state);

        const currentTrack = state.track_window.current_track;
        setNowPlaying({
          isPlaying: !state.paused,
          albumArt: currentTrack.album.images[0]?.url,
          trackName: currentTrack.name,
          artistName: currentTrack.artists[0]?.name,
          albumName: currentTrack.album.name,
          uri: currentTrack.uri,
          id: currentTrack.id,
        });

        // check if liked
        await checkIfLiked(currentTrack.id);
      });

      newPlayer.connect();
      setPlayer(newPlayer);
    });

    return () => {
      if (player) player.disconnect();
    };
  }, [authenticated, spotifyToken]);

  const handlePlayPause = async () => {
    if (!player) return;
    const state = await player.getCurrentState();
    if (state) {
      state.paused ? await player.resume() : await player.pause();
    }
  };

  const handleNext = async () => {
    if (!player) return;
    console.log("User skipped song");
    await player.nextTrack();
  };

  const handlePrevious = async () => {
    if (!player) return;
    console.log("User went back to previous song");
    await player.previousTrack();
  };

  const handleVolumeChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newVolume = Number(event.target.value);
    setVolume(newVolume);
    if (player) {
      await player.setVolume(newVolume / 100);
    }
  };

  const checkIfLiked = async (trackId: string) => {
    const response = await fetch(
      `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    );

    const data = await response.json();
    setIsLiked(data[0]);
  };

  const toggleLike = async () => {
    if (!nowPlaying?.id) return;

    if (isLiked) {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${nowPlaying.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
      console.log("Song disliked:", nowPlaying.trackName);
    } else {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${nowPlaying.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
      console.log("Song liked:", nowPlaying.trackName);
    }

    setIsLiked(!isLiked);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SoundShift</h1>
          {authenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              Logout
            </button>
          )}
        </div>

        {/* {showPopup && <Popup message="Enjoy seamless music streaming with Spotify!" onClose={handleClosePopup} />} */}
        {showPopup && <Popup onClose={handleClosePopup} />}
        
        {!showPopup && (
          nowPlaying ? (
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
              <p className="text-lg text-gray-300 mb-1">
                {nowPlaying.artistName}
              </p>
              <p className="text-sm text-gray-400">{nowPlaying.albumName}</p>

              <div className="flex mt-4 space-x-4">
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-full"
                >
                  ⏮ Previous
                </button>
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-full"
                >
                  {nowPlaying.isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-full"
                >
                  ⏭ Next
                </button>
              </div>

              <div className="flex mt-4 space-x-4">
                <button
                  onClick={toggleLike}
                  className={`px-4 py-2 rounded-full transition ${
                    isLiked
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-700 hover:bg-gray-800"
                  }`}
                >
                  {isLiked ? "❤️ Liked" : "🤍 Like"}
                </button>
              </div>

              <div className="flex items-center mt-4 space-x-2">
                <span className="text-gray-400">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-40"
                />
              </div>
            </div>
            ) : (
              <p className="text-center text-gray-400">No song currently playing.</p>
            )
          )}
      </div>
    </div>
  );
}
