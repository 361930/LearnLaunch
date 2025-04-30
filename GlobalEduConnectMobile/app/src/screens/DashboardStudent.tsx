import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  Image
} from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Avatar, 
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  useTheme,
  ProgressBar
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getClasses, getUserProfile } from '../api';

const DashboardStudent = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();

  // Fetch enrolled classes
  const { 
    data: enrolledClassesData,
    isLoading: enrolledLoading,
    error: enrolledError,
    refetch: refetchEnrolled
  } = useQuery({
    queryKey: ['enrolledClasses'],
    queryFn: () => getClasses({ enrolled: true }),
    enabled: !!user,
  });

  // Fetch recommended classes
  const {
    data: recommendedClassesData,
    isLoading: recommendedLoading,
    error: recommendedError,
    refetch: refetchRecommended
  } = useQuery({
    queryKey: ['recommendedClasses'],
    queryFn: () => getClasses({ recommended: true, limit: 3 }),
    enabled: !!user,
  });

  // Fetch user profile with detailed information
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: !!user,
  });

  const handleRefresh = () => {
    refetchEnrolled();
    refetchRecommended();
    refetchProfile();
  };

  const isLoading = enrolledLoading || recommendedLoading || profileLoading;
  const hasError = enrolledError || recommendedError || profileError;

  const navigateToClassDetail = (classId: number) => {
    // @ts-ignore: navigation types
    navigation.navigate('ClassDetail', { classId });
  };

  const navigateToAllClasses = () => {
    // @ts-ignore: navigation types
    navigation.navigate('Classes');
  };

  // Helper functions for formatting
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 0.3) return '#FF6B6B'; // Red for low progress
    if (progress < 0.7) return '#FFCC5C'; // Yellow for medium progress
    return '#4CAF50'; // Green for high progress
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <Title style={styles.welcomeTitle}>
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </Title>
          <Paragraph style={styles.welcomeSubtitle}>
            Track your progress and continue learning
          </Paragraph>
        </View>
        <Avatar.Image 
          size={60} 
          source={
            profileData?.profilePicture 
              ? { uri: profileData.profilePicture } 
              : require('../assets/default-avatar.png')
          } 
        />
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="book-open-variant" size={30} color={theme.colors.primary} />
          <Text style={styles.statValue}>
            {profileData?.enrollments?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="check-circle" size={30} color="#4CAF50" />
          <Text style={styles.statValue}>
            {profileData?.enrollments?.filter(e => e.progress === 100)?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="certificate" size={30} color="#FFCC5C" />
          <Text style={styles.statValue}>
            {profileData?.badges?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Enrolled Classes */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>My Classes</Title>
          <TouchableOpacity onPress={navigateToAllClasses}>
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {enrolledLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : enrolledError ? (
          <Text style={styles.errorText}>
            Failed to load your classes. Pull down to retry.
          </Text>
        ) : enrolledClassesData?.classes?.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <MaterialCommunityIcons 
                name="book-open-page-variant" 
                size={50} 
                color="#DDDDDD" 
                style={styles.emptyIcon}
              />
              <Paragraph style={styles.emptyText}>
                You're not enrolled in any classes yet
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={navigateToAllClasses}
                style={styles.emptyButton}
              >
                Browse Classes
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View>
            {enrolledClassesData?.classes?.slice(0, 3)?.map((classItem: any) => (
              <Card 
                key={classItem.id} 
                style={styles.classCard}
                onPress={() => navigateToClassDetail(classItem.id)}
              >
                <Card.Content>
                  <View style={styles.classHeader}>
                    <Title style={styles.className}>{classItem.title}</Title>
                    <Chip mode="outlined" style={styles.classChip}>
                      {classItem.subject}
                    </Chip>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelContainer}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressPercentage}>
                        {classItem.progress || 0}%
                      </Text>
                    </View>
                    <ProgressBar 
                      progress={(classItem.progress || 0) / 100} 
                      color={getProgressColor((classItem.progress || 0) / 100)}
                      style={styles.progressBar}
                    />
                  </View>

                  {classItem.nextSession && (
                    <View style={styles.nextSessionContainer}>
                      <MaterialCommunityIcons name="calendar-clock" size={16} color="#666" />
                      <Text style={styles.nextSessionText}>
                        Next: {formatDate(classItem.nextSession)}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Recommended Classes */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Recommended For You</Title>
          <TouchableOpacity onPress={navigateToAllClasses}>
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {recommendedLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : recommendedError ? (
          <Text style={styles.errorText}>
            Failed to load recommendations. Pull down to retry.
          </Text>
        ) : recommendedClassesData?.classes?.length === 0 ? (
          <Paragraph style={styles.emptyText}>No recommendations available</Paragraph>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedScrollContent}
          >
            {recommendedClassesData?.classes?.map((classItem: any) => (
              <Card 
                key={classItem.id} 
                style={styles.recommendedCard}
                onPress={() => navigateToClassDetail(classItem.id)}
              >
                <Card.Cover 
                  source={
                    classItem.coverImage 
                      ? { uri: classItem.coverImage } 
                      : require('../assets/default-class.jpg')
                  } 
                  style={styles.recommendedCardCover}
                />
                <Card.Content style={styles.recommendedCardContent}>
                  <Title style={styles.recommendedCardTitle} numberOfLines={1}>
                    {classItem.title}
                  </Title>
                  <View style={styles.recommendedCardDetails}>
                    <Chip size={20} style={styles.recommendedCardChip}>
                      {classItem.difficulty || 'Beginner'}
                    </Chip>
                    {classItem.averageRating > 0 && (
                      <View style={styles.ratingContainer}>
                        <MaterialCommunityIcons name="star" size={16} color="#FFCC5C" />
                        <Text style={styles.ratingText}>
                          {classItem.averageRating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Badges Section */}
      <View style={styles.sectionContainer}>
        <Title style={styles.sectionTitle}>My Achievements</Title>
        
        {profileLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : profileError ? (
          <Text style={styles.errorText}>
            Failed to load achievements. Pull down to retry.
          </Text>
        ) : !profileData?.badges || profileData.badges.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <MaterialCommunityIcons 
                name="trophy" 
                size={50} 
                color="#DDDDDD" 
                style={styles.emptyIcon}
              />
              <Paragraph style={styles.emptyText}>
                Complete classes to earn badges and track your achievements
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScrollContent}
          >
            {profileData.badges.map((badge: any) => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={styles.badgeIconContainer}>
                  <MaterialCommunityIcons 
                    name={badge.icon || "medal"} 
                    size={40} 
                    color={badge.color || theme.colors.primary} 
                  />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    width: '30%',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#666666',
    marginTop: 4,
  },
  sectionContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  classCard: {
    marginBottom: 12,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 16,
    flex: 1,
  },
  classChip: {
    height: 24,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666666',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  nextSessionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  nextSessionText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  recommendedScrollContent: {
    paddingRight: 15,
  },
  recommendedCard: {
    width: 200,
    marginRight: 15,
    elevation: 2,
  },
  recommendedCardCover: {
    height: 100,
  },
  recommendedCardContent: {
    padding: 10,
  },
  recommendedCardTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  recommendedCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedCardChip: {
    height: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  badgesScrollContent: {
    paddingRight: 15,
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    width: 80,
  },
  loader: {
    padding: 20,
  },
  errorText: {
    padding: 20,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  emptyCard: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  emptyIcon: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666666',
  },
  emptyButton: {
    marginTop: 10,
  },
  footer: {
    height: 20,
  },
});

export default DashboardStudent;