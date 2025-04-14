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
  const [isRecommendationsCollapsed, setIsRecommendationsCollapsed] = useState(false);

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

      const functions = getFunctions();
      const moodAnalysisFunction = httpsCallable<
        { context: string },
        RecommendationResponse
      >(functions, "moodAnalysis");

      const moodRes = await moodAnalysisFunction({
        context: text,
      });

      let mood = moodRes.data.mood;

      const analysisMessage: Message = {
        id: uuidv4(),
        text: `I see you're feeling ${mood.toLowerCase()} Let me find some music that matches your mood...`,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-neutral-700/60">

        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">SoundShift Assistant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-auto flex flex-col">
          <ConversationChat messages={messages} isTyping={isTyping} />

          {recommendedTracks.length > 0 && (
            <div className="p-4 border-t border-neutral-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Recommended Tracks</h3>
                <button
                  onClick={() => setIsRecommendationsCollapsed(!isRecommendationsCollapsed)}
                  className="p-2 hover:bg-neutral-700 rounded-full transition-colors"
                  aria-label={isRecommendationsCollapsed ? "Expand recommendations" : "Collapse recommendations"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`w-5 h-5 transition-transform ${isRecommendationsCollapsed ? 'rotate-180' : ''}`}
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
              </div>

              {!isRecommendationsCollapsed && (
                <>
                  <p className="text-sm text-gray-400 mb-4">{explanation}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                    {recommendedTracks.map((track, index) => (
                      <div
                        key={`${track.id}-${index}`}
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
                      setQueuedTracks( // Set button as "All added to queue" to prevent multiple clicks..
                        new Set(recommendedTracks.map((track) => track.id))
                      );
                      
                      // Process the queue
                      for (const track of recommendedTracks) {
                        if (!queuedTracks.has(track.id)) {
                          await addToQueue(track.id);
                        }
                      }
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
                </>
              )}
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
