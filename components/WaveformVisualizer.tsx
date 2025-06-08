import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface WaveformVisualizerProps {
  isRecording: boolean;
  audioLevel?: number; // 0-1 range
}

const NUM_BARS = 30;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_BAR_HEIGHT = 40;
const MIN_BAR_HEIGHT = 5;

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isRecording, audioLevel = 0 }) => {
  const barAnimations = useRef<Animated.Value[]>(
    Array(NUM_BARS).fill(0).map(() => new Animated.Value(MIN_BAR_HEIGHT))
  ).current;

  useEffect(() => {
    if (!isRecording) {
      barAnimations.forEach(anim => anim.setValue(MIN_BAR_HEIGHT));
      return;
    }

    // Calculate target height based on audio level
    const targetHeight = MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * audioLevel;

    // Animate each bar with slight variations
    barAnimations.forEach((anim, index) => {
      const variance = Math.random() * 0.2 - 0.1; // ±10% variance
      const finalHeight = Math.max(MIN_BAR_HEIGHT, Math.min(MAX_BAR_HEIGHT, targetHeight * (1 + variance)));
      
      Animated.spring(anim, {
        toValue: finalHeight,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    });
  }, [isRecording, audioLevel]);

  return (
    <View style={styles.container}>
      {barAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: anim,
              backgroundColor: isRecording ? '#4F46E5' : '#E5E7EB',
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: MAX_BAR_HEIGHT,
    marginVertical: 20,
  },
  bar: {
    width: BAR_WIDTH,
    marginHorizontal: BAR_GAP / 2,
    borderRadius: BAR_WIDTH / 2,
  },
}); 