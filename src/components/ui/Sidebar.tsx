import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
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
  const setCurrentChatId = useChatStore(state => state.setCurrentChatId);
  const addChat = useChatStore(state => state.addChat);
  const setActiveView = useChatStore(state => state.setActiveView);
  
  const { themeMode, setThemeMode } = useSettingsStore();
  const theme = useTheme();

  const handleNewChat = () => {
    addChat("Новый чат");
    setActiveView('chat');
    onClose();
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    setActiveView('chat');
    onClose();
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

  const ThemeBtn = ({ mode, label, icon }: { mode: ThemeMode, label: string, icon: any }) => (
    <TouchableOpacity 
      style={[
        styles.themeBtn, 
        themeMode === mode && { backgroundColor: theme.accent, borderColor: theme.accent }
      ]} 
      onPress={() => setThemeMode(mode)}
    >
      {icon}
      <Text style={[
        styles.themeBtnText, 
        { color: themeMode === mode ? '#ffffff' : theme.text.tertiary }
      ]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.newChatBtn, { borderColor: theme.border }]} onPress={handleNewChat}>
          <Svg width="20" height="20" fill="none" stroke={theme.text.primary} viewBox="0 0 24 24">
            <Path strokeWidth="2" d="M12 4v16m8-8H4" />
          </Svg>
          <Text style={[styles.newChatLabel, { color: theme.text.primary }]}>Новый чат</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.history}>
        <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>История</Text>
        {chats.map(chat => (
          <TouchableOpacity 
            key={chat.id} 
            style={[
              styles.chatItem, 
              currentChatId === chat.id && { backgroundColor: theme.surface }
            ]}
            onPress={() => handleSelectChat(chat.id)}
          >
            <Text style={[styles.chatTitle, { color: theme.text.secondary }]} numberOfLines={1}>
              {chat.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
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

        <View style={styles.themeRow}>
          <ThemeBtn 
            mode="light" 
            label="Светлая" 
            icon={<Svg width="14" height="14" fill="none" stroke={themeMode === 'light' ? 'white' : theme.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></Svg>}
          />
          <ThemeBtn 
            mode="dark" 
            label="Темная" 
            icon={<Svg width="14" height="14" fill="none" stroke={themeMode === 'dark' ? 'white' : theme.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></Svg>}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: 280 },
  header: { padding: 16 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  newChatLabel: { fontSize: 15, fontFamily: fonts.medium },
  history: { flex: 1, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 12, fontFamily: fonts.semiBold, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 },
  chatItem: { padding: 12, borderRadius: 8, marginBottom: 4 },
  chatTitle: { fontSize: 14, fontFamily: fonts.regular },
  footer: { padding: 16, borderTopWidth: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  navIcon: { width: 24, alignItems: 'center' },
  navLabel: { fontSize: 14, fontFamily: fonts.medium },
  themeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(128,128,128,0.05)' },
  themeBtnText: { fontSize: 11, fontFamily: fonts.medium }
});
