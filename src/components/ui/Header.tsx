import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../theme/colors';

interface HeaderProps {
  onMenuPress: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuPress, title = "LocalGem" }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Svg width="24" height="24" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24">
          <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </Svg>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity style={styles.settingsButton}>
            <Svg width="16" height="16" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24">
                <Path strokeWidth="2" strokeLinecap="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>G</Text>
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
    padding: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#d1d5db',
    maxWidth: 140,
  },
  settingsButton: {
    padding: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    backgroundColor: '#333333',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e6e6e6',
    fontSize: 10,
    fontFamily: fonts.semiBold,
  }
});
