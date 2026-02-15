export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nickname: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nickname: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nickname?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          price: number;
          category: string;
          location: string;
          status: 'available' | 'reserved' | 'sold';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          price: number;
          category: string;
          location?: string;
          status?: 'available' | 'reserved' | 'sold';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          price?: number;
          category?: string;
          location?: string;
          status?: 'available' | 'reserved' | 'sold';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      post_images: {
        Row: {
          id: string;
          post_id: string;
          image_url: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          image_url: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          image_url?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_post_id: string | null;
          reason: string;
          description: string | null;
          status: 'pending' | 'reviewed' | 'resolved';
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_post_id?: string | null;
          reason: string;
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved';
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_user_id?: string | null;
          reported_post_id?: string | null;
          reason?: string;
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved';
          created_at?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          post_id: string | null;
          buyer_id: string;
          seller_id: string;
          last_message_at: string;
          buyer_unread_count: number;
          seller_unread_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          buyer_id: string;
          seller_id: string;
          last_message_at?: string;
          buyer_unread_count?: number;
          seller_unread_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string | null;
          buyer_id?: string;
          seller_id?: string;
          last_message_at?: string;
          buyer_unread_count?: number;
          seller_unread_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostImage = Database['public']['Tables']['post_images']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type Block = Database['public']['Tables']['blocks']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

// Extended types with relations
export type PostWithImages = Post & {
  post_images: PostImage[];
  profiles: Profile;
};

export type ConversationWithDetails = Conversation & {
  posts: Pick<Post, 'id' | 'title' | 'price'> & {
    post_images: Pick<PostImage, 'image_url'>[];
  } | null;
  buyer: Profile;
  seller: Profile;
  lastMessage?: Message;
};

export type MessageWithSender = Message & {
  profiles: Profile;
};
