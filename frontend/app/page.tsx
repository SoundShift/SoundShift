"use client";

import { useCallback } from "react";
import Link from "next/link";
import { FaSpotify } from "react-icons/fa";

export default function Home() {
  {
      const handleSpotifyLogin = useCallback(() => {
    window.location.href = "http://localhost:8000/auth/spotify/login";
  }, []); 
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Link // changed from button, can go back
          href={"http://localhost:8000/auth/spotify/login"}
          className="bg-[#1DB954] hover:bg-[#1ed760] py-4 px-6 rounded-full transition-colors flex gap-5 items-center justify-center"
        >
          <FaSpotify size={30} />

          <h2 className="text-white font-bold">Login with Spotify</h2>
        </Link>
      </main>
    </div>
  );
}
