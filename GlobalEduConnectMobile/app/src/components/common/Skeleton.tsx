import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Easing } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
  animation = 'pulse',
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const translateX = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (animation === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else if (animation === 'wave') {
      Animated.loop(
        Animated.timing(translateX, {
          toValue: 100,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ).start();
    }

    return () => {
      fadeAnim.stopAnimation();
      translateX.stopAnimation();
    };
  }, [animation, fadeAnim, translateX]);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        },
        style,
      ]}
    >
      {animation === 'pulse' && (
        <Animated.View
          style={[
            styles.animation,
            {
              opacity: fadeAnim,
              backgroundColor: theme.isDarkMode
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.2)',
            },
          ]}
        />
      )}
      {animation === 'wave' && (
        <Animated.View
          style={[
            styles.waveAnimation,
            {
              transform: [{ translateX }],
              backgroundColor: theme.isDarkMode
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.2)',
            },
          ]}
        />
      )}
    </View>
  );
};

interface SkeletonListProps {
  count: number;
  width?: number | string;
  height?: number | string;
  spacing?: number;
  style?: ViewStyle;
  rowStyle?: ViewStyle;
  animation?: 'pulse' | 'wave' | 'none';
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count,
  width,
  height,
  spacing = 8,
  style,
  rowStyle,
  animation = 'pulse',
}) => {
  return (
    <View style={[styles.listContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width={width}
          height={height}
          style={[{ marginBottom: spacing }, rowStyle]}
          animation={animation}
        />
      ))}
    </View>
  );
};

interface CircleSkeletonProps {
  size?: number;
  style?: ViewStyle;
  animation?: 'pulse' | 'wave' | 'none';
}

export const CircleSkeleton: React.FC<CircleSkeletonProps> = ({
  size = 40,
  style,
  animation = 'pulse',
}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      animation={animation}
    />
  );
};

interface RectangleSkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  animation?: 'pulse' | 'wave' | 'none';
}

export const RectangleSkeleton: React.FC<RectangleSkeletonProps> = ({
  width = '100%',
  height = 200,
  style,
  animation = 'pulse',
}) => {
  return (
    <Skeleton
      width={width}
      height={height}
      style={style}
      animation={animation}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  animation: {
    ...StyleSheet.absoluteFillObject,
  },
  waveAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '200%',
    opacity: 0.5,
  },
  listContainer: {
    width: '100%',
  },
});

export default Skeleton;