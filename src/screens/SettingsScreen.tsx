import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts } from '../theme/colors';
import { useSettingsStore, BackendType } from '../store/settingsStore';
import { useTheme } from '../theme/useTheme';

export const SettingsScreen: React.FC = () => {
  const settings = useSettingsStore();
  const theme = useTheme();

  const handleBackendChange = (type: BackendType) => {
    settings.setBackend(type);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>Система</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text.primary }]}>Ускоритель (Backend)</Text>
          <View style={styles.backendRow}>
            {(['CPU', 'GPU', 'NPU'] as BackendType[]).map((type) => {
              const isNpu = type === 'NPU';
              return (
                <TouchableOpacity 
                  key={type}
                  style={[
                    styles.backendBtn, 
                    { borderColor: theme.border },
                    settings.backend === type && { borderColor: theme.accent, backgroundColor: theme.accent + '15' },
                    isNpu && styles.backendBtnDisabled
                  ]}
                  onPress={() => !isNpu && handleBackendChange(type)}
                  disabled={isNpu}
                >
                  <Text style={[
                    styles.backendText, 
                    { color: theme.text.secondary },
                    settings.backend === type && { color: theme.accent },
                    isNpu && styles.backendTextDisabled
                  ]}>
                    {type}{isNpu ? " (Скоро)" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: theme.text.tertiary }]}>GPU рекомендуется для S25 Ultra. NPU будет доступен в следующих обновлениях.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>О приложении</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>Версия</Text>
            <Text style={[styles.infoValue, { color: theme.text.primary }]}>1.0.0 (Alpha)</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>Движок</Text>
            <Text style={[styles.infoValue, { color: theme.text.primary }]}>LiteRT (TensorFlow Lite)</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.infoText, { color: theme.text.tertiary }]}>
        LocalGem — это полностью локальный ИИ-чат. Ваши данные и изображения никогда не покидают устройство.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text.tertiary, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  label: { fontSize: 15, fontFamily: fonts.medium, color: colors.text.primary, paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  hint: { fontSize: 12, fontFamily: fonts.regular, color: colors.text.tertiary, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 18 },
  backendRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  backendBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  backendBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(217, 119, 87, 0.1)' },
  backendBtnDisabled: { opacity: 0.4, borderColor: '#333333' },
  backendText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text.secondary },
  backendTextActive: { color: colors.accent },
  backendTextDisabled: { fontSize: 11 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 15, fontFamily: fonts.regular, color: colors.text.secondary },
  infoValue: { fontSize: 15, fontFamily: fonts.medium, color: colors.text.primary },
  infoText: { marginTop: 24, fontSize: 12, fontFamily: fonts.regular, color: colors.text.tertiary, lineHeight: 18, textAlign: 'center' }
});
