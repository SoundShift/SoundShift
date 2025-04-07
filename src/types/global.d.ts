export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (arg: any) => void): boolean | void;
  removeListener(event: string): boolean | void;
  getCurrentState(): Promise<SpotifyPlayerState | null>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

interface SpotifyPlayerState {
  paused: boolean;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
      album: {
        name: string;
        images: { url: string }[];
      };
      artists: { name: string }[];
    };
  };
}
