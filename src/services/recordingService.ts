import { EventEmitter } from 'events';

interface RecordingProgress {
  uploadProgress: number;
  duration: number;
  fileSize: number;
}

export class RecordingService extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private startTime: number = 0;
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly SUPPORTED_MIME_TYPES = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  constructor() {
    super();
  }

  private getMimeType(): string {
    for (const mimeType of this.SUPPORTED_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    throw new Error('No supported mime type found for recording');
  }

  async startRecording(stream: MediaStream): Promise<void> {
    try {
      if (this.isRecording) {
        throw new Error('Recording is already in progress');
      }

      this.recordedChunks = [];
      this.startTime = Date.now();
      
      // Create MediaRecorder instance with supported codec
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getMimeType(),
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          const totalSize = this.recordedChunks.reduce((size, chunk) => size + chunk.size, 0);
          
          // Check file size limit
          if (totalSize > this.MAX_FILE_SIZE) {
            this.stopRecording().catch(console.error);
            this.emit('error', new Error('Recording size limit exceeded'));
          }

          // Emit progress
          this.emit('progress', {
            duration: (Date.now() - this.startTime) / 1000,
            fileSize: totalSize,
          });
        }
      };

      // Handle recording state changes
      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        this.emit('start');
      };

      this.mediaRecorder.onpause = () => {
        this.emit('pause');
      };

      this.mediaRecorder.onresume = () => {
        this.emit('resume');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.emit('stop');
      };

      this.mediaRecorder.onerror = (event) => {
        this.emit('error', event.error);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Create chunks every second
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No MediaRecorder instance found'));
        return;
      }

      const handleStop = () => {
        try {
          const recordedBlob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder?.mimeType || 'video/webm',
          });
          this.isRecording = false;
          this.recordedChunks = [];
          resolve(recordedBlob);
        } catch (error) {
          reject(error);
        }
      };

      if (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.onstop = handleStop;
        this.mediaRecorder.stop();
      } else {
        handleStop();
      }
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    } else {
      throw new Error('Cannot pause recording: recorder is not recording');
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    } else {
      throw new Error('Cannot resume recording: recorder is not paused');
    }
  }

  getRecordingState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  getRecordingDuration(): number {
    return this.isRecording ? (Date.now() - this.startTime) / 1000 : 0;
  }

  async uploadRecording(blob: Blob, consultationId: string): Promise<string> {
    try {
      // Check file size
      if (blob.size > this.MAX_FILE_SIZE) {
        throw new Error('File size exceeds maximum allowed size');
      }

      const formData = new FormData();
      formData.append('recording', blob, `consultation-${consultationId}-${Date.now()}.webm`);
      formData.append('consultationId', consultationId);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          this.emit('uploadProgress', progress);
        }
      };

      // Handle upload
      const response = await new Promise<string>((resolve, reject) => {
        xhr.open('POST', `${process.env.REACT_APP_API_BASE_URL}/api/consultations/recordings/upload`);
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            const { url } = JSON.parse(xhr.responseText);
            resolve(url);
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      return response;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  }

  downloadRecording(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
