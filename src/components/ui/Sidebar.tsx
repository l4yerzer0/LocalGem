import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/colors';
import { useChatStore } from '../../store/chatStore';

const { width } = Dimensions.get('window');

interface SidebarProps {
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const chats = useChatStore(state => state.chats);
  const currentChatId = useChatStore(state => state.currentChatId);
  const addChat = useChatStore(state => state.addChat);
  const setCurrentChat = useChatStore(state => state.setCurrentChat);
  const deleteChat = useChatStore(state => state.deleteChat);
  const activeView = useChatStore(state => state.activeView);
  const setActiveView = useChatStore(state => state.setActiveView);

  const handleNewChat = () => {
    addChat(`Chat ${chats.length + 1}`);
    setActiveView('chat');
    onClose();
  };

  const handleChatSelect = (id: string) => {
    setCurrentChat(id);
    setActiveView('chat');
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color={colors.accent}>
              <Path d="M12 2L4.5 9.5 12 17l7.5-7.5L12 2zm0 12l-4-4 4-4 4 4-4 4z" />
            </Svg>
            <Text style={styles.title}>LocalGem</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
          <Svg width="24" height="24" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24">
            <Path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.newChatContainer}>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatText}>Новый чат</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>История</Text>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.chatItem, item.id === currentChatId && styles.activeChatItem]}>
              <TouchableOpacity 
                style={styles.chatInfo} 
                onPress={() => handleChatSelect(item.id)}
              >
                <Text style={[styles.chatTitle, item.id === currentChatId && styles.activeChatTitle]} numberOfLines={1}>
                    {item.title}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => deleteChat(item.id)} style={styles.iconButton}>
                 <Svg width="16" height="16" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24">
                    <Path strokeWidth="2" strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </Svg>
              </TouchableOpacity>
            </View>
          )}
        />
      </ScrollView>

      <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
             <Svg width="20" height="20" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24">
                 <Path strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </Svg>
             <Text style={styles.navText}>Архив</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setActiveView('models'); onClose(); }}>
             <Svg width="20" height="20" fill="none" stroke={activeView === 'models' ? colors.text.primary : colors.text.tertiary} viewBox="0 0 24 24">
                 <Path strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
             </Svg>
             <Text style={[styles.navText, activeView === 'models' && { color: colors.text.primary }]}>Модели</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setActiveView('device'); onClose(); }}>
             <Svg width="20" height="20" fill="none" stroke={activeView === 'device' ? colors.text.primary : colors.text.tertiary} viewBox="0 0 24 24">
                 <Path strokeWidth="1.5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
             </Svg>
             <Text style={[styles.navText, activeView === 'device' && { color: colors.text.primary }]}>Устройство</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setActiveView('settings'); onClose(); }}>
             <Svg width="20" height="20" fill="none" stroke={activeView === 'settings' ? colors.text.primary : colors.text.tertiary} viewBox="0 0 24 24">
                 <Path strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
             </Svg>
             <Text style={[styles.navText, activeView === 'settings' && { color: colors.text.primary }]}>Настройки</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
    width: width * 0.75,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.serif,
    color: colors.accent,
  },
  newChatContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  newChatButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  newChatText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  activeChatItem: {
    backgroundColor: colors.surface,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  activeChatTitle: {
    color: colors.text.primary,
  },
  iconButton: {
    padding: 4,
  },
  bottomNav: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  }
});
