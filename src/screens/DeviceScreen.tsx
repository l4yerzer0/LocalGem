import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeModules, ActivityIndicator, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/colors';

const { LiteRtModule } = NativeModules;

export const DeviceScreen: React.FC = () => {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchInfo = async () => {
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
        <View style={[styles.iconBox, { backgroundColor: theme.accent + '15' }]}>{icon}</View>
        <Text style={[styles.cardTitle, { color: theme.text.tertiary }]} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.valueWrapper}>
        <Text style={[styles.cardValue, { color: theme.text.primary }]} numberOfLines={2}>{value}</Text>
        {subValue && <Text style={[styles.cardSubValue, { color: theme.text.secondary }]}>{subValue}</Text>}
      </View>
    </View>
  );

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.accent} /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={[styles.modelName, { color: theme.text.primary }]}>{info?.model || 'Device'}</Text>
        <Text style={[styles.androidVer, { color: theme.text.tertiary }]}>Android {info?.androidVersion}</Text>
      </View>

      <View style={styles.grid}>
        <InfoCard 
          title="CPU" 
          value={info?.cpu} 
          subValue={`${info?.cores} Cores`}
          icon={<Svg width="18" height="18" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></Svg>}
        />
        <InfoCard 
          title="GPU" 
          value={info?.gpu || "Unknown"} 
          icon={<Svg width="18" height="18" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></Svg>}
        />
        <InfoCard 
          title="RAM" 
          value={`${(info?.totalRam / 1024 / 1024 / 1024).toFixed(1)} GB`} 
          subValue={`${(info?.availRam / 1024 / 1024 / 1024).toFixed(1)} GB Free`}
          icon={<Svg width="18" height="18" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2.5" d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM9 5v14M15 5v14" /></Svg>}
        />
        <InfoCard 
          title="Temp" 
          value={`${info?.temperature}°C`} 
          icon={<Svg width="18" height="18" fill="none" stroke={theme.accent} viewBox="0 0 24 24"><Path strokeWidth="2.5" d="M12 2v14m0 0a3 3 0 100 6 3 3 0 000-6zM12 2a3 3 0 013 3v7a3 3 0 11-6 0V5a3 3 0 013-3z" /></Svg>}
        />
      </View>

      <View style={styles.statusBox}>
        <Text style={[styles.statusTitle, { color: theme.text.secondary }]}>NPU Accelerator</Text>
        <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: info?.hasNpu ? '#4caf50' : '#ff9800' }]} />
            <Text style={[styles.statusText, { color: theme.text.primary }]}>{info?.hasNpu ? "Hardware support detected" : "Emulated via CPU/GPU"}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'flex-start', marginBottom: 36, marginTop: 10, paddingLeft: 4 },
  modelName: { fontSize: 30, fontFamily: fonts.serif, marginBottom: 6, lineHeight: 38 },
  androidVer: { fontSize: 14, fontFamily: fonts.medium, opacity: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  infoCard: { width: (Dimensions.get('window').width - 54) / 2, borderRadius: 20, padding: 18, borderWidth: 1, minHeight: 130 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 10, fontFamily: fonts.semiBold, textTransform: 'uppercase', letterSpacing: 0.6 },
  valueWrapper: { flex: 1, justifyContent: 'flex-end' },
  cardValue: { fontSize: 17, fontFamily: fonts.semiBold, lineHeight: 22 },
  cardSubValue: { fontSize: 12, fontFamily: fonts.medium, marginTop: 5, opacity: 0.7 },
  statusBox: { marginTop: 28, padding: 22, borderRadius: 20, backgroundColor: 'rgba(128,128,128,0.05)', borderWidth: 1, borderColor: 'transparent' },
  statusTitle: { fontSize: 12, fontFamily: fonts.semiBold, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontFamily: fonts.medium }
});
