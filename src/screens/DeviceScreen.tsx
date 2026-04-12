import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeModules, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/colors';

const { LiteRtModule } = NativeModules;

export const DeviceScreen: React.FC = () => {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const data = await LiteRtModule.getDeviceInfo();
      setInfo(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const InfoCard = ({ title, value, icon, subValue }: any) => (
    <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: theme.accent + '10' }]}>{icon}</View>
        <View>
          <Text style={[styles.cardTitle, { color: theme.text.tertiary }]}>{title}</Text>
          <Text style={[styles.cardValue, { color: theme.text.primary }]}>{value}</Text>
        </View>
      </View>
      {subValue && <Text style={[styles.cardSubValue, { color: theme.text.secondary }]}>{subValue}</Text>}
    </View>
  );

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.accent} /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.chip, { backgroundColor: theme.accent }]}>
          <Text style={styles.chipText}>AI Ready</Text>
        </View>
        <Text style={[styles.modelName, { color: theme.text.primary }]}>{info?.model || 'Unknown Device'}</Text>
        <Text style={[styles.androidVer, { color: theme.text.tertiary }]}>Android {info?.androidVersion}</Text>
      </View>

      <View style={styles.grid}>
        <InfoCard 
          title="Процессор" 
          value={info?.cpu} 
          subValue={`${info?.cores} ядер`}
          icon={<Svg width="20" height="20" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></Svg>}
        />
        <InfoCard 
          title="Оперативная память" 
          value={`${(info?.totalRam / 1024 / 1024 / 1024).toFixed(1)} GB`} 
          subValue={`${(info?.availRam / 1024 / 1024 / 1024).toFixed(1)} GB доступно`}
          icon={<Svg width="20" height="20" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2" d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2zM9 5v14M15 5v14" /></Svg>}
        />
        <InfoCard 
          title="Температура" 
          value={`${info?.temperature}°C`} 
          icon={<Svg width="20" height="20" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2" d="M9 19c-4.286 1.35-4.286-2.55-6-3m12 5v-3.5c0-1 .45-1.92 1.2-2.5l3.5-2.5c.8-.6 1.3-1.54 1.3-2.5V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10z" /></Svg>}
        />
        <InfoCard 
          title="NPU" 
          value={info?.hasNpu ? "Доступен" : "Отсутствует"} 
          icon={<Svg width="20" height="20" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></Svg>}
        />
      </View>

      <TouchableOpacity style={[styles.refreshBtn, { borderColor: theme.border }]} onPress={fetchInfo}>
        <Text style={[styles.refreshText, { color: theme.text.secondary }]}>Обновить данные</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  chipText: { color: '#ffffff', fontSize: 10, fontFamily: fonts.semiBold, textTransform: 'uppercase' },
  modelName: { fontSize: 24, fontFamily: fonts.serif, marginBottom: 4 },
  androidVer: { fontSize: 14, fontFamily: fonts.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  infoCard: { width: (Dimensions.get('window').width - 56) / 2, borderRadius: 20, padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 11, fontFamily: fonts.semiBold, textTransform: 'uppercase' },
  cardValue: { fontSize: 16, fontFamily: fonts.medium, marginTop: 2 },
  cardSubValue: { fontSize: 12, fontFamily: fonts.regular },
  refreshBtn: { marginTop: 32, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  refreshText: { fontSize: 14, fontFamily: fonts.medium }
});
