type PeerId = string;
type VideoPreset = 'low' | 'medium' | 'high';

const TURN_URL = import.meta.env.VITE_TURN_URL as string | undefined;
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME as string | undefined;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;
const RAW_EXTRA_ICE = import.meta.env.VITE_ICE_SERVERS as string | undefined;
const DEFAULT_VIDEO_BITRATE = Number(import.meta.env.VITE_RTC_MAX_VIDEO_BITRATE ?? 1500) * 1000; // bps
const ICE_RESTART_DELAY = Number(import.meta.env.VITE_RTC_ICE_RESTART_DELAY ?? 2500);

function parseExtraIce(): RTCIceServer[] {
  if (!RAW_EXTRA_ICE) return [];
  try {
    const parsed = JSON.parse(RAW_EXTRA_ICE);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[RTC] Could not parse VITE_ICE_SERVERS:', err);
    return [];
  }
}

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
    ...parseExtraIce()
  ];

  if (TURN_URL && TURN_USERNAME && TURN_CREDENTIAL) {
    servers.push({ urls: [TURN_URL], username: TURN_USERNAME, credential: TURN_CREDENTIAL });
  }

  return servers;
}

export type RtcEvents = {
  onParticipantJoined?: (id: PeerId) => void;
  onParticipantLeft?: (id: PeerId) => void;
  onStream?: (id: PeerId, stream: MediaStream) => void;
};

class WebRTCManager {
  private meetingId: string;
  private socket: any;
  private localStream: MediaStream | null = null;
  private peers: Map<PeerId, RTCPeerConnection> = new Map();
  private events: RtcEvents;
  private makingOffer: Map<PeerId, boolean> = new Map();
  private ignoreOffer: Map<PeerId, boolean> = new Map();
  private isSettingRemoteAnswerPending: Map<PeerId, boolean> = new Map();
  private restartTimers: Map<PeerId, number> = new Map();
  private iceServers: RTCIceServer[] = buildIceServers();
  private preferredPreset: VideoPreset = 'high';
  private preferredVideoBitrate = DEFAULT_VIDEO_BITRATE;
  private iceRestartDelay = ICE_RESTART_DELAY;

  constructor(socket: any, meetingId: string, events: RtcEvents = {}) {
    this.socket = socket;
    this.meetingId = meetingId;
    this.events = events;

    this.handleSocket();
  }

  async initLocalMedia() {
    if (this.localStream) {
      console.log('[RTC] Local stream already exists, reusing');
      return this.localStream;
    }
    
    // Check for video input devices
    let hasVideoInput = false;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      hasVideoInput = devices.some(device => device.kind === 'videoinput');
      console.log('[RTC] Device enumeration:', {
        totalDevices: devices.length,
        hasVideoInput,
        videoDevices: devices.filter(d => d.kind === 'videoinput').map(d => d.label)
      });
    } catch (err) {
      console.warn('[RTC] Could not enumerate devices:', err);
    }

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
    const videoConstraints: MediaTrackConstraints | boolean = hasVideoInput
      ? {
          width: { ideal: this.preferredPreset === 'high' ? 1280 : 960, max: 1920 },
          height: { ideal: this.preferredPreset === 'high' ? 720 : 540, max: 1080 },
          frameRate: { ideal: this.preferredPreset === 'low' ? 15 : 30, max: 30 }
        }
      : false;

    // Request audio + video (if available)
    try {
      console.log('[RTC] Requesting getUserMedia with:', { audio: audioConstraints, video: videoConstraints });
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints, 
        video: videoConstraints 
      });
      console.log('[RTC] Got local stream:', {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length,
        videoEnabled: this.localStream.getVideoTracks()[0]?.enabled
      });
    } catch (err) {
      console.warn('[RTC] Could not get video, falling back to audio only:', err);
      // Fallback to audio only if video fails
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints, 
        video: false 
      });
      console.log('[RTC] Fallback stream (audio only):', {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });
    }
    
    return this.localStream;
  }

  async join() {
    this.socket.emit('rtc:join', { room: this.meetingId });
  }

  async leave() {
    for (const [, pc] of this.peers) {
      pc.close();
    }
    this.peers.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this.socket.emit('rtc:leave', { room: this.meetingId });
  }

  async toggleMic(enabled: boolean) {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach(t => (t.enabled = enabled));
  }

  async toggleCamera(enabled: boolean) {
    if (!this.localStream) return;
    
    const videoTracks = this.localStream.getVideoTracks();
    
    // Si no hay video tracks disponibles y queremos habilitar, necesitamos obtener la cámara
    if (enabled && videoTracks.length === 0) {
      console.log('[RTC] No video track exists, requesting camera access');
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ 
          audio: false, 
          video: true 
        });
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
          this.localStream.addTrack(videoTrack);
          console.log('[RTC] Added new video track to local stream');
          
          // Agregar el track a todos los peers existentes
          for (const [remoteId, pc] of this.peers) {
            const senders = pc.getSenders();
            const videoSender = senders.find(s => s.track === null || s.track?.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(videoTrack);
              console.log('[RTC] Replaced video track for peer', remoteId);
            } else {
              pc.addTrack(videoTrack, this.localStream);
              console.log('[RTC] Added new video track for peer', remoteId);
            }
            this.applyPreferredBitrate(pc);
          }
        }
      } catch (err) {
        console.error('[RTC] Failed to get camera:', err);
        return;
      }
    } else if (videoTracks.length > 0) {
      // Solo habilitar/deshabilitar el track existente
      videoTracks.forEach(t => {
        t.enabled = enabled;
        console.log('[RTC] Video track', enabled ? 'enabled' : 'disabled');
      });
      
      // Si se está activando, asegurar que los peers lo reciban
      if (enabled) {
        console.log('[RTC] Video enabled, ensuring all peers receive it');
        for (const [remoteId, pc] of this.peers) {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender && videoSender.track) {
            console.log('[RTC] Re-confirming video sender for peer', remoteId);
            await videoSender.replaceTrack(videoTracks[0]);
            this.applyPreferredBitrate(pc);
          }
        }
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  setVideoQuality(preset: VideoPreset) {
    this.preferredPreset = preset;
    const bitrateMap: Record<VideoPreset, number> = {
      low: 450_000,
      medium: 900_000,
      high: DEFAULT_VIDEO_BITRATE,
    };
    this.preferredVideoBitrate = bitrateMap[preset] ?? DEFAULT_VIDEO_BITRATE;
    console.log('[RTC] Applying video quality preset:', preset, 'max bitrate:', this.preferredVideoBitrate);
    for (const [, pc] of this.peers) {
      this.applyPreferredBitrate(pc);
    }
  }

  private applyPreferredBitrate(pc: RTCPeerConnection) {
    const senders = pc.getSenders().filter(sender => sender.track?.kind === 'video');
    for (const sender of senders) {
      try {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}];
        }
        const encoding = params.encodings[0];
        encoding.maxBitrate = this.preferredVideoBitrate;
        encoding.maxFramerate = this.preferredPreset === 'low' ? 15 : 30;
        sender.setParameters(params).catch(err => {
          console.warn('[RTC] Could not update sender parameters:', err);
        });
      } catch (err) {
        console.warn('[RTC] Failed to apply bitrate settings:', err);
      }
    }
  }

  private scheduleIceRestart(remoteId: PeerId) {
    if (this.restartTimers.has(remoteId)) return;
    const timer = window.setTimeout(() => {
      this.restartTimers.delete(remoteId);
      void this.restartIce(remoteId);
    }, this.iceRestartDelay);
    this.restartTimers.set(remoteId, timer);
  }

  private clearIceRestart(remoteId: PeerId) {
    const timer = this.restartTimers.get(remoteId);
    if (timer) {
      clearTimeout(timer);
      this.restartTimers.delete(remoteId);
    }
  }

  private async restartIce(remoteId: PeerId) {
    const pc = this.peers.get(remoteId);
    if (!pc) return;
    try {
      console.log('[RTC] Restarting ICE with peer', remoteId);
      this.makingOffer.set(remoteId, true);
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      this.socket.emit('rtc:offer', { room: this.meetingId, to: remoteId, offer });
    } catch (err) {
      console.error('[RTC] ICE restart failed for', remoteId, err);
    } finally {
      this.makingOffer.set(remoteId, false);
    }
  }

  private createPeer(remoteId: PeerId) {
    if (this.peers.has(remoteId)) return this.peers.get(remoteId)!;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // ensure transceivers exist for predictable negotiation
    pc.addTransceiver('audio', { direction: 'sendrecv' });
    pc.addTransceiver('video', { direction: 'sendrecv' });

    // add local tracks (audio + video if available)
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      console.log('[RTC] Adding local tracks to peer', remoteId, ':', {
        totalTracks: tracks.length,
        audio: tracks.filter(t => t.kind === 'audio').length,
        video: tracks.filter(t => t.kind === 'video').length,
        videoEnabled: tracks.find(t => t.kind === 'video')?.enabled
      });
      tracks.forEach(track => {
        const sender = pc.addTrack(track, this.localStream!);
        console.log('[RTC] Added track:', track.kind, 'id:', track.id, 'enabled:', track.enabled, 'sender:', !!sender);
      });
      this.applyPreferredBitrate(pc);
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        console.debug('[RTC] ICE candidate ->', remoteId);
        this.socket.emit('rtc:ice', { room: this.meetingId, to: remoteId, candidate: ev.candidate });
      }
    };

    pc.ontrack = (ev) => {
      console.log('[RTC] ontrack event for peer:', remoteId, {
        track: ev.track.kind,
        trackId: ev.track.id,
        trackEnabled: ev.track.enabled,
        streams: ev.streams.length
      });
      const stream = ev.streams[0];
      if (stream) {
        console.log('[RTC] Stream received from peer:', remoteId, {
          streamId: stream.id,
          tracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          videoEnabled: stream.getVideoTracks()[0]?.enabled,
          audioEnabled: stream.getAudioTracks()[0]?.enabled
        });
        if (this.events.onStream) {
          this.events.onStream(remoteId, stream);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log('[RTC] ICE connection state ->', remoteId, state);
      if (state === 'failed' || state === 'disconnected') {
        this.scheduleIceRestart(remoteId);
      }
      if (state === 'connected' || state === 'completed') {
        this.clearIceRestart(remoteId);
      }
    };

    // negotiationneeded -> send offer politely
    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer.set(remoteId, true);
        console.log('[RTC] Negotiation needed for peer:', remoteId, 'state:', pc.signalingState);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('[RTC] Sending offer ->', remoteId, 'with tracks:', {
          audio: this.localStream?.getAudioTracks().length || 0,
          video: this.localStream?.getVideoTracks().length || 0
        });
        this.socket.emit('rtc:offer', { room: this.meetingId, to: remoteId, offer });
      } catch (err) {
        console.error('[RTC] Error creating offer for', remoteId, ':', err);
      } finally { this.makingOffer.set(remoteId, false); }
    };

    pc.onconnectionstatechange = () => {
      console.log('[RTC] Connection state ->', remoteId, pc.connectionState);
      if (pc.connectionState === 'failed') {
        this.scheduleIceRestart(remoteId);
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peers.delete(remoteId);
        this.clearIceRestart(remoteId);
      }
    };

    this.peers.set(remoteId, pc);
    return pc;
  }

  private handleSocket() {
    this.socket.on('rtc:joined', async ({ from }: { from: PeerId }) => {
      console.log('[RTC] rtc:joined event, peer ID:', from);
      if (!this.localStream) await this.initLocalMedia();
      const pc = this.createPeer(from);
      // letting onnegotiationneeded drive offers avoids wrong-state errors
      console.debug('[RTC] Peer joined ->', from, 'signaling:', pc.signalingState);
      this.events.onParticipantJoined?.(from);
    });

    this.socket.on('rtc:offer', async ({ from, offer }: { from: PeerId, offer: RTCSessionDescriptionInit }) => {
      if (!this.localStream) await this.initLocalMedia();
      const pc = this.createPeer(from);
      const polite = true;
      const readyForOffer = pc.signalingState === 'stable' || (pc.signalingState === 'have-local-offer' && this.isSettingRemoteAnswerPending.get(from));
      const offerCollision = this.makingOffer.get(from) || !readyForOffer;
      this.ignoreOffer.set(from, !polite && offerCollision);
      if (this.ignoreOffer.get(from)) return;

      try {
        console.debug('[RTC] Received offer <-', from, 'state:', pc.signalingState, 'collision:', offerCollision);
        if (offerCollision) {
          await Promise.all([
            pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit),
            pc.setRemoteDescription(new RTCSessionDescription(offer))
          ]);
        } else {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
        }
        const answer = await pc.createAnswer();
        this.isSettingRemoteAnswerPending.set(from, true);
        await pc.setLocalDescription(answer);
        this.isSettingRemoteAnswerPending.set(from, false);
        console.debug('[RTC] Sending answer ->', from);
        this.socket.emit('rtc:answer', { room: this.meetingId, to: from, answer });
        this.events.onParticipantJoined?.(from);
      } catch (err) {
        console.error('[RTC] Error handling offer from', from, ':', err);
      }
    });

    this.socket.on('rtc:answer', async ({ from, answer }: { from: PeerId, answer: RTCSessionDescriptionInit }) => {
      const pc = this.peers.get(from);
      if (!pc) return;
      try {
        console.debug('[RTC] Received answer <-', from);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('[RTC] Error handling answer from', from, ':', err);
      }
    });

    this.socket.on('rtc:ice', async ({ from, candidate }: { from: PeerId, candidate: RTCIceCandidateInit }) => {
      const pc = this.peers.get(from);
      if (!pc) return;
      try {
        console.debug('[RTC] Received ICE <-', from);
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[RTC] Error adding ICE candidate from', from, ':', err);
      }
    });

    this.socket.on('rtc:left', ({ from }: { from: PeerId }) => {
      console.log('[RTC] rtc:left event, peer ID:', from);
      const pc = this.peers.get(from);
      if (pc) pc.close();
      this.peers.delete(from);
      this.events.onParticipantLeft?.(from);
    });
  }
}

export default WebRTCManager;
