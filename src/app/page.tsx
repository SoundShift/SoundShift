"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { authenticated, authLoaded } = useAuth();
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
      "streaming user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private user-library-read user-library-modify user-top-read user-read-recently-played user-read-private user-read-email"
    );
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl;
  };

  return (
    <div className="flex flex-col md:flex-row relative bg-black text-white min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-neutral-950 opacity-80"></div>

      <div className="relative flex flex-col justify-center items-start gap-10 p-6 sm:p-8 lg:p-16 xl:p-20 w-full md:w-3/5 lg:w-3/5 md:min-h-screen">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#1DB954]/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-black"
            >
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sound<span className="text-[#1DB954]">Shift</span>
          </h1>
        </div>

        <div className="text-left mb-6 md:mb-10 max-w-2xl w-full">
          <div className="inline-block mb-1 px-3 py-1 bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-full text-[#1DB954] text-sm font-medium">
            AI-Powered Music Discovery
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6 leading-[1.1] tracking-tight text-white">
            Music that <span className="text-[#1DB954]">understands</span> you
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-xl">
            Chat with SoundShift about your day, mood, or activities, and
            discover music that hits just right - like getting recommendations
            from a friend who really gets you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
          {[
            {
              title: "Natural Conversation",
              description:
                "Tell us how you're feeling in natural language, just like texting a friend.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1DB954"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              ),
            },
            {
              title: "Personalized Recommendations",
              description:
                "Get music suggestions perfectly matched to your current vibe and preferences.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1DB954"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                </svg>
              ),
            },
            {
              title: "Seamless Spotify Integration",
              description:
                "Play your recommended tracks instantly through your Spotify account.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1DB954"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
              ),
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-[#1DB954]/10 hover:border-[#1DB954]/20 hover:-translate-y-1 group flex flex-col h-full relative z-10 overflow-visible"
            >
              <div className="bg-black/30 rounded-xl p-3 w-fit mb-4 transition-transform duration-300 group-hover:scale-105 transform-gpu group-hover:bg-[#1DB954]/20 relative z-20">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white relative z-20">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed relative z-20">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex justify-center items-center w-full md:w-2/5 lg:w-2/5 p-6 sm:p-8 lg:p-12 min-h-[50vh] md:min-h-screen bg-neutral-900/50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square bg-gradient-to-br from-[#1DB954]/10 via-purple-700/10 to-black rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/4 right-1/3 w-24 h-24 bg-[#1DB954]/20 blur-3xl rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-purple-700/20 blur-3xl rounded-full animate-pulse-slow delay-700"></div>

        <div className="relative w-full max-w-md z-10">
          <div className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-8 rounded-3xl border border-neutral-700/60 w-full relative shadow-2xl">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#1DB954]/30 to-purple-700/30 rounded-3xl blur-md opacity-20"></div>
            <div className="relative">
              <h3 className="text-2xl font-bold mb-4 text-center text-white">
                Get started with SoundShift
              </h3>
              <p className="text-gray-300 mb-8 text-center text-base">
                Connect your Spotify account to start getting personalized music
                recommendations.
              </p>
              <button
                onClick={handleLogin}
                className="w-full py-4 px-6 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-xl transition-all duration-300 text-base font-semibold flex items-center justify-center group shadow-lg shadow-[#1DB954]/30 hover:shadow-[#1ed760]/40 transform hover:scale-[1.02]"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Login with Spotify
              </button>

              <div className="mt-8 text-center">
                <div className="flex justify-center space-x-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
