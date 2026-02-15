import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// UNSW email domain validation
export const isUNSWEmail = (email: string): boolean => {
  // DEV MODE: 개발 중에는 모든 이메일 허용
  if (__DEV__) return true;

  const unswDomains = ['unsw.edu.au', 'student.unsw.edu.au', 'ad.unsw.edu.au'];
  const domain = email.split('@')[1]?.toLowerCase();
  return unswDomains.includes(domain);
};

// Upload image to Supabase Storage
export const uploadImage = async (
  uri: string,
  userId: string
): Promise<string | null> => {
  try {
    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No session found');
      return null;
    }

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // React Native: Create FormData with file
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: fileName.split('/').pop(),
      type: contentType,
    } as any);

    // Upload directly to Supabase Storage REST API
    const uploadUrl = `${supabaseUrl}/storage/v1/object/post-images/${fileName}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-upsert': 'false',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error:', errorText);
      return null;
    }

    // Return public URL
    return `${supabaseUrl}/storage/v1/object/public/post-images/${fileName}`;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};
