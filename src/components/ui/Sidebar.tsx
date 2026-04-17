import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore, ThemeMode } from '../../store/settingsStore';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/colors';

interface SidebarProps {
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const chats = useChatStore(state => state.chats);
  const currentChatId = useChatStore(state => state.currentChatId);
  const setCurrentChat = useChatStore(state => state.setCurrentChat);
  const addChat = useChatStore(state => state.addChat);
  const deleteChat = useChatStore(state => state.deleteChat);
  const setActiveView = useChatStore(state => state.setActiveView);
  
  const { themeMode, setThemeMode } = useSettingsStore();
  const theme = useTheme();

  const handleNewChat = () => {
    addChat("Новый чат");
    setActiveView('chat');
    onClose();
  };

  const handleSelectChat = (id: string) => {
    setCurrentChat(id);
    setActiveView('chat');
    onClose();
  };

  const handleDeleteChat = (id: string, title: string) => {
    Alert.alert(
      "Удалить чат",
      `Вы уверены, что хотите удалить чат "${title}"? Это действие нельзя отменить.`,
      [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: () => deleteChat(id) }
      ]
    );
  };

  const NavItem = ({ label, icon, view }: any) => (
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={() => { setActiveView(view); onClose(); }}
    >
      <View style={styles.navIcon}>{icon}</View>
      <Text style={[styles.navLabel, { color: theme.text.secondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const ThemeToggle = () => {
    const isDark = themeMode === 'dark';
    const isLight = themeMode === 'light';
    
    return (
      <View style={styles.themeToggleContainer}>
        <View style={[styles.themeToggle, { backgroundColor: theme.surface === '#ffffff' ? '#f3f4f6' : '#2b2b2b', borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[
              styles.themeOption,
              isLight && { backgroundColor: theme.surface === '#ffffff' ? '#ffffff' : theme.accent }
            ]}
            onPress={() => setThemeMode('light')}
          >
            <Svg width="16" height="16" fill="none" stroke={isLight ? (theme.surface === '#ffffff' ? '#1a1a1a' : '#ffffff') : theme.text.tertiary} viewBox="0 0 24 24">
              <Path strokeWidth="2" strokeLinecap="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.themeOption,
              isDark && { backgroundColor: theme.surface === '#ffffff' ? '#1a1a1a' : theme.accent }
            ]}
            onPress={() => setThemeMode('dark')}
          >
            <Svg width="16" height="16" fill="none" stroke={isDark ? '#ffffff' : theme.text.tertiary} viewBox="0 0 24 24">
              <Path strokeWidth="2" strokeLinecap="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.newChatBtn, { borderColor: theme.border }]} onPress={handleNewChat}>
          <Svg width="20" height="20" fill="none" stroke={theme.text.primary} viewBox="0 0 24 24">
            <Path strokeWidth="2" d="M12 4v16m8-8H4" />
          </Svg>
          <Text style={[styles.newChatLabel, { color: theme.text.primary }]}>Новый чат</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.history} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>История</Text>
        {chats.map(chat => (
          <View key={chat.id} style={[styles.chatItemWrapper, currentChatId === chat.id && { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={styles.chatItem}
              onPress={() => handleSelectChat(chat.id)}
            >
              <Text style={[styles.chatTitle, { color: theme.text.secondary }]} numberOfLines={1}>
                {chat.title}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteChat(chat.id, chat.title)}>
                <Svg width="16" height="16" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24">
                    <Path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </Svg>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <NavItem 
          label="Модели" 
          view="models"
          icon={<Svg width="20" height="20" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></Svg>} 
        />
        <NavItem 
          label="Устройство" 
          view="device"
          icon={<Svg width="20" height="20" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></Svg>} 
        />
        <NavItem 
          label="Настройки" 
          view="settings"
          icon={<Svg width="20" height="20" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><Path strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></Svg>} 
        />

        <ThemeToggle />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: 280 },
  header: { padding: 16 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  newChatLabel: { fontSize: 15, fontFamily: fonts.medium },
  history: { flex: 1, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.semiBold, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 8, letterSpacing: 0.5 },
  chatItemWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, marginBottom: 4, paddingRight: 8 },
  chatItem: { flex: 1, padding: 12 },
  chatTitle: { fontSize: 14, fontFamily: fonts.regular },
  deleteBtn: { padding: 8 },
  footer: { padding: 16 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  navIcon: { width: 24, alignItems: 'center' },
  navLabel: { fontSize: 14, fontFamily: fonts.medium },
  themeToggleContainer: { marginTop: 16, alignItems: 'center' },
  themeToggle: { flexDirection: 'row', padding: 3, borderRadius: 10, borderWidth: 1, gap: 3, width: 100 },
  themeOption: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }
});