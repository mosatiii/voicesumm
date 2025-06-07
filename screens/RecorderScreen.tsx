import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, Dimensions, TextInput, Platform } from 'react-native';
import { Mic, Upload, FileText, Brain, ListTodo, Pencil, ChevronRight } from 'lucide-react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import axios from 'axios';
import { PermissionsAndroid } from 'react-native';

const RUNPOD_ENDPOINT = 'YOUR_RUNPOD_ENDPOINT';
const RUNPOD_API_KEY = 'YOUR_RUNPOD_API_KEY';

export default function RecorderScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summaryPoints, setSummaryPoints] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const swipeableRefs = useRef<Array<Swipeable | null>>([]);
  const flashAnimValue = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 100; // Minimum swipe distance required
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const recordingPath = useRef('');

  useEffect(() => {
    if (hasRecorded) {
      startHintAnimation();
    }
    // Request necessary permissions on mount
    requestPermissions();
    return () => {
      // Cleanup recording on unmount
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        
        console.log('write external storage', grants);
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const path = Platform.select({
        ios: 'recording.m4a',
        android: 'sdcard/recording.mp4',
      });
      recordingPath.current = path;

      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener((e) => {
        const time = audioRecorderPlayer.mmssss(Math.floor(e.currentPosition));
        setRecordingTime(time.slice(0, 5));
      });
      console.log(result);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setIsProcessing(true);
      await processAudioWithWhisper();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const processAudioWithWhisper = async () => {
    try {
      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: `file://${recordingPath.current}`,
        type: Platform.OS === 'ios' ? 'audio/x-m4a' : 'audio/mp4',
        name: Platform.OS === 'ios' ? 'recording.m4a' : 'recording.mp4',
      } as any); // Type assertion needed for React Native's FormData

      // Send to Runpod Whisper endpoint
      const response = await axios.post(RUNPOD_ENDPOINT, formData, {
        headers: {
          'Authorization': `Bearer ${RUNPOD_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Process the transcription
      if (response.data && response.data.text) {
        setTranscription(response.data.text);
        // Generate summary points using the transcription
        await generateSummaryPoints(response.data.text);
      }

      setHasRecorded(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to process audio:', error);
      setIsProcessing(false);
    }
  };

  const generateSummaryPoints = async (text) => {
    try {
      // You can either use Runpod's API or another service to generate summary points
      // For now, we'll use a simple split by sentences
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const points = sentences.slice(0, 3).map(s => s.trim());
      setSummaryPoints(points);
    } catch (error) {
      console.error('Failed to generate summary points:', error);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleUpload = () => {
    Alert.alert('Upload', 'Select an audio file to upload');
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

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleEditComplete = (index, newText) => {
    setSummaryPoints(prev => 
      prev.map((point, i) => i === index ? newText : point)
    );
    setEditingIndex(-1);
  };

  const startHintAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hintAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(hintAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
          <ChevronRight size={24} color="white" />
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
          <ChevronRight size={24} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
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
      Animated.delay(300), // Hold the flash longer
      Animated.timing(flashAnimValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Recording Section */}
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
            <Mic size={48} color={isRecording ? 'white' : '#374151'} />
          </TouchableOpacity>

          <Text style={styles.recordingText}>
            {isProcessing ? 'Processing...' : 
             isRecording ? `Recording ${recordingTime}` : 
             'Tap to start recording'}
          </Text>

          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Upload size={20} color="white" style={styles.uploadIcon} />
            <Text style={styles.uploadText}>Upload Audio File</Text>
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.cta}>
              <Text style={styles.ctaText}>You have 1 hour of free transcribing</Text>
              <Text style={styles.ctaLink}>Want more?</Text>
            </View>
          )}
        </View>

        {/* Features Section - Only show when not recording and not recorded */}
        {!isRecording && !hasRecorded && (
          <View style={styles.features}>
            {renderFeatureCard(
              FileText, 
              'Smart Transcription', 
              'Convert speech to text',
              '🎯'
            )}
            {renderFeatureCard(
              Brain, 
              'AI Summary', 
              'Extract key points',
              '🧠'
            )}
            {renderFeatureCard(
              ListTodo, 
              'Task Management', 
              'Create tasks from your audio',
              '✅'
            )}
          </View>
        )}

        {/* Results Section - Only show after recording */}
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
                    {editingIndex === index ? (
                      <TextInput
                        style={styles.summaryInput}
                        value={point}
                        onChangeText={(text) => handleEditComplete(index, text)}
                        onBlur={() => setEditingIndex(-1)}
                        autoFocus
                      />
                    ) : (
                      <View style={styles.summaryContent}>
                        <Text style={styles.summaryText}>{point}</Text>
                        <TouchableOpacity 
                          onPress={() => handleEdit(index)}
                          style={styles.editButton}
                        >
                          <Pencil size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    )}
                    <Animated.View style={[
                      styles.hintOverlay,
                      {
                        opacity: hintAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.1]
                        })
                      }
                    ]} />
                  </Animated.View>
                </Swipeable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Success Flash Overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnimValue,
          },
        ]}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
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
  cta: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: {
    color: '#6B7280',
    fontSize: 14,
  },
  ctaLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
  cardSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  summaryItem: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  summaryInput: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
    flex: 1,
  },
  editButton: {
    padding: 4,
    marginLeft: 8,
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
  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4CAF50',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4CAF50',
    zIndex: 999,
  },
});
