import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { fonts, colors } from '../../theme/colors';

interface HeaderProps {
  onMenuPress: () => void;
  title?: string;
  onSettingsPress?: () => void;
  showSettings?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuPress, 
  title = "LocalGem", 
  onSettingsPress, 
  showSettings = true 
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Svg width="24" height="24" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24">
          <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </Svg>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {showSettings ? (
          <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
            <Svg width="24" height="24" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24">
                <Path strokeWidth="2" strokeLinecap="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </Svg>
          </TouchableOpacity>
        ) : (
          <View style={styles.settingsPlaceholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 100 : 64,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 40,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#d1d5db',
    textAlign: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPlaceholder: {
    width: 40,
    height: 40,
  }
});
