import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
  AccessibilityInfo,
  findNodeHandle,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define onboarding slides
const onboardingSlides = [
  {
    id: '1',
    title: 'Welcome to GlobalEduConnect',
    description: 'Connect with teachers and students around the world for an enriching learning experience.',
    image: require('../assets/onboarding-1.png'),
    iconName: 'school',
  },
  {
    id: '2',
    title: 'Learn Anywhere, Anytime',
    description: 'Access classes from anywhere in the world. Learn at your own pace with flexible scheduling.',
    image: require('../assets/onboarding-2.png'),
    iconName: 'clock-outline',
  },
  {
    id: '3',
    title: 'Join Live Discussions',
    description: 'Participate in real-time discussions with teachers and fellow students.',
    image: require('../assets/onboarding-3.png'),
    iconName: 'chat-processing',
  },
  {
    id: '4',
    title: 'Ready to Get Started?',
    description: 'Create an account or log in to begin your learning journey today!',
    image: require('../assets/onboarding-4.png'),
    iconName: 'rocket-launch',
  },
];

const OnboardingScreen = () => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Accessibility refs for announcing screens
  const slideRefs = useRef<Array<null | number>>(onboardingSlides.map(() => null));
  
  // Handle slide change
  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      
      // Announce for screen readers
      const currentRef = slideRefs.current[viewableItems[0].index];
      if (currentRef !== null) {
        AccessibilityInfo.isScreenReaderEnabled().then(isEnabled => {
          if (isEnabled) {
            const { title, description } = onboardingSlides[viewableItems[0].index];
            AccessibilityInfo.announceForAccessibility(
              `Screen ${viewableItems[0].index + 1} of ${onboardingSlides.length}: ${title}. ${description}`
            );
          }
        });
      }
    }
  }).current;
  
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  
  // Handle navigation to auth or home
  const handleGetStarted = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_complete', 'true');
      
      // Navigate to auth screen
      // @ts-ignore: navigation types
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };
  
  const handleSkip = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_complete', 'true');
      
      // Navigate to auth screen
      // @ts-ignore: navigation types
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };
  
  // Go to next slide
  const scrollToNextSlide = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };
  
  // Render individual slide
  const renderSlide = ({ item, index }: { item: typeof onboardingSlides[0]; index: number }) => {
    // Calculate input range for animations based on slide index
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    // Animate opacity
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
    
    // Animate translateY (slide in from bottom)
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [100, 0, 100],
      extrapolate: 'clamp',
    });
    
    return (
      <View 
        style={[styles.slide, { width, height: height * 0.85 }]}
        ref={ref => {
          const node = findNodeHandle(ref);
          slideRefs.current[index] = node;
        }}
        accessibilityLabel={`Onboarding screen ${index + 1} of ${onboardingSlides.length}`}
        accessible={true}
      >
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          {item.image ? (
            <Image 
              source={item.image} 
              style={styles.image}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel={`Illustration for ${item.title}`}
            />
          ) : (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={item.iconName} 
                size={120} 
                color={theme.colors.primary} 
              />
            </View>
          )}
          
          <Text 
            style={[styles.title, { color: theme.colors.text }]}
            accessibilityRole="header"
          >
            {item.title}
          </Text>
          
          <Text 
            style={[styles.description, { color: theme.colors.mediumGrey }]}
            accessibilityRole="text"
          >
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };
  
  // Render pagination dots
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationDots}>
          {onboardingSlides.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            
            // Animate dot width
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            
            // Animate dot opacity
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            
            return (
              <Animated.View
                key={index.toString()}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };
  
  // Render buttons (Next/Get Started & Skip)
  const renderButtons = () => {
    return (
      <View style={styles.buttonsContainer}>
        {currentIndex < onboardingSlides.length - 1 ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            accessibilityHint="Goes directly to the login screen"
          >
            <Text style={[styles.skipText, { color: theme.colors.mediumGrey }]}>
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyView} />
        )}
        
        <Button
          mode="contained"
          onPress={scrollToNextSlide}
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          labelStyle={styles.nextButtonText}
          accessibilityRole="button"
          accessibilityLabel={
            currentIndex === onboardingSlides.length - 1
              ? "Get Started"
              : "Next Screen"
          }
        >
          {currentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={onboardingSlides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
        scrollEventThrottle={32}
        accessible={false}
      />
      
      {renderPagination()}
      {renderButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  image: {
    width: 280,
    height: 280,
    marginBottom: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 130,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 30,
    minWidth: 140,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyView: {
    width: 50,
  },
});

export default OnboardingScreen;