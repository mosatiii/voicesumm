import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { recordingService } from '../services/recordingService';
import { storageService } from '../services/storageService';
import { Audio } from 'expo-av';
import { Waveform } from '../components/Waveform';
import { ErrorMessage } from '../components/ErrorMessage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Recording } from '../types/recording';

export const HomeScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRecording, setLastRecording] = useState<Recording | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setInterval(() => {
      if (isRecording) {
        setDuration(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscriptionUpdate = (text: string) => {
    setTranscription(text);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscription('');
      setDuration(0);
      setIsRecording(true);
      await recordingService.startRecording(handleTranscriptionUpdate);
    } catch (error) {
      setError('Unable to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      const recording = await recordingService.stopRecording();
      setLastRecording(recording);
      setIsProcessing(false);
      setTranscription('');
      
      // Navigate to recordings screen after saving
      navigation.navigate('Recordings' as never);
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleUploadAudio = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Pick an audio file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        // Start transcription
        const transcription = await recordingService.transcribeAudio(file.uri);
        
        // Generate title from transcription
        const words = transcription.split(/\s+/);
        const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');

        // Save recording
        const duration = 0; // We'll need to get actual duration from the file
        const savedRecording = await storageService.saveRecording(
          file.uri,
          transcription,
          duration,
          title
        );

        setLastRecording(savedRecording);
        
        // Navigate to recordings screen
        navigation.navigate('Recordings' as never);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to upload audio file. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const renderRecordingSaved = () => {
    if (!lastRecording || isRecording || isProcessing) return null;
    
    return (
      <View style={styles.savedContainer}>
        <View style={styles.savedHeader}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.savedTitle}>Recording Saved!</Text>
        </View>
        
        <View style={styles.savedContent}>
          <View style={styles.savedMetadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metadataText}>Duration: {formatTime(lastRecording.duration)}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="text-outline" size={20} color="#666" />
              <Text style={styles.metadataText}>{lastRecording.wordCount} words</Text>
            </View>
          </View>

          <Text style={styles.transcriptionLabel}>Transcription:</Text>
          <Text style={styles.savedTranscription}>{lastRecording.transcription}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('Recordings' as never)}
          >
            <Ionicons name="list" size={24} color="#FFF" />
            <Text style={styles.primaryButtonText}>View All Recordings</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleUploadAudio}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#4B7BF5" />
              <Text style={styles.secondaryButtonText}>Upload Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={startRecording}
            >
              <Ionicons name="mic-outline" size={24} color="#4B7BF5" />
              <Text style={styles.secondaryButtonText}>New Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {error ? (
        <ErrorMessage 
          message={error} 
          onDismiss={clearError}
        />
      ) : (
        <View style={styles.waveformContainer}>
          <Waveform isActive={isRecording} />
        </View>
      )}

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(duration)}</Text>
      </View>

      {transcription ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      ) : null}

      {renderRecordingSaved()}

      {!lastRecording && (
        <View style={styles.buttonContainer}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#4B7BF5" />
              <Text style={styles.processingText}>Processing recording...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <View style={[styles.buttonInner, isRecording && styles.stopButton]} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: '200',
    color: '#333',
  },
  transcriptionContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginVertical: 10,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FFE5E5',
  },
  buttonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4444',
  },
  stopButton: {
    borderRadius: 6,
    backgroundColor: '#FF4444',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  savedContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  savedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  savedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  savedContent: {
    marginBottom: 20,
  },
  savedMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 6,
  },
  transcriptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  savedTranscription: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  primaryButton: {
    backgroundColor: '#4B7BF5',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 0.48,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#4B7BF5',
  },
  secondaryButtonText: {
    color: '#4B7BF5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
}); 