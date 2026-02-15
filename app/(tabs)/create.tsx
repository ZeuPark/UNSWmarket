import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, uploadImage } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, CategoryIcons, Shadows } from '@/constants/theme';

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Other'];

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setLoading(true);

    try {
      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user!.id,
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price),
          category,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload images
      const imagePromises = images.map(async (uri, index) => {
        const imageUrl = await uploadImage(uri, user!.id);
        if (imageUrl) {
          return supabase.from('post_images').insert({
            post_id: post.id,
            image_url: imageUrl,
            display_order: index,
          });
        }
      });

      await Promise.all(imagePromises);

      Alert.alert('Success', 'Your item has been posted!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setPrice('');
            setImages([]);
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionCounter}>{images.length}/5</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage} activeOpacity={0.7}>
                <View style={styles.addImageIconContainer}>
                  <Ionicons name="camera" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="What are you selling?"
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your item in detail..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </View>
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </View>

        {/* Price Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <Text style={styles.currencyLabel}>AUD</Text>
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              const iconName = CategoryIcons[cat] || 'ellipsis-horizontal-outline';
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    isActive && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={iconName as any}
                    size={18}
                    color={isActive ? Colors.background : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <>
              <Ionicons name="pricetag" size={20} color={Colors.background} />
              <Text style={styles.submitButtonText}>Post Item</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
  },
  sectionCounter: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  imageScroll: {
    flexDirection: 'row',
    marginTop: -Spacing.md,
  },
  imageScrollContent: {
    paddingRight: Spacing.lg,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundCard,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  coverBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  coverBadgeText: {
    color: Colors.background,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  addImageButton: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addImageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  inputWrapper: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  input: {
    padding: Spacing.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: Colors.textTertiary,
    fontSize: Typography.fontSize.xs,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.lg,
  },
  currencySymbol: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    paddingVertical: Spacing.lg,
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  currencyLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryTextActive: {
    color: Colors.background,
    fontWeight: Typography.fontWeight.semibold,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.glow,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background,
  },
});
