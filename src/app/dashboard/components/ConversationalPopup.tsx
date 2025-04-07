"use client";

import { useState, useEffect } from "react";
import { useSpotify } from "@/providers/SpotifyProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getFunctions, httpsCallable } from "firebase/functions";
import Image from "next/image";
import ConversationChat from "@/components/ConversationChat";
import ConversationInput from "@/components/ConversationInput";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface RecommendationTrack {
  name: string;
  artist: string;
}

interface RecommendationResponse {
  tracks: RecommendationTrack[];
  explanation: string;
}

export default function ConversationalPopup({
  onClose,
}: {
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState<
    { id: string; name: string; artist: string; albumArt: string }[]
  >([]);
  const [queuedTracks, setQueuedTracks] = useState<Set<string>>(new Set());
  const [explanation, setExplanation] = useState<string>("");

  const { addToQueue } = useSpotify();
  const { likedTracks, spotifyToken, user } = useAuth();

  useEffect(() => {
    const initialMessage: Message = {
      id: uuidv4(),
      text: "Hi there! How are you feeling today? Tell me about your day or what you're up to.",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, []);

  const findTrackIdByName = async (trackName: string, artistName: string) => {
    if (!spotifyToken) return null;

    const url = `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(
      trackName
    )} artist:${encodeURIComponent(artistName)}&type=track&limit=1`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });

      const data = await response.json();
      if (data.tracks?.items?.length > 0) {
        const track = data.tracks.items[0];
        return {
          id: track.id,
          name: track.name,
          artist: track.artists.map((a: any) => a.name).join(", "),
          albumArt: track.album.images[0]?.url || "",
        };
      }
      return null;
    } catch (error) {
      console.error("Error searching for track:", error);
      return null;
    }
  };

  const handleMessageSent = async (text: string) => {
    try {
      const userMessage: Message = {
        id: uuidv4(),
        text,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      let mood = "Neutral";
      if (
        text.toLowerCase().includes("happy") ||
        text.toLowerCase().includes("good") ||
        text.toLowerCase().includes("great")
      ) {
        mood = "Happy";
      } else if (
        text.toLowerCase().includes("sad") ||
        text.toLowerCase().includes("bad") ||
        text.toLowerCase().includes("tired")
      ) {
        mood = "Sad";
      }

      const analysisMessage: Message = {
        id: uuidv4(),
        text: `I see you're feeling ${mood.toLowerCase()}. Let me find some music that matches your mood...`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, analysisMessage]);

      console.log("Getting recommendations...");
      setLoading(true);

      try {
        const functions = getFunctions();
        const getRecommendationsFunction = httpsCallable<
          { mood: string; context: string },
          RecommendationResponse
        >(functions, "getRecommendations");

        const response = await getRecommendationsFunction({
          mood: mood,
          context: text,
        });

        console.log("Recommendation response:", response.data);

        if (response.data.tracks && response.data.tracks.length > 0) {
          setExplanation(response.data.explanation || "");

          const trackPromises = response.data.tracks.map(
            (track: RecommendationTrack) =>
              findTrackIdByName(track.name, track.artist)
          );

          const resolvedTracks = await Promise.all(trackPromises);
          const validTracks = resolvedTracks.filter(
            (track) => track !== null
          ) as {
            id: string;
            name: string;
            artist: string;
            albumArt: string;
          }[];

          setRecommendedTracks(validTracks);

          const successMessage: Message = {
            id: uuidv4(),
            text: `I found ${validTracks.length} songs that I think you'll enjoy! Check them out below.`,
            sender: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, successMessage]);
        } else {
          throw new Error("No recommendations returned");
        }
      } catch (error) {
        console.error("Error getting recommendations:", error);

        const errorMessage: Message = {
          id: uuidv4(),
          text: "I'm having trouble finding recommendations right now. Could you try again?",
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      setLoading(false);
      setIsTyping(false);
    } catch (error) {
      console.error("Error in message handling:", error);
      setLoading(false);
      setIsTyping(false);

      const errorMessage: Message = {
        id: uuidv4(),
        text: "Sorry, I encountered an error. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">SoundShift Assistant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-auto flex flex-col">
          <ConversationChat messages={messages} isTyping={isTyping} />

          {recommendedTracks.length > 0 && (
            <div className="p-4 border-t border-neutral-800">
              <h3 className="text-lg font-semibold mb-3">Recommended Tracks</h3>
              <p className="text-sm text-gray-400 mb-4">{explanation}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {recommendedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center bg-neutral-800 p-2 rounded-lg"
                  >
                    {track.albumArt && (
                      <Image
                        src={track.albumArt}
                        alt={`${track.name} album art`}
                        width={50}
                        height={50}
                        className="rounded mr-3"
                      />
                    )}
                    <div className="flex-grow min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await addToQueue(track.id);
                        setQueuedTracks(new Set([...queuedTracks, track.id]));
                      }}
                      disabled={queuedTracks.has(track.id)}
                      className={`ml-2 px-3 py-1 rounded ${
                        queuedTracks.has(track.id)
                          ? "bg-gray-700 text-gray-500"
                          : "bg-[#1DB954] hover:bg-[#1ed760] text-black"
                      }`}
                    >
                      {queuedTracks.has(track.id) ? "Added" : "Add"}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={async () => {
                  for (const track of recommendedTracks) {
                    if (!queuedTracks.has(track.id)) {
                      await addToQueue(track.id);
                    }
                  }
                  setQueuedTracks(
                    new Set(recommendedTracks.map((track) => track.id))
                  );
                }}
                disabled={queuedTracks.size === recommendedTracks.length}
                className={`mt-4 px-6 py-2 rounded-lg text-lg font-semibold w-full ${
                  queuedTracks.size === recommendedTracks.length
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-[#1DB954] hover:bg-[#1ed760] text-black"
                }`}
              >
                {queuedTracks.size === recommendedTracks.length
                  ? "All Added to Queue"
                  : "Add All to Queue"}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-800">
          <ConversationInput
            onMessageSent={handleMessageSent}
            isProcessing={loading}
          />
        </div>
      </div>
    </div>
  );
}
