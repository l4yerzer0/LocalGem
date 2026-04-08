import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/colors';
import { useModelStore } from '../../store/modelStore';

interface ChatInputProps {
  onSend: (text: string) => void;
  isCentered?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isCentered = false }) => {
  const [text, setText] = useState('');
  const { activeModel } = useModelStore();

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={isCentered ? styles.centeredContainer : styles.bottomContainer}
    >
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, isCentered && styles.inputCenteredText]}
          placeholder={isCentered ? "Спроси что-нибудь..." : "Ответить..."}
          placeholderTextColor="#555555"
          value={text}
          onChangeText={setText}
          multiline
          maxHeight={120}
        />
        
        <View style={styles.bottomRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Svg width="24" height="24" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24">
                <Path strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.modelPickerBtn}>
              <Text style={styles.modelPickerText} numberOfLines={1}>{activeModel ? activeModel.name : "Нет модели"}</Text>
              <Svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <Path strokeWidth="2" d="M19 9l-7 7-7-7" />
              </Svg>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sendButton, text.length > 0 && styles.sendButtonActive]} 
              onPress={handleSend}
              disabled={!text.trim()}
            >
              <Svg width="20" height="20" fill="none" stroke={text.length > 0 ? '#ffffff' : colors.text.tertiary} viewBox="0 0 24 24">
                 <Path strokeWidth="2.5" strokeLinecap="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 30,
  },
  centeredContainer: {
    width: '100%',
    maxWidth: 540,
    marginTop: 40,
  },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  inputCenteredText: {
    fontSize: 17,
    minHeight: 44,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  modelPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  modelPickerText: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.accent,
    transform: [{ scale: 1.05 }],
  },
});
