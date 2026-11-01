import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AppButton from '../components/AppButton';
import ScreenHeader from '../components/ScreenHeader';
import { deleteVehicleWithRecords, subscribeToVehicle } from '../services/vehicleService';
import { subscribeToRecords } from '../services/maintenanceService';
import { iconForService } from '../constants/services';
import { formatDate, formatMoney } from '../utils/format';
import type { MaintenanceRecord, Vehicle } from '../types';
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

function RecordRow({ record, last }: { record: MaintenanceRecord; last: boolean }) {
  return (
    <View style={[styles.recordRow, !last && styles.recordRowBorder]}>
      <View style={styles.recordIcon}>
        <MaterialCommunityIcons
          name={iconForService(record.serviceType)}
          size={22}
          color={colors.primary}
        />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordTitle}>{record.serviceType}</Text>
        <Text style={styles.recordMeta}>
          {formatDate(record.date)} {'\u2022'} {record.odometer.toLocaleString()} km
        </Text>
        {!!record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
      </View>
      {record.cost > 0 && <Text style={styles.recordCost}>{formatMoney(record.cost)}</Text>}
    </View>
  );
}

export default function VehicleDetailScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
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

  // Live maintenance history for this vehicle
  useEffect(() => {
    const unsubscribe = subscribeToRecords(
      vehicleId,
      (list) => setRecords(list),
      (error) => console.warn(error)
    );
    return unsubscribe;
  }, [vehicleId]);

  const confirmDelete = () => {
    if (!vehicle) return;
    Alert.alert(
      'Delete vehicle',
      `Delete ${vehicle.make} ${vehicle.model} and all its maintenance records? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            deletingRef.current = true;
            setDeleting(true);
            try {
              await deleteVehicleWithRecords(vehicle.id);
              navigation.goBack();
            } catch (error) {
              console.warn(error);
              deletingRef.current = false;
              setDeleting(false);
              Alert.alert('Could not delete', 'Please check your connection and try again.');
            }
          },
        },
      ]
    );
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
  const totalSpend = records.reduce((sum, r) => sum + (r.cost || 0), 0);

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

        <View style={styles.primaryAction}>
          <AppButton
            title="Log Maintenance"
            onPress={() => navigation.navigate('LogMaintenance', { vehicle })}
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

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total spend</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalSpend)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Services</Text>
            <Text style={styles.summaryValue}>{records.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance history</Text>

          {records.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="construct-outline" size={30} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptyText}>
                Log services like oil changes and tyre rotations to track your history and spend.
              </Text>
            </View>
          ) : (
            <View style={styles.recordsCard}>
              {records.map((record, index) => (
                <RecordRow key={record.id} record={record} last={index === records.length - 1} />
              ))}
            </View>
          )}
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
  primaryAction: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: { flex: 1 },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.card,
  },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.md + 2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  recordsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  recordRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recordIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  recordMeta: { fontSize: fontSize.xs + 1, color: colors.textSecondary, marginTop: 2 },
  recordNotes: {
    fontSize: fontSize.xs + 1,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  recordCost: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
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
});