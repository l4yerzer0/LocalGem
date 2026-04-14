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
  Image,
  Pressable,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
  KeyboardAvoidingView
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { Header } from '../components/ui/Header';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { Sidebar } from '../components/ui/Sidebar';
import ModelsScreen from './ModelsScreen';
import { SettingsScreen } from './SettingsScreen';
import { DeviceScreen } from './DeviceScreen';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/colors';
import { useChatStore } from '../store/chatStore';
import { useModelStore } from '../store/modelStore';
import { useSettingsStore } from '../store/settingsStore';

const { LiteRtModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(LiteRtModule);

export const ChatScreen: React.FC = () => {
  const theme = useTheme();
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
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{uri: string, filePath: string} | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const currentAssistantMsg = useRef("");
  
  // Анимация сайдбара
  const sidebarAnim = useRef(new Animated.Value(0)).current;

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

  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.timing(sidebarAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(sidebarAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsSidebarOpen(false));
  };

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

  const ParamSlider = ({ label, value, min, max, step, onValueChange }: any) => (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: theme.text.primary }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: theme.accent }]}>{value}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onSlidingComplete={onValueChange}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.accent}
      />
    </View>
  );

  const sidebarTranslateX = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 0]
  });

  const overlayOpacity = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const isEmpty = !currentChat || currentChat.messages.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar 
        barStyle={theme.surface === '#ffffff' ? 'dark-content' : 'light-content'} 
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      {/* Сайдбар */}
      <Modal 
        visible={isSidebarOpen} 
        animationType="none" 
        transparent 
        statusBarTranslucent={true}
        onRequestClose={closeSidebar}
      >
        <StatusBar backgroundColor="transparent" translucent={true} barStyle={theme.surface === '#ffffff' ? 'dark-content' : 'light-content'} />
        <View style={styles.sidebarOverlay}>
          <Animated.View style={[styles.sidebarOverlayInner, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={styles.closeOverlay} activeOpacity={1} onPress={closeSidebar} />
          </Animated.View>
          
          <Animated.View style={[styles.animatedSidebar, { transform: [{ translateX: sidebarTranslateX }] }]}>
            <Sidebar onClose={closeSidebar} />
          </Animated.View>
        </View>
      </Modal>

      {/* Настройки параметров чата */}
      <Modal 
        visible={isChatSettingsOpen} 
        animationType="slide" 
        transparent 
        statusBarTranslucent={true}
        onRequestClose={() => setIsChatSettingsOpen(false)}
      >
        <StatusBar backgroundColor="transparent" translucent={true} barStyle={theme.surface === '#ffffff' ? 'dark-content' : 'light-content'} />
        <Pressable style={styles.modalOverlay} onPress={() => setIsChatSettingsOpen(false)}>
            <View style={[styles.chatSettingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.chatSettingsHeader}>
                    <Text style={[styles.chatSettingsTitle, { color: theme.text.primary }]}>Параметры модели</Text>
                    <TouchableOpacity onPress={() => setIsChatSettingsOpen(false)}>
                        <Svg width="24" height="24" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></Svg>
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    <ParamSlider label="Temperature" value={settings.temperature} min={0} max={2} step={0.1} onValueChange={(v: number) => { settings.setTemperature(v); setInitialized(false); }} />
                    <ParamSlider label="Top P" value={settings.topP} min={0} max={1} step={0.05} onValueChange={(v: number) => { settings.setTopP(v); setInitialized(false); }} />
                    <ParamSlider label="Top K" value={settings.topK} min={1} max={100} step={1} onValueChange={(v: number) => { settings.setTopK(v); setInitialized(false); }} />
                    <ParamSlider label="Max Tokens" value={settings.maxTokens} min={128} max={4096} step={128} onValueChange={(v: number) => { settings.setMaxTokens(v); setInitialized(false); }} />
                    <Text style={[styles.paramHint, { color: theme.text.tertiary }]}>Изменение параметров потребует перезагрузки модели при следующем сообщении.</Text>
                </ScrollView>
            </View>
        </Pressable>
      </Modal>

      <Header 
        onMenuPress={openSidebar} 
        onSettingsPress={() => setIsChatSettingsOpen(true)}
        showSettings={activeView === 'chat'}
        title={activeView === 'models' ? 'Модели' : activeView === 'settings' ? 'Настройки' : activeView === 'device' ? 'Устройство' : (isEmpty ? "" : currentChat?.title || "LocalGem")}
      />
      
      {activeView === 'models' ? <ModelsScreen /> : 
       activeView === 'settings' ? <SettingsScreen /> : 
       activeView === 'device' ? <DeviceScreen /> : (
        <KeyboardAvoidingView 
          style={{flex: 1}} 
          behavior={Platform.OS === 'android' ? 'height' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0}
        >
          <View style={styles.chatWrapper}>
            {isEmpty ? (
              <View style={styles.emptyContainer}>
                  <View style={styles.emptyTitleRow}>
                      <Svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" color={theme.accent} style={styles.emptyIcon}>
                          <Path d="M12 2L4.5 9.5 12 17l7.5-7.5L12 2zm0 12l-4-4 4-4 4 4-4 4z" />
                      </Svg>
                      <Text style={[styles.emptyTitle, { color: theme.text.primary }]} allowFontScaling={false}>Добрый день, как я{"\n"}могу помочь?</Text>
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
                          <View style={styles.imagePreviewWrapper}>
                              <Image source={{ uri: pendingImage.uri }} style={styles.imagePreview} />
                              <TouchableOpacity style={[styles.removeImageBtn, { borderColor: theme.background }]} onPress={() => setPendingImage(null)}>
                                  <Svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24">
                                      <Path strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                  </Svg>
                              </TouchableOpacity>
                          </View>
                      </View>
                  )}
                  <ChatInput onSend={handleSend} onImagePick={handleImagePick} isCentered={false} />
                </View>
              </>
            )}
            
            {loadingStatus && (
              <View style={[styles.statusToast, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.statusText, { color: theme.text.primary }]}>{loadingStatus}</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatWrapper: { flex: 1 },
  bottomInputContainer: { width: '100%' },
  listContent: { paddingVertical: 20, paddingBottom: 28 },
  
  // Оверлеи
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarOverlayInner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  animatedSidebar: { width: 280, height: '100%', elevation: 16, zIndex: 100 },
  closeOverlay: { flex: 1, height: '100%' },
  
  emptyContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: '18%' },
  emptyTitleRow: { alignItems: 'center', marginBottom: 60 },
  emptyIcon: { marginBottom: 30 },
  emptyTitle: { 
    fontSize: 44, 
    fontFamily: Platform.OS === 'android' ? 'serif' : fonts.serifMedium, 
    textAlign: 'center', 
    lineHeight: 52, 
    letterSpacing: -1.5 
  },
  statusToast: { position: 'absolute', bottom: 120, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, borderWidth: 1, zIndex: 100 },
  statusText: { fontFamily: fonts.medium, fontSize: 13 },
  imagePreviewContainer: { paddingHorizontal: 20, marginBottom: -8, zIndex: 40, flexDirection: 'row' },
  imagePreviewWrapper: { width: 84, height: 84 },
  imagePreview: { width: 80, height: 80, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
  removeImageBtn: { position: 'absolute', top: -6, right: -2, backgroundColor: '#ff4444', borderRadius: 14, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, zIndex: 50 },
  
  // Модалка настроек чата
  chatSettingsCard: { width: '90%', maxHeight: '80%', borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 25 },
  chatSettingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  chatSettingsTitle: { fontSize: 19, fontFamily: fonts.semiBold },
  sliderRow: { marginBottom: 26, width: '100%' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  sliderLabel: { fontSize: 15, fontFamily: fonts.medium },
  sliderValue: { fontSize: 15, fontFamily: fonts.semiBold },
  slider: { width: '100%', height: 40 },
  paramHint: { fontSize: 12, fontFamily: fonts.regular, opacity: 0.6, marginTop: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 }
});
