import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import DateField from '../components/DateField';
import ScreenHeader from '../components/ScreenHeader';
import { addMaintenanceRecord } from '../services/maintenanceService';
import { CURRENCY, SERVICE_TYPES } from '../constants/services';
import { colors, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LogMaintenance'>;

type Errors = {
  serviceType?: string;
  odometer?: string;
  cost?: string;
};

export default function LogMaintenanceScreen({ navigation, route }: Props) {
  const { vehicle } = route.params;

  const [serviceType, setServiceType] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [odometer, setOdometer] = useState(String(vehicle.odometer));
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const newErrors: Errors = {};

    if (!serviceType) newErrors.serviceType = 'Choose a service type';

    if (!/^\d{1,7}$/.test(odometer)) {
      newErrors.odometer = 'Enter the odometer reading in km (numbers only)';
    }

    const costText = cost.trim();
    if (costText && !/^\d+(\.\d{1,2})?$/.test(costText)) {
      newErrors.cost = 'Enter a valid amount, for example 1500 or 1500.50';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !serviceType) return;

    setLoading(true);
    try {
      await addMaintenanceRecord(vehicle, {
        serviceType,
        date: date.getTime(),
        odometer: Number(odometer),
        cost: costText ? Number(costText) : 0,
        notes: notes.trim(),
      });
      navigation.goBack();
    } catch (error) {
      console.warn(error);
      Alert.alert('Could not save record', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="Log maintenance"
            subtitle={`${vehicle.make} ${vehicle.model} \u2022 ${vehicle.licensePlate}`}
            onBack={() => navigation.goBack()}
          />

          <View style={styles.sheet}>
            <Text style={styles.label}>Service type</Text>
            <View style={styles.chipWrap}>
              {SERVICE_TYPES.map((service) => {
                const selected = serviceType === service.label;
                return (
                  <Pressable
                    key={service.label}
                    onPress={() => setServiceType(service.label)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <MaterialCommunityIcons
                      name={service.icon}
                      size={18}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {service.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!!errors.serviceType && <Text style={styles.error}>{errors.serviceType}</Text>}

            <View style={styles.spacer} />

            <DateField
              label="Service date"
              value={date}
              onChange={setDate}
              maximumDate={new Date()}
            />

            <AppInput
              label="Odometer at service (km)"
              icon="speedometer-outline"
              placeholder="e.g. 24500"
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="number-pad"
              maxLength={7}
              error={errors.odometer}
            />

            <AppInput
              label={`Cost (${CURRENCY}) - optional`}
              icon="cash-outline"
              placeholder="e.g. 1500"
              value={cost}
              onChangeText={setCost}
              keyboardType="decimal-pad"
              error={errors.cost}
            />

            <AppInput
              label="Notes - optional"
              icon="create-outline"
              placeholder="e.g. Synthetic oil, new filter"
              value={notes}
              onChangeText={setNotes}
              maxLength={120}
            />

            <AppButton
              title="Save Record"
              onPress={handleSave}
              loading={loading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  sheet: {
    flex: 1,
    marginTop: -32,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  chipTextSelected: { color: colors.primary },
  error: { color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs },
  spacer: { height: spacing.md },
  button: { marginTop: spacing.sm },
});