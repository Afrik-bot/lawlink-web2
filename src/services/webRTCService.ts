import { EventEmitter } from 'events';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
}

interface ConnectionStats {
  bitrate: number;
  packetsLost: number;
  packetLossRate: number;
  roundTripTime: number;
}

export class WebRTCService extends EventEmitter {
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly STATS_INTERVAL = 3000;

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: process.env.REACT_APP_TURN_SERVER || 'turn:your-turn-server.com',
        username: process.env.REACT_APP_TURN_USERNAME || 'username',
        credential: process.env.REACT_APP_TURN_CREDENTIAL || 'credential'
      }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 10
  };

  constructor() {
    super();
  }

  async startLocalStream(videoConstraints: MediaTrackConstraints = {}): Promise<MediaStream> {
    try {
      const defaultConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      };

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { ...defaultConstraints, ...videoConstraints },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  async createPeerConnection(remoteUserId: string): Promise<RTCPeerConnection> {
    try {
      const peerConnection = new RTCPeerConnection(this.configuration);
      
      // Add local stream tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.localStream) {
            peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('iceCandidate', {
            remoteUserId,
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        this.emit('connectionStateChange', {
          remoteUserId,
          state
        });

        if (state === 'failed' || state === 'disconnected') {
          this.handleConnectionFailure(remoteUserId);
        } else if (state === 'connected') {
          this.resetReconnectAttempts(remoteUserId);
          this.startStatsMonitoring(remoteUserId, peerConnection);
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        this.emit('iceConnectionStateChange', {
          remoteUserId,
          state: peerConnection.iceConnectionState
        });
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        this.emit('remoteStream', {
          remoteUserId,
          stream: event.streams[0]
        });
      };

      // Create data channel
      const dataChannel = peerConnection.createDataChannel('messageChannel', {
        ordered: true,
        maxRetransmits: 3
      });
      this.setupDataChannel(dataChannel);

      this.peerConnections.set(remoteUserId, { 
        connection: peerConnection,
        dataChannel 
      });

      this.setupPeerConnection(peerConnection, remoteUserId);

      return peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw new Error('Failed to establish connection. Please try again.');
    }
  }

  private setupPeerConnection(pc: RTCPeerConnection, remoteUserId: string) {
    // Add bandwidth management
    const bandwidthConstraints = {
      video: { max: 2500000 }, // 2.5 Mbps
      audio: { max: 128000 }   // 128 Kbps
    };

    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'video') {
        const params = sender.getParameters();
        if (!params.encodings) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = bandwidthConstraints.video.max;
        sender.setParameters(params).catch(e => console.error('Failed to set video bandwidth:', e));
      }
      if (sender.track?.kind === 'audio') {
        const params = sender.getParameters();
        if (!params.encodings) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = bandwidthConstraints.audio.max;
        sender.setParameters(params).catch(e => console.error('Failed to set audio bandwidth:', e));
      }
    });

    // Monitor connection quality
    const statsInterval = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let videoPacketsLost = 0;
        let videoPacketsSent = 0;
        let currentBitrate = 0;

        stats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.kind === 'video') {
            videoPacketsLost = report.packetsLost;
            videoPacketsSent = report.packetsSent;
            currentBitrate = report.bytesSent * 8 / (report.timestamp - report.startTime);
          }
        });

        const packetLossRate = videoPacketsSent ? (videoPacketsLost / videoPacketsSent) * 100 : 0;
        
        this.emit('connectionStats', {
          userId: remoteUserId,
          stats: {
            bitrate: currentBitrate,
            packetsLost: videoPacketsLost,
            packetLossRate
          }
        });
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    }, 2000);

    // Clean up interval on connection close
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
        clearInterval(statsInterval);
      }
    };
  }

  private startStatsMonitoring(remoteUserId: string, peerConnection: RTCPeerConnection) {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(async () => {
      try {
        const stats = await this.getConnectionStats(peerConnection);
        this.emit('connectionStats', {
          remoteUserId,
          stats
        });

        // Adapt video quality based on network conditions
        this.adaptVideoQuality(stats);
      } catch (error) {
        console.error('Error monitoring connection stats:', error);
      }
    }, this.STATS_INTERVAL);
  }

  private async getConnectionStats(peerConnection: RTCPeerConnection): Promise<ConnectionStats> {
    const stats = await peerConnection.getStats();
    let bitrate = 0;
    let packetsLost = 0;
    let roundTripTime = 0;

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bitrate = report.bytesReceived * 8 / this.STATS_INTERVAL;
        packetsLost = report.packetsLost || 0;
      } else if (report.type === 'remote-inbound-rtp') {
        roundTripTime = report.roundTripTime || 0;
      }
    });

    return { bitrate, packetsLost, roundTripTime, packetLossRate: 0 };
  }

  private adaptVideoQuality(stats: ConnectionStats) {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const constraints = videoTrack.getConstraints();

    // Adjust quality based on network conditions
    if (stats.bitrate < 500000 || stats.packetsLost > 50) {
      // Lower quality
      videoTrack.applyConstraints({
        ...constraints,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
      });
    } else if (stats.bitrate > 2000000 && stats.packetsLost < 10) {
      // Restore quality
      videoTrack.applyConstraints({
        ...constraints,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      });
    }
  }

  private async handleConnectionFailure(remoteUserId: string) {
    const attempts = this.reconnectAttempts.get(remoteUserId) || 0;
    
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts.set(remoteUserId, attempts + 1);
      try {
        await this.restartIce(remoteUserId);
      } catch (error) {
        console.error('Error during ICE restart:', error);
      }
    } else {
      this.emit('connectionFailed', {
        remoteUserId,
        message: 'Connection failed after multiple attempts'
      });
    }
  }

  private async restartIce(remoteUserId: string) {
    const peer = this.peerConnections.get(remoteUserId);
    if (!peer) return;

    try {
      const offer = await peer.connection.createOffer({ iceRestart: true });
      await peer.connection.setLocalDescription(offer);
      this.emit('restartOffer', {
        remoteUserId,
        offer
      });
    } catch (error) {
      console.error('Error restarting ICE:', error);
      throw error;
    }
  }

  private resetReconnectAttempts(remoteUserId: string) {
    this.reconnectAttempts.set(remoteUserId, 0);
  }

  private setupDataChannel(dataChannel: RTCDataChannel) {
    dataChannel.onmessage = (event) => {
      this.emit('dataChannelMessage', {
        data: event.data
      });
    };

    dataChannel.onopen = () => {
      this.emit('dataChannelOpen');
    };

    dataChannel.onclose = () => {
      this.emit('dataChannelClose');
    };

    dataChannel.onerror = (error) => {
      this.emit('dataChannelError', {
        error
      });
    };
  }

  async createOffer(remoteUserId: string): Promise<RTCSessionDescriptionInit> {
    try {
      const peerConnection = await this.createPeerConnection(remoteUserId);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw new Error('Failed to create connection offer. Please try again.');
    }
  }

  async handleAnswer(remoteUserId: string, answer: RTCSessionDescriptionInit) {
    try {
      const peerConnection = this.peerConnections.get(remoteUserId)?.connection;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      throw new Error('Failed to establish connection. Please try again.');
    }
  }

  async handleOffer(remoteUserId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      const peerConnection = await this.createPeerConnection(remoteUserId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      throw new Error('Failed to establish connection. Please try again.');
    }
  }

  async addIceCandidate(remoteUserId: string, candidate: RTCIceCandidateInit) {
    try {
      const peerConnection = this.peerConnections.get(remoteUserId)?.connection;
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  sendMessage(remoteUserId: string, message: string) {
    const dataChannel = this.peerConnections.get(remoteUserId)?.dataChannel;
    if (dataChannel?.readyState === 'open') {
      try {
        dataChannel.send(message);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  closeConnection(remoteUserId: string) {
    const peer = this.peerConnections.get(remoteUserId);
    if (peer) {
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
      peer.connection.close();
      this.peerConnections.delete(remoteUserId);
      this.reconnectAttempts.delete(remoteUserId);
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  cleanup() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    this.stopLocalStream();
    this.peerConnections.forEach((peer, userId) => {
      this.closeConnection(userId);
    });
    
    this.peerConnections.clear();
    this.reconnectAttempts.clear();
  }

  getPeerConnection(remoteUserId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(remoteUserId)?.connection;
  }
}
