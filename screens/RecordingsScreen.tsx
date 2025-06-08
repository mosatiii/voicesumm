import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, Platform, Share, Modal, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import { storageService } from '../services/storageService';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '../types/recording';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ExpoSharing from 'expo-sharing';

// Utility functions
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface Section {
  title: string;
  data: Recording[];
}

interface PlaybackStatus {
  id: string;
  position: number;
  duration: number;
  isPlaying: boolean;
}

interface RecordingSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  recording: Recording | null;
}

const RecordingSuccessModal = ({ visible, onClose, recording }: RecordingSuccessModalProps) => {
  if (!recording) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark" size={32} color="#22C55E" />
          </View>
          <Text style={styles.modalTitle}>Recording Saved!</Text>
          
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.metadataText}>
                Duration: {formatTime(recording.duration)}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="text-outline" size={20} color="#6B7280" />
              <Text style={styles.metadataText}>
                {recording.wordCount} words
              </Text>
            </View>
          </View>

          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionLabel}>Transcription:</Text>
            <Text style={styles.transcriptionText}>{recording.transcription}</Text>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.primaryButton]}
              onPress={() => {
                onClose();
                // Add navigation to new recording if needed
              }}
            >
              <Ionicons name="mic" size={24} color="white" />
              <Text style={styles.actionButtonText}>New Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default function RecordingsScreen() {
  const [recordings, setRecordings] = useState<Section[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [lastSavedRecording, setLastSavedRecording] = useState<Recording | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadRecordings();
      return () => {
        if (sound) {
          sound.unloadAsync();
        }
      };
    }, [])
  );

  useEffect(() => {
    // Update playback position every 100ms when playing
    let interval: NodeJS.Timeout;
    if (playbackStatus?.isPlaying) {
      interval = setInterval(async () => {
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPlaybackStatus(prev => prev ? {
              ...prev,
              position: status.positionMillis / 1000
            } : null);
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [playbackStatus?.isPlaying]);

  const loadRecordings = async () => {
    try {
      const allRecordings = await storageService.getRecordings();
      const sections = organizeRecordingsIntoSections(allRecordings);
      setRecordings(sections);
      
      // Show success modal if there's a new recording
      if (allRecordings.length > 0) {
        const latestRecording = allRecordings[allRecordings.length - 1];
        const now = Date.now();
        const recordingTime = new Date(latestRecording.timestamp).getTime();
        
        // Show modal if recording was made in the last 2 seconds
        if (now - recordingTime < 2000) {
          setLastSavedRecording(latestRecording);
          setSuccessModalVisible(true);
        }
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const organizeRecordingsIntoSections = (recordings: Recording[]): Section[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today);
    thisMonth.setDate(1);

    const sections: Section[] = [
      { title: 'Today', data: [] },
      { title: 'This Month', data: [] },
      { title: 'Older', data: [] }
    ];

    recordings.forEach(recording => {
      const recordingDate = new Date(recording.timestamp);
      recordingDate.setHours(0, 0, 0, 0);

      if (recordingDate.getTime() === today.getTime()) {
        sections[0].data.push(recording);
      } else if (recordingDate >= thisMonth) {
        sections[1].data.push(recording);
      } else {
        sections[2].data.push(recording);
      }
    });

    return sections.filter(section => section.data.length > 0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const playRecording = async (recording: Recording) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setPlayingId(recording.id);
      
      const status = await newSound.getStatusAsync();
      if (status.isLoaded && 'durationMillis' in status) {
        setPlaybackStatus({
          id: recording.id,
          position: 0,
          duration: status.durationMillis / 1000,
          isPlaying: true
        });
      } else {
        setPlaybackStatus({
          id: recording.id,
          position: 0,
          duration: recording.duration,
          isPlaying: true
        });
      }
      
      await newSound.playAsync();
    } catch (error) {
      console.error('Failed to play recording:', error);
      setPlayingId(null);
      setPlaybackStatus(null);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setPlayingId(null);
      setPlaybackStatus(prev => prev ? { ...prev, isPlaying: false, position: 0 } : null);
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setPlayingId(null);
      setPlaybackStatus(prev => prev ? { ...prev, isPlaying: false, position: 0 } : null);
    }
  };

  const pausePlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setPlaybackStatus(prev => prev ? { ...prev, isPlaying: false } : null);
    }
  };

  const resumePlayback = async () => {
    if (sound) {
      await sound.playAsync();
      setPlaybackStatus(prev => prev ? { ...prev, isPlaying: true } : null);
    }
  };

  const seekTo = async (position: number) => {
    if (sound) {
      await sound.setPositionAsync(position * 1000);
      setPlaybackStatus(prev => prev ? { ...prev, position } : null);
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      await storageService.deleteRecording(id);
      await loadRecordings();
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  const handleShare = async (recording: Recording) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(recording.uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file not found');
      }

      if (Platform.OS === 'ios') {
        await ExpoSharing.shareAsync(recording.uri, {
          UTI: 'public.audio',
          mimeType: 'audio/mpeg'
        });
      } else {
        await Share.share({
          url: recording.uri,
          title: recording.title,
          message: `Check out my recording: ${recording.title}`
        });
      }
    } catch (error) {
      console.error('Failed to share recording:', error);
    }
  };

  const renderItem = ({ item }: { item: Recording }) => {
    const isCurrentlyPlaying = playingId === item.id;
    const status = playbackStatus && playbackStatus.id === item.id ? playbackStatus : null;

    return (
      <View style={styles.recordingItem}>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.recordingDetails}>
            {formatDate(item.timestamp)} • {formatDuration(item.duration)} • {item.wordCount} words
          </Text>
          
          {isCurrentlyPlaying && status && (
            <View style={styles.playbackControls}>
              <Text style={styles.timeText}>
                {formatTime(status.position)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={status.duration}
                value={status.position}
                onValueChange={seekTo}
                minimumTrackTintColor="#4F46E5"
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#4F46E5"
              />
              <Text style={styles.timeText}>
                {formatTime(status.duration)}
              </Text>
            </View>
          )}

          <Text style={styles.transcriptionText} numberOfLines={2}>
            {item.transcription}
          </Text>
        </View>
        
        <View style={styles.recordingActions}>
          <TouchableOpacity
            onPress={() => {
              if (!isCurrentlyPlaying) {
                playRecording(item);
              } else if (status?.isPlaying) {
                pausePlayback();
              } else {
                resumePlayback();
              }
            }}
            style={styles.listActionButton}
          >
            <Ionicons
              name={!isCurrentlyPlaying ? 'play' : status?.isPlaying ? 'pause' : 'play'}
              size={24}
              color="#4F46E5"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleShare(item)}
            style={styles.listActionButton}
          >
            <Ionicons name="share-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => deleteRecording(item.id)}
            style={styles.listActionButton}
          >
            <Ionicons name="trash-outline" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <RecordingSuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        recording={lastSavedRecording}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Recordings</Text>
        <Text style={styles.subtitle}>{recordings.length} total</Text>
      </View>

      <SectionList
        sections={recordings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fff',
    padding: 15,
    paddingBottom: 10,
  },
  recordingItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recordingInfo: {
    flex: 1,
    marginRight: 12,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  recordingDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    minWidth: 35,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCF7E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 16,
    color: '#6B7280',
  },
  transcriptionContainer: {
    width: '100%',
    marginBottom: 24,
  },
  transcriptionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 