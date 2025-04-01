"use client";

import { useState } from "react";
import { useSpotify } from "@/providers/SpotifyProvider";
import { useAuth } from "@/providers/AuthProvider";
import { getFunctions, httpsCallable } from "firebase/functions";
import Image from "next/image";

interface RecommendationResponse {
  tracks: { name: string; artist: string }[];
}

export default function Popup({ onClose }: { onClose: () => void }) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendedTracks, setRecommendedTracks] = useState<
    { id: string; name: string; artist: string; albumArt: string }[]
  >([]);
  const [queuedTracks, setQueuedTracks] = useState<Set<string>>(new Set());

  const { addToQueue } = useSpotify();
  const { likedTracks, spotifyToken } = useAuth();
  const functions = getFunctions();
  const getRecommendations = httpsCallable<
    { mood: string; genres: string[] },
    RecommendationResponse
  >(functions, "getRecommendations");

  const moods = ["Happy", "Sad", "Neutral"];
  const genres = ["Rap", "Classical", "Rock", "Jazz", "Pop", "Electronic"];

  // Function to find a track ID by its name
  const findTrackIdByName = async (trackName: string, artistName: string) => {
    const url = `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(
      trackName
    )} artist:${encodeURIComponent(artistName)}&type=track&limit=1`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });

      const data = await response.json();
      if (data.tracks.items.length > 0) {
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

  const handleSubmit = async () => {
    if (!selectedMood || selectedGenres.length === 0) return;

    setLoading(true);
    setRecommendedTracks([]);
    setQueuedTracks(new Set());

    try {
      const response = await getRecommendations({
        mood: selectedMood,
        genres: selectedGenres,
      });

      if (response.data?.tracks && Array.isArray(response.data.tracks)) {
        console.log("AI Recommended Songs:", response.data.tracks);

        const trackResults = await Promise.all(
          response.data.tracks.map(
            async (track) => await findTrackIdByName(track.name, track.artist)
          )
        );

        // Remove failed searches (null values)
        let filteredTracks = trackResults.filter(
          (
            track
          ): track is {
            id: string;
            name: string;
            artist: string;
            albumArt: string;
          } => track !== null
        );

        // Remove duplicates
        const uniqueTracks = Array.from(
          new Map(filteredTracks.map((t) => [t.id, t])).values()
        );

        // Filter out liked tracks
        const finalTracks = uniqueTracks.filter((track) => {
          if (likedTracks?.[track.id]) {
            console.log(
              `Skipping liked song: ${track.name} by ${track.artist}`
            );
            return false;
          }
          return true;
        });

        console.log(
          "Filtered Tracks (No Duplicates, No Liked Songs):",
          finalTracks
        );

        setRecommendedTracks(finalTracks);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[9999]">
      <div className="bg-neutral-900 text-white p-8 rounded-2xl shadow-2xl w-[50vw] h-auto flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white"
        >
          ✖
        </button>

        <h2 className="text-3xl font-bold mb-6">Hello, User</h2>

        {/* Mood Selection */}
        {!recommendedTracks.length && (
          <>
            <p className="mb-3 text-lg font-semibold">
              How are you feeling today?
            </p>
            <div className="flex space-x-4 mb-6">
              {moods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`px-5 py-2 rounded-lg text-lg transition ${
                    selectedMood === mood
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>

            {/* Genre Selection */}
            <p className="mb-3 text-lg font-semibold">
              Select your preferred genres:
            </p>
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() =>
                    setSelectedGenres((prev) =>
                      prev.includes(genre)
                        ? prev.filter((g) => g !== genre)
                        : [...prev, genre]
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    selectedGenres.includes(genre)
                      ? "bg-green-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition"
              disabled={loading}
            >
              {loading ? "Loading..." : "Enter"}
            </button>
          </>
        )}

        {/* Loading Animation */}
        {loading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2 text-gray-400">Fetching recommendations...</p>
          </div>
        )}

        {/* Recommended Tracks List */}
        {recommendedTracks.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-4 bg-gray-800 rounded-lg mt-4 w-full">
            <h3 className="text-xl font-semibold mb-3">Recommended Songs</h3>
            {recommendedTracks.map((track) => (
              <div
                key={track.id}
                className="flex justify-between items-center p-2 border-b border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  {track.albumArt && (
                    <Image
                      src={track.albumArt}
                      alt={track.name}
                      width={50}
                      height={50}
                      className="rounded-lg"
                    />
                  )}
                  <div>
                    <span className="font-semibold">{track.name}</span> -{" "}
                    <span className="text-gray-400">{track.artist}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    addToQueue(track.id);
                    setQueuedTracks((prev) => new Set(prev).add(track.id));
                  }}
                  disabled={queuedTracks.has(track.id)}
                  className={`px-4 py-1 rounded-lg ${
                    queuedTracks.has(track.id)
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {queuedTracks.has(track.id) ? "Added" : "Add to Queue"}
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                recommendedTracks.forEach((track) => {
                  addToQueue(track.id);
                });
                setQueuedTracks(
                  new Set(recommendedTracks.map((track) => track.id))
                );
              }}
              disabled={queuedTracks.size === recommendedTracks.length}
              className={`mt-4 px-6 py-2 rounded-lg text-lg font-semibold w-full ${
                queuedTracks.size === recommendedTracks.length
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {queuedTracks.size === recommendedTracks.length
                ? "All Added"
                : "Add All to Queue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
