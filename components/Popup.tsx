"use client";

import { useState } from "react";

export default function Popup({ onClose }: { onClose: () => void }) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const moods = ["Happy", "Sad", "Neutral"];
  const genres = ["Rap", "Classical", "Rock", "Jazz", "Pop", "Electronic"];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[9999]">
      <div className="bg-neutral-900 text-white p-8 rounded-2xl shadow-2xl w-[50vw] h-[55vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-6">Hello, User</h2>

        {/* Mood Selection */}
        <p className="mb-3 text-lg font-semibold">How are you feeling today?</p>
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
        <p className="mb-3 text-lg font-semibold">Select your preferred genres:</p>
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

        {/* Enter Button */}
        <button
          onClick={onClose}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition"
        >
          Enter
        </button>
      </div>
    </div>
  );
}
