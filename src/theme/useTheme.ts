import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { darkTheme, lightTheme } from '../theme/colors';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const themeMode = useSettingsStore(state => state.themeMode);

  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  return isDark ? darkTheme : lightTheme;
};

export const useIsDark = () => {
  const systemColorScheme = useColorScheme();
  const themeMode = useSettingsStore(state => state.themeMode);

  return themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';
};
