export const lightTheme = {
  colors: {
    primary: '#FF0000',
    primaryHover: '#CC0000',
    secondary: '#000000',
    secondaryHover: '#1A1A1A',
    accent: '#FF0000',
    accentHover: '#CC0000',
    background: '#F5EEEE',
    card: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    border: '#DDD0D0',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    white: '#FFFFFF',
    black: '#000000',
  },
  font: {
    family: "'Inter', sans-serif",
    headingFamily: "'Oswald', sans-serif",
    sizes: {
      xs: '0.85rem',
      sm: '1rem',
      base: '1.125rem',
      lg: '1.25rem',
      xl: '1.5rem',
      '2xl': '1.75rem',
      '3xl': '2.25rem',
      '4xl': '3rem',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  space: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  transition: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#1A0A0A',
    card: '#2A1212',
    text: '#F1F0F5',
    textSecondary: '#C0A0A0',
    border: '#3D1E1E',
    white: '#FFFFFF',
    black: '#000000',
  },
};

export type ThemeType = typeof lightTheme;

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeType {}
}
