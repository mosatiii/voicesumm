import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface WaveformProps {
  isActive: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animation.setValue(0);
    }

    return () => {
      animation.setValue(0);
    };
  }, [isActive]);

  const bars = Array.from({ length: 30 }, (_, index) => {
    const inputRange = [0, 0.5, 1];
    const outputRange = [
      1,
      index % 2 === 0 ? 1.5 : 1.2,
      1,
    ];

    const scaleY = animation.interpolate({
      inputRange,
      outputRange,
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.bar,
          {
            transform: [{ scaleY }],
            backgroundColor: '#4B7BF5',
          },
        ]}
      />
    );
  });

  return (
    <View style={styles.container}>
      {bars}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  bar: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
    marginHorizontal: 2,
  },
}); 