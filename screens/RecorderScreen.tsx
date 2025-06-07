import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, Platform, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { CONFIG } from '../config/config';
import { trialService } from '../services/trialService';
import { SignupPromptModal } from '../components/SignupPromptModal';
import { useAuth } from '../contexts/AuthContext';

const { RUNPOD_ENDPOINT } = CONFIG;

export default function RecorderScreen({ navigation }) {
  const { trialMinutesUsed, trialMinutesRemaining, addTrialMinutes, user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summaryPoints, setSummaryPoints] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(30);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [showTrialReminder, setShowTrialReminder] = useState(false);
  
  const recording = useRef(null);
  const recordingTimer = useRef(null);
  const startTime = useRef(0);

  const swipeableRefs = useRef<Array<Swipeable | null>>([]);
  const flashAnimValue = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 100; // Minimum swipe distance required

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
    };
  }, []);

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

  const startRecording = async () => {
    try {
      // Check if we have enough minutes remaining
      if (await trialService.shouldPromptSignup()) {
        setShowSignupModal(true);
        return;
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = newRecording;
      setIsRecording(true);
      
      startTime.current = Date.now();
      recordingTimer.current = setInterval(updateRecordingTime, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };
  
  const stopRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;
      setIsRecording(false);
      setIsProcessing(true);

      // Calculate duration in minutes
      const duration = (Date.now() - startTime.current) / 1000 / 60;

      // Process the recording
      await processAudioWithWhisper(uri, duration);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const processAudioWithWhisper = async (uri: string, duration: number) => {
    try {
      // Read the audio file
      const audioFile = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create the request payload
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

      // Get auth token if available
      const token = await trialService.getAuthToken();
      
      // Send to Runpod Whisper endpoint
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

      // Process the transcription
      if (data && data.output && data.output.text) {
        const transcribedText = data.output.text;
        setTranscription(transcribedText);
        await generateSummaryPoints(transcribedText);
        setHasRecorded(true);

        // Only add to trial minutes if not logged in
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
      startRecording();
    }
  };

  const handleUpload = async () => {
    try {
      // Check if we have enough minutes remaining
      if (await trialService.shouldPromptSignup()) {
        setShowSignupModal(true);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if ('assets' in result && result.assets.length > 0) {
        setIsProcessing(true);
        // For uploaded files, estimate duration as 1 minute per MB
        const fileSizeInMB = result.assets[0].size / (1024 * 1024);
        await processAudioWithWhisper(result.assets[0].uri, fileSizeInMB);
      }
    } catch (error) {
      console.error('Failed to pick document:', error);
    }
  };

  const handleSignup = () => {
    // Navigate to signup screen
    navigation.navigate('Auth', { screen: 'Signup' });
    setShowSignupModal(false);
  };

  const handleLogin = () => {
    // Navigate to login screen
    navigation.navigate('Auth', { screen: 'Login' });
    setShowSignupModal(false);
  };

  const handleAddToDo = (index) => {
    const item = summaryPoints[index];
    // Here you would actually add to your ToDo list
    flashScreen();
    if (swipeableRefs.current[index]) {
      swipeableRefs.current[index].close();
    }
    setSummaryPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = (index) => {
    setSummaryPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleWantMore = () => {
    navigation.navigate('SignInModal');
  };

  const renderFeatureCard = (Icon, title, subtitle, emoji) => (
    <View style={styles.featureCard}>
      <View style={styles.featureLeft}>
        <Icon size={24} color="#374151" style={styles.featureIcon} />
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.featureEmoji}>{emoji}</Text>
    </View>
  );

  const renderLeftActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [0, swipeThreshold],
      outputRange: [-20, 0],
      extrapolate: 'clamp',
    });
    
    const scale = dragX.interpolate({
      inputRange: [0, swipeThreshold],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.leftAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.actionContent,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={24} color="white" />
          <Text style={styles.actionText}>Add to To-Do</Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-swipeThreshold, 0],
      outputRange: [0, -20],
      extrapolate: 'clamp',
    });

    const scale = dragX.interpolate({
      inputRange: [-swipeThreshold, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.rightAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.actionContent,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <Text style={styles.actionText}>Delete</Text>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Animated.View>
      </Animated.View>
    );
  };

  // Flash animation function
  const flashScreen = () => {
    Animated.sequence([
      Animated.timing(flashAnimValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(300),
      Animated.timing(flashAnimValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
              isProcessing && styles.micButtonProcessing
            ]}
            onPress={handleMicPress}
            disabled={isProcessing}
          >
            <Ionicons 
              name={isRecording ? "mic" : "mic-outline"} 
              size={48} 
              color={isRecording ? 'white' : '#374151'} 
            />
          </TouchableOpacity>

          <Text style={styles.recordingText}>
            {isProcessing ? 'Processing...' : 
             isRecording ? `Recording ${recordingTime}` : 
             'Tap to start recording'}
          </Text>

          {showTrialReminder && (
            <View style={styles.trialReminderContainer}>
              <View style={styles.trialReminderContent}>
                <Text style={styles.trialReminderText}>
                  🎉 You have 30 minutes free to try out all features!
                </Text>
                <TouchableOpacity 
                  style={styles.wantMoreButton}
                  onPress={handleWantMore}
                >
                  <Text style={styles.wantMoreText}>Want more?</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Ionicons name="cloud-upload-outline" size={20} color="white" style={styles.uploadIcon} />
            <Text style={styles.uploadText}>Upload Audio File</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section - Only show when not recording and not recorded */}
        {!isRecording && !hasRecorded && (
          <View style={styles.features}>
            {renderFeatureCard(
              Ionicons, 
              'Smart Transcription', 
              'Convert speech to text',
              '🎯'
            )}
            {renderFeatureCard(
              Ionicons, 
              'AI Summary', 
              'Extract key points',
              '🧠'
            )}
            {renderFeatureCard(
              Ionicons, 
              'Task Management', 
              'Create tasks from your audio',
              '✅'
            )}
          </View>
        )}

        {hasRecorded && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Transcription</Text>
              <Text style={styles.cardText}>{transcription}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Summary Points</Text>
              <Text style={styles.cardSubtext}>
                Swipe right to add to To-Do, swipe left to delete
              </Text>
              {summaryPoints.map((point, index) => (
                <Swipeable
                  key={index}
                  ref={ref => {
                    if (ref) {
                      swipeableRefs.current[index] = ref;
                    }
                  }}
                  renderLeftActions={renderLeftActions}
                  renderRightActions={renderRightActions}
                  friction={2}
                  overshootFriction={8}
                  leftThreshold={swipeThreshold}
                  rightThreshold={swipeThreshold}
                  onSwipeableLeftWillOpen={() => handleAddToDo(index)}
                  onSwipeableRightWillOpen={() => handleDelete(index)}
                >
                  <Animated.View style={[
                    styles.summaryItem,
                    {
                      transform: [{
                        translateX: hintAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 15]
                        })
                      }]
                    }
                  ]}>
                    <Text style={styles.summaryText}>{point}</Text>
                  </Animated.View>
                </Swipeable>
              ))}
            </View>
          </>
        )}

        <SignupPromptModal
          visible={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSignup={handleSignup}
          onLogin={handleLogin}
          minutesUsed={minutesUsed}
        />

        {/* Success Flash Overlay */}
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashAnimValue,
            },
          ]}
        />
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  micButton: {
    backgroundColor: '#F3F4F6',
    padding: 32,
    borderRadius: 999,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  micButtonProcessing: {
    backgroundColor: '#9CA3AF',
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
    color: '#111827',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 8,
    color: '#111827',
  },
  cardText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  summaryItem: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#111827',
  },
  flex: {
    flex: 1,
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  featureSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  featureEmoji: {
    fontSize: 24,
    marginLeft: 12,
  },
  cardSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  leftAction: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 8,
  },
  rightAction: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 8,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4CAF50',
    zIndex: 999,
  },
  trialReminderContainer: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  trialReminderContent: {
    alignItems: 'center',
    gap: 12,
  },
  trialReminderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  wantMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  wantMoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 