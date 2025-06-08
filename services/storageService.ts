import * as FileSystem from 'expo-file-system';
import { Recording } from '../types/recording';

const RECORDINGS_DIRECTORY = `${FileSystem.documentDirectory}recordings/`;
const RECORDINGS_INDEX = `${RECORDINGS_DIRECTORY}index.json`;

class StorageService {
  private recordings: Recording[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Create recordings directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIRECTORY, { intermediates: true });
      }

      // Load recordings index
      const indexInfo = await FileSystem.getInfoAsync(RECORDINGS_INDEX);
      if (indexInfo.exists) {
        const indexContent = await FileSystem.readAsStringAsync(RECORDINGS_INDEX);
        this.recordings = JSON.parse(indexContent);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  async saveRecording(uri: string, transcription: string, duration: number, title: string): Promise<Recording> {
    await this.initialize();

    try {
      // Generate unique filename
      const timestamp = new Date().toISOString();
      const filename = `recording_${timestamp.replace(/[:.]/g, '-')}.m4a`;
      const newPath = `${RECORDINGS_DIRECTORY}${filename}`;

      // Copy recording to app directory
      await FileSystem.copyAsync({
        from: uri,
        to: newPath
      });

      // Create recording metadata
      const recording: Recording = {
        id: filename,
        uri: newPath,
        title,
        transcription,
        duration,
        timestamp: new Date().toISOString(),
        wordCount: transcription.split(/\s+/).length,
        language: 'auto', // Language is auto-detected by Whisper
      };

      // Add to recordings list
      this.recordings.push(recording);

      // Save index
      await this.saveIndex();

      return recording;
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  }

  async getRecordings(): Promise<Recording[]> {
    await this.initialize();
    return [...this.recordings].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async deleteRecording(id: string): Promise<void> {
    await this.initialize();

    const recording = this.recordings.find(r => r.id === id);
    if (!recording) {
      throw new Error('Recording not found');
    }

    try {
      // Delete file
      await FileSystem.deleteAsync(recording.uri);

      // Remove from recordings list
      this.recordings = this.recordings.filter(r => r.id !== id);

      // Save index
      await this.saveIndex();
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  private async saveIndex(): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(
        RECORDINGS_INDEX,
        JSON.stringify(this.recordings)
      );
    } catch (error) {
      console.error('Failed to save recordings index:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService(); 