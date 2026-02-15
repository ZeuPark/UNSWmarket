import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { PostWithImages } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, CampusLocations, Spacing, BorderRadius, Typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<PostWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_images (*),
          profiles (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPost(data as any as PostWithImages);
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!post) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${post.profiles.nickname}? You won't see their posts anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('blocks').insert({
                blocker_id: user!.id,
                blocked_id: post.user_id,
              });

              if (error) throw error;
              Alert.alert('Blocked', 'User has been blocked');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleReport = async () => {
    if (!post) return;

    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Spam',
        onPress: () => submitReport('spam'),
      },
      {
        text: 'Inappropriate',
        onPress: () => submitReport('inappropriate'),
      },
      {
        text: 'Scam',
        onPress: () => submitReport('scam'),
      },
    ]);
  };

  const submitReport = async (reason: string) => {
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user!.id,
        reported_post_id: post!.id,
        reported_user_id: post!.user_id,
        reason,
      });

      if (error) throw error;
      Alert.alert('Reported', 'Thank you for reporting. We will review this post.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post!.id);

              if (error) throw error;
              Alert.alert('Deleted', 'Post has been deleted');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const updateStatus = async (status: 'available' | 'reserved' | 'sold') => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status })
        .eq('id', post!.id);

      if (error) throw error;
      setPost({ ...post!, status });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleContactSeller = async () => {
    if (!post || !user) return;

    setContactLoading(true);
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('post_id', post.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', post.user_id)
        .single();

      if (existingConv) {
        // Navigate to existing conversation
        router.push(`/chat/${existingConv.id}` as any);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          post_id: post.id,
          buyer_id: user.id,
          seller_id: post.user_id,
        })
        .select('id')
        .single();

      if (error) throw error;

      router.push(`/chat/${newConv.id}` as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start conversation');
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const isOwner = user?.id === post.user_id;
  const images = post.post_images || [];

  return (
    <ScrollView style={styles.container}>
      {/* Image Carousel */}
      <View style={styles.imageCarousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {images.length > 0 ? (
            images.map((img, index) => (
              <Image
                key={img.id}
                source={{ uri: img.image_url }}
                style={styles.carouselImage}
                contentFit="cover"
              />
            ))
          ) : (
            <View style={[styles.carouselImage, styles.noImage]}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
        </ScrollView>
        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentImageIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Post Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.price}>${post.price.toLocaleString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(post.status) }]}>
            <Text style={styles.statusText}>{post.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.category}>{post.category}</Text>

        {/* Location */}
        {post.location && (
          <View style={styles.locationContainer}>
            <Ionicons
              name={(CampusLocations.find(l => l.id === post.location)?.icon || 'location-outline') as any}
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.locationText}>
              {CampusLocations.find(l => l.id === post.location)?.label || post.location}
            </Text>
          </View>
        )}

        <Text style={styles.description}>{post.description}</Text>

        {/* Seller Info */}
        <View style={styles.sellerContainer}>
          <View style={styles.sellerInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#888" />
            </View>
            <View>
              <Text style={styles.sellerName}>{post.profiles.nickname}</Text>
              <Text style={styles.sellerEmail}>{post.profiles.email}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/post/edit/${post.id}`)}
            >
              <Ionicons name="pencil" size={20} color="#000" />
              <Text style={styles.editButtonText}>Edit Post</Text>
            </TouchableOpacity>

            <Text style={styles.actionLabel}>Update Status:</Text>
            <View style={styles.statusButtons}>
              {(['available', 'reserved', 'sold'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    post.status === status && styles.statusButtonActive,
                  ]}
                  onPress={() => updateStatus(status)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      post.status === status && styles.statusButtonTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color="#F44336" />
              <Text style={styles.deleteButtonText}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buyerActions}>
            <TouchableOpacity
              style={[styles.contactButton, contactLoading && styles.contactButtonDisabled]}
              onPress={handleContactSeller}
              disabled={contactLoading}
            >
              {contactLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="chatbubble" size={20} color="#000" />
                  <Text style={styles.contactButtonText}>Contact Seller</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleReport}>
                <Ionicons name="flag" size={20} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleBlock}>
                <Ionicons name="ban" size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return '#4CAF50';
    case 'reserved':
      return '#FF9800';
    case 'sold':
      return '#F44336';
    default:
      return '#888';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  imageCarousel: {
    position: 'relative',
  },
  carouselImage: {
    width,
    height: width,
  },
  noImage: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#666',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFD700',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 24,
  },
  sellerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sellerEmail: {
    fontSize: 14,
    color: '#888',
  },
  ownerActions: {
    marginBottom: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#FFD700',
  },
  statusButtonText: {
    color: '#888',
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#000',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    gap: 8,
  },
  deleteButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
  buyerActions: {
    marginBottom: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  contactButtonDisabled: {
    opacity: 0.7,
  },
  contactButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
});
