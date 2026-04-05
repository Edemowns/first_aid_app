// AIDA — AI First Aid App
// Theme constants

export const colors = {
  // Primary — urgent red for emergencies
  primary: '#D32F2F',
  primaryDark: '#B71C1C',
  primaryLight: '#FFCDD2',

  // Secondary — calm teal for info/safe actions
  secondary: '#00796B',
  secondaryLight: '#E0F2F1',

  // Neutrals
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F5',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#9E9E9E',
  textOnPrimary: '#FFFFFF',

  // Severity levels
  severityCritical: '#D32F2F',
  severityModerate: '#F57C00',
  severityMild: '#388E3C',

  // Borders
  border: '#E0E0E0',
  borderStrong: '#BDBDBD',
};

export const typography = {
  // Font families (Expo default — swap for custom later)
  fontBold: 'System',
  fontRegular: 'System',

  // Scale
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  small: 13,
  tiny: 11,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};