import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, NativeModules, ActivityIndicator, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useModelStore } from '../store/modelStore';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/colors';

const { LiteRtModule } = NativeModules;

export const ModelsScreen: React.FC = () => {
  const { models, activeModel, setActiveModel, setModels } = useModelStore();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const loadModels = async () => {
    setLoading(true);
    try {
      const installed = await LiteRtModule.getInstalledModels();
      setModels(installed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleImport = async () => {
    try {
      const result = await LiteRtModule.importModel();
      if (result) {
        Alert.alert("Успех", `Модель ${result.name} импортирована`);
        loadModels();
      }
    } catch (e: any) {
      if (e.code !== 'CANCELLED') Alert.alert("Ошибка", e.message);
    }
  };

  const handleDelete = (fileName: string) => {
    Alert.alert("Удаление", "Вы уверены, что хотите удалить эту модель?", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: async () => {
          try {
            await LiteRtModule.deleteModel(fileName);
            loadModels();
          } catch (e: any) { Alert.alert("Ошибка", e.message); }
      }}
    ]);
  };

  const renderItem = ({ item }: any) => {
    const isActive = activeModel?.fileName === item.fileName;
    return (
      <View style={[styles.modelCard, { backgroundColor: theme.surface, borderColor: isActive ? theme.accent : theme.border }]}>
        <View style={styles.modelInfo}>
          <Text style={[styles.modelName, { color: theme.text.primary }]}>{item.name}</Text>
          <Text style={[styles.modelSize, { color: theme.text.tertiary }]}>{(item.size / 1024 / 1024 / 1024).toFixed(2)} GB</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.selectBtn, isActive && { backgroundColor: theme.accent }]} 
            onPress={() => setActiveModel(item)}
          >
            <Text style={[styles.selectBtnText, { color: isActive ? '#ffffff' : theme.accent }]}>{isActive ? "Активна" : "Выбрать"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.fileName)}>
            <Svg width="20" height="20" fill="none" stroke={theme.text.tertiary} viewBox="0 0 24 24">
              <Path strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={[styles.importBtn, { backgroundColor: theme.accent }]} onPress={handleImport}>
        <Svg width="20" height="20" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
          <Path strokeWidth="2.5" d="M12 4v12m0 0l-4-4m4 4l4-4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
        </Svg>
        <Text style={styles.importBtnText}>Импортировать .litertlm</Text>
      </TouchableOpacity>

      <FlatList
        data={models}
        keyExtractor={(item) => item.fileName}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadModels}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.text.tertiary }]}>Нет установленных моделей.{"\n"}Импортируйте файл .litertlm</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20 },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 20, padding: 18, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  importBtnText: { color: '#ffffff', fontSize: 15, fontFamily: fonts.semiBold },
  modelCard: { borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modelInfo: { flex: 1 },
  modelName: { fontSize: 16, fontFamily: fonts.medium, marginBottom: 6 },
  modelSize: { fontSize: 12, fontFamily: fonts.regular },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  selectBtnText: { fontSize: 13, fontFamily: fonts.semiBold },
  deleteBtn: { padding: 6, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 100, fontSize: 14, fontFamily: fonts.regular, lineHeight: 24 }
});

export default ModelsScreen;
