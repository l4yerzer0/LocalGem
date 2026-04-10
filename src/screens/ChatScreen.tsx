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
  TouchableOpacity,
  ImageBackground,
  Pressable,
  Dimensions
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Header } from '../components/ui/Header';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { Sidebar } from '../components/ui/Sidebar';
import ModelsScreen from './ModelsScreen';
import { SettingsScreen } from './SettingsScreen';
import { DeviceScreen } from './DeviceScreen';
import { colors, fonts } from '../theme/colors';
import { useChatStore } from '../store/chatStore';
import { useModelStore } from '../store/modelStore';
import { useSettingsStore } from '../store/settingsStore';

const { LiteRtModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(LiteRtModule);
const { width, height } = Dimensions.get('window');

export const ChatScreen: React.FC = () => {
  const chats = useChatStore(state => state.chats);
  const currentChatId = useChatStore(state => state.currentChatId);
  const addChat = useChatStore(state => state.addChat);
  const addMessage = useChatStore(state => state.addMessage);
  const addMessageWithImage = useChatStore(state => state.addMessageWithImage);
  const updateLastMessage = useChatStore(state => state.updateLastMessage);
  const updateLastMessageWithThinking = useChatStore(state => state.updateLastMessageWithThinking);
  const updateLastMessageWithStats = useChatStore(state => state.updateLastMessageWithStats);
  const activeView = useChatStore(state => state.activeView);
  const setActiveView = useChatStore(state => state.setActiveView);

  const { activeModel, isInitialized, setInitialized, setModels, setActiveModel } = useModelStore();
  const settings = useSettingsStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{uri: string, filePath: string} | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const currentAssistantMsg = useRef("");

  useEffect(() => {
    if (chats.length === 0) addChat("New Chat");
    const initModels = async () => {
        if (!LiteRtModule) return;
        try {
            const installed = await LiteRtModule.getInstalledModels();
            setModels(installed);
            if (installed.length > 0 && !activeModel) setActiveModel(installed[0]);
        } catch (e) { console.error(e); }
    };
    initModels();
  }, []);

  const currentChat = chats.find(c => c.id === currentChatId);

  useEffect(() => {
    const tokenSub = eventEmitter.addListener('onTokenReceived', (token: string) => {
      currentAssistantMsg.current += token;
      if (currentChatId) updateLastMessage(currentChatId, currentAssistantMsg.current);
    });
    const thinkingSub = eventEmitter.addListener('onThinkingReceived', (thought: string) => {
      if (currentChatId) updateLastMessageWithThinking(currentChatId, thought);
    });
    const doneSub = eventEmitter.addListener('onResponseDone', (stats: any) => {
      if (currentChatId) updateLastMessageWithStats(currentChatId, currentAssistantMsg.current, stats);
      currentAssistantMsg.current = "";
    });
    return () => { tokenSub.remove(); thinkingSub.remove(); doneSub.remove(); };
  }, [currentChatId]);

  const handleImagePick = async () => {
    try {
        const result = await LiteRtModule.pickImage();
        if (result) setPendingImage(result);
    } catch (e) { console.error(e); }
  };

  const handleSend = async (text: string) => {
    if (!currentChatId || !activeModel) return;

    if (pendingImage) {
        addMessageWithImage(currentChatId, text, pendingImage.uri);
    } else {
        addMessage(currentChatId, 'user', text);
    }
    
    const imageToSend = pendingImage?.filePath || null;
    setPendingImage(null);
    
    try {
      if (!isInitialized) {
        setLoadingStatus("Загружаем модель в память...");
        await LiteRtModule.initializeModel(
            activeModel.path, settings.backend, settings.temperature,
            settings.topK, settings.topP, settings.maxTokens
        );
        setInitialized(true);
        setLoadingStatus(null);
      }

      addMessage(currentChatId, 'assistant', "...");
      currentAssistantMsg.current = "";
      LiteRtModule.sendMessage(text, imageToSend, settings.isThinkingEnabled);
    } catch (e: any) {
      setLoadingStatus(`Ошибка: ${e.message}`);
      setTimeout(() => setLoadingStatus(null), 5000);
    }
  };

  const isEmpty = !currentChat || currentChat.messages.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <Modal visible={isSidebarOpen} animationType="fade" transparent onRequestClose={() => setIsSidebarOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsSidebarOpen(false)}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
          <View style={styles.closeOverlay} />
        </Pressable>
      </Modal>

      <Header 
        onMenuPress={() => setIsSidebarOpen(true)} 
        onSettingsPress={() => setActiveView(activeView === 'settings' ? 'chat' : 'settings')}
        showSettings={activeView === 'chat'}
        title={activeView === 'models' ? 'Модели' : activeView === 'settings' ? 'Настройки' : activeView === 'device' ? 'Устройство' : (isEmpty ? "" : currentChat?.title || "LocalGem")}
      />
      
      {activeView === 'models' ? <ModelsScreen /> : 
       activeView === 'settings' ? <SettingsScreen /> : 
       activeView === 'device' ? <DeviceScreen /> : (
        <View style={styles.chatWrapper}>
          {isEmpty ? (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyTitleRow}>
                    <Svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" color={colors.accent} style={styles.emptyIcon}>
                        <Path d="M12 2L4.5 9.5 12 17l7.5-7.5L12 2zm0 12l-4-4 4-4 4 4-4 4z" />
                    </Svg>
                    <Text style={styles.emptyTitle}>Добрый день, как я{"\n"}могу помочь?</Text>
                </View>
                <ChatInput onSend={handleSend} onImagePick={handleImagePick} isCentered={true} />
            </View>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={currentChat?.messages || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ChatMessage role={item.role} content={item.content} thinking={item.thinking} image={item.image} stats={item.stats} />
                )}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
              <View style={styles.bottomInputContainer}>
                {pendingImage && (
                    <View style={styles.imagePreviewContainer}>
                        <ImageBackground source={{ uri: pendingImage.uri }} style={styles.imagePreview} imageStyle={{ borderRadius: 12 }}>
                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setPendingImage(null)}>
                                <Svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
                                    <Path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </Svg>
                            </TouchableOpacity>
                        </ImageBackground>
                    </View>
                )}
                <ChatInput onSend={handleSend} onImagePick={handleImagePick} isCentered={false} />
              </View>
            </>
          )}
          
          {loadingStatus && (
            <View style={styles.statusToast}>
              <Text style={styles.statusText}>{loadingStatus}</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chatWrapper: { flex: 1 },
  bottomInputContainer: { width: '100%' },
  listContent: { paddingVertical: 16, paddingBottom: 24 },
  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)' },
  closeOverlay: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: '20%' },
  emptyTitleRow: { alignItems: 'center', marginBottom: 40 },
  emptyIcon: { marginBottom: 20 },
  emptyTitle: { fontSize: 28, fontFamily: fonts.serif, color: colors.text.primary, textAlign: 'center', lineHeight: 36 },
  statusToast: { position: 'absolute', bottom: 120, alignSelf: 'center', backgroundColor: '#2b2b2b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, zIndex: 100 },
  statusText: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: 13 },
  imagePreviewContainer: { paddingHorizontal: 20, marginBottom: -8, zIndex: 40 },
  imagePreview: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ff4444', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background }
});
