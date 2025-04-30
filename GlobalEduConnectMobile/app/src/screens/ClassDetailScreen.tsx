import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Share,
  Dimensions
} from 'react-native';
import { 
  Text, 
  Title, 
  Paragraph, 
  Button, 
  Chip,
  Card,
  Avatar,
  Divider,
  useTheme,
  IconButton,
  Portal,
  Modal,
  ActivityIndicator,
  ProgressBar,
  TextInput
} from 'react-native-paper';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClassById, joinClass, rateClass } from '../api';

type ClassDetailScreenRouteProp = RouteProp<
  { params: { classId: number } },
  'params'
>;

const ClassDetailScreen = () => {
  const route = useRoute<ClassDetailScreenRouteProp>();
  const { classId } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const windowWidth = Dimensions.get('window').width;

  // State for modals
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  // Fetch class details
  const { 
    data: classData, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClassById(classId),
    enabled: !!classId,
  });

  // Join class mutation
  const joinClassMutation = useMutation({
    mutationFn: () => joinClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
      queryClient.invalidateQueries({ queryKey: ['enrolledClasses'] });
      Alert.alert('Success', 'You have joined this class!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to join class. Please try again.');
    },
  });

  // Rate class mutation
  const rateClassMutation = useMutation({
    mutationFn: ({ rating, review }: { rating: number; review: string }) => 
      rateClass(classId, { rating, review }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
      setShowRatingModal(false);
      setRating(0);
      setReview('');
      Alert.alert('Thank You!', 'Your rating has been submitted.');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to submit rating. Please try again.');
    },
  });

  const handleJoinClass = () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please login to join this class.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: () => {
              // @ts-ignore: navigation types
              navigation.navigate('Login');
            } 
          }
        ]
      );
      return;
    }

    // Confirm join
    Alert.alert(
      'Join Class',
      'Do you want to enroll in this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: () => joinClassMutation.mutate() }
      ]
    );
  };

  const handleShareClass = async () => {
    try {
      await Share.share({
        message: `Check out this class: ${classData.title} on GlobalEduConnect!`,
        url: `globaleduconnect://classes/${classId}`,
      });
    } catch (error) {
      console.error('Error sharing class:', error);
    }
  };

  const navigateToDiscussion = () => {
    // @ts-ignore: navigation types
    navigation.navigate('Discussion', { classId });
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating before submitting.');
      return;
    }

    rateClassMutation.mutate({ rating, review });
  };

  // Check if user has enrolled in this class
  const isEnrolled = classData?.enrollment && user;
  const isTeacher = user?.role === 'teacher';
  const isCreator = classData?.createdBy === user?.id;

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading class details...</Text>
      </View>
    );
  }

  // Render error state
  if (error || !classData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Error Loading Class</Text>
        <Text style={styles.errorMessage}>
          {error?.message || 'Failed to load class details. Please try again.'}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => refetch()}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  // Render star rating selector
  const renderRatingSelector = () => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <MaterialCommunityIcons
              name={rating >= star ? 'star' : 'star-outline'}
              size={32}
              color={rating >= star ? '#FFCC5C' : '#CCCCCC'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Class Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>{classData.title}</Title>
            <View style={styles.chipsContainer}>
              <Chip mode="outlined" style={styles.chip}>{classData.subject}</Chip>
              <Chip mode="outlined" style={styles.chip}>{classData.difficulty || 'Beginner'}</Chip>
              {classData.isActive && (
                <Chip 
                  mode="outlined" 
                  style={[styles.chip, { borderColor: '#4CAF50' }]}
                  textStyle={{ color: '#4CAF50' }}
                >
                  Active
                </Chip>
              )}
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <IconButton
              icon="share-variant"
              size={24}
              onPress={handleShareClass}
            />
            {user && !isCreator && !isEnrolled && !isTeacher && (
              <Button 
                mode="contained"
                onPress={handleJoinClass}
                loading={joinClassMutation.isPending}
                disabled={joinClassMutation.isPending}
                style={styles.joinButton}
              >
                Join Class
              </Button>
            )}
            {isEnrolled && (
              <Button 
                mode="contained"
                onPress={navigateToDiscussion}
                icon="chat"
                style={styles.discussionButton}
              >
                Discussion
              </Button>
            )}
          </View>
        </View>
        
        <Divider />
        
        {/* Main Content */}
        <View style={styles.content}>
          {/* Description Section */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>About This Class</Title>
              <Paragraph style={styles.description}>{classData.description}</Paragraph>
              
              {classData.tags?.length > 0 && (
                <View style={styles.tagsContainer}>
                  {classData.tags.map((tag, index) => (
                    <Chip 
                      key={index} 
                      mode="outlined" 
                      style={styles.tagChip}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
          
          {/* Teacher Info */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Instructor</Title>
              <View style={styles.teacherContainer}>
                <Avatar.Image
                  size={60}
                  source={
                    classData.teacher?.profileImage 
                      ? { uri: classData.teacher.profileImage } 
                      : require('../assets/default-avatar.png')
                  }
                />
                <View style={styles.teacherInfo}>
                  <Text style={styles.teacherName}>
                    {classData.teacher?.name || 'Unknown Teacher'}
                  </Text>
                  
                  {classData.teacher?.averageRating > 0 && (
                    <View style={styles.teacherRating}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFCC5C" />
                      <Text style={styles.ratingValue}>
                        {classData.teacher.averageRating.toFixed(1)}
                      </Text>
                      <Text style={styles.ratingCount}>
                        ({classData.teacher.totalRatings || 0} ratings)
                      </Text>
                    </View>
                  )}
                  
                  {classData.teacher?.bio && (
                    <Paragraph style={styles.teacherBio} numberOfLines={3}>
                      {classData.teacher.bio}
                    </Paragraph>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
          
          {/* Class Schedule */}
          {classData.schedule?.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Class Schedule</Title>
                {classData.schedule.map((session, index) => (
                  <View key={index} style={styles.scheduleItem}>
                    <MaterialCommunityIcons name="calendar-clock" size={24} color="#666" />
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleDate}>{formatDate(session.date)}</Text>
                      {session.topic && (
                        <Text style={styles.scheduleTopic}>{session.topic}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
          
          {/* Enrollment Information */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Enrollment</Title>
              <View style={styles.enrollmentInfo}>
                <View style={styles.enrollmentStat}>
                  <MaterialCommunityIcons name="account-group" size={24} color="#666" />
                  <Text style={styles.enrollmentStatValue}>
                    {classData.enrollmentCount || 0}
                  </Text>
                  <Text style={styles.enrollmentStatLabel}>Students</Text>
                </View>
                
                {classData.maxStudents && (
                  <View style={styles.enrollmentStat}>
                    <MaterialCommunityIcons name="account-multiple-check" size={24} color="#666" />
                    <Text style={styles.enrollmentStatValue}>
                      {Math.max(classData.maxStudents - (classData.enrollmentCount || 0), 0)}
                    </Text>
                    <Text style={styles.enrollmentStatLabel}>Spots Left</Text>
                  </View>
                )}
                
                <View style={styles.enrollmentStat}>
                  <MaterialCommunityIcons 
                    name={classData.language === 'English' ? 'translate' : 'web'} 
                    size={24} 
                    color="#666" 
                  />
                  <Text style={styles.enrollmentStatValue}>
                    {classData.language || 'English'}
                  </Text>
                  <Text style={styles.enrollmentStatLabel}>Language</Text>
                </View>
              </View>
              
              {classData.maxStudents && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelContainer}>
                    <Text style={styles.progressLabel}>Enrollment</Text>
                    <Text style={styles.progressPercentage}>
                      {Math.round((classData.enrollmentCount / classData.maxStudents) * 100)}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={classData.enrollmentCount / classData.maxStudents}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                </View>
              )}
            </Card.Content>
          </Card>
          
          {/* Ratings & Reviews */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.ratingsHeader}>
                <Title style={styles.sectionTitle}>Ratings & Reviews</Title>
                {isEnrolled && !isCreator && (
                  <Button 
                    mode="text" 
                    onPress={() => setShowRatingModal(true)}
                    style={styles.rateButton}
                  >
                    Rate this class
                  </Button>
                )}
              </View>
              
              {classData.averageRating > 0 ? (
                <View style={styles.ratingSummary}>
                  <Text style={styles.ratingAverage}>{classData.averageRating.toFixed(1)}</Text>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialCommunityIcons
                        key={star}
                        name={classData.averageRating >= star ? 'star' : 'star-outline'}
                        size={20}
                        color="#FFCC5C"
                      />
                    ))}
                    <Text style={styles.ratingCount}>
                      ({classData.ratings?.length || 0} reviews)
                    </Text>
                  </View>
                </View>
              ) : (
                <Paragraph style={styles.noReviews}>No reviews yet</Paragraph>
              )}
              
              {classData.ratings?.length > 0 && (
                <View style={styles.reviewsList}>
                  {classData.ratings.slice(0, 3).map((review: any) => (
                    <View key={review.id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          <Avatar.Image
                            size={40}
                            source={
                              review.userProfileImage 
                                ? { uri: review.userProfileImage } 
                                : require('../assets/default-avatar.png')
                            }
                          />
                          <Text style={styles.reviewerName}>
                            {review.userName || 'Anonymous User'}
                          </Text>
                        </View>
                        <View style={styles.reviewRating}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialCommunityIcons
                              key={star}
                              name={review.rating >= star ? 'star' : 'star-outline'}
                              size={16}
                              color="#FFCC5C"
                            />
                          ))}
                        </View>
                      </View>
                      {review.review && (
                        <Paragraph style={styles.reviewText}>
                          {review.review}
                        </Paragraph>
                      )}
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                  
                  {classData.ratings.length > 3 && (
                    <Button 
                      mode="text" 
                      onPress={() => {}}
                      style={styles.moreReviewsButton}
                    >
                      See all {classData.ratings.length} reviews
                    </Button>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      
      {/* Rating Modal */}
      <Portal>
        <Modal
          visible={showRatingModal}
          onDismiss={() => setShowRatingModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Rate This Class</Title>
          <Paragraph style={styles.modalSubtitle}>
            How would you rate your experience?
          </Paragraph>
          
          {renderRatingSelector()}
          
          <TextInput
            label="Review (optional)"
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
            style={styles.reviewInput}
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowRatingModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained"
              onPress={handleSubmitRating}
              loading={rateClassMutation.isPending}
              disabled={rateClassMutation.isPending || rating === 0}
              style={styles.modalButton}
            >
              Submit
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  retryButton: {
    marginTop: 10,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  joinButton: {
    marginLeft: 8,
  },
  discussionButton: {
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  teacherInfo: {
    marginLeft: 16,
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teacherRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingValue: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  ratingCount: {
    marginLeft: 4,
    color: '#666',
    fontSize: 12,
  },
  teacherBio: {
    fontSize: 14,
    color: '#666',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleInfo: {
    marginLeft: 12,
  },
  scheduleDate: {
    fontSize: 16,
    marginBottom: 2,
  },
  scheduleTopic: {
    fontSize: 14,
    color: '#666',
  },
  enrollmentInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  enrollmentStat: {
    alignItems: 'center',
    width: '30%',
  },
  enrollmentStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  enrollmentStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  ratingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateButton: {
    marginRight: -8,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingAverage: {
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noReviews: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  reviewsList: {
    marginTop: 16,
  },
  reviewItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  moreReviewsButton: {
    alignSelf: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 5,
  },
  reviewInput: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default ClassDetailScreen;