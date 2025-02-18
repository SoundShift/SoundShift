import { spotifyClient } from '@/lib/spotify';

export default function SpotifyLogin() {
  const handleLogin = () => {
    spotifyClient.login();
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
    >
      Login with Spotify
    </button>
  );
} 