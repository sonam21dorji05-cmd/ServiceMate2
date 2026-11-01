import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AppButton from '../components/AppButton';
import { auth } from '../services/firebase';
import { logOut } from '../services/authService';
import { subscribeToVehicles } from '../services/vehicleService';
import { subscribeToAllRecords } from '../services/maintenanceService';
import { computeAllReminders } from '../utils/reminders';
import type { MaintenanceRecord, Vehicle } from '../types';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function VehicleCard({
  vehicle,
  overdueCount,
  onPress,
}: {
  vehicle: Vehicle;
  overdueCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.vehicleCard, pressed && styles.vehicleCardPressed]}
    >
      <View style={styles.vehicleIcon}>
        <MaterialCommunityIcons
          name={vehicle.vehicleType === 'motorbike' ? 'motorbike' : 'car'}
          size={28}
          color={colors.primary}
        />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>
          {vehicle.make} {vehicle.model}
        </Text>
        <Text style={styles.vehicleMeta}>
          {vehicle.year} {'\u2022'} {vehicle.licensePlate}
        </Text>
        <Text style={styles.vehicleOdometer}>{vehicle.odometer.toLocaleString()} km</Text>
        {overdueCount > 0 && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueBadgeText}>{overdueCount} overdue</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState(auth.currentUser?.displayName ?? '');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh the profile so the name appears right after sign up
  useEffect(() => {
    auth.currentUser
      ?.reload()
      .then(() => setName(auth.currentUser?.displayName ?? ''))
      .catch(() => {});
  }, []);

  // Live list of this user's vehicles from the cloud
  useEffect(() => {
    const unsubscribe = subscribeToVehicles(
      (list) => {
        setVehicles(list);
        setLoading(false);
      },
      (error) => {
        console.warn(error);
        setLoading(false);
        Alert.alert('Could not load vehicles', 'Check your connection and Firestore rules.');
      }
    );
    return unsubscribe;
  }, []);

  // Live maintenance records, used to work out reminders
  useEffect(() => {
    const unsubscribe = subscribeToAllRecords(
      (list) => setRecords(list),
      (error) => console.warn(error)
    );
    return unsubscribe;
  }, []);

  const reminders = useMemo(() => computeAllReminders(vehicles, records), [vehicles, records]);
  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;

  const overdueByVehicle = useMemo(() => {
    const counts: Record<string, number> = {};
    reminders.forEach((r) => {
      if (r.status === 'overdue') counts[r.vehicle.id] = (counts[r.vehicle.id] ?? 0) + 1;
    });
    return counts;
  }, [reminders]);

  const firstName = name.trim().split(' ')[0] || 'there';
  const initial = firstName.charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const goToAddVehicle = () => navigation.navigate('AddVehicle');
  const goToReminders = () => navigation.navigate('Reminders');

  const hasAlert = overdueCount > 0;
  const bannerTitle = hasAlert
    ? `${overdueCount} service${overdueCount === 1 ? '' : 's'} overdue`
    : reminders.length === 0
    ? 'No reminders yet'
    : 'All services up to date';
  const bannerSub = hasAlert
    ? 'Tap to see what needs attention'
    : reminders.length === 0
    ? 'Log a service to start getting reminders'
    : 'Tap to see upcoming services';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.greetingBox}>
              <Text style={styles.hello}>Hello, {firstName}</Text>
              <Text style={styles.helloSub}>Keep your vehicles in top shape</Text>
            </View>
            <Pressable onPress={handleLogout} hitSlop={12} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={22} color={colors.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="car-sport-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>

          <Pressable onPress={goToReminders} style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: hasAlert ? colors.dangerLight : colors.successLight },
              ]}
            >
              <Ionicons
                name={hasAlert ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={20}
                color={hasAlert ? colors.danger : colors.success}
              />
            </View>
            <Text style={[styles.statNumber, hasAlert && { color: colors.danger }]}>
              {overdueCount}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </Pressable>
        </View>

        {vehicles.length > 0 && (
          <Pressable
            onPress={goToReminders}
            style={[styles.banner, hasAlert ? styles.bannerAlert : styles.bannerOk]}
          >
            <Ionicons
              name={hasAlert ? 'alert-circle' : 'checkmark-circle'}
              size={26}
              color={hasAlert ? colors.danger : colors.success}
            />
            <View style={styles.bannerText}>
              <Text
                style={[
                  styles.bannerTitle,
                  { color: hasAlert ? colors.danger : colors.success },
                ]}
              >
                {bannerTitle}
              </Text>
              <Text style={styles.bannerSub}>{bannerSub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Garage</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="car-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptyText}>
                Add your vehicle to start tracking maintenance and service reminders.
              </Text>
              <AppButton
                title="Add Vehicle"
                onPress={goToAddVehicle}
                style={styles.emptyButton}
              />
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                overdueCount={overdueByVehicle[vehicle.id] ?? 0}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Pressable onPress={goToAddVehicle} style={styles.fab}>
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 110 },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: 72,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '700' },
  greetingBox: { flex: 1, marginLeft: spacing.md },
  hello: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  helloSub: { color: colors.primaryLight, fontSize: fontSize.xs + 1, marginTop: 2 },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: -44,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.card,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  bannerAlert: { backgroundColor: colors.dangerLight, borderColor: '#F5B5B5' },
  bannerOk: { backgroundColor: colors.successLight, borderColor: '#B9DDBB' },
  bannerText: { flex: 1, marginLeft: spacing.md },
  bannerTitle: { fontSize: fontSize.md, fontWeight: '700' },
  bannerSub: { fontSize: fontSize.xs + 1, color: colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.md + 2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  loader: { marginTop: spacing.lg },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  vehicleCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: { flex: 1, marginLeft: spacing.md },
  vehicleName: { fontSize: fontSize.md + 1, fontWeight: '700', color: colors.text },
  vehicleMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  vehicleOdometer: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  overdueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: spacing.sm,
  },
  overdueBadgeText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '700' },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: fontSize.md + 2, fontWeight: '700', color: colors.text },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs + 2,
    lineHeight: 20,
  },
  emptyButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    shadowOpacity: 0.25,
  },
});