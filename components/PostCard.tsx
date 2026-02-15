import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PostWithImages } from '@/types/database';
import { Colors, BorderRadius, Shadows, Typography, Spacing, StatusColors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / 2;

interface PostCardProps {
  post: PostWithImages;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const firstImage = post.post_images?.[0]?.image_url;

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    return StatusColors[status] || Colors.textTertiary;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/post/${post.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}

        {/* Gradient overlay for better text readability */}
        <View style={styles.gradient} />

        {/* Status badge */}
        {post.status !== 'available' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(post.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {post.status.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Price tag on image */}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{formatPrice(post.price)}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerInitial}>
              {(post.profiles?.nickname || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.seller} numberOfLines={1}>
            {post.profiles?.nickname || 'Unknown'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.md,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH,
    position: 'relative',
    backgroundColor: Colors.backgroundElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  noImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  priceTag: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  priceText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  info: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInitial: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  seller: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
});
