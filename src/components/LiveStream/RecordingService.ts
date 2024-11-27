class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private startTime: number | null = null;
  private endTime: number | null = null;

  async startRecording(stream: MediaStream): Promise<void> {
    try {
      this.recordedChunks = [];
      this.startTime = Date.now();
      this.endTime = null;
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        throw new Error(`${options.mimeType} is not supported`);
      }

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.endTime = Date.now();
      this.mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(this.recordedChunks, {
            type: 'video/webm'
          });
          this.isRecording = false;
          this.recordedChunks = [];
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getRecordingDuration(): number {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return Math.floor((endTime - this.startTime) / 1000); // Duration in seconds
  }

  async downloadRecording(blob: Blob, filename: string = 'consultation-recording.webm'): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async uploadRecording(blob: Blob, roomId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('recording', blob, `${roomId}-${Date.now()}.webm`);

      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  }
}

const recordingService = new RecordingService();
export { RecordingService as IRecordingService }; 
export default recordingService;
