// UNSW Market Theme Constants
// Premium dark theme with gold accents

import { Platform } from 'react-native';

export const Colors = {
  // Primary palette
  primary: '#FFD700',
  primaryLight: '#FFE44D',
  primaryDark: '#CCB000',
  primaryMuted: 'rgba(255, 215, 0, 0.15)',

  // Background colors
  background: '#0A0A0A',
  backgroundElevated: '#141414',
  backgroundCard: '#1C1C1E',
  backgroundInput: '#2C2C2E',

  // Surface colors with subtle warmth
  surface: '#1C1C1E',
  surfaceHover: '#252528',
  surfaceBorder: '#3A3A3C',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A6',
  textTertiary: '#6E6E73',
  textMuted: '#48484A',

  // Status colors
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0A84FF',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.85)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Legacy support
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Status badge colors
export const StatusColors: { [key: string]: string } = {
  available: Colors.success,
  reserved: Colors.warning,
  sold: Colors.error,
};

// Category icons mapping
export const CategoryIcons: { [key: string]: string } = {
  All: 'grid-outline',
  Electronics: 'laptop-outline',
  Books: 'book-outline',
  Furniture: 'bed-outline',
  Clothing: 'shirt-outline',
  Other: 'ellipsis-horizontal-outline',
};

// Campus locations for meetup
export const CampusLocations = [
  { id: 'negotiable', label: 'To be discussed', icon: 'chatbubbles-outline' },
  { id: 'main_library', label: 'Main Library', icon: 'library-outline' },
  { id: 'quadrangle', label: 'Quadrangle', icon: 'business-outline' },
  { id: 'ainsworth', label: 'Ainsworth Building', icon: 'school-outline' },
  { id: 'mathews', label: 'Mathews Building', icon: 'calculator-outline' },
  { id: 'red_centre', label: 'Red Centre', icon: 'color-palette-outline' },
  { id: 'law_building', label: 'Law Building', icon: 'briefcase-outline' },
  { id: 'roundhouse', label: 'Roundhouse', icon: 'restaurant-outline' },
  { id: 'scientia', label: 'Scientia Building', icon: 'flask-outline' },
  { id: 'village', label: 'UNSW Village', icon: 'home-outline' },
  { id: 'other', label: 'Other', icon: 'location-outline' },
] as const;

export type CampusLocationId = typeof CampusLocations[number]['id'];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
