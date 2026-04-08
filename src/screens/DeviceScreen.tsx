import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, NativeModules, ActivityIndicator, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme/colors';

const { LiteRtModule } = NativeModules;

interface DeviceInfo {
  model: string;
  totalRam: number;
  availRam: number;
  cpu: string;
  cores: number;
  hasNpu: boolean;
  temperature: number;
  androidVersion: string;
}

export const DeviceScreen: React.FC = () => {
  const [info, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await LiteRtModule.getDeviceInfo();
        setDeviceInfo(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const formatGb = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>;
  if (!info) return <View style={styles.center}><Text style={styles.error}>Не удалось получить данные</Text></View>;

  const InfoRow = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
                <Path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
            </Svg>
            <Text style={styles.heroSubValue}>{info.temperature}°C</Text>
        </View>

        <View style={styles.heroCenter}>
            <Text style={styles.modelName}>{info.model}</Text>
        </View>

        <View style={styles.heroRight}>
            <Text style={styles.heroSubLabel}>Free RAM</Text>
            <Text style={styles.heroSubValue}>{formatGb(info.availRam)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Система</Text>
      <View style={styles.card}>
        <InfoRow 
          label="Версия Android" 
          value={info.androidVersion} 
          icon={<Svg width="18" height="18" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></Svg>}
        />
        <InfoRow 
          label="Процессор" 
          value={info.cpu} 
          icon={<Svg width="18" height="18" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" /></Svg>}
        />
        <InfoRow 
          label="Ядра CPU" 
          value={info.cores} 
          icon={<Svg width="18" height="18" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2zM9 5v14M15 5v14" /></Svg>}
        />
        <InfoRow 
          label="Всего RAM" 
          value={formatGb(info.totalRam)} 
          icon={<Svg width="18" height="18" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></Svg>}
        />
      </View>

      <Text style={styles.sectionTitle}>Ускорители LiteRT</Text>
      <View style={styles.card}>
        <InfoRow 
          label="GPU Ускорение" 
          value="Доступно" 
          icon={<Svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24"><Path strokeWidth="2" d="M5 13l4 4L19 7" /></Svg>}
        />
        <InfoRow 
          label="NPU (Нейрочип)" 
          value={info.hasNpu ? "Доступно" : "Не обнаружено"} 
          icon={info.hasNpu ? 
            <Svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24"><Path strokeWidth="2" d="M5 13l4 4L19 7" /></Svg> :
            <Svg width="18" height="18" fill="none" stroke={colors.text.tertiary} viewBox="0 0 24 24"><Path strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></Svg>
          }
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLeft: {
    alignItems: 'center',
    width: 60,
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  heroRight: {
    alignItems: 'center',
    width: 70,
  },
  modelName: { fontSize: 18, fontFamily: fonts.serif, color: colors.text.primary, textAlign: 'center' },
  heroSubLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: colors.text.tertiary, textTransform: 'uppercase' },
  heroSubValue: { fontSize: 14, fontFamily: fonts.medium, color: colors.text.primary, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 14, fontFamily: fonts.regular, color: colors.text.secondary },
  value: { fontSize: 14, fontFamily: fonts.medium, color: colors.text.primary },
  error: { color: colors.accent, fontFamily: fonts.medium }
});
