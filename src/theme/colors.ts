export const darkTheme = {
  background: '#1a1a1a', 
  surface: '#242424',    
  text: {
    primary: '#e6e6e6',
    secondary: '#9ca3af', 
    tertiary: '#6b7280',  
    inverse: '#1a1a1a',
  },
  accent: '#d97757',     
  border: '#333333',     
  codeBg: '#0d0d0d',     
};

export const lightTheme = {
  background: '#f8f8f8', 
  surface: '#ffffff',    
  text: {
    primary: '#1a1a1a',
    secondary: '#4b5563', 
    tertiary: '#9ca3af',  
    inverse: '#ffffff',
  },
  accent: '#d97757',     
  border: '#e5e7eb',     
  codeBg: '#f3f4f6',     
};

// Для обратной совместимости со статическими стилями (StyleSheet.create)
export const colors = darkTheme;

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  serif: 'Lora-Regular',
  serifMedium: 'Lora-Medium',
};
