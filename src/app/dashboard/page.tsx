"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useSpotify } from "@/providers/SpotifyProvider";
import ConversationalPopup from "@/app/dashboard/components/ConversationalPopup";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState<
    { id: string; name: string; artist: string; albumArt: string }[]
  >([]);
  const [queuedTracks, setQueuedTracks] = useState<Set<string>>(new Set());
  const [explanation, setExplanation] = useState<string>("");
  const [isRecommendationsCollapsed, setIsRecommendationsCollapsed] = useState(false);

  useEffect(() => {
    if (authLoaded && !authenticated) {
      router.push("/");
    }
  }, [authLoaded, authenticated, router]);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (showPopup && messages.length === 0) {
      const initialMessage = {
        id: uuidv4(),
        text: "Hi there! How are you feeling today? Tell me about your day or what you're up to.",
        sender: "assistant" as const,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [showPopup, messages.length]);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleOpenPopup = () => {
    setShowPopup(true);
  };

  const handleLogout = () => {
    logout();
  };

  const handleStartNewChat = () => {
    setMessages([{
      id: uuidv4(),
      text: "Hi there! How are you feeling today? Tell me about your day or what you're up to.",
      sender: "assistant" as const,
      timestamp: new Date(),
    }]);
    setIsTyping(false);
    setLoading(false);
    setRecommendedTracks([]);
    setQueuedTracks(new Set());
    setExplanation("");
    setIsRecommendationsCollapsed(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative before:content-[''] before:fixed before:inset-0 before:bg-[url('/noise-texture.png')] before:opacity-[0.03] before:pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black opacity-80"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#1DB954]/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-black">
                    <path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>
                </svg>
             </div>
             <h1 className="text-3xl font-bold tracking-tight">Sound<span className="text-[#1DB954]">Shift</span></h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOpenPopup}
              className="px-5 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-xl transition-all duration-300 font-medium shadow-md shadow-[#1DB954]/20 hover:shadow-[#1ed760]/30 hover:scale-[1.02] flex items-center"
            >

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Get Recommendations
            </button>
            {authenticated && (
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-neutral-800/80 hover:bg-red-900/80 hover:text-red-100 border border-neutral-700/60 rounded-xl transition-all duration-300 font-medium flex items-center"
              >

                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout
              </button>
            )}
          </div>
        </div>


        <div className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-sm border border-neutral-700/60 rounded-2xl p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1DB954]/80 via-[#1DB954]/40 to-transparent"></div>
          <h2 className="text-2xl font-bold mb-6 flex items-center">

            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            Now Playing
          </h2>
          {nowPlaying && nowPlaying.item ? (
            <div className="flex flex-col md:flex-row items-center gap-8">

              {nowPlaying.item.album.images[0]?.url && (
                <div className="relative w-60 h-60 md:w-64 md:h-64 flex-shrink-0 group">
                  <div className="absolute inset-0 bg-[#1DB954]/20 blur-xl rounded-full opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <Image
                    src={nowPlaying.item.album.images[0].url}
                    alt={`${nowPlaying.item.name} album art`}
                    fill
                    className="rounded-xl object-cover shadow-lg transform group-hover:scale-[1.02] transition-all duration-500"
                  />
                </div>
              )}

              <div className="flex-grow text-center md:text-left space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{nowPlaying.item.name}</h3>
                  <p className="text-lg text-gray-300 mt-1">
                    {nowPlaying.item.artists.map((a) => a.name).join(", ")}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {nowPlaying.item.album.name}
                  </p>
                </div>

                <div className="flex justify-center md:justify-start mt-6 space-x-4">
                  <button
                    onClick={handlePrevious} 
                    className="p-3 bg-neutral-700/70 hover:bg-neutral-600/70 rounded-full transition-all duration-300 flex items-center justify-center shadow-md hover:shadow group"
                    aria-label="Previous track"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                  </button>
                  <button
                    onClick={handlePlayPause}
                    className="p-4 bg-neutral-700/70 hover:bg-[#1DB954]/80 hover:text-black rounded-full transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-[#1DB954]/20 group"
                    aria-label={nowPlaying.isPlaying ? "Pause" : "Play"}
                  >
                    {nowPlaying.isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-3 bg-neutral-700/70 hover:bg-neutral-600/70 rounded-full transition-all duration-300 flex items-center justify-center shadow-md hover:shadow group"
                    aria-label="Next track"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-center md:justify-between items-center gap-4 sm:gap-6 pt-4"> {/* Adjusted gap and padding */}
                  <button
                    onClick={toggleLike}
                    className={`p-3 rounded-full transition-all duration-300 shadow-md flex items-center ${
                      isLiked
                        ? "bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954]"
                        : "bg-neutral-700/70 hover:bg-neutral-600/70 text-white"
                    }`}
                     aria-label={isLiked ? "Unlike track" : "Like track"}
                  >
                    {isLiked ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1DB954" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    )}
                  </button>

                  <div className="flex items-center gap-3 bg-neutral-800/60 px-4 py-2 rounded-full w-full sm:w-auto"> {/* Adjusted width */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localVolume} 
                      onChange={(e) => setLocalVolume(Number(e.target.value))}
                      onMouseUp={() => handleVolumeChange(localVolume)} 
                      onTouchEnd={() => handleVolumeChange(localVolume)}
                      className="w-full sm:w-28 md:w-32 h-1.5 appearance-none bg-neutral-700 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1DB954] [&::-webkit-slider-thumb]:shadow" // Enhanced styling
                      aria-label="Volume control"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (

            <div className="py-16 text-center space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500 mx-auto mb-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <p className="text-xl text-gray-400">No song currently playing</p>
              <p className="text-gray-500">Play a song from Spotify to see it here</p>
            </div>
          )}
        </div>


        {queue && queue.length > 0 && (
          <div className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-sm border border-neutral-700/60 rounded-2xl p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/80 via-purple-500/40 to-transparent"></div>
            <h3 className="text-2xl font-bold mb-5 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-purple-400"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              Up Next
            </h3>
            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800/30 pr-2">
              <ul className="space-y-2">
                {queue.map((track, index) => (
                  <li
                    key={track.item?.uri || track.item?.id || index}
                    className="flex items-center space-x-4 p-3 hover:bg-neutral-700/30 rounded-xl transition-all duration-200 border border-transparent hover:border-neutral-700/50 group"
                  >
                    <div className="flex-shrink-0 w-6 text-center text-sm font-medium text-gray-400 group-hover:text-white">
                      {index === 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--spotify-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      ) : ( index + 1 )}
                    </div>
                    {track.item?.album.images[0]?.url && (
                      <div className="w-12 h-12 relative flex-shrink-0 overflow-hidden rounded-md shadow-md group-hover:shadow-lg transition-all duration-300">
                        <Image src={track.item.album.images[0].url} fill className="object-cover group-hover:scale-110 transition-transform duration-500" alt={track.item.name}/>
                      </div>
                    )}
                    <div className="overflow-hidden flex-grow">
                      <p className="font-medium text-white truncate">{track.item?.name}</p>
                      <p className="text-sm text-gray-400 truncate">{track.item?.artists.map((a) => a.name).join(", ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}


        <div className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-sm border border-neutral-700/60 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/80 via-blue-500/40 to-transparent"></div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full opacity-50 pointer-events-none"></div>
           <div className="flex justify-between items-center mb-5">
             <h2 className="text-2xl font-bold flex items-center">

               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-blue-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
               Your Music Assistant
             </h2>
           </div>
           <p className="text-gray-300 mb-6">
             Tell me how you're feeling or what you're up to, and I'll recommend music that matches your mood.
           </p>
           <button
             onClick={handleOpenPopup}
             className="w-full py-4 bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-black rounded-xl transition-all duration-300 text-lg font-semibold shadow-lg shadow-[#1DB954]/20 hover:shadow-[#1ed760]/40 hover:scale-[1.01] flex items-center justify-center group"
           >

             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
             Start a Conversation
           </button>
         </div>
      </div>

      {showPopup && (
        <ConversationalPopup 
          onClose={handleClosePopup}
          onStartNewChat={handleStartNewChat}
          messages={messages}
          setMessages={setMessages}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          loading={loading}
          setLoading={setLoading}
          recommendedTracks={recommendedTracks}
          setRecommendedTracks={setRecommendedTracks}
          queuedTracks={queuedTracks}
          setQueuedTracks={setQueuedTracks}
          explanation={explanation}
          setExplanation={setExplanation}
          isRecommendationsCollapsed={isRecommendationsCollapsed}
          setIsRecommendationsCollapsed={setIsRecommendationsCollapsed}
        />
      )}
    </div>
  );
}