import React, { useEffect, useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, uploadImage } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithImages } from '@/types/database';

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Other'];

export default function EditPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [post, setPost] = useState<PostWithImages | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      const postData = data as any as PostWithImages;

      // Check ownership
      if (postData.user_id !== user?.id) {
        Alert.alert('Error', 'You can only edit your own posts');
        router.back();
        return;
      }

      setPost(postData);
      setTitle(postData.title);
      setDescription(postData.description);
      setPrice(postData.price.toString());
      setCategory(postData.category);
      setExistingImages(
        (postData.post_images || []).map((img) => ({
          id: img.id,
          url: img.image_url,
        }))
      );
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const totalImages = existingImages.length - removedImageIds.length + newImages.length;
    if (totalImages >= 5) {
      Alert.alert('Limit Reached', 'You can only have up to 5 images');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - totalImages,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      setNewImages([...newImages, ...selectedImages].slice(0, 5 - (existingImages.length - removedImageIds.length)));
    }
  };

  const removeExistingImage = (imageId: string) => {
    setRemovedImageIds([...removedImageIds, imageId]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
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

    const remainingImages = existingImages.length - removedImageIds.length + newImages.length;
    if (remainingImages === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setSaving(true);

    try {
      // Update post
      const { error: postError } = await supabase
        .from('posts')
        .update({
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price),
          category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (postError) throw postError;

      // Remove deleted images
      if (removedImageIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('post_images')
          .delete()
          .in('id', removedImageIds);

        if (deleteError) throw deleteError;
      }

      // Upload new images
      if (newImages.length > 0) {
        const currentMaxOrder = existingImages.length - removedImageIds.length;
        const imagePromises = newImages.map(async (uri, index) => {
          const imageUrl = await uploadImage(uri, user!.id);
          if (imageUrl) {
            return supabase.from('post_images').insert({
              post_id: id,
              image_url: imageUrl,
              display_order: currentMaxOrder + index,
            });
          }
        });

        await Promise.all(imagePromises);
      }

      Alert.alert('Success', 'Your post has been updated!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  const visibleExistingImages = existingImages.filter(
    (img) => !removedImageIds.includes(img.id)
  );
  const totalImages = visibleExistingImages.length + newImages.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Photos ({totalImages}/5)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {visibleExistingImages.map((img) => (
            <View key={img.id} style={styles.imageContainer}>
              <Image source={{ uri: img.url }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeExistingImage(img.id)}
              >
                <Ionicons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
          {newImages.map((uri, index) => (
            <View key={`new-${index}`} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeNewImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
          {totalImages < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color="#888" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text style={styles.sectionTitle}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What are you selling?"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your item..."
          placeholderTextColor="#666"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />

        <Text style={styles.sectionTitle}>Price (AUD)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#666"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.categories}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
