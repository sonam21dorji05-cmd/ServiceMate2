import React, { useEffect, useState } from 'react';
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
import type { Vehicle } from '../types';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <View style={styles.vehicleCard}>
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
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState(auth.currentUser?.displayName ?? '');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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

  const firstName = name.trim().split(' ')[0] || 'there';
  const initial = firstName.charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const goToAddVehicle = () => navigation.navigate('AddVehicle');

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

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

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
            vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)
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