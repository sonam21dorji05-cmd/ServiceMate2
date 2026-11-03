import React, { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AppButton from '../components/AppButton';
import { auth } from '../services/firebase';
import { logOut } from '../services/authService';
import { subscribeToVehicles } from '../services/vehicleService';
import { subscribeToAllRecords } from '../services/maintenanceService';
import { formatMoney } from '../utils/format';
import type { MaintenanceRecord, Vehicle } from '../types';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

function SettingRow({
  icon,
  label,
  right,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  right?: React.ReactNode;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const user = auth.currentUser;
  const name = user?.displayName?.trim() || 'ServiceMate user';
  const email = user?.email ?? '';
  const initial = name.charAt(0).toUpperCase();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [notificationsOn, setNotificationsOn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToVehicles(setVehicles, (error) => console.warn(error));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAllRecords(setRecords, (error) => console.warn(error));
    return unsubscribe;
  }, []);

  // Check notification permission, and again whenever the app returns from Settings
  useEffect(() => {
    const refresh = async () => {
      try {
        const permission = await Notifications.getPermissionsAsync();
        setNotificationsOn(permission.granted);
      } catch {
        setNotificationsOn(false);
      }
    };

    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);

  const totalSpend = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  const handleNotificationsPress = async () => {
    try {
      if (!notificationsOn) {
        const permission = await Notifications.getPermissionsAsync();
        if (permission.canAskAgain) {
          const result = await Notifications.requestPermissionsAsync();
          setNotificationsOn(result.granted);
          return;
        }
      }
    } catch (error) {
      console.warn(error);
    }
    Linking.openSettings();
  };

  const handleTestNotification = async () => {
    try {
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Notifications are off',
          'Turn on notifications to receive service alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ServiceMate test',
          body: 'Notifications are working. You will be alerted when a service is due.',
        },
        trigger: null,
      });
    } catch (error) {
      console.warn(error);
      Alert.alert('Could not send notification', 'Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </Pressable>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{records.length}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(totalSpend)}
            </Text>
            <Text style={styles.statLabel}>Total spend</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            onPress={handleNotificationsPress}
            right={
              notificationsOn === null ? null : (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: notificationsOn ? colors.successLight : colors.dangerLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: notificationsOn ? colors.success : colors.danger },
                    ]}
                  >
                    {notificationsOn ? 'On' : 'Off'}
                  </Text>
                </View>
              )
            }
          />
          <SettingRow
            icon="paper-plane-outline"
            label="Send test notification"
            onPress={handleTestNotification}
          />
          <SettingRow
            icon="alarm-outline"
            label="Service reminders"
            onPress={() => navigation.navigate('Reminders')}
            last
          />
        </View>

        <View style={styles.logoutWrap}>
          <AppButton title="Log Out" variant="danger" onPress={handleLogout} />
        </View>

        <Text style={styles.footer}>ServiceMate {'\u2022'} Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },
  header: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: 72,
  },
  backButton: {
    position: 'absolute',
    top: 64,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  avatarText: { color: colors.primary, fontSize: 36, fontWeight: '700' },
  name: {
    color: colors.white,
    fontSize: fontSize.lg + 2,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  email: { color: colors.primaryLight, fontSize: fontSize.sm, marginTop: spacing.xs },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -40,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadow.card,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  statValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: fontSize.xs + 1, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  sectionTitle: {
    fontSize: fontSize.md + 2,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { opacity: 0.6 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  statusPill: {
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginRight: spacing.sm,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '700' },
  logoutWrap: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.xs + 1,
    marginTop: spacing.lg,
  },
});