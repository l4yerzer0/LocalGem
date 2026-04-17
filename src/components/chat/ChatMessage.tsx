import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image, Clipboard } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MarkdownLite } from './MarkdownLite';
import { useTheme } from '../../theme/useTheme';
import { fonts, colors } from '../../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type Role = 'user' | 'assistant';

interface ChatMessageProps {
  role: Role;
  content: string;
  thinking?: string;
  image?: string;
  stats?: {
    totalTime: number;
    firstTokenTime: number;
    tokenCount: number;
    tps: number;
    backend: string;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, thinking, image, stats }) => {
  const isUser = role === 'user';
  const theme = useTheme();
  const [showFullStats, setShowFullStats] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const toggleStats = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFullStats(!showFullStats);
  };

  const toggleThinking = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowThinking(!showThinking);
  };

  const InfoBit = ({ label, value }: { label: string, value: string | number }) => (
    <View style={styles.infoBit}>
      <Text style={[styles.infoBitLabel, { color: theme.text.tertiary }]}>{label}</Text>
      <Text style={[styles.infoBitValue, { color: theme.text.primary }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.assistantAvatar}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color={theme.accent}>
              <Path d="M12 2L4.5 9.5 12 17l7.5-7.5L12 2zm0 12l-4-4 4-4 4 4-4 4z" />
            </Svg>
          </View>
        </View>
      )}
      
      <View style={[styles.contentContainer, isUser && styles.userContentContainer]}>
        {!isUser && <Text style={[styles.name, { color: theme.text.tertiary }]}>LocalGem</Text>}
        
        {isUser ? (
          <View style={[styles.userBubble, { backgroundColor: theme.surface === '#ffffff' ? '#f0f0f0' : '#2b2b28' }]}>
            {image && (
                <Image source={{ uri: image }} style={styles.messageImage} />
            )}
            <Text style={[styles.userText, { color: theme.text.primary }]}>{content}</Text>
          </View>
        ) : (
          <View style={styles.assistantMessageWrapper}>
            {thinking && thinking.length > 0 && (
                <View style={[styles.thinkingWrapper, { backgroundColor: 'rgba(128,128,128,0.05)', borderColor: theme.border }]}>
                    <TouchableOpacity onPress={toggleThinking} style={styles.thinkingHeader}>
                        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                            <Path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </Svg>
                        <Text style={[styles.thinkingTitle, { color: theme.text.tertiary }]}>{showThinking ? "Скрыть процесс мышления" : "Показать процесс мышления"}</Text>
                    </TouchableOpacity>
                    {showThinking && (
                        <View style={[styles.thinkingContent, { borderTopColor: theme.border }]}>
                            <Text style={[styles.thinkingText, { color: theme.text.tertiary }]}>{thinking}</Text>
                        </View>
                    )}
                </View>
            )}

            <MarkdownLite content={content} />
            
            {!isUser && (
              <TouchableOpacity 
                onPress={() => Clipboard.setString(content)}
                style={[styles.copyButton, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}
              >
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2">
                  <Path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </Svg>
                <Text style={[styles.copyLabel, { color: theme.accent }]}>Копировать</Text>
              </TouchableOpacity>
            )}
            
            {stats && (
              <View style={styles.statsWrapper}>
                <TouchableOpacity onPress={toggleStats} style={[styles.statsButton, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5">
                    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </Svg>
                  <Text style={[styles.statsLabel, { color: theme.accent }]}>{stats.tps.toFixed(1)} t/s</Text>
                </TouchableOpacity>

                {showFullStats && (
                  <View style={[styles.expandedStats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.statsGrid}>
                        <InfoBit label="Ускоритель" value={stats.backend} />
                        <InfoBit label="Время" value={`${stats.totalTime.toFixed(1)}с`} />
                        <InfoBit label="Первый" value={`${stats.firstTokenTime.toFixed(2)}с`} />
                        <InfoBit label="Токены" value={stats.tokenCount} />
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
  container: { paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', width: '100%' },
  userContainer: { justifyContent: 'flex-end' },
  assistantContainer: { justifyContent: 'flex-start', gap: 12 },
  avatarContainer: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 },
  assistantAvatar: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  contentContainer: { flex: 1, paddingTop: 4 },
  userContentContainer: { flex: 0, maxWidth: '85%', alignItems: 'flex-end' },
  name: { fontSize: 13, fontFamily: fonts.semiBold, color: '#9ca3af', marginBottom: 8 },
  userBubble: { backgroundColor: '#2b2b28', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, alignSelf: 'flex-end', overflow: 'hidden' },
  userText: { fontSize: 15, lineHeight: 23, fontFamily: fonts.regular, color: '#e5e7eb' },
  messageImage: { width: 200, height: 200, borderRadius: 14, marginBottom: 10, resizeMode: 'cover' },
  assistantMessageWrapper: { alignItems: 'flex-start', flex: 1 },
  
  // Мышление
  thinkingWrapper: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, marginBottom: 14, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  thinkingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  thinkingTitle: { fontSize: 12, fontFamily: fonts.medium, color: colors.text.tertiary },
  thinkingContent: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
  thinkingText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text.tertiary, fontStyle: 'italic', lineHeight: 21 },

  statsWrapper: { marginTop: 14, width: '100%' },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(217, 119, 87, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(217, 119, 87, 0.25)', marginBottom: 12 },
  copyLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.accent },
  statsButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(217, 119, 87, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(217, 119, 87, 0.25)' },
  statsLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.accent },
  expandedStats: { marginTop: 10, backgroundColor: '#111111', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, width: '100%' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  infoBit: { minWidth: '45%' },
  infoBitLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: colors.text.tertiary, textTransform: 'uppercase', marginBottom: 3, letterSpacing: 0.5 },
  infoBitValue: { fontSize: 14, fontFamily: fonts.medium, color: colors.text.primary }
});
