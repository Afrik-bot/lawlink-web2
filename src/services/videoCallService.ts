import { api } from './api';

interface TokenResponse {
  token: string;
  roomName: string;
}

interface ParticipantsResponse {
  participants: any[];
}

class VideoCallService {
  async getToken(consultationId: string): Promise<TokenResponse> {
    const response = await api.post('/video/token', {
      roomName: `consultation-${consultationId}`,
    });
    return response.data;
  }

  async endRoom(roomName: string): Promise<void> {
    await api.post('/video/end-room', {
      roomName,
    });
  }

  async getRoomParticipants(roomName: string): Promise<ParticipantsResponse> {
    const response = await api.get(`/video/participants/${roomName}`);
    return response.data;
  }

  // Helper method to start a video call
  async startVideoCall(consultationId: string): Promise<TokenResponse> {
    try {
      // Get token and room name
      const { token, roomName } = await this.getToken(consultationId);
      return { token, roomName };
    } catch (error) {
      console.error('Error starting video call:', error);
      throw new Error('Failed to start video call');
    }
  }
}

export const videoCallService = new VideoCallService();
