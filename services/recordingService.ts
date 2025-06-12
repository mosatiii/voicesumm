import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { storageService } from './storageService';
import { CONFIG } from '../config/config';

const TRANSCRIPTION_ENDPOINT = `${CONFIG.TRANSCRIPTION_ENDPOINT}/transcribe`;
const CHUNK_DURATION = 3000; // 3 seconds for better transcription

class RecordingService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private startTime = 0;
  private transcriptionBuffer = '';
  private onTranscriptionUpdate: ((text: string) => void) | null = null;
  private onMeterUpdate: ((level: number) => void) | null = null;
  private recordingChunks: string[] = [];
  private currentChunkStartTime = 0;
  private chunkInterval: ReturnType<typeof setInterval> | null = null;
  private meterInterval: ReturnType<typeof setInterval> | null = null;

  async setupRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to setup recording:', error);
      throw error;
    }
  }

  async startRecording(onTranscriptionUpdate: (text: string) => void, onMeterUpdate: (level: number) => void) {
    try {
      await this.setupRecording();
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100 // Update metering every 100ms
      );
      
      this.recording = recording;
      this.isRecording = true;
      this.startTime = Date.now();
      this.currentChunkStartTime = this.startTime;
      this.onTranscriptionUpdate = onTranscriptionUpdate;
      this.onMeterUpdate = onMeterUpdate;
      this.transcriptionBuffer = '';
      this.recordingChunks = [];

      // Start processing chunks
      this.processChunks();
      
      // Start metering
      this.startMetering();

      return recording;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  private async processChunks() {
    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
    }

    this.chunkInterval = setInterval(async () => {
      if (!this.recording || !this.isRecording) return;

      try {
        // Stop current recording
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        
        if (uri) {
          // Save the chunk
          this.recordingChunks.push(uri);

          // Start transcribing this chunk
          this.transcribeChunk(uri);
        }

        // Start new recording immediately
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        this.recording = newRecording;
        this.currentChunkStartTime = Date.now();

      } catch (error) {
        console.error('Chunk processing error:', error);
      }
    }, CHUNK_DURATION);
  }

  private async transcribeChunk(uri: string) {
    try {
      const chunkTranscription = await this.transcribeAudio(uri, true);
      if (chunkTranscription && this.onTranscriptionUpdate) {
        // Append new transcription to buffer and update UI
        this.transcriptionBuffer += (this.transcriptionBuffer ? ' ' : '') + chunkTranscription;
        this.onTranscriptionUpdate(this.transcriptionBuffer.trim());
      }
    } catch (error) {
      console.error('Chunk transcription error:', error);
    }
  }

  private generateTitle(transcription: string): string {
    // Split into words and get first 5-7 meaningful words
    const words = transcription.split(/\s+/);
    let title = words.slice(0, 6).join(' ').trim();
    
    // If title is too short, try to get more context
    if (title.length < 20 && words.length > 6) {
      title = words.slice(0, 10).join(' ').trim();
    }
    
    // Add ellipsis if we cut the text
    if (words.length > 10) {
      title += '...';
    }
    
    return title || 'New Recording';
  }

  private startMetering() {
    if (this.meterInterval) {
      clearInterval(this.meterInterval);
    }

    this.meterInterval = setInterval(async () => {
      if (!this.recording || !this.isRecording) return;

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          const { metering = -160 } = status;
          // Convert dB to a 0-1 range, where -160dB is 0 and 0dB is 1
          const normalizedLevel = (metering + 160) / 160;
          this.onMeterUpdate?.(Math.max(0, Math.min(1, normalizedLevel)));
        }
      } catch (error) {
        console.error('Metering error:', error);
      }
    }, 100);
  }

  async stopRecording() {
    try {
      if (this.chunkInterval) {
        clearInterval(this.chunkInterval);
      }
      if (this.meterInterval) {
        clearInterval(this.meterInterval);
      }
      
      this.isRecording = false;
      
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        this.recording = null;
        
        if (uri) {
          return await this.processRecording(uri);
        }
      }
      
      throw new Error('No recording found');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async transcribeAudio(uri: string, isChunk: boolean = false): Promise<string> {
    try {
      console.log(`Starting transcription for ${isChunk ? 'chunk' : 'full recording'}: ${uri}`);
      
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      } as any);

      formData.append('task', 'transcribe');
      formData.append('language', 'auto');

      const response = await fetch(TRANSCRIPTION_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Transcription failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';

    } catch (error) {
      console.error('Transcription error:', error);
      if (isChunk) {
        // For chunks, we can ignore errors and continue
        return '';
      }
      throw error;
    }
  }

  private async processRecording(uri: string) {
    try {
      const duration = (Date.now() - this.startTime) / 1000; // Duration in seconds
      
      // Get final transcription from the buffer
      let fullTranscription = this.transcriptionBuffer;
      
      // Transcribe the final chunk if it exists
      const finalChunkTranscription = await this.transcribeAudio(uri, false);
      if (finalChunkTranscription) {
        fullTranscription += ' ' + finalChunkTranscription;
      }
      
      fullTranscription = fullTranscription.trim();

      // Generate title from transcription
      const title = this.generateTitle(fullTranscription);

      // Save recording with title
      const savedRecording = await storageService.saveRecording(
        uri,
        fullTranscription,
        duration,
        title
      );

      // Clean up chunks except the last one (which we saved)
      for (const chunkUri of this.recordingChunks) {
        if (chunkUri !== uri) {
          try {
            await FileSystem.deleteAsync(chunkUri);
          } catch (error) {
            console.error('Failed to delete chunk:', error);
          }
        }
      }

      // Reset state
      this.transcriptionBuffer = '';
      this.recordingChunks = [];
      this.onTranscriptionUpdate = null;
      this.onMeterUpdate = null;

      return savedRecording;
    } catch (error) {
      console.error('Failed to process recording:', error);
      throw error;
    }
  }

  getIsRecording() {
    return this.isRecording;
  }
}

export const recordingService = new RecordingService(); 