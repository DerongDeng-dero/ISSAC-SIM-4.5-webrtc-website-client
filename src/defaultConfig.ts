export type ClientConfig = {
  server: string;
  signalingPort: number;
  mediaPort: number | null;
  width: number;
  height: number;
  fps: number;
};

function detectDefaultServer() {
  if (typeof window === "undefined") {
    return "127.0.0.1";
  }

  const host = window.location.hostname.trim();
  if (host === "" || host === "0.0.0.0") {
    return "127.0.0.1";
  }

  return host;
}

export const defaultConfig: ClientConfig = {
  server: detectDefaultServer(),
  signalingPort: 49100,
  mediaPort: 47998,
  width: 1920,
  height: 1080,
  fps: 60,
};
