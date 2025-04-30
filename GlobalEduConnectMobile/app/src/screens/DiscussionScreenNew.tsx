import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  Image,
  ActivityIndicator,
  Text,
  Alert
} from 'react-native';
import {
  TextInput,
  Avatar,
  Button,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getMessages, getClassById, sendMessage as sendMessageApi } from '../api';
import { RectangleSkeleton, SkeletonList, CircleSkeleton } from '../components/common/Skeleton';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DiscussionScreenRouteProp = RouteProp<
  { params: { classId: number } },
  'params'
>;

interface Message {
  id: string;
  userId: number;
  userName: string;
  userProfileImage?: string | null;
  content: string;
  timestamp: number;
  isLocal?: boolean;
  status?: 'sending' | 'sent' | 'error';
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const DiscussionScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  const route = useRoute<DiscussionScreenRouteProp>();
  const { classId } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { socket, isConnected, joinRoom, leaveRoom, emit } = useSocket();
  const { showToast } = useToast();
  
  const roomId = `class_${classId}`;
  
  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      // Try to send pending messages when reconnecting
      if (state.isConnected && pendingMessages.length > 0) {
        handleSendPendingMessages();
      }
    });
    
    return () => unsubscribe();
  }, [pendingMessages]);
  
  // Join socket room when connected
  useEffect(() => {
    if (isConnected) {
      joinRoom(roomId);
    }
    
    return () => {
      if (isConnected) {
        leaveRoom(roomId);
      }
    };
  }, [isConnected, roomId, joinRoom, leaveRoom]);
  
  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (newMessage: Message) => {
      // Don't add duplicate messages
      setMessages(prevMessages => {
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, newMessage];
      });
      
      // Scroll to bottom on new message
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };
    
    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);
  
  // Fetch class details
  const { 
    data: classData,
    isLoading: classLoading,
  } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClassById(classId),
    enabled: !!classId,
  });
  
  // Fetch messages from API
  const {
    data: apiMessages,
    isLoading: apiLoading,
    error: apiError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', classId],
    queryFn: () => getMessages(classId),
    enabled: !!classId,
    onSuccess: async (data) => {
      if (data && data.length > 0) {
        setMessages(data);
        
        // Cache messages for offline use
        try {
          await AsyncStorage.setItem(
            `messages_${classId}`,
            JSON.stringify({
              timestamp: Date.now(),
              data: data
            })
          );
        } catch (e) {
          console.error('Error caching messages:', e);
        }
        
        // Scroll to bottom on initial load
        if (flatListRef.current && !initialLoadDone) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
            setInitialLoadDone(true);
          }, 100);
        }
      }
      setIsLoading(false);
    },
    onError: async (error) => {
      console.error('Error fetching messages:', error);
      showToast('Failed to load messages. Attempting to use cached data.', 'warning');
      
      // Try to load cached messages
      try {
        const cachedData = await AsyncStorage.getItem(`messages_${classId}`);
        if (cachedData) {
          const { timestamp, data } = JSON.parse(cachedData);
          
          // Check if cache is still valid (within 24 hours)
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setMessages(data);
            showToast('Loaded cached messages', 'info');
          } else {
            showToast('Cached messages are too old', 'error');
          }
        }
      } catch (e) {
        console.error('Error loading cached messages:', e);
      }
      
      setIsLoading(false);
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessageApi(classId, content),
    onSuccess: (response) => {
      // Update query cache
      queryClient.invalidateQueries({ queryKey: ['messages', classId] });
      
      // Update local message status
      setMessages(prev => 
        prev.map(msg => 
          msg.isLocal && msg.content === response.content
            ? { ...response, isLocal: false, status: 'sent' }
            : msg
        )
      );
      
      // Remove from pending messages if it was there
      setPendingMessages(prev => prev.filter(msg => msg.content !== response.content));
    },
    onError: (error, content) => {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
      
      // Update message status to error
      setMessages(prev => 
        prev.map(msg => 
          msg.isLocal && msg.content === content
            ? { ...msg, status: 'error' }
            : msg
        )
      );
    }
  });
  
  // Handle sending pending messages
  const handleSendPendingMessages = useCallback(() => {
    [...pendingMessages].forEach(msg => {
      sendMessageMutation.mutate(msg.content);
    });
  }, [pendingMessages, sendMessageMutation]);
  
  // Handle message send
  const handleSendMessage = () => {
    if (!message.trim()) return;
    Keyboard.dismiss();
    
    const newMessage: Message = {
      id: `local_${Date.now()}`,
      userId: user?.id || 0,
      userName: user?.name || 'You',
      userProfileImage: user?.profileImage,
      content: message.trim(),
      timestamp: Date.now(),
      isLocal: true,
      status: 'sending'
    };
    
    // Add message to the list immediately for UI responsiveness
    setMessages(prev => [...prev, newMessage]);
    
    // Scroll to the bottom
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    // Clear input
    setMessage('');
    
    // If connected, send via socket
    if (isConnected && socket) {
      emit('send_message', {
        roomId,
        message: message.trim(),
        userId: user?.id,
        userName: user?.name
      });
    }
    
    // Also send via API for persistence
    if (!isOffline) {
      sendMessageMutation.mutate(message.trim());
    } else {
      // If offline, add to pending messages
      setPendingMessages(prev => [...prev, newMessage]);
      showToast('Message queued for sending when online', 'info');
      
      // Update UI to show pending status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id
            ? { ...msg, status: 'sending' }
            : msg
        )
      );
    }
  };
  
  // Retry sending a failed message
  const handleRetryMessage = (messageContent: string) => {
    if (!isOffline) {
      sendMessageMutation.mutate(messageContent);
      
      // Update UI to show sending status
      setMessages(prev => 
        prev.map(msg => 
          msg.isLocal && msg.content === messageContent
            ? { ...msg, status: 'sending' }
            : msg
        )
      );
    } else {
      showToast('Still offline. Message will be sent when connection is restored.', 'warning');
    }
  };
  
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
  
  // Render individual message
  const renderMessage = ({ item }: { item: Message }) => {
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
          isMine ? styles.myMessageBubble : styles.otherMessageBubble,
          item.status === 'error' && styles.errorBubble
        ]}>
          {!isMine && (
            <Text style={styles.messageSender}>{item.userName}</Text>
          )}
          
          <Text style={styles.messageText}>{item.content}</Text>
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {formatTimestamp(item.timestamp)}
            </Text>
            
            {item.status === 'sending' && (
              <MaterialCommunityIcons name="clock-outline" size={12} color="#999" style={styles.statusIcon} />
            )}
            
            {item.status === 'sent' && (
              <MaterialCommunityIcons name="check" size={12} color="#5CB85C" style={styles.statusIcon} />
            )}
            
            {item.status === 'error' && (
              <TouchableOpacity 
                onPress={() => handleRetryMessage(item.content)}
                style={styles.retryButton}
                accessibilityLabel="Retry sending message"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="refresh" size={14} color="#F44336" style={styles.statusIcon} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  // Render skeleton loading state
  const renderSkeletonLoading = () => (
    <View style={styles.skeletonContainer}>
      {/* Other user messages */}
      <View style={styles.skeletonMessage}>
        <CircleSkeleton size={36} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={40} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={12} style={{ alignSelf: 'flex-start' }} />
        </View>
      </View>
      
      {/* Current user messages */}
      <View style={[styles.skeletonMessage, { justifyContent: 'flex-end' }]}>
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <Skeleton width="70%" height={40} style={{ marginBottom: 4, alignSelf: 'flex-end' }} />
          <Skeleton width={60} height={12} style={{ alignSelf: 'flex-end' }} />
        </View>
      </View>
      
      {/* Other user messages */}
      <View style={styles.skeletonMessage}>
        <CircleSkeleton size={36} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={60} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={12} style={{ alignSelf: 'flex-start' }} />
        </View>
      </View>
    </View>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/empty-chat.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No messages yet</Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.mediumGrey }]}>
        Be the first to start the conversation!
      </Text>
    </View>
  );
  
  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons 
        name="alert-circle" 
        size={60} 
        color={theme.colors.error} 
      />
      <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
        Error Loading Messages
      </Text>
      <Text style={[styles.errorMessage, { color: theme.colors.mediumGrey }]}>
        {apiError?.message || 'Failed to load messages. Please try again.'}
      </Text>
      <Button 
        mode="contained" 
        onPress={() => refetchMessages()}
        style={styles.retryButton}
      >
        Retry
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={80}
    >
      {/* Offline banner */}
      {isOffline && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.colors.warning }]}>
          <MaterialCommunityIcons name="wifi-off" size={18} color="#000" />
          <Text style={styles.offlineBannerText}>
            You are offline. Messages will be sent when you reconnect.
          </Text>
        </View>
      )}
      
      {/* Header with class title */}
      {classData && (
        <View style={[styles.classInfoContainer, { backgroundColor: theme.colors.surface }]}>
          <Text 
            style={[styles.classTitle, { color: theme.colors.text }]} 
            numberOfLines={1}
          >
            {classData.title}
          </Text>
          <Text style={[styles.classParticipants, { color: theme.colors.mediumGrey }]}>
            {classData.enrollmentCount || 0} participants
          </Text>
        </View>
      )}
      
      <Divider />
      
      {/* Messages list */}
      {isLoading ? (
        renderSkeletonLoading()
      ) : apiError ? (
        renderErrorState()
      ) : messages.length === 0 ? (
        renderEmptyState()
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
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
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
              onPress={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              color={!message.trim() ? '#CCCCCC' : theme.colors.primary}
            />
          }
          accessibilityLabel="Message input"
          accessibilityHint="Type your message and press the send button"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
  },
  classInfoContainer: {
    padding: 16,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  classParticipants: {
    fontSize: 14,
    marginTop: 4,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonMessage: {
    flexDirection: 'row',
    marginBottom: 16,
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
  },
  messagesList: {
    padding: 16,
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
  errorBubble: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
  },
  statusIcon: {
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  retryText: {
    fontSize: 10,
    color: '#F44336',
    marginLeft: 2,
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  input: {
    maxHeight: 120,
  },
});

export default DiscussionScreen;