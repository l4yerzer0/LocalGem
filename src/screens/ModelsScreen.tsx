import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, NativeModules, Alert, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme/colors';
import { useModelStore, AIModel } from '../store/modelStore';

const { LiteRtModule } = NativeModules;

export const ModelsScreen: React.FC = () => {
  const { models, activeModel, addModel, removeModel, setActiveModel } = useModelStore();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!LiteRtModule) return;
    try {
      setIsImporting(true);
      const newModel = await LiteRtModule.importModel();
      if (newModel) {
        addModel(newModel);
      }
    } catch (e: any) {
      if (e?.message !== 'Import cancelled' && e?.message !== 'No file selected') {
        Alert.alert('Ошибка импорта', e?.message || 'Не удалось импортировать модель');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!LiteRtModule) return;
    try {
      await LiteRtModule.deleteModel(name);
      removeModel(name);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось удалить модель');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Управление моделями</Text>

      <TouchableOpacity 
        style={styles.importButton} 
        onPress={handleImport}
        disabled={isImporting}
      >
        {isImporting ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Svg width="20" height="20" fill="none" stroke={colors.background} viewBox="0 0 24 24">
              <Path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </Svg>
            <Text style={styles.importText}>Импортировать модель</Text>
          </>
        )}
      </TouchableOpacity>

      <FlatList
        data={models}
        keyExtractor={(item) => item.path}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет установленных моделей. Импортируйте .litertlm файл для начала работы.</Text>
        }
        renderItem={({ item }) => {
          const isActive = activeModel?.name === item.name;
          return (
            <TouchableOpacity 
              style={[styles.modelCard, isActive && styles.activeModelCard]}
              onPress={() => setActiveModel(item)}
            >
              <View style={styles.modelInfo}>
                <View style={styles.modelHeader}>
                  <Text style={styles.modelName} numberOfLines={1}>{item.name}</Text>
                  {isActive && <Text style={styles.activeTag}>АКТИВНА</Text>}
                </View>
                <Text style={styles.modelDetails}>
                  Размер: {formatBytes(item.size)} • Локальный запуск
                </Text>
              </View>

              <TouchableOpacity onPress={() => handleDelete(item.name)} style={styles.deleteButton}>
                <Svg width="20" height="20" fill="none" stroke={colors.accent} viewBox="0 0 24 24">
                  <Path strokeWidth="1.5" strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </Svg>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.serif,
    color: colors.text.primary,
    marginBottom: 24,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e6e6e6',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 32,
  },
  importText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.background,
  },
  listContent: {
    gap: 16,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    borderRadius: 16,
  },
  activeModelCard: {
    borderColor: colors.text.tertiary,
  },
  modelInfo: {
    flex: 1,
    marginRight: 16,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  modelName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text.primary,
    flexShrink: 1,
  },
  activeTag: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#10b981', // green-500
    letterSpacing: 0.5,
  },
  modelDetails: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.tertiary,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(217, 119, 87, 0.1)',
    borderRadius: 8,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  }
});

export default ModelsScreen;
