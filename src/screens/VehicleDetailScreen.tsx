import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AppButton from '../components/AppButton';
import ScreenHeader from '../components/ScreenHeader';
import { deleteVehicle, subscribeToVehicle } from '../services/vehicleService';
import type { Vehicle } from '../types';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>{icon}</View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function VehicleDetailScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

  // Live updates: the screen refreshes after an edit, and closes if the vehicle is deleted
  useEffect(() => {
    const unsubscribe = subscribeToVehicle(
      vehicleId,
      (v) => {
        if (!v && !deletingRef.current) {
          if (navigation.canGoBack()) navigation.goBack();
          return;
        }
        setVehicle(v);
      },
      (error) => console.warn(error)
    );
    return unsubscribe;
  }, [vehicleId, navigation]);

  const confirmDelete = () => {
    if (!vehicle) return;
    Alert.alert('Delete vehicle', `Delete ${vehicle.make} ${vehicle.model}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deletingRef.current = true;
          setDeleting(true);
          try {
            await deleteVehicle(vehicle.id);
            navigation.goBack();
          } catch (error) {
            console.warn(error);
            deletingRef.current = false;
            setDeleting(false);
            Alert.alert('Could not delete', 'Please check your connection and try again.');
          }
        },
      },
    ]);
  };

  if (!vehicle) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ScreenHeader title="Vehicle" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  const isBike = vehicle.vehicleType === 'motorbike';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ScreenHeader
          title={`${vehicle.make} ${vehicle.model}`}
          subtitle={`${vehicle.year} \u2022 ${vehicle.licensePlate}`}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.infoCard}>
          <InfoRow
            icon={
              <MaterialCommunityIcons
                name={isBike ? 'motorbike' : 'car'}
                size={20}
                color={colors.primary}
              />
            }
            label="Type"
            value={isBike ? 'Motorbike' : 'Car'}
          />
          <InfoRow
            icon={<Ionicons name="speedometer-outline" size={20} color={colors.primary} />}
            label="Odometer"
            value={`${vehicle.odometer.toLocaleString()} km`}
          />
          <InfoRow
            icon={<Ionicons name="calendar-outline" size={20} color={colors.primary} />}
            label="Year"
            value={String(vehicle.year)}
          />
          <InfoRow
            icon={<Ionicons name="card-outline" size={20} color={colors.primary} />}
            label="License plate"
            value={vehicle.licensePlate}
            last
          />
        </View>

        <View style={styles.actionRow}>
          <AppButton
            title="Edit"
            variant="outline"
            onPress={() => navigation.navigate('AddVehicle', { vehicle })}
            style={styles.actionButton}
          />
          <AppButton
            title="Delete"
            variant="danger"
            onPress={confirmDelete}
            loading={deleting}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance history</Text>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="construct-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptyText}>
              Log services like oil changes and tyre rotations to get automatic reminders.
            </Text>
            <AppButton
              title="Log Maintenance"
              onPress={() =>
                Alert.alert('Coming next', 'Logging maintenance is built in the next step.')
              }
              style={styles.logButton}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },
  loader: { marginTop: spacing.xl },
  infoCard: {
    marginTop: -32,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoLabel: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  actionButton: { flex: 1 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.md + 2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: fontSize.md + 1, fontWeight: '700', color: colors.text },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs + 2,
    lineHeight: 20,
  },
  logButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
});