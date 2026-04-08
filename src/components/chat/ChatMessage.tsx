import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/colors';

// Включаем анимацию для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type Role = 'user' | 'assistant';

interface ChatMessageProps {
  role: Role;
  content: string;
  stats?: {
    totalTime: number;
    firstTokenTime: number;
    tokenCount: number;
    tps: number;
    backend: string;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, stats }) => {
  const isUser = role === 'user';
  const [showFullStats, setShowFullStats] = useState(false);

  const toggleStats = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFullStats(!showFullStats);
  };

  const InfoBit = ({ label, value }: { label: string, value: string | number }) => (
    <View style={styles.infoBit}>
      <Text style={styles.infoBitLabel}>{label}</Text>
      <Text style={styles.infoBitValue}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.assistantAvatar}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color={colors.accent}>
              <Path d="M12 2L4.5 9.5 12 17l7.5-7.5L12 2zm0 12l-4-4 4-4 4 4-4 4z" />
            </Svg>
          </View>
        </View>
      )}
      
      <View style={[styles.contentContainer, isUser && styles.userContentContainer]}>
        {!isUser && <Text style={styles.name}>LocalGem</Text>}
        
        {isUser ? (
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{content}</Text>
          </View>
        ) : (
          <View style={styles.assistantMessageWrapper}>
            <Text style={styles.assistantText}>{content}</Text>
            
            {stats && (
              <View style={styles.statsWrapper}>
                <TouchableOpacity onPress={toggleStats} style={styles.statsButton}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2.5">
                    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </Svg>
                  <Text style={styles.statsLabel}>{stats.tps.toFixed(1)} t/s</Text>
                </TouchableOpacity>

                {showFullStats && (
                  <View style={styles.expandedStats}>
                    <View style={styles.statsGrid}>
                        <InfoBit label="Back" value={stats.backend} />
                        <InfoBit label="Total" value={`${stats.totalTime.toFixed(1)}s`} />
                        <InfoBit label="First" value={`${stats.firstTokenTime.toFixed(2)}s`} />
                        <InfoBit label="Tokens" value={stats.tokenCount} />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    width: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
    gap: 12,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 4,
  },
  userContentContainer: {
    flex: 0,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#9ca3af',
    marginBottom: 6,
  },
  userBubble: {
    backgroundColor: '#2b2b28',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-end',
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: '#e5e7eb',
  },
  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: '#d1d5db',
  },
  statsWrapper: {
    marginTop: 12,
    width: '100%',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 87, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(217, 119, 87, 0.2)',
  },
  statsLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.accent,
  },
  expandedStats: {
    marginTop: 8,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoBit: {
    minWidth: '45%',
  },
  infoBitLabel: {
    fontSize: 9,
    fontFamily: fonts.semiBold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoBitValue: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  }
});
