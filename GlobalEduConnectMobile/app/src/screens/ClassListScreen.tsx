import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Searchbar, 
  Chip,
  Button,
  Menu,
  Divider,
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getClasses } from '../api';

const ClassListScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    subject: '',
    language: '',
    difficulty: ''
  });
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);

  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();

  // Available filter options
  const subjects = ['Mathematics', 'Science', 'Languages', 'Arts', 'Technology', 'History', 'All'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'All'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'All'];

  // Fetch classes with pagination and filters
  const { 
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage
  } = useQuery({
    queryKey: ['classes', searchQuery, filters, page],
    queryFn: () => getClasses({
      search: searchQuery,
      subject: filters.subject !== 'All' ? filters.subject : undefined,
      language: filters.language !== 'All' ? filters.language : undefined,
      difficulty: filters.difficulty !== 'All' ? filters.difficulty : undefined,
      page,
      limit: 10
    }),
    keepPreviousData: true,
  });

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) {
      setPage(prev => prev + 1);
      fetchNextPage();
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      language: '',
      difficulty: ''
    });
  };

  const navigateToClassDetail = (classId: number) => {
    // @ts-ignore: navigation types
    navigation.navigate('ClassDetail', { classId });
  };

  const navigateToSearch = () => {
    // @ts-ignore: navigation types
    navigation.navigate('Search');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render an individual class card
  const renderClassItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.classCard}
      onPress={() => navigateToClassDetail(item.id)}
    >
      <Card.Content>
        <View style={styles.classHeader}>
          <Title style={styles.classTitle} numberOfLines={1}>
            {item.title}
          </Title>
          {item.isActive && (
            <Chip 
              mode="outlined" 
              style={[styles.activeChip, { borderColor: '#4CAF50' }]}
              textStyle={{ color: '#4CAF50', fontSize: 12 }}
            >
              Active
            </Chip>
          )}
        </View>
        
        <Paragraph style={styles.classDescription} numberOfLines={2}>
          {item.description}
        </Paragraph>
        
        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="book-open-variant" size={16} color="#666" />
            <Text style={styles.detailText}>{item.subject}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={16} color="#666" />
            <Text style={styles.detailText}>
              {`by ${item.teacherName || 'Unknown Teacher'}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="translate" size={16} color="#666" />
            <Text style={styles.detailText}>{item.language || 'English'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="signal-cellular-2" size={16} color="#666" />
            <Text style={styles.detailText}>{item.difficulty || 'Beginner'}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.classFooter}>
          <View style={styles.ratingContainer}>
            {item.averageRating > 0 ? (
              <>
                <MaterialCommunityIcons name="star" size={16} color="#FFCC5C" />
                <Text style={styles.ratingText}>
                  {item.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ratingCount}>
                  ({item.ratingCount || 0})
                </Text>
              </>
            ) : (
              <Text style={styles.noRatingText}>No ratings yet</Text>
            )}
          </View>
          
          <Text style={styles.dateText}>
            Created: {formatDate(item.createdAt)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderFooter = () => {
    if (!isFetching) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.footerText}>Loading more classes...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="book-search" size={60} color="#DDDDDD" />
        <Text style={styles.emptyText}>No classes found</Text>
        {(searchQuery || filters.subject || filters.language || filters.difficulty) && (
          <Button 
            mode="outlined" 
            onPress={clearFilters}
            style={styles.clearButton}
          >
            Clear Filters
          </Button>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Search classes..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <Menu
            visible={showSubjectMenu}
            onDismiss={() => setShowSubjectMenu(false)}
            anchor={
              <Chip
                mode="outlined"
                onPress={() => setShowSubjectMenu(true)}
                style={[
                  styles.filterChip,
                  filters.subject ? { backgroundColor: theme.colors.primary + '20' } : {}
                ]}
                icon="book-open-page-variant"
              >
                {filters.subject || 'Subject'}
              </Chip>
            }
            style={styles.menu}
          >
            {subjects.map(subject => (
              <Menu.Item
                key={subject}
                title={subject}
                onPress={() => {
                  setFilters(prev => ({...prev, subject: subject === 'All' ? '' : subject}));
                  setShowSubjectMenu(false);
                }}
              />
            ))}
          </Menu>
          
          <Menu
            visible={showLanguageMenu}
            onDismiss={() => setShowLanguageMenu(false)}
            anchor={
              <Chip
                mode="outlined"
                onPress={() => setShowLanguageMenu(true)}
                style={[
                  styles.filterChip,
                  filters.language ? { backgroundColor: theme.colors.primary + '20' } : {}
                ]}
                icon="translate"
              >
                {filters.language || 'Language'}
              </Chip>
            }
            style={styles.menu}
          >
            {languages.map(language => (
              <Menu.Item
                key={language}
                title={language}
                onPress={() => {
                  setFilters(prev => ({...prev, language: language === 'All' ? '' : language}));
                  setShowLanguageMenu(false);
                }}
              />
            ))}
          </Menu>
          
          <Menu
            visible={showDifficultyMenu}
            onDismiss={() => setShowDifficultyMenu(false)}
            anchor={
              <Chip
                mode="outlined"
                onPress={() => setShowDifficultyMenu(true)}
                style={[
                  styles.filterChip,
                  filters.difficulty ? { backgroundColor: theme.colors.primary + '20' } : {}
                ]}
                icon="signal"
              >
                {filters.difficulty || 'Difficulty'}
              </Chip>
            }
            style={styles.menu}
          >
            {difficulties.map(difficulty => (
              <Menu.Item
                key={difficulty}
                title={difficulty}
                onPress={() => {
                  setFilters(prev => ({...prev, difficulty: difficulty === 'All' ? '' : difficulty}));
                  setShowDifficultyMenu(false);
                }}
              />
            ))}
          </Menu>
          
          {(filters.subject || filters.language || filters.difficulty) && (
            <Chip
              mode="outlined"
              onPress={clearFilters}
              style={styles.filterChip}
              icon="close-circle"
            >
              Clear Filters
            </Chip>
          )}
        </ScrollView>
      </View>
      
      <FlatList
        data={data?.classes}
        renderItem={renderClassItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading && !isFetching} 
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchBarContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  filtersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: 'white',
  },
  filtersScroll: {
    paddingHorizontal: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  menu: {
    marginTop: 40,
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  classCard: {
    marginBottom: 10,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  classTitle: {
    fontSize: 16,
    flex: 1,
  },
  activeChip: {
    height: 24,
  },
  classDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  classDetails: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    minWidth: '40%',
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  divider: {
    marginBottom: 12,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  ratingCount: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 4,
  },
  noRatingText: {
    color: '#666666',
    fontSize: 12,
  },
  dateText: {
    color: '#666666',
    fontSize: 12,
  },
  footer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    marginBottom: 20,
  },
  clearButton: {
    marginTop: 10,
  },
});

export default ClassListScreen;