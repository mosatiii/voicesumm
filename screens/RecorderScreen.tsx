import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config/config';
import { trialService } from '../services/trialService';
import { SignupPromptModal } from '../components/SignupPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { recordingService } from '../services/recordingService';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { Surface } from 'react-native-paper';
import type { Recording } from '../types/recording';
import { useNavigation } from '@react-navigation/native';
import { storageService } from '../services/storageService';
import { Waveform } from '../components/Waveform';
import { ErrorMessage } from '../components/ErrorMessage';
import type { RootStackParamList, TabStackParamList } from '../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, { 
  FadeInDown,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withDelay
} from 'react-native-reanimated';

const { RUNPOD_ENDPOINT } = CONFIG;

type RecorderScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabStackParamList, 'Recorder'>,
  StackNavigationProp<RootStackParamList>
>;

// Utility functions
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface RecordingSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  recording: Recording | null;
  onNewRecording: () => void;
  user: any;
  onGenerateActions: (text: string) => void;
  isGeneratingActions: boolean;
  actionItems: string[];
  setShowSignupModal: (show: boolean) => void;
}

const RecordingSuccessModal = ({ 
  visible, 
  onClose, 
  recording, 
  onNewRecording, 
  user, 
  onGenerateActions, 
  isGeneratingActions, 
  actionItems,
  setShowSignupModal 
}: RecordingSuccessModalProps) => {
  if (!recording) return null;
  const navigation = useNavigation<RecorderScreenNavigationProp>();

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
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

          {!user && (
            <TouchableOpacity 
              style={styles.aiPromptButton}
              onPress={() => setShowSignupModal(true)}
            >
              <View style={styles.aiPromptContent}>
                <View style={styles.aiIconContainer}>
                  <Ionicons name="sparkles" size={24} color="#4F46E5" />
                </View>
                <View style={styles.aiTextContainer}>
                  <Text style={styles.aiTitle}>Generate Action Items with AI</Text>
                  <Text style={styles.aiDescription}>
                    Let AI analyze your recording and create a smart action plan
                  </Text>
                </View>
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.newRecordingButton}
            onPress={onNewRecording}
          >
            <Ionicons name="mic" size={24} color="white" />
            <Text style={styles.newRecordingText}>New Recording</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonsContainer}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                handleClose();
                navigation.navigate('Recordings' as never);
              }}
            >
              <Ionicons name="list" size={22} color="#4B7BF5" />
              <Text style={styles.secondaryButtonText}>View All</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={22} color="#4B7BF5" />
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function RecorderScreen() {
  const { trialMinutesUsed, trialMinutesRemaining, addTrialMinutes, user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [summaryPoints, setSummaryPoints] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(30);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [showTrialReminder, setShowTrialReminder] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedRecording, setSavedRecording] = useState<Recording | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const navigation = useNavigation<RecorderScreenNavigationProp>();
  
  const recording = useRef(null);
  const recordingTimer = useRef(null);
  const trialTimer = useRef(null);
  const startTime = useRef(0);
  const scrollViewRef = useRef(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Reanimated shared values
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    setupAudio();
    loadTrialStatus();
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (trialTimer.current) {
        clearInterval(trialTimer.current);
      }
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1
      );
    } else {
      pulseScale.value = withSpring(1);
      setElapsedMinutes(0);
    }
  }, [isRecording]);

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const loadTrialStatus = async () => {
    const used = await trialService.getTrialMinutesUsed();
    const remaining = await trialService.getMinutesRemaining();
    setMinutesUsed(used);
    setMinutesRemaining(remaining);
  };

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  };

  const updateRecordingTime = () => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime.current;
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    setRecordingTime(
      `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    );
  };

  const updateTrialTime = () => {
    setElapsedMinutes(prev => {
      if (prev === 0) {
        clearInterval(trialTimer.current);
        stopRecording();
        return 0;
      }
      return prev - 1;
    });
  };

  const startTimer = () => {
    if (timer) {
      clearInterval(timer);
    }
    let seconds = 0;
    const newTimer = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      setRecordingTime(
        `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
      );
    }, 1000);
    setTimer(newTimer);
  };

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setRecordingTime('00:00');
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscription('');
      setDuration(0);
      setSavedRecording(null);
      setRecordingTime('00:00');
      setAudioLevel(0);
      setIsRecording(true);
      startTimer();
      await recordingService.startRecording(
        handleTranscriptionUpdate,
        (level) => setAudioLevel(level)
      );
    } catch (error) {
      setError('Unable to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (await trialService.shouldPromptSignup()) {
        setShowSignupModal(true);
        return;
      }

      setError(null);
      setLiveTranscription('');
      setTranscription('');
      setSavedRecording(null);
      setShowSuccessModal(false);
      setRecordingTime('00:00');
      setDuration(0);
      setAudioLevel(0);
      
      await recordingService.startRecording(
        (text) => {
          setLiveTranscription(text);
        },
        (level) => {
          setAudioLevel(level);
        }
      );
      
      setIsRecording(true);
      startTimer();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      stopTimer();
      
      const recording = await recordingService.stopRecording();
      setIsRecording(false);
      setTranscription(recording.transcription);
      setSavedRecording(recording);
      setShowSuccessModal(true);
      setLiveTranscription('');
      setAudioLevel(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process recording';
      setError(errorMessage);
      console.error('Failed to stop recording:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const startStreamingTranscription = async () => {
    try {
      while (isRecording && recording.current) {
        const status = await recording.current.getStatusAsync();
        if (status.isDoneRecording) break;

        const uri = recording.current.getURI();
        if (!uri) continue;

        const audioFile = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const payload = {
          input: {
            audio: `data:audio/m4a;base64,${audioFile}`,
            language: "en",
            model_size: "base",
            transcription: "text",
            translate: false,
            temperature: 0,
            best_of: 1,
            beam_size: 1,
            patience: 0,
            suppress_tokens: "-1",
            condition_on_previous_text: false,
            temperature_increment_on_fallback: 0.2,
            compression_ratio_threshold: 2.4,
            logprob_threshold: -1,
            no_speech_threshold: 0.6
          }
        };

        const token = await trialService.getAuthToken();
        
        const response = await fetch(RUNPOD_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.output && data.output.text) {
            setLiveTranscription(data.output.text);
            // Scroll to bottom of transcription
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }

        // Wait before next update
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error in streaming transcription:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (trialTimer.current) {
        clearInterval(trialTimer.current);
      }

      setIsRecording(false);
      setIsProcessing(true);

      if (recording.current) {
        await recording.current?.stopAndUnloadAsync();
        const uri = recording.current?.getURI();
        recording.current = null;

        if (uri) {
          const duration = (Date.now() - startTime.current) / 1000 / 60;
          await processAudioWithWhisper(uri, duration);
        }
      } else {
        const recording = await recordingService.stopRecording();
        setSavedRecording(recording);
      }

      setIsProcessing(false);
      setTranscription('');
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const processAudioWithWhisper = async (uri: string, duration: number) => {
    try {
      const audioFile = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const payload = {
        input: {
          audio: `data:audio/m4a;base64,${audioFile}`,
          language: "en",
          model_size: "base",
          transcription: "text",
          translate: false,
          temperature: 0,
          best_of: 1,
          beam_size: 1,
          patience: 0,
          suppress_tokens: "-1",
          condition_on_previous_text: false,
          temperature_increment_on_fallback: 0.2,
          compression_ratio_threshold: 2.4,
          logprob_threshold: -1,
          no_speech_threshold: 0.6
        }
      };

      const token = await trialService.getAuthToken();
      
      const response = await fetch(RUNPOD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.output && data.output.text) {
        const transcribedText = data.output.text;
        setTranscription(transcribedText);
        await generateSummaryPoints(transcribedText);
        setHasRecorded(true);

        if (!user) {
          await addTrialMinutes(duration);
        }
      } else {
        throw new Error('Invalid response format from Whisper API');
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to process audio:', error);
      Alert.alert(
        'Error',
        'Failed to process audio. Please try again.'
      );
      setIsProcessing(false);
    }
  };

  const generateSummaryPoints = async (text: string) => {
    try {
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const points = sentences.slice(0, 3).map(s => s.trim());
      setSummaryPoints(points);
    } catch (error) {
      console.error('Failed to generate summary points:', error);
    }
  };

  const handleMicPress = () => {
    if (!isRecording && minutesUsed < 30) {
      setShowTrialReminder(true);
    }
    
    if (isRecording) {
      stopRecording();
      setShowTrialReminder(false);
    } else {
      handleStartRecording();
    }
  };

  const handleUpload = async () => {
    try {
      if (await trialService.shouldPromptSignup()) {
        setShowSignupModal(true);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsProcessing(true);
        const transcription = await recordingService.transcribeAudio(file.uri);
        
        const words = transcription.split(/\s+/);
        const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');

        const duration = 0; // We'll need to get actual duration from the file
        const savedRecording = await storageService.saveRecording(
          file.uri,
          transcription,
          duration,
          title
        );

        setSavedRecording(savedRecording);
        setShowSuccessModal(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload audio';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignup = () => {
    setShowSignupModal(false);
    navigation.navigate('Auth', { screen: 'Signup' });
  };

  const handleLogin = () => {
    setShowSignupModal(false);
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const handleWantMore = () => {
    setShowSignupModal(true);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTranscriptionUpdate = (text: string) => {
    setTranscription(text);
  };

  const handleUploadAudio = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const transcription = await recordingService.transcribeAudio(file.uri);
        
        const words = transcription.split(/\s+/);
        const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');

        const duration = 0;
        const savedRecording = await storageService.saveRecording(
          file.uri,
          transcription,
          duration,
          title
        );

        setSavedRecording(savedRecording);
        navigation.navigate('Recordings');
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

  const renderTrialBanner = () => {
    if (user) return null;

    return (
      <View style={styles.trialBanner}>
        <View style={styles.trialHeader}>
          <View style={styles.trialTimeInfo}>
            <Ionicons 
              name="time-outline" 
              size={28} 
              color={isRecording ? '#FF4B4B' : 'white'} 
            />
            <Text style={[
              styles.trialTimeText,
              isRecording && styles.recordingTrialText
            ]}>
              {minutesRemaining}
            </Text>
            <Text style={[
              styles.trialTimeUnit,
              isRecording && styles.recordingTrialText
            ]}>
              min
            </Text>
          </View>
          <Text style={styles.trialLabel}>remaining in your trial</Text>
        </View>

        <View style={styles.trialProgress}>
          <View style={[
            styles.trialProgressBar, 
            { width: `${(minutesUsed / 30) * 100}%` },
            isRecording && styles.recordingProgressBar
          ]} />
        </View>

        <TouchableOpacity 
          style={[
            styles.upgradeButton,
            isRecording && styles.recordingUpgradeButton
          ]}
          onPress={handleWantMore}
          disabled={isRecording}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save 20%</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const startAnimation = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
  };

  const stopAnimation = () => {
    scale.value = withSpring(1);
  };

  const generateActionItems = async (text: string) => {
    try {
      setIsGeneratingActions(true);
      setAiThinking(true);
      startAnimation();
      
      // TODO: Replace with actual API call to generate action items
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: "You are an AI assistant that extracts actionable items from text. Format each action item as a concise, actionable bullet point starting with '• '. Focus on clear, specific tasks that can be completed."
          }, {
            role: "user",
            content: `Extract key action items from this text, ensuring each item is specific and actionable: ${text}`
          }],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      const items = data.choices[0].message.content
        .split('\n')
        .filter(item => item.trim().startsWith('•'))
        .map(item => item.trim());

      setActionItems(items);
    } catch (error) {
      console.error('Failed to generate action items:', error);
      setError('Failed to generate action items. Please try again.');
    } finally {
      setIsGeneratingActions(false);
      setAiThinking(false);
      stopAnimation();
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setDuration(0);
    setRecordingTime('00:00');
    setActionItems([]);
  };

  const handleNewRecording = () => {
    handleCloseSuccessModal();
    setTimeout(() => {
      handleStartRecording();
    }, 100); // Small delay to ensure modal is closed
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording && !user) {
      interval = setInterval(() => {
        setElapsedMinutes(prev => {
          const newElapsed = prev + 1;
          
          if (newElapsed >= 30) {
            stopRecording();
            clearInterval(interval!);
            return prev;
          }
          
          setMinutesRemaining(30 - newElapsed);
          setMinutesUsed(newElapsed);
          
          return newElapsed;
        });
      }, 60000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isRecording) {
        setDuration(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (aiThinking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1 // Infinite repeat
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [aiThinking]);

  return (
    <View style={styles.container}>
      <Surface style={styles.recorderContainer} elevation={2}>
        <View style={styles.recordingView}>
          <View style={styles.mainContent}>
            <WaveformVisualizer 
              isRecording={isRecording} 
              audioLevel={audioLevel}
            />
            <Animated.Text style={[
              styles.timerText,
              isRecording && styles.recordingTimerText,
              pulseStyle
            ]}>
              {isProcessing ? 'Processing...' : formatTime(duration)}
            </Animated.Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.controlsSection}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={handlePress}
              disabled={isProcessing}
            >
              <Animated.View style={[styles.recordButtonInner, pulseStyle]}>
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={32}
                  color={isRecording ? '#DC2626' : '#4F46E5'}
                />
              </Animated.View>
            </TouchableOpacity>

            {!isRecording && (
              <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                <Ionicons name="cloud-upload-outline" size={24} color="#6B7280" />
                <Text style={styles.uploadText}>Upload Audio</Text>
              </TouchableOpacity>
            )}
          </View>

          {!user && renderTrialBanner()}
        </View>
      </Surface>

      <RecordingSuccessModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        recording={savedRecording}
        onNewRecording={handleNewRecording}
        user={user}
        onGenerateActions={generateActionItems}
        isGeneratingActions={isGeneratingActions}
        actionItems={actionItems}
        setShowSignupModal={setShowSignupModal}
      />

      <SignupPromptModal
        visible={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSignup={handleSignup}
        onLogin={handleLogin}
        minutesUsed={minutesUsed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  recorderContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 28,
    overflow: 'hidden',
  },
  recordingView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  recordingTimerText: {
    fontSize: 48,
  },
  controlsSection: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  recordButtonInner: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: '#FEE2E2',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    width: '100%',
    gap: 8,
  },
  uploadText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginHorizontal: 24,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  trialBanner: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  trialHeader: {
    alignItems: 'center',
    gap: 4,
  },
  trialTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trialTimeText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trialTimeUnit: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 4,
    opacity: 0.9,
  },
  trialLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  trialProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trialProgressBar: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  savingsBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  recordingTrialText: {
    color: '#FF4B4B',
  },
  recordingProgressBar: {
    backgroundColor: '#FF4B4B',
  },
  recordingUpgradeButton: {
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
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
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
    width: '100%',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#4B5563',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    minHeight: 100,
  },
  aiPromptButton: {
    width: '100%',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E9E8FD',
  },
  aiPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  aiDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  proBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  proText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  newRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 12,
  },
  newRecordingText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4B7BF5',
    fontSize: 15,
    fontWeight: '500',
  },
}); 