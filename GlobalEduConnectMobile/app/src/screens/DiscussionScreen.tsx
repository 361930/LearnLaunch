import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  Image,
  ActivityIndicator
} from 'react-native';
import {
  TextInput,
  Text,
  IconButton,
  Avatar,
  useTheme,
  Button,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage, markMessagesAsRead, getClassById } from '../api';
import * as firebase from 'firebase/app';
import { getDatabase, ref, onValue, push, set, serverTimestamp } from 'firebase/database';

type DiscussionScreenRouteProp = RouteProp<
  { params: { classId: number } },
  'params'
>;

const DiscussionScreen = () => {
  const [message, setMessage] = useState('');
  const [useFirebase, setUseFirebase] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  const route = useRoute<DiscussionScreenRouteProp>();
  const { classId } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Firebase reference
  const [firebaseMessages, setFirebaseMessages] = useState<any[]>([]);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);

  // Try to initialize Firebase, fallback to API if it fails
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if Firebase is initialized by getting messages
        const db = getDatabase();
        const messagesRef = ref(db, `messages/class_${classId}`);
        
        onValue(messagesRef, (snapshot) => {
          const data = snapshot.val();
          const messagesList = data ? Object.keys(data).map(key => ({
            id: key,
            ...data[key],
          })) : [];
          
          // Sort by timestamp
          messagesList.sort((a, b) => a.timestamp - b.timestamp);
          
          setFirebaseMessages(messagesList);
          setFirebaseLoading(false);
        }, (error) => {
          console.error("Firebase error:", error);
          setFirebaseError(error);
          setUseFirebase(false);
          setFirebaseLoading(false);
        });
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        setFirebaseError(error as Error);
        setUseFirebase(false);
        setFirebaseLoading(false);
      }
    };

    initializeFirebase();
  }, [classId]);

  // Fetch class details
  const { 
    data: classData,
    isLoading: classLoading,
  } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClassById(classId),
    enabled: !!classId,
  });

  // Fetch messages from API (fallback)
  const {
    data: apiMessages,
    isLoading: apiLoading,
    error: apiError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', classId],
    queryFn: () => getMessages(classId),
    enabled: !useFirebase,
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: () => markMessagesAsRead(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', classId] });
    },
  });

  // Send message mutation for API
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(classId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', classId] });
      setMessage('');
      // Scroll to bottom after sending
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    },
  });

  // Send message to Firebase
  const sendFirebaseMessage = async (content: string) => {
    if (!user) return;
    
    try {
      const db = getDatabase();
      const messagesRef = ref(db, `messages/class_${classId}`);
      const newMessageRef = push(messagesRef);
      
      await set(newMessageRef, {
        userId: user.id,
        userName: user.name,
        userProfileImage: user.profilePicture,
        content,
        timestamp: serverTimestamp(),
        readBy: [user.id]
      });
      
      setMessage('');
      
      // Scroll to bottom after sending
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message to Firebase:", error);
      // Fallback to API
      setUseFirebase(false);
      sendMessageMutation.mutate(content);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    Keyboard.dismiss();

    if (useFirebase) {
      sendFirebaseMessage(message.trim());
    } else {
      sendMessageMutation.mutate(message.trim());
    }
  };

  // Mark messages as read when opening the screen
  useEffect(() => {
    if (!useFirebase) {
      markAsReadMutation.mutate();
    }
  }, [useFirebase]);

  // Calculate whether a message is from the current user
  const isCurrentUser = (messageUserId: number) => {
    return user?.id === messageUserId;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp) 
      : new Date(timestamp);
    
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle between Firebase and API (for testing)
  const toggleDataSource = () => {
    setUseFirebase(!useFirebase);
  };

  // Determine what messages to display
  const messages = useFirebase ? firebaseMessages : apiMessages || [];
  const isLoading = useFirebase ? firebaseLoading : apiLoading;
  const error = useFirebase ? firebaseError : apiError;

  // Render individual message
  const renderMessage = ({ item }: { item: any }) => {
    const isMine = isCurrentUser(item.userId);
    
    return (
      <View style={[
        styles.messageContainer,
        isMine ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMine && (
          <Avatar.Image
            size={36}
            source={
              item.userProfileImage 
                ? { uri: item.userProfileImage } 
                : require('../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isMine ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          {!isMine && (
            <Text style={styles.messageSender}>{item.userName}</Text>
          )}
          
          <Text style={styles.messageText}>{item.content}</Text>
          
          <Text style={styles.messageTime}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      {/* Header with class title */}
      {classData && (
        <View style={styles.classInfoContainer}>
          <Text style={styles.classTitle} numberOfLines={1}>
            {classData.title}
          </Text>
          <Text style={styles.classParticipants}>
            {classData.enrollmentCount || 0} participants
          </Text>
        </View>
      )}
      
      <Divider />
      
      {/* Messages list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Error Loading Messages</Text>
          <Text style={styles.errorMessage}>
            {error.message || 'Failed to load messages. Please try again.'}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => useFirebase ? toggleDataSource() : refetchMessages()}
            style={styles.retryButton}
          >
            {useFirebase ? 'Switch to API' : 'Retry'}
          </Button>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/empty-chat.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyMessage}>
            Be the first to start the conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}
      
      {/* Message input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          mode="outlined"
          multiline
          maxLength={500}
          style={styles.input}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              color={!message.trim() ? '#CCCCCC' : theme.colors.primary}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  classInfoContainer: {
    padding: 10,
    backgroundColor: 'white',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  classParticipants: {
    fontSize: 12,
    color: '#666',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  messagesList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '75%',
  },
  myMessageBubble: {
    backgroundColor: '#4C6EF5',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#EEEEEE',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  input: {
    maxHeight: 120,
  },
});

export default DiscussionScreen;