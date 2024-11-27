import { Socket } from 'socket.io-client';

export interface ParticipantJoinedData {
  socketId: string;
  userId: string;
}

export interface RTCSignalData {
  type: 'offer' | 'answer' | 'candidate';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface StreamSignalData {
  to: string;
  signal: RTCSignalData;
}

export interface StreamMessageData {
  from: string;
  message: string;
  timestamp: string;
}

// Define all possible events
export interface ServerToClientEvents {
  'participant-joined': (data: ParticipantJoinedData) => void;
  'signal': (data: { from: string; signal: RTCSignalData }) => void;
  'stream-message': (data: StreamMessageData) => void;
  'stream-ended': () => void;
  'error': (data: { message: string }) => void;
  'connect': () => void;
  'connect_error': (error: Error) => void;
}

export interface ClientToServerEvents {
  'join-stream': (data: { sessionId: string; userId: string }) => void;
  'signal': (data: StreamSignalData) => void;
  'stream-message': (data: { sessionId: string; message: string; from: string }) => void;
  'end-stream': (data: { sessionId: string }) => void;
}

export type StreamSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
