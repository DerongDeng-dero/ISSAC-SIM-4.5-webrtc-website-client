import { useEffect, useRef, useState } from "react";
import {
  AppStreamer,
  DirectConfig,
  StreamEvent,
  StreamProps,
  StreamType,
} from "@nvidia/omniverse-webrtc-streaming-library";

import { ClientConfig, defaultConfig } from "./defaultConfig";
import { subscribeWebRtcDiagnostics } from "./webrtcDiagnostics";

type ConnectionState = "idle" | "connecting" | "streaming" | "error";

const STORAGE_KEY = "isaac-sim-webrtc-shell-config-v2";
const SDK_ERROR_HINTS: Record<string, string> = {
  "0xC0F22206": "StreamerIceConnectionFailed: ICE candidate pair failed. Usually firewall, wrong host IP, or wrong network.",
  "0xC0F22207": "StreamerGetRemotePeerTimedOut: signaling connected but remote peer was not established in time.",
  "0xC0F2220C": "StreamerNoVideoPacketsReceivedEver: media path came up but no video packets were received.",
  "0xC0F2220D": "StreamerNoVideoFramesLossyNetwork: packets arrived too poorly to decode video frames.",
  "0xC0F2220F": "StreamerNoLocalCandidates: the browser failed to gather usable local ICE candidates.",
  "0xC0F22210": "StreamerNoRemoteCandidates: the server did not provide usable remote ICE candidates.",
  "0xC0F22212": "StreamerIceReConnectionFailed: stream dropped and ICE reconnection failed.",
  "0xC0F22219": "StreamerNoOffer: signaling connected, but the client never received a valid offer. Most commonly caused by stale duplicate Isaac Sim streaming processes or split signaling/media ports.",
  "0xC0F22226": "StreamerNoStunResponsesReceived: signaling succeeded, but the browser never received STUN responses on the media path. This usually means peer-to-peer UDP is blocked or dropped between client and Isaac Sim.",
  "0xC0F22227": "StreamerNoNominatedCandidatePairs: ICE gathered candidates, but never found a nominated pair to carry media.",
  "0xC0F22228": "StreamerNoSucceededCandidatePairs: ICE gathered candidates, but none of the candidate pairs ever reached succeeded state.",
};

function loadInitialConfig(): ClientConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultConfig;
    }
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
}

function saveConfig(config: ClientConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function App() {
  const [config, setConfig] = useState<ClientConfig>(() => loadInitialConfig());
  const [draft, setDraft] = useState<ClientConfig>(() => loadInitialConfig());
  const [status, setStatus] = useState<ConnectionState>("idle");
  const [statusText, setStatusText] = useState("Ready");
  const [events, setEvents] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState(
    JSON.stringify(
      {
        event_type: "isaacsim.webrtc.bridge.rpc",
        payload: {
          action: "get_status",
          request_id: "req-1",
        },
      },
      null,
      2,
    ),
  );

  const hasStartedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeWebRtcDiagnostics((message) => {
      appendEvent(message);
    });

    return () => {
      unsubscribe();
      try {
        AppStreamer.stop();
      } catch {
        // Ignore cleanup errors from the external library.
      }
    };
  }, []);

  function appendEvent(message: string) {
    setEvents((current) => {
      const next = [`${new Date().toLocaleTimeString()}  ${message}`, ...current];
      return next.slice(0, 60);
    });
  }

  async function connect() {
    if (status === "connecting" || status === "streaming") {
      return;
    }

    saveConfig(draft);
    setConfig(draft);
    hasStartedRef.current = false;
    setStatus("connecting");
    setStatusText("Connecting to Isaac Sim...");
    appendEvent(`connect ${draft.server}:${draft.signalingPort}`);

    const streamProps: StreamProps = {
      streamSource: StreamType.DIRECT,
      streamConfig: {
        ...createStreamConfig(draft),
      },
    };

    try {
      const result = await AppStreamer.connect(streamProps);
      appendEvent(`connect result ${formatEvent(result)}`);
    } catch (error) {
      setStatus("error");
      setStatusText("Connection failed");
      appendEvent(`connect error ${formatUnknown(error)}`);
    }
  }

  function createStreamConfig(input: ClientConfig): DirectConfig {
    return {
      videoElementId: "remote-video",
      audioElementId: "remote-audio",
      authenticate: true,
      maxReconnects: 20,
      signalingServer: input.server,
      signalingPort: input.signalingPort,
      mediaServer: input.server,
      ...(input.mediaPort != null ? { mediaPort: input.mediaPort } : {}),
      nativeTouchEvents: true,
      width: input.width,
      height: input.height,
      fps: input.fps,
      onStart,
      onUpdate,
      onStop,
      onTerminate,
      onCustomEvent,
    };
  }

  function disconnect() {
    try {
      AppStreamer.stop();
    } catch {
      // Ignore stop errors from the external library.
    }
    setStatus("idle");
    setStatusText("Disconnected");
    appendEvent("disconnect");
  }

  function sendCustomMessage() {
    try {
      AppStreamer.sendMessage(customMessage);
      appendEvent(`send ${customMessage.replace(/\s+/g, " ").slice(0, 120)}`);
    } catch (error) {
      appendEvent(`send error ${formatUnknown(error)}`);
    }
  }

  function onStart(message: StreamEvent) {
    appendEvent(`start ${formatEvent(message)}`);
    if (message.action === "start" && message.status === "success" && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setStatus("streaming");
      setStatusText("Streaming");
    }
    if (message.status === "error") {
      setStatus("error");
      setStatusText("Stream error");
    }
  }

  function onUpdate(message: StreamEvent) {
    appendEvent(`update ${formatEvent(message)}`);
  }

  function onStop(message: StreamEvent) {
    appendEvent(`stop ${formatEvent(message)}`);
    setStatus("idle");
    setStatusText("Stopped");
  }

  function onTerminate(message: StreamEvent) {
    appendEvent(`terminate ${formatEvent(message)}`);
    setStatus("idle");
    setStatusText("Terminated");
  }

  function onCustomEvent(message: unknown) {
    appendEvent(`custom ${formatUnknown(message)}`);
  }

  function updateDraft<K extends keyof ClientConfig>(key: K, value: ClientConfig[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="shell">
      <aside className="control-panel">
        <div className="panel-header">
          <p className="eyebrow">Isaac Sim 4.5 Native WebRTC</p>
          <h1>LAN Viewer Shell</h1>
          <p className="subtle">
            Keeps the NVIDIA streaming backend and embeds it into a local browser client.
          </p>
        </div>

        <div className="field-grid">
          <label>
            <span>Server IP</span>
            <input
              value={draft.server}
              onChange={(event) => updateDraft("server", event.target.value)}
              placeholder="192.168.1.20"
            />
          </label>

          <label>
            <span>Signaling Port</span>
            <input
              type="number"
              value={draft.signalingPort}
              onChange={(event) => updateDraft("signalingPort", Number(event.target.value))}
            />
          </label>

          <label>
            <span>Media Port</span>
            <input
              value={draft.mediaPort ?? ""}
              onChange={(event) =>
                updateDraft(
                  "mediaPort",
                  event.target.value.trim() === "" ? null : Number(event.target.value),
                )
              }
              placeholder="optional"
            />
          </label>

          <label>
            <span>Resolution</span>
            <div className="inline-pair">
              <input
                type="number"
                value={draft.width}
                onChange={(event) => updateDraft("width", Number(event.target.value))}
              />
              <input
                type="number"
                value={draft.height}
                onChange={(event) => updateDraft("height", Number(event.target.value))}
              />
            </div>
          </label>

          <label>
            <span>FPS</span>
            <input
              type="number"
              value={draft.fps}
              onChange={(event) => updateDraft("fps", Number(event.target.value))}
            />
          </label>
        </div>

        <div className="button-row">
          <button className="primary" onClick={connect}>
            Connect
          </button>
          <button className="secondary" onClick={disconnect}>
            Disconnect
          </button>
        </div>

        <div className="status-card">
          <span className={`status-dot status-${status}`} />
          <div>
            <strong>{statusText}</strong>
            <p>
              `{config.server}:{config.signalingPort}`
            </p>
          </div>
        </div>

        <div className="message-card">
          <div className="message-card-header">
            <strong>Custom Message</strong>
            <button className="secondary small" onClick={sendCustomMessage}>
              Send
            </button>
          </div>
          <textarea
            value={customMessage}
            onChange={(event) => setCustomMessage(event.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="event-card">
          <strong>Event Log</strong>
          <div className="event-list">
            {events.length === 0 ? <p>No events yet.</p> : null}
            {events.map((entry, index) => (
              <pre key={`${index}-${entry}`}>{entry}</pre>
            ))}
          </div>
        </div>
      </aside>

      <main className="stream-stage">
        <div className="stream-frame">
          <div className="frame-label">Native Isaac Sim WebRTC Stream</div>
          <video id="remote-video" autoPlay muted playsInline tabIndex={-1} />
          <audio id="remote-audio" muted />
        </div>
      </main>
    </div>
  );
}

function formatEvent(message: StreamEvent) {
  return JSON.stringify(withSdkHint(message));
}

function formatUnknown(value: unknown) {
  try {
    return JSON.stringify(withSdkHint(value));
  } catch {
    return String(value);
  }
}

function withSdkHint<T>(value: T): T | Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return value;
  }

  const info = "info" in value && typeof value.info === "string" ? value.info : "";
  const match = info.match(/0x[0-9A-F]{8}/i);
  if (!match) {
    return value;
  }

  const code = match[0].toUpperCase();
  const hint = SDK_ERROR_HINTS[code];
  if (!hint) {
    return value;
  }

  return {
    ...(value as Record<string, unknown>),
    decoded_error: hint,
  };
}
