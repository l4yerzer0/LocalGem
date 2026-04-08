import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { colors, fonts } from '../theme/colors';
import { useSettingsStore, BackendType } from '../store/settingsStore';
import { useModelStore } from '../store/modelStore';

export const SettingsScreen: React.FC = () => {
  const settings = useSettingsStore();
  const { setInitialized } = useModelStore();

  const handleBackendChange = (type: BackendType) => {
    settings.setBackend(type);
    setInitialized(false); // Нужно переинициализировать модель при смене бэкенда
  };

  const renderOption = (label: string, value: string | number, onDecrease: () => void, onIncrease: () => void) => (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={onDecrease} style={styles.controlBtn}><Text style={styles.controlText}>-</Text></TouchableOpacity>
        <Text style={styles.optionValue}>{value}</Text>
        <TouchableOpacity onPress={onIncrease} style={styles.controlBtn}><Text style={styles.controlText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Ускоритель (Backend)</Text>
      <View style={styles.backendRow}>
        {(['CPU', 'GPU', 'NPU'] as BackendType[]).map((type) => (
          <TouchableOpacity 
            key={type}
            style={[styles.backendBtn, settings.backend === type && styles.backendBtnActive]}
            onPress={() => handleBackendChange(type)}
          >
            <Text style={[styles.backendText, settings.backend === type && styles.backendTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Параметры генерации</Text>
      <View style={styles.card}>
        {renderOption("Temperature", settings.temperature.toFixed(1), 
          () => settings.setTemperature(Math.max(0.1, settings.temperature - 0.1)),
          () => settings.setTemperature(Math.min(2.0, settings.temperature + 0.1))
        )}
        {renderOption("Top-P", settings.topP.toFixed(2), 
          () => settings.setTopP(Math.max(0.1, settings.topP - 0.05)),
          () => settings.setTopP(Math.min(1.0, settings.topP + 0.05))
        )}
        {renderOption("Top-K", settings.topK, 
          () => settings.setTopK(Math.max(1, settings.topK - 5)),
          () => settings.setTopK(Math.min(100, settings.topK + 5))
        )}
        {renderOption("Max Tokens", settings.maxTokens, 
          () => settings.setMaxTokens(Math.max(128, settings.maxTokens - 128)),
          () => settings.setMaxTokens(Math.min(4096, settings.maxTokens + 128))
        )}
      </View>

      <Text style={styles.infoText}>
        * Смена ускорителя потребует повторной загрузки модели в память при следующей отправке сообщения.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  backendRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  backendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  backendBtnActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(217, 119, 87, 0.1)',
  },
  backendText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  backendTextActive: {
    color: colors.accent,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    color: colors.text.primary,
    fontSize: 18,
  },
  optionValue: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.accent,
  },
  infoText: {
    marginTop: 24,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.tertiary,
    lineHeight: 18,
  }
});
