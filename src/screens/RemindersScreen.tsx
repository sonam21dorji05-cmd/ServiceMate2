import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ReminderCard from '../components/ReminderCard';
import ScreenHeader from '../components/ScreenHeader';
import { subscribeToVehicles } from '../services/vehicleService';
import { subscribeToAllRecords } from '../services/maintenanceService';
import { computeAllReminders } from '../utils/reminders';
import type { MaintenanceRecord, Vehicle } from '../types';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Reminders'>;

export default function RemindersScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToVehicles(
      (list) => {
        setVehicles(list);
        setVehiclesLoaded(true);
      },
      (error) => console.warn(error)
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAllRecords(
      (list) => setRecords(list),
      (error) => console.warn(error)
    );
    return unsubscribe;
  }, []);

  const reminders = useMemo(() => computeAllReminders(vehicles, records), [vehicles, records]);
  const overdue = reminders.filter((r) => r.status === 'overdue');
  const upcoming = reminders.filter((r) => r.status !== 'overdue');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ScreenHeader
          title="Service reminders"
          subtitle={`${overdue.length} overdue \u2022 ${upcoming.length} upcoming`}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.sheet}>
          {!vehiclesLoaded ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : reminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No reminders yet</Text>
              <Text style={styles.emptyText}>
                Log a service on one of your vehicles and its next due date will appear here
                automatically.
              </Text>
            </View>
          ) : (
            <>
              {overdue.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Overdue ({overdue.length})</Text>
                  {overdue.map((reminder) => (
                    <ReminderCard
                      key={reminder.key}
                      reminder={reminder}
                      onPress={() =>
                        navigation.navigate('VehicleDetail', { vehicleId: reminder.vehicle.id })
                      }
                    />
                  ))}
                </>
              )}

              {upcoming.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Upcoming ({upcoming.length})</Text>
                  {upcoming.map((reminder) => (
                    <ReminderCard
                      key={reminder.key}
                      reminder={reminder}
                      onPress={() =>
                        navigation.navigate('VehicleDetail', { vehicleId: reminder.vehicle.id })
                      }
                    />
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  sheet: {
    flex: 1,
    marginTop: -32,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  loader: { marginTop: spacing.lg },
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
});