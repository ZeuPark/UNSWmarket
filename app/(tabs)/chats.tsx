import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Conversation, Profile, Post, PostImage } from '@/types/database';

type ConversationItem = Conversation & {
  posts: (Pick<Post, 'id' | 'title' | 'price'> & {
    post_images: Pick<PostImage, 'image_url'>[];
  }) | null;
  buyer: Profile;
  seller: Profile;
};

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const fetchBlockedUsers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);

    if (data) {
      setBlockedIds(data.map(b => b.blocked_id));
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          posts:post_id (
            id,
            title,
            price,
            post_images (image_url)
          ),
          buyer:buyer_id (
            id,
            nickname,
            email,
            avatar_url
          ),
          seller:seller_id (
            id,
            nickname,
            email,
            avatar_url
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Filter out conversations with blocked users
      const filtered = (data as any as ConversationItem[]).filter(conv => {
        const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
        return !blockedIds.includes(otherUserId);
      });

      setConversations(filtered);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [user, blockedIds])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const getOtherUser = (conv: ConversationItem) => {
    return conv.buyer_id === user?.id ? conv.seller : conv.buyer;
  };

  const getUnreadCount = (conv: ConversationItem) => {
    if (!user) return 0;
    return conv.buyer_id === user.id
      ? conv.buyer_unread_count
      : conv.seller_unread_count;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-AU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const renderConversation = ({ item }: { item: ConversationItem }) => {
    const otherUser = getOtherUser(item);
    const unreadCount = getUnreadCount(item);
    const postImage = item.posts?.post_images?.[0]?.image_url;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}` as any)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {postImage ? (
            <Image
              source={{ uri: postImage }}
              style={styles.productImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="cube-outline" size={24} color={Colors.textMuted} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser.nickname || 'Unknown'}
            </Text>
            <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
          </View>

          <Text style={styles.productTitle} numberOfLines={1}>
            {item.posts?.title || 'Deleted Post'}
          </Text>

          {item.posts?.price !== undefined && (
            <Text style={styles.price}>
              ${item.posts.price.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Chats Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation by contacting a seller
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

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
  list: {
    paddingVertical: Spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
  },
  productTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  price: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    marginRight: Spacing.sm,
  },
  unreadText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginLeft: 56 + Spacing.lg + Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
