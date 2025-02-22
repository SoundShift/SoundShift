"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useSpotify } from "@/providers/SpotifyProvider";
import Popup from "@/app/dashboard/components/Popup";

export default function Dashboard() {
  const router = useRouter();
  const { authenticated, authLoaded, logout } = useAuth();
  const {
    nowPlaying,
    isLiked,
    volume,
    handlePlayPause,
    handleNext,
    handlePrevious,
    handleVolumeChange,
    toggleLike,
  } = useSpotify();

  const [showPopup, setShowPopup] = useState<boolean>(false);

  useEffect(() => {
    if (authLoaded && authenticated) {
      setShowPopup(true);
    }
  }, [authLoaded, authenticated]);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (authLoaded && !authenticated) {
      router.push("/");
    }
  }, [authLoaded, authenticated, router]);

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

        {showPopup && <Popup onClose={handleClosePopup} />}

        {!showPopup &&
          (nowPlaying ? (
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
              <h2 className="text-2xl font-bold mb-2">
                {nowPlaying.trackName}
              </h2>
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
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-40"
                />
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400">
              No song currently playing.
            </p>
          ))}
      </div>
    </div>
  );
}
