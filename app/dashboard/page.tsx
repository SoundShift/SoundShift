"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useSpotify } from "@/providers/SpotifyProvider";
import ConversationalPopup from "@/app/dashboard/components/ConversationalPopup";

export default function Dashboard() {
  const router = useRouter();
  const { authenticated, authLoaded, logout } = useAuth();
  const {
    nowPlaying,
    queue,
    isLiked,
    volume,
    handlePlayPause,
    handleNext,
    handlePrevious,
    handleVolumeChange,
    toggleLike,
  } = useSpotify();
  const [localVolume, setLocalVolume] = useState(volume);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  useEffect(() => {
    if (authLoaded && !authenticated) {
      router.push("/");
    }
  }, [authLoaded, authenticated, router]);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleOpenPopup = () => {
    setShowPopup(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SoundShift</h1>
          <div className="flex gap-4">
            <button
              onClick={handleOpenPopup}
              className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full transition-colors"
            >
              Get Recommendations
            </button>
            {authenticated && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Now Playing</h2>

          {nowPlaying && nowPlaying.item ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {nowPlaying.item.album.images[0]?.url && (
                <div className="relative w-64 h-64 flex-shrink-0">
                  <Image
                    src={nowPlaying.item.album.images[0].url}
                    alt={`${nowPlaying.item.name} album art`}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}

              <div className="flex-grow">
                <h3 className="text-xl font-bold">{nowPlaying.item.name}</h3>
                <p className="text-gray-400">
                  {nowPlaying.item.artists.map((a) => a.name).join(", ")}
                </p>
                <p className="text-gray-400 mt-1">
                  {nowPlaying.item.album.name}
                </p>

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
                    value={localVolume}
                    onChange={(e) => setLocalVolume(Number(e.target.value))}
                    onMouseUp={() => handleVolumeChange(localVolume)}
                    onTouchEnd={() => handleVolumeChange(localVolume)}
                    className="w-40"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400">
              No song currently playing.
            </p>
          )}
        </div>

        {queue && queue.length > 0 && (
          <div className="mt-8 bg-neutral-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Up Next</h3>
            <div className="max-h-64 bg-neutral-850 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
              <ul className="space-y-4">
                {queue.map((track, index) => (
                  <li key={track.item?.id || index} className="flex items-center space-x-4">
                    {track.item?.album.images[0]?.url && (
                      <div className="w-12 h-12 relative flex-shrink-0">
                        <Image
                          src={track.item.album.images[0].url}
                          alt={`${track.item.name} album art`}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white truncate max-w-xs">
                        {track.item?.name}
                      </p>
                      <p className="text-sm text-gray-400 truncate max-w-xs">
                        {track.item?.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}



        <div className="mt-8 bg-neutral-800 rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Music Assistant</h2>
          </div>
          <p className="text-gray-300 mb-6">
            Tell me how you're feeling or what you're up to, and I'll recommend
            music that matches your mood.
          </p>
          <button
            onClick={handleOpenPopup}
            className="w-full py-4 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-lg transition-colors text-lg font-semibold"
          >
            Start a Conversation
          </button>
        </div>
      </div>

      {showPopup && <ConversationalPopup onClose={handleClosePopup} />}
    </div>
  );
}
