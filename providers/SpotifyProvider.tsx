"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

interface NowPlaying {
  isPlaying: boolean;
  albumArt?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  uri?: string;
  id?: string;
}

interface SpotifyContextType {
  player: Spotify.Player | null;
  deviceId: string | null;
  nowPlaying: NowPlaying | null;
  volume: number;
  isLiked: boolean | null;
  handlePlayPause: () => Promise<void>;
  handleNext: () => Promise<void>;
  handlePrevious: () => Promise<void>;
  handleVolumeChange: (volume: number) => Promise<void>;
  toggleLike: () => Promise<void>;
  addToQueue: (uri: string) => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, spotifyToken } = useAuth();
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [volume, setVolume] = useState<number>(
    () => Number(localStorage.getItem("spotifyVolume")) || 25
  );

  useEffect(() => {
    if (!authenticated || !spotifyToken) return;

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
    await player.nextTrack();
  };

  const handlePrevious = async () => {
    if (!player) return;
    await player.previousTrack();
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem("spotifyVolume", String(newVolume));
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
    } else {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${nowPlaying.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
    }

    setIsLiked(!isLiked);
  };

  const addToQueue = async (trackId: string) => {
    if (!spotifyToken) {
      console.error("Spotify token is missing");
      return;
    }

    try {
      // Ensure the user has an active device
      const deviceResponse = await fetch(
        "https://api.spotify.com/v1/me/player",
        {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        }
      );
      const deviceData = await deviceResponse.json();

      if (!deviceData.device || !deviceData.device.id) {
        console.error(
          "No active Spotify device found. Please play something on Spotify first."
        );
        return;
      }

      // Properly format track URI
      const trackUri = `spotify:track:${trackId}`;
      const queueUrl = `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(
        trackUri
      )}`;

      const response = await fetch(queueUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add to queue:", errorData);
      } else {
        console.log(`Successfully added ${trackId} to queue.`);
      }
    } catch (error) {
      console.error("Error adding track to queue:", error);
    }
  };

  return (
    <SpotifyContext.Provider
      value={{
        player,
        deviceId,
        nowPlaying,
        volume,
        isLiked,
        handlePlayPause,
        handleNext,
        handlePrevious,
        handleVolumeChange,
        toggleLike,
        addToQueue,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error("useSpotify must be used within a SpotifyProvider");
  }
  return context;
};
