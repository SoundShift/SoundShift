"use client";

import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";

export default function Home() {
  const { authenticated, spotifyToken, logout } = useAuth();

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
    <div>
      <button
        onClick={handleLogin}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
      >
        Login with Spotify
      </button>

      <>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ml-4"
        >
          Logout
        </button>
        <button
          onClick={() => console.log(authenticated, spotifyToken)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ml-4"
        >
          Click me
        </button>
        <Link
          href={"/dashboard"}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ml-4"
        >
          dashboard
        </Link>
      </>
    </div>
  );
}
