import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/colors';

export type Role = 'user' | 'assistant';

interface ChatMessageProps {
  role: Role;
  content: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {isUser ? (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>U</Text>
          </View>
        ) : (
          <View style={styles.assistantAvatar}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color={colors.accent}>
              <Path d="M12 2L4.5 9.5 12 17l7.5-7.5L12 2zm0 12l-4-4 4-4 4 4-4 4z" />
            </Svg>
          </View>
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{isUser ? 'You' : 'LocalGem'}</Text>
        {isUser ? (
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{content}</Text>
          </View>
        ) : (
          <Text style={styles.assistantText}>{content}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  userAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#374151', // bg-gray-700
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: fonts.semiBold,
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
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#d1d5db',
    marginBottom: 6,
  },
  userBubble: {
    backgroundColor: '#2b2b28',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '90%',
  },
  userText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: '#e5e7eb',
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: '#d1d5db',
  },
});
