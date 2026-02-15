import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Message, Profile, Conversation, Post, PostImage } from '@/types/database';

type ConversationDetails = Conversation & {
  posts: (Pick<Post, 'id' | 'title' | 'price' | 'status'> & {
    post_images: Pick<PostImage, 'image_url'>[];
  }) | null;
  buyer: Profile;
  seller: Profile;
};

type MessageItem = Message & {
  profiles: Profile;
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          posts:post_id (
            id,
            title,
            price,
            status,
            post_images (image_url)
          ),
          buyer:buyer_id (*),
          seller:seller_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setConversation(data as any as ConversationDetails);

      // Check if blocked
      const otherUserId = data.buyer_id === user?.id ? data.seller_id : data.buyer_id;
      const { data: blockData } = await supabase
        .from('blocks')
        .select('id')
        .or(`blocker_id.eq.${user?.id}.and.blocked_id.eq.${otherUserId},blocker_id.eq.${otherUserId}.and.blocked_id.eq.${user?.id}`)
        .limit(1);

      setIsBlocked(!!(blockData && blockData.length > 0));
    } catch (error) {
      console.error('Error fetching conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
      router.back();
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (*)
        `)
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as any as MessageItem[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversation || !user) return;

    const updateField = conversation.buyer_id === user.id
      ? 'buyer_unread_count'
      : 'seller_unread_count';

    await supabase
      .from('conversations')
      .update({ [updateField]: 0 })
      .eq('id', id);
  };

  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [id]);

  useEffect(() => {
    if (conversation) {
      markAsRead();
    }
  }, [conversation]);

  // Handle keyboard on Android
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShow = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(e.endCoordinates.height);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
      }
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from('messages')
            .select(`*, profiles:sender_id (*)`)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data as any as MessageItem]);
            markAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending || isBlocked || !user) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: id,
        sender_id: user.id,
        content: messageText,
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = () => {
    if (!conversation || !user) return null;
    return conversation.buyer_id === user.id ? conversation.seller : conversation.buyer;
  };

  const renderMessage = ({ item, index }: { item: MessageItem; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender_id !== item.sender_id);

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={[styles.avatarSpace, !showAvatar && styles.avatarSpaceHidden]}>
            {showAvatar && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.profiles?.nickname || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {new Date(item.created_at).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </Text>
        </View>
      </View>
    );
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const chatContent = (
    <>
      {/* Product Header */}
      {conversation?.posts && (
        <TouchableOpacity
          style={styles.productHeader}
          onPress={() => router.push(`/post/${conversation.posts!.id}` as any)}
          activeOpacity={0.7}
        >
          <View style={styles.productImageContainer}>
            {conversation.posts.post_images?.[0]?.image_url ? (
              <Image
                source={{ uri: conversation.posts.post_images[0].image_url }}
                style={styles.productImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.noProductImage}>
                <Ionicons name="cube-outline" size={20} color={Colors.textMuted} />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {conversation.posts.title}
            </Text>
            <Text style={styles.productPrice}>
              ${conversation.posts.price.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(conversation.posts.status) }]}>
            <Text style={styles.statusText}>{conversation.posts.status}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Blocked Warning */}
      {isBlocked && (
        <View style={styles.blockedBanner}>
          <Ionicons name="ban" size={16} color={Colors.error} />
          <Text style={styles.blockedText}>Cannot send messages to blocked user</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isBlocked ? 'Blocked' : 'Type a message...'}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
          editable={!isBlocked}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending || isBlocked) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending || isBlocked}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.background} />
          )}
        </TouchableOpacity>
      </View>

      {/* Keyboard spacer for Android */}
      {Platform.OS === 'android' && keyboardHeight > 0 && (
        <View style={{ height: keyboardHeight }} />
      )}
    </>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: otherUser?.nickname || 'Chat',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
          headerBackTitle: 'Back',
        }}
      />

      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          style={styles.container}
          behavior="padding"
          keyboardVerticalOffset={90}
        >
          {chatContent}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.container}>
          {chatContent}
        </View>
      )}
    </>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return Colors.success;
    case 'reserved':
      return Colors.warning;
    case 'sold':
      return Colors.error;
    default:
      return Colors.textTertiary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElevated,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noProductImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  avatarSpace: {
    width: 28,
    marginRight: Spacing.sm,
  },
  avatarSpaceHidden: {
    opacity: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  messageBubbleThem: {
    backgroundColor: Colors.backgroundCard,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageBubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.xs,
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  messageTextMe: {
    color: Colors.background,
  },
  messageTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderTopWidth: 1,
    borderTopColor: Colors.error,
  },
  blockedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
});
