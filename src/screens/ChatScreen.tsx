import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  NativeModules, 
  NativeEventEmitter,
  Modal,
  Text,
  TouchableOpacity
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Header } from '../components/ui/Header';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { Sidebar } from '../components/ui/Sidebar';
import { ModelsScreen } from './ModelsScreen';
import { colors, fonts } from '../theme/colors';
import { useChatStore } from '../store/chatStore';

const { LiteRtModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(LiteRtModule);

export const ChatScreen: React.FC = () => {
  const chats = useChatStore(state => state.chats);
  const currentChatId = useChatStore(state => state.currentChatId);
  const addChat = useChatStore(state => state.addChat);
  const addMessage = useChatStore(state => state.addMessage);
  const updateLastMessage = useChatStore(state => state.updateLastMessage);
  const activeView = useChatStore(state => state.activeView);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentAssistantMsg = useRef("");

  useEffect(() => {
    if (chats.length === 0) {
      addChat("New Chat");
    }
  }, []);

  const currentChat = chats.find(c => c.id === currentChatId);

  useEffect(() => {
    const tokenSub = eventEmitter.addListener('onTokenReceived', (token: string) => {
      currentAssistantMsg.current += token;
      if (currentChatId) {
        updateLastMessage(currentChatId, currentAssistantMsg.current);
      }
    });

    const doneSub = eventEmitter.addListener('onResponseDone', () => {
      currentAssistantMsg.current = "";
    });

    return () => {
      tokenSub.remove();
      doneSub.remove();
    };
  }, [currentChatId]);

  const handleSend = (text: string) => {
    if (!currentChatId) return;

    addMessage(currentChatId, 'user', text);
    addMessage(currentChatId, 'assistant', "...");
    currentAssistantMsg.current = "";

    if (LiteRtModule) {
      LiteRtModule.sendMessage(text);
    }
  };

  const isEmpty = !currentChat || currentChat.messages.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <Modal
        visible={isSidebarOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
          <TouchableOpacity 
            style={styles.closeOverlay} 
            onPress={() => setIsSidebarOpen(false)} 
          />
        </View>
      </Modal>

      <Header 
        onMenuPress={() => setIsSidebarOpen(true)} 
        title={activeView === 'models' ? 'Модели' : (isEmpty ? "" : currentChat?.title || "LocalGem")}
      />
      
      {activeView === 'models' ? (
        <ModelsScreen />
      ) : isEmpty ? (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyTitleRow}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" color={colors.accent} style={styles.emptyIcon}>
                    <Path d="M12 2L4.5 9.5 12 17l7.5-7.5L12 2zm0 12l-4-4 4-4 4 4-4 4z" />
                </Svg>
                <Text style={styles.emptyTitle}>Добрый день, как я{"\n"}могу помочь?</Text>
            </View>
            <ChatInput onSend={handleSend} isCentered={true} />
        </View>
      ) : (
        <View style={styles.chatWrapper}>
          <FlatList
            ref={flatListRef}
            data={currentChat?.messages || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage role={item.role} content={item.content} />
            )}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <ChatInput onSend={handleSend} isCentered={false} />
        </View>
      )}
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatWrapper: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  closeOverlay: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: '20%',
  },
  emptyTitleRow: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontFamily: fonts.serif,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 36,
  },
});
