"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export interface NowPlaying {
  item: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
    uri: string;
  } | null;
  isPlaying: boolean;
}

interface SpotifyContextType {
  player: Spotify.Player | null;
  deviceId: string | null;
  nowPlaying: NowPlaying | null;
  queue: NowPlaying[] | null;
  volume: number;
  isLiked: boolean | null;
  handlePlayPause: () => Promise<void>;
  handleNext: () => Promise<void>;
  handlePrevious: () => Promise<void>;
  handleVolumeChange: (volume: number) => Promise<void>;
  toggleLike: () => Promise<void>;
  addToQueue: (trackId: string) => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider");
  }
  return context;
};

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { spotifyToken, likedTracks } = useAuth();
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("spotifyVolume")) || 25;
    }
    return 25;
  });
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [queue, setQueue] = useState<NowPlaying[] | null>(null);

  useEffect(() => {
    if (!spotifyToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new Spotify.Player({
        name: "SoundShift Web Player",
        getOAuthToken: (cb) => {
          cb(spotifyToken);
        },
        volume: 0.5,
      });

      spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);

        // 🔥 Transfer playback to this device
        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        });
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      spotifyPlayer.addListener("player_state_changed", (state) => {
        if (!state) return;

        const currentTrack = state.track_window.current_track;
        setNowPlaying({
          item: {
            id: currentTrack.id ?? "", // fallback to empty string if null
            name: currentTrack.name,
            artists: currentTrack.artists,
            album: {
              name: currentTrack.album.name,
              images: currentTrack.album.images,
            },
            uri: currentTrack.uri,
          },
          isPlaying: !state.paused,
        });

        // @ts-ignore - device is not typed in PlaybackState
        setVolume(state.device?.volume_percent ?? 50);

        if (likedTracks && currentTrack.id) {
          setIsLiked(!!likedTracks[currentTrack.id]);
        }
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [spotifyToken]);

  useEffect(() => {
    if (!spotifyToken) return;

    const fetchPlaybackState = async () => {
      try {
        const response = await fetch("https://api.spotify.com/v1/me/player", {
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
          },
        });

        if (response.status === 204) {
          setNowPlaying(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.item) {
          setNowPlaying({
            item: {
              id: data.item.id,
              name: data.item.name,
              artists: data.item.artists,
              album: {
                name: data.item.album.name,
                images: data.item.album.images,
              },
              uri: data.item.uri,
            },
            isPlaying: data.is_playing,
          });

          if (data.item.id) {
            checkIfTrackIsLiked(data.item.id);
          }
          fetchQueue();
        } else {
          setNowPlaying(null);
        }
      } catch (error) {
        console.error("Error fetching playback state:", error);
      }
    };

    const checkIfTrackIsLiked = async (trackId: string) => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
          {
            headers: {
              Authorization: `Bearer ${spotifyToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setIsLiked(data[0] || false);
      } catch (error) {
        console.error("Error checking if track is liked:", error);
      }
    };

    const fetchQueue = async () => {

      if(!spotifyToken) return;
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/queue`,
          {
            headers: {
              Authorization: `Bearer ${spotifyToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch queue");
        }

        const data = await response.json();

        const nextUp = data.queue.map((track: any) => ({
          item: {
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            uri: track.uri,
          },
          isPlaying: false,
        }));
        setQueue(nextUp);
      } catch (error) {
        console.error("Error fetching queue:", error);
      }
    }

    fetchPlaybackState();

    const interval = setInterval(fetchPlaybackState, 3000);
    setPollingInterval(interval);

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [spotifyToken]);

  const handlePlayPause = async () => {
    if (!spotifyToken) return;

    try {
      const endpoint = nowPlaying?.isPlaying ? "pause" : "play";
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      });

      if (nowPlaying) {
        setNowPlaying({
          ...nowPlaying,
          isPlaying: !nowPlaying.isPlaying,
        });
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  const handleNext = async () => {
    if (!spotifyToken) return;

    try {
      await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
    } catch (error) {
      console.error("Error skipping to next track:", error);
    }
  };

  const handlePrevious = async () => {
    if (!spotifyToken) return;

    try {
      await fetch("https://api.spotify.com/v1/me/player/previous", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
    } catch (error) {
      console.error("Error going to previous track:", error);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    if (!spotifyToken) return;

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${newVolume}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
          },
        }
      );

      setVolume(newVolume);
    } catch (error) {
      console.error("Error changing volume:", error);
    }
  };

  const toggleLike = async () => {
    if (!spotifyToken || !nowPlaying?.item?.id) return;

    try {
      const trackId = nowPlaying.item.id;
      const method = isLiked ? "DELETE" : "PUT";

      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method,
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      });

      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error toggling like status:", error);
    }
  };

  const addToQueue = async (trackId: string) => {
    if (!spotifyToken) return;

    try {
      // Ensure the user has an active device
      const deviceResponse = await fetch(
        "https://api.spotify.com/v1/me/player",
        {
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
          },
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
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("spotifyVolume", volume.toString());
    }
  }, [volume]);

  return (
    <SpotifyContext.Provider
      value={{
        player,
        deviceId,
        nowPlaying,
        queue,
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
};
