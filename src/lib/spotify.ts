import { TokenResponse } from '@/types/spotify';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
export class SpotifyClient {
  private static instance: SpotifyClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {}

  static getInstance(): SpotifyClient {
    if (!SpotifyClient.instance) {
      SpotifyClient.instance = new SpotifyClient();
    }
    return SpotifyClient.instance;
  }

  async login() {
    window.location.href = `${BACKEND_URL}/auth/spotify/login`;
  }

  async handleCallback(code: string): Promise<TokenResponse> {
    const response = await fetch(`${BACKEND_URL}/auth/spotify/callback?code=${code}`);
    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }
    
    const tokens = await response.json();
    this.setTokens(tokens);
    return tokens;
  }

  private setTokens(tokens: TokenResponse) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token || null;
    
    localStorage.setItem('spotify_access_token', tokens.access_token); // Store tokens in localStorage
    if (tokens.refresh_token) {
      localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
    }
  }

  async refreshAccessToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${BACKEND_URL}/auth/spotify/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokens = await response.json();
    this.setTokens(tokens);
    return tokens;
  }
  async getProfile() {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  }

  async getNowPlaying(): Promise<any> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getNowPlaying();
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch now playing:', error);
      throw error;
    }
  }

  async searchTrack(query: string) {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search track');
    }

    const data = await response.json();
    return data.tracks.items[0];
  }

  async playTrack(uri: string): Promise<void> {
    try {
      const accessToken = localStorage.getItem('spotify_access_token');
      if (!accessToken) throw new Error('No access token available');

      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          uris: [uri]
        })
      });

      if (response.status === 404) {
        throw new Error('Please open Spotify on any device first');
      }

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.playTrack(uri);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || 'Failed to play track');
      }
    } catch (error) {
      throw error;
    }
  }
}
export const spotifyClient = SpotifyClient.getInstance();