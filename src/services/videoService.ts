import { Device, Room, LocalTrack, RemoteTrack, createLocalTracks, connect } from 'twilio-video';
import { notificationService } from './notificationService';

export interface VideoParticipant {
  identity: string;
  audioTrack?: RemoteTrack | LocalTrack;
  videoTrack?: RemoteTrack | LocalTrack;
  isLocal: boolean;
}

class VideoService {
  private room: Room | null = null;
  private device: Device | null = null;
  private localTracks: LocalTrack[] = [];
  private onParticipantConnected?: (participant: VideoParticipant) => void;
  private onParticipantDisconnected?: (participant: VideoParticipant) => void;
  private onError?: (error: Error) => void;

  async initialize(
    onParticipantConnected: (participant: VideoParticipant) => void,
    onParticipantDisconnected: (participant: VideoParticipant) => void,
    onError: (error: Error) => void
  ) {
    this.onParticipantConnected = onParticipantConnected;
    this.onParticipantDisconnected = onParticipantDisconnected;
    this.onError = onError;

    try {
      // Request permissions and create local tracks
      this.localTracks = await createLocalTracks({
        audio: true,
        video: { width: 640, height: 480 }
      });

      // Notify the application about the local participant
      this.onParticipantConnected({
        identity: 'local',
        audioTrack: this.localTracks.find(track => track.kind === 'audio'),
        videoTrack: this.localTracks.find(track => track.kind === 'video'),
        isLocal: true
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async joinRoom(roomName: string, token: string) {
    try {
      // Connect to the Twilio room
      this.room = await connect(token, {
        name: roomName,
        tracks: this.localTracks,
        dominantSpeaker: true
      });

      // Handle remote participants that are already connected
      this.room.participants.forEach(participant => {
        this.handleParticipantConnected(participant);
      });

      // Handle participants connecting to the room
      this.room.on('participantConnected', participant => {
        this.handleParticipantConnected(participant);
        notificationService.showNotification({
          title: 'New Participant',
          body: `${participant.identity} joined the call`,
        });
      });

      // Handle participants disconnecting from the room
      this.room.on('participantDisconnected', participant => {
        this.handleParticipantDisconnected(participant);
        notificationService.showNotification({
          title: 'Participant Left',
          body: `${participant.identity} left the call`,
        });
      });

      // Handle errors
      this.room.on('error', this.handleError);

    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private handleParticipantConnected(participant: any) {
    // Create VideoParticipant object for the new participant
    const videoParticipant: VideoParticipant = {
      identity: participant.identity,
      isLocal: false
    };

    // Handle participant's existing tracks
    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed) {
        this.handleTrackSubscribed(videoParticipant, publication.track);
      }
    });

    // Handle participant's new tracks
    participant.on('trackSubscribed', (track: any) => {
      this.handleTrackSubscribed(videoParticipant, track);
    });

    // Handle participant's tracks being unsubscribed
    participant.on('trackUnsubscribed', (track: any) => {
      this.handleTrackUnsubscribed(videoParticipant, track);
    });

    this.onParticipantConnected?.(videoParticipant);
  }

  private handleParticipantDisconnected(participant: any) {
    this.onParticipantDisconnected?.({
      identity: participant.identity,
      isLocal: false
    });
  }

  private handleTrackSubscribed(participant: VideoParticipant, track: any) {
    if (track.kind === 'audio') {
      participant.audioTrack = track;
    } else if (track.kind === 'video') {
      participant.videoTrack = track;
    }
  }

  private handleTrackUnsubscribed(participant: VideoParticipant, track: any) {
    if (track.kind === 'audio') {
      participant.audioTrack = undefined;
    } else if (track.kind === 'video') {
      participant.videoTrack = undefined;
    }
  }

  private handleError(error: Error) {
    console.error('Video Error:', error);
    this.onError?.(error);
  }

  async leaveRoom() {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    // Stop local tracks
    this.localTracks.forEach(track => {
      track.stop();
    });
    this.localTracks = [];
  }

  async toggleAudio(enabled: boolean) {
    const audioTrack = this.localTracks.find(track => track.kind === 'audio');
    if (audioTrack) {
      if (enabled) {
        await audioTrack.enable();
      } else {
        await audioTrack.disable();
      }
    }
  }

  async toggleVideo(enabled: boolean) {
    const videoTrack = this.localTracks.find(track => track.kind === 'video');
    if (videoTrack) {
      if (enabled) {
        await videoTrack.enable();
      } else {
        await videoTrack.disable();
      }
    }
  }

  async switchCamera() {
    const videoTrack = this.localTracks.find(track => track.kind === 'video');
    if (videoTrack) {
      const newTrack = await createLocalTracks({
        video: { facingMode: videoTrack.name === 'user' ? 'environment' : 'user' }
      });
      
      // Replace the old track with the new one
      const oldTrack = this.localTracks.find(t => t.kind === 'video');
      if (oldTrack) {
        const trackIndex = this.localTracks.indexOf(oldTrack);
        this.localTracks[trackIndex] = newTrack[0];
        if (this.room) {
          await this.room.localParticipant.publishTrack(newTrack[0]);
          await this.room.localParticipant.unpublishTrack(oldTrack);
        }
        oldTrack.stop();
      }
    }
  }
}

export const videoService = new VideoService();
