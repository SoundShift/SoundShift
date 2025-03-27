"use client";

import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { authenticated, authLoaded, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && authenticated) {
      router.push("/dashboard");
    }
  }, [authLoaded, authenticated, router]);

  const handleLogin = () => {
    const clientId = "d94d200c0e3f4fc0b83ed70f1e29958d";
    const redirectUri = encodeURIComponent("http://localhost:3000/callback");
    const scope = encodeURIComponent(
      "streaming user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private user-library-read user-top-read user-read-recently-played user-read-private user-read-email"
    );

    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto p-8">
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold">SoundShift</h1>
          {authenticated && (
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              Logout
            </button>
          )}
        </header>

        <main className="flex flex-col items-center justify-center">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6">
              Music that understands you
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Chat with SoundShift about your day, mood, or activities, and discover music that hits just right - like getting recommendations from a friend who really gets you.
            </p>
          </div>

          <div className="bg-neutral-800 p-8 rounded-xl shadow-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Get started with SoundShift
            </h3>
            <p className="text-gray-300 mb-8 text-center">
              Connect your Spotify account to start getting personalized music recommendations.
            </p>
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full transition-colors text-lg font-semibold flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 496 512"
                className="h-6 w-6 mr-2"
                fill="currentColor"
              >
                <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 30.6 6.1 4.2 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z" />
              </svg>
              Login with Spotify
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="bg-neutral-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">Natural Conversation</h3>
              <p className="text-gray-300">
                Tell us how you're feeling and we'll find your next favorite song.
              </p>
            </div>
            <div className="bg-neutral-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">Personalized Recommendations</h3>
              <p className="text-gray-300">
                Music that fits your mood, matches your taste, and feels just right.
              </p>
            </div>
            <div className="bg-neutral-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">Seamless Spotify Integration</h3>
              <p className="text-gray-300">
                Play your recommended tracks instantly on any Spotify-enabled device.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
