type DiagnosticListener = (message: string) => void;

type StatsCandidatePair = RTCStats & {
  localCandidateId?: string;
  remoteCandidateId?: string;
  selected?: boolean;
  state?: string;
  nominated?: boolean;
  bytesReceived?: number;
  bytesSent?: number;
  currentRoundTripTime?: number;
};

type StatsCandidate = RTCStats & {
  candidateType?: string;
  protocol?: string;
  address?: string;
  ip?: string;
  port?: number;
  networkType?: string;
};

declare global {
  interface Window {
    __isaacWebrtcDiagnosticsInstalled__?: boolean;
    __isaacWebrtcDiagnosticListeners__?: Set<DiagnosticListener>;
  }
}

function emit(message: string) {
  const listeners = window.__isaacWebrtcDiagnosticListeners__;
  if (!listeners) {
    return;
  }
  for (const listener of listeners) {
    listener(message);
  }
}

function candidateSummary(candidate: RTCIceCandidate | RTCIceCandidateInit | null | undefined) {
  if (!candidate || !candidate.candidate) {
    return "end-of-candidates";
  }

  const text = candidate.candidate;
  const parts = text.split(" ");
  const typeIndex = parts.findIndex((part) => part === "typ");
  const protocol = parts[2] ?? "unknown";
  const address = parts[4] ?? "unknown";
  const port = parts[5] ?? "unknown";
  const type = typeIndex >= 0 ? parts[typeIndex + 1] : "unknown";
  return `${type}/${protocol} ${address}:${port}`;
}

async function logSelectedCandidatePair(pc: RTCPeerConnection, reason: string) {
  try {
    const stats = await pc.getStats();
    let selectedPair: StatsCandidatePair | null = null;
    const candidates = new Map<string, StatsCandidate>();

    stats.forEach((entry) => {
      if (entry.type === "local-candidate" || entry.type === "remote-candidate") {
        candidates.set(entry.id, entry as StatsCandidate);
      }
      if (entry.type === "candidate-pair") {
        const pair = entry as StatsCandidatePair;
        if (pair.selected || pair.nominated || pair.state === "succeeded") {
          selectedPair = pair;
        }
      }
      if (entry.type === "transport") {
        const transport = entry as RTCTransportStats;
        if (transport.selectedCandidatePairId) {
          const pair = stats.get(transport.selectedCandidatePairId) as StatsCandidatePair | undefined;
          if (pair) {
            selectedPair = pair;
          }
        }
      }
    });

    if (!selectedPair) {
      emit(`pc:stats ${reason} no-selected-candidate-pair`);
      return;
    }

    const selected = selectedPair as StatsCandidatePair;
    const local = selected.localCandidateId ? candidates.get(selected.localCandidateId) : undefined;
    const remote = selected.remoteCandidateId ? candidates.get(selected.remoteCandidateId) : undefined;

    const localText = local
      ? `${local.candidateType ?? "unknown"}/${local.protocol ?? "unknown"} ${local.address ?? local.ip ?? "unknown"}:${local.port ?? "?"}`
      : "unknown";
    const remoteText = remote
      ? `${remote.candidateType ?? "unknown"}/${remote.protocol ?? "unknown"} ${remote.address ?? remote.ip ?? "unknown"}:${remote.port ?? "?"}`
      : "unknown";

    emit(
      `pc:stats ${reason} pair=${selected.state ?? "unknown"} nominated=${String(selected.nominated ?? false)} rtt=${selected.currentRoundTripTime ?? "?"} bytes=${selected.bytesReceived ?? "?"}/${selected.bytesSent ?? "?"} local=${localText} remote=${remoteText}`,
    );
  } catch (error) {
    emit(`pc:stats ${reason} error=${String(error)}`);
  }
}

export function installWebRtcDiagnostics() {
  if (typeof window === "undefined" || window.__isaacWebrtcDiagnosticsInstalled__) {
    return;
  }

  const NativeRTCPeerConnection = window.RTCPeerConnection;
  if (!NativeRTCPeerConnection) {
    return;
  }

  window.__isaacWebrtcDiagnosticsInstalled__ = true;
  window.__isaacWebrtcDiagnosticListeners__ = new Set<DiagnosticListener>();

  class InstrumentedRTCPeerConnection extends NativeRTCPeerConnection {
    constructor(configuration?: RTCConfiguration) {
      super(configuration);

      emit(
        `pc:create bundle=${configuration?.bundlePolicy ?? "default"} iceTransport=${configuration?.iceTransportPolicy ?? "all"} servers=${configuration?.iceServers?.length ?? 0}`,
      );

      this.addEventListener("signalingstatechange", () => {
        emit(`pc:signaling ${this.signalingState}`);
      });

      this.addEventListener("icegatheringstatechange", () => {
        emit(`pc:iceGathering ${this.iceGatheringState}`);
      });

      this.addEventListener("iceconnectionstatechange", () => {
        emit(`pc:iceConnection ${this.iceConnectionState}`);
        if (this.iceConnectionState === "connected" || this.iceConnectionState === "completed") {
          void logSelectedCandidatePair(this, this.iceConnectionState);
        }
        if (this.iceConnectionState === "failed" || this.iceConnectionState === "disconnected") {
          void logSelectedCandidatePair(this, this.iceConnectionState);
        }
      });

      this.addEventListener("connectionstatechange", () => {
        emit(`pc:connection ${this.connectionState}`);
      });

      this.addEventListener("icecandidate", (event) => {
        emit(`pc:localCandidate ${candidateSummary(event.candidate)}`);
      });

      this.addEventListener("icecandidateerror", (event) => {
        emit(
          `pc:iceCandidateError address=${event.address ?? "?"} port=${event.port ?? "?"} url=${event.url ?? "?"} code=${event.errorCode ?? "?"} text=${event.errorText ?? "?"}`,
        );
      });

      this.addEventListener("track", (event) => {
        emit(`pc:track kind=${event.track.kind} streams=${event.streams.length}`);
      });

      this.addEventListener("datachannel", (event) => {
        emit(`pc:dataChannel label=${event.channel.label} state=${event.channel.readyState}`);
        event.channel.addEventListener("open", () => emit(`pc:dataChannelOpen label=${event.channel.label}`));
        event.channel.addEventListener("close", () => emit(`pc:dataChannelClose label=${event.channel.label}`));
        event.channel.addEventListener("error", () => emit(`pc:dataChannelError label=${event.channel.label}`));
      });
    }

    async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
      emit(`pc:setRemoteDescription type=${description.type}`);
      return super.setRemoteDescription(description);
    }

    async setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void> {
      emit(`pc:setLocalDescription type=${description?.type ?? "auto"}`);
      return super.setLocalDescription(description);
    }

    async addIceCandidate(candidate?: RTCIceCandidateInit | null): Promise<void> {
      emit(`pc:addRemoteCandidate ${candidateSummary(candidate)}`);
      return super.addIceCandidate(candidate);
    }

    createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
      emit(`pc:createDataChannel label=${label} ordered=${String(options?.ordered ?? true)}`);
      return super.createDataChannel(label, options);
    }
  }

  window.RTCPeerConnection = InstrumentedRTCPeerConnection;
}

export function subscribeWebRtcDiagnostics(listener: DiagnosticListener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  installWebRtcDiagnostics();
  const listeners = window.__isaacWebrtcDiagnosticListeners__;
  if (!listeners) {
    return () => {};
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
