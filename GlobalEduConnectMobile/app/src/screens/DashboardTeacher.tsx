import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Avatar, 
  Button,
  Chip,
  useTheme,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getClasses, getUserProfile } from '../api';

const DashboardTeacher = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();

  // Fetch classes created by this teacher
  const { 
    data: classesData,
    isLoading: classesLoading,
    error: classesError,
    refetch: refetchClasses
  } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn: () => getClasses({ createdBy: 'self' }),
    enabled: !!user,
  });

  // Fetch teacher profile with additional information
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['teacherProfile'],
    queryFn: getUserProfile,
    enabled: !!user,
  });

  const handleRefresh = () => {
    refetchClasses();
    refetchProfile();
  };

  const isLoading = classesLoading || profileLoading;
  const hasError = classesError || profileError;

  const navigateToClassDetail = (classId: number) => {
    // @ts-ignore: navigation types
    navigation.navigate('ClassDetail', { classId });
  };

  const navigateToCreateClass = () => {
    // @ts-ignore: navigation types
    navigation.navigate('CreateClass');
  };

  // Helper functions for data presentation
  const getEnrollmentStatus = (enrollmentCount: number, maxStudents?: number) => {
    if (!maxStudents) return `${enrollmentCount} students enrolled`;
    
    const percentFilled = (enrollmentCount / maxStudents) * 100;
    if (percentFilled >= 90) {
      return `Almost full! ${enrollmentCount}/${maxStudents} students`;
    } else {
      return `${enrollmentCount}/${maxStudents} students enrolled`;
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getClassStatusChip = (classItem: any) => {
    if (!classItem.isActive) {
      return (
        <Chip 
          mode="outlined" 
          style={[styles.statusChip, { borderColor: '#9E9E9E' }]}
          textStyle={{ color: '#9E9E9E' }}
        >
          Inactive
        </Chip>
      );
    }
    
    if (classItem.enrollmentCount >= (classItem.maxStudents || 100)) {
      return (
        <Chip 
          mode="outlined" 
          style={[styles.statusChip, { borderColor: '#FF6B6B' }]}
          textStyle={{ color: '#FF6B6B' }}
        >
          Full
        </Chip>
      );
    }
    
    return (
      <Chip 
        mode="outlined" 
        style={[styles.statusChip, { borderColor: '#4CAF50' }]}
        textStyle={{ color: '#4CAF50' }}
      >
        Active
      </Chip>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Teacher Info Section */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileCardContent}>
            <Avatar.Image 
              size={80} 
              source={
                profileData?.profilePicture 
                  ? { uri: profileData.profilePicture } 
                  : require('../assets/default-avatar.png')
              } 
            />
            <View style={styles.profileInfo}>
              <Title style={styles.profileName}>{user?.name || 'Teacher'}</Title>
              <View style={styles.profileMetaRow}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color="#666" />
                <Text style={styles.profileMetaText}>
                  {classesData?.classes?.length || 0} Classes Created
                </Text>
              </View>
              {profileData?.teacherProfile?.averageRating > 0 && (
                <View style={styles.profileMetaRow}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFCC5C" />
                  <Text style={styles.profileMetaText}>
                    {profileData.teacherProfile.averageRating.toFixed(1)} Rating
                  </Text>
                </View>
              )}
              {profileData?.teacherProfile?.totalStudents > 0 && (
                <View style={styles.profileMetaRow}>
                  <MaterialCommunityIcons name="account-group" size={16} color="#666" />
                  <Text style={styles.profileMetaText}>
                    {profileData.teacherProfile.totalStudents} Total Students
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="teach" size={30} color={theme.colors.primary} />
            <Text style={styles.statValue}>
              {classesData?.classes?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="account-group" size={30} color={theme.colors.accent} />
            <Text style={styles.statValue}>
              {profileData?.teacherProfile?.totalStudents || 0}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="star-circle" size={30} color="#FFCC5C" />
            <Text style={styles.statValue}>
              {profileData?.teacherProfile?.totalReviews || 0}
            </Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* My Classes */}
        <View style={styles.classesSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>My Classes</Title>
            <Button 
              mode="contained" 
              onPress={navigateToCreateClass}
              labelStyle={{ fontSize: 12 }}
              compact
            >
              Create Class
            </Button>
          </View>

          {classesLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : classesError ? (
            <Text style={styles.errorText}>
              Failed to load your classes. Pull down to retry.
            </Text>
          ) : classesData?.classes?.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <MaterialCommunityIcons 
                  name="teach" 
                  size={50} 
                  color="#DDDDDD" 
                  style={styles.emptyIcon}
                />
                <Paragraph style={styles.emptyText}>
                  You haven't created any classes yet
                </Paragraph>
                <Button 
                  mode="contained" 
                  onPress={navigateToCreateClass}
                  style={styles.emptyButton}
                >
                  Create Your First Class
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <View>
              {classesData?.classes?.map((classItem: any) => (
                <Card 
                  key={classItem.id} 
                  style={styles.classCard}
                  onPress={() => navigateToClassDetail(classItem.id)}
                >
                  <Card.Content>
                    <View style={styles.classHeader}>
                      <View style={styles.classHeaderLeft}>
                        <Title style={styles.className}>{classItem.title}</Title>
                        <Chip mode="outlined" style={styles.subjectChip}>
                          {classItem.subject}
                        </Chip>
                      </View>
                      {getClassStatusChip(classItem)}
                    </View>
                    
                    <Paragraph style={styles.classDescription} numberOfLines={2}>
                      {classItem.description}
                    </Paragraph>
                    
                    <View style={styles.classStatsRow}>
                      <View style={styles.classStatItem}>
                        <MaterialCommunityIcons name="account-group" size={16} color="#666" />
                        <Text style={styles.classStatText}>
                          {getEnrollmentStatus(classItem.enrollmentCount, classItem.maxStudents)}
                        </Text>
                      </View>
                      
                      {classItem.averageRating > 0 && (
                        <View style={styles.classStatItem}>
                          <MaterialCommunityIcons name="star" size={16} color="#FFCC5C" />
                          <Text style={styles.classStatText}>
                            {classItem.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.classDates}>
                      <Text style={styles.classDateText}>
                        Created: {formatDate(classItem.createdAt)}
                      </Text>
                      
                      {classItem.nextSession && (
                        <View style={styles.classStatItem}>
                          <MaterialCommunityIcons name="calendar-clock" size={14} color="#666" />
                          <Text style={[styles.classStatText, styles.nextSessionText]}>
                            Next: {formatDate(classItem.nextSession)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={navigateToCreateClass}
        label="Create Class"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  profileCard: {
    margin: 15,
    elevation: 2,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    marginBottom: 5,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profileMetaText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    width: '30%',
    elevation: 1,
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
  classesSection: {
    paddingHorizontal: 15,
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
  classCard: {
    marginBottom: 15,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  classHeaderLeft: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    marginBottom: 5,
  },
  subjectChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusChip: {
    height: 26,
  },
  classDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  classStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  classStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  classStatText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  classDates: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classDateText: {
    fontSize: 12,
    color: '#666666',
  },
  nextSessionText: {
    fontWeight: 'bold',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DashboardTeacher;