import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Text, Modal, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../../theme/colors';
import { useModelStore } from '../../store/modelStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../theme/useTheme';

interface ChatInputProps {
  onSend: (text: string) => void;
  onImagePick?: () => void;
  isCentered?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onImagePick, isCentered = false }) => {
  const [text, setText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = useTheme();
  const { activeModel } = useModelStore();
  const { isThinkingEnabled, setThinkingEnabled } = useSettingsStore();
  const plusButtonRef = useRef<View>(null);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const ActionBtn = ({ label, icon, disabled = false, onPress }: any) => (
    <TouchableOpacity 
        style={[styles.actionBtn, disabled && styles.actionBtnDisabled]} 
        onPress={() => { if (!disabled) { onPress(); setIsMenuOpen(false); } }}
        disabled={disabled}
    >
        <View style={[styles.actionIcon, { backgroundColor: theme.surface === '#ffffff' ? '#f3f4f6' : '#2b2b2b' }]}>{icon}</View>
        <Text style={[styles.actionLabel, { color: theme.text.primary }]}>{label}{disabled ? " (Скоро)" : ""}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={isCentered ? styles.centeredContainer : styles.bottomContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, isCentered && styles.inputCenteredText, { color: theme.text.primary }]}
            placeholder={isCentered ? "Спроси что-нибудь..." : "Ответить..."}
            placeholderTextColor={theme.text.tertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxHeight={120}
          />
          
          <View style={styles.bottomRow}>
            <View style={styles.leftActions}>
              <TouchableOpacity ref={plusButtonRef} style={styles.iconButton} onPress={() => setIsMenuOpen(true)}>
                <Svg width="24" height="24" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24">
                  <Path strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => setThinkingEnabled(!isThinkingEnabled)}>
                <Svg width="22" height="22" fill={isThinkingEnabled ? theme.accent : "none"} stroke={isThinkingEnabled ? theme.accent : theme.text.tertiary} viewBox="0 0 24 24">
                  <Path strokeWidth="2" strokeLinecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </Svg>
              </TouchableOpacity>
            </View>
            
            <View style={styles.rightActions}>
              <TouchableOpacity style={[styles.modelPickerBtn, { backgroundColor: theme.surface === '#ffffff' ? '#f9fafb' : '#111111', borderColor: theme.border }]}>
                <Text style={[styles.modelPickerText, { color: theme.text.tertiary }]} numberOfLines={1}>{activeModel ? activeModel.name : "Нет модели"}</Text>
                <Svg width="12" height="12" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24">
                  <Path strokeWidth="2" d="M19 9l-7 7-7-7" />
                </Svg>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sendButton, text.length > 0 && { backgroundColor: theme.accent }]} 
                onPress={handleSend}
                disabled={!text.trim()}
              >
                <Svg width="20" height="20" fill="none" stroke={text.length > 0 ? '#ffffff' : theme.text.tertiary} viewBox="0 0 24 24">
                   <Path strokeWidth="2.5" strokeLinecap="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsMenuOpen(false)}>
            <View style={[styles.menuContainer, { backgroundColor: theme.surface, borderColor: theme.border }, isCentered ? styles.menuCentered : styles.menuBottom]}>
                <ActionBtn 
                    label="Фото" 
                    onPress={onImagePick}
                    icon={<Svg width="20" height="20" fill="none" stroke={theme.text.primary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></Svg>} 
                />
                <ActionBtn 
                    label="Аудио" 
                    disabled 
                    icon={<Svg width="20" height="20" fill="none" stroke={theme.text.primary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></Svg>} 
                />
                <ActionBtn 
                    label="Документы" 
                    disabled 
                    icon={<Svg width="20" height="20" fill="none" stroke={theme.text.primary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Svg>} 
                />
            </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: { padding: 16, borderTopWidth: 1 },
  centeredContainer: { width: '100%', maxWidth: 540, marginTop: 40, paddingHorizontal: 16 },
  inputWrapper: { borderRadius: 28, borderWidth: 1, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 },
  input: { fontFamily: fonts.regular, fontSize: 16, minHeight: 36, paddingHorizontal: 16, paddingVertical: 8, textAlignVertical: 'top' },
  inputCenteredText: { fontSize: 17, minHeight: 44 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 8 },
  modelPickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4, maxWidth: 120 },
  modelPickerText: { fontSize: 12, fontFamily: fonts.semiBold },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuContainer: { position: 'absolute', borderRadius: 20, padding: 8, width: 220, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  menuBottom: { left: 24, bottom: 90 },
  menuCentered: { left: 32, top: '55%' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12 },
  actionBtnDisabled: { opacity: 0.4 },
  actionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontFamily: fonts.medium },
});
