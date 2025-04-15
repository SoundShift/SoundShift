export default function SpotifyLogin() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT;
    const redirectUri = encodeURIComponent("http://localhost:3000/callback");
    const scope = encodeURIComponent("playlist-read-private user-library-read");

    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    window.location.href = authUrl;
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
