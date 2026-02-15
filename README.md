# UNSW Market

A student-only marketplace app for UNSW (University of New South Wales) students to buy and sell items within the campus community.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)

## Features

### Authentication
- UNSW email-only registration (@unsw.edu.au, @student.unsw.edu.au)
- Secure authentication via Supabase Auth

### Marketplace
- Create listings with up to 5 images
- Browse items by categories (Electronics, Books, Furniture, Clothing, Other)
- Search items by title
- View detailed item information
- Edit and delete your own listings
- Mark items as Available, Reserved, or Sold

### User Features
- Customizable user profiles
- View your listings
- Block unwanted users
- Report inappropriate posts

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Backend | Supabase (Auth, Database, Storage) |
| Styling | React Native StyleSheet |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for mobile testing)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZeuPark/UNSWmarket.git
   cd UNSWmarket
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**

   Create the following tables in your Supabase project:

   ```sql
   -- Profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users PRIMARY KEY,
     email TEXT NOT NULL,
     nickname TEXT,
     avatar_url TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Posts table
   CREATE TABLE posts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     price INTEGER NOT NULL,
     category TEXT NOT NULL,
     status TEXT DEFAULT 'available',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Post images table
   CREATE TABLE post_images (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
     image_url TEXT NOT NULL,
     display_order INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Blocks table
   CREATE TABLE blocks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     blocker_id UUID REFERENCES profiles(id),
     blocked_id UUID REFERENCES profiles(id),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Reports table
   CREATE TABLE reports (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     reporter_id UUID REFERENCES profiles(id),
     reported_user_id UUID REFERENCES profiles(id),
     reported_post_id UUID REFERENCES posts(id),
     reason TEXT NOT NULL,
     description TEXT,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **Create Storage bucket**

   In Supabase Storage, create a bucket named `post-images` with public access.

6. **Run the app**
   ```bash
   npx expo start
   ```

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   └── login.tsx
│   ├── (tabs)/            # Main tab screens
│   │   ├── index.tsx      # Feed
│   │   ├── create.tsx     # Create listing
│   │   └── profile.tsx    # User profile
│   └── post/              # Post detail screens
│       ├── [id].tsx       # View post
│       └── edit/[id].tsx  # Edit post
├── components/            # Reusable components
├── constants/             # Theme and constants
├── contexts/              # React contexts
├── lib/                   # Utilities and Supabase client
└── types/                 # TypeScript type definitions
```

## Roadmap

- [ ] In-app messaging between buyers and sellers
- [ ] Push notifications
- [ ] Wishlist / Favorites
- [ ] Advanced search filters (price range, condition)
- [ ] Seller ratings and reviews
- [ ] Transaction history

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Backend powered by [Supabase](https://supabase.com/)
