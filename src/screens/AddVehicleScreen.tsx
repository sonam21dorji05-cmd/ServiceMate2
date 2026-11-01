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
import ScreenHeader from '../components/ScreenHeader';
import { addVehicle } from '../services/vehicleService';
import type { VehicleType } from '../types';
import { colors, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddVehicle'>;

type Errors = {
  make?: string;
  model?: string;
  year?: string;
  plate?: string;
  odometer?: string;
};

export default function AddVehicleScreen({ navigation }: Props) {
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const newErrors: Errors = {};
    const currentYear = new Date().getFullYear();

    if (!make.trim()) newErrors.make = 'Make is required';
    if (!model.trim()) newErrors.model = 'Model is required';

    const yearNumber = Number(year);
    if (!/^\d{4}$/.test(year) || yearNumber < 1950 || yearNumber > currentYear + 1) {
      newErrors.year = `Enter a valid year (1950 - ${currentYear + 1})`;
    }

    if (!plate.trim()) newErrors.plate = 'License plate is required';

    if (!/^\d{1,7}$/.test(odometer)) {
      newErrors.odometer = 'Enter the odometer reading in km (numbers only)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await addVehicle({
        make: make.trim(),
        model: model.trim(),
        year: yearNumber,
        licensePlate: plate.trim().toUpperCase(),
        vehicleType,
        odometer: Number(odometer),
      });
      navigation.goBack();
    } catch (error) {
      console.warn(error);
      Alert.alert('Could not save vehicle', 'Please check your connection and try again.');
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
            title="Add vehicle"
            subtitle="Tell us about your car or motorbike"
            onBack={() => navigation.goBack()}
          />

          <View style={styles.sheet}>
            <Text style={styles.label}>Vehicle type</Text>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setVehicleType('car')}
                style={[styles.typeOption, vehicleType === 'car' && styles.typeSelected]}
              >
                <MaterialCommunityIcons
                  name="car"
                  size={26}
                  color={vehicleType === 'car' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[styles.typeText, vehicleType === 'car' && styles.typeTextSelected]}
                >
                  Car
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setVehicleType('motorbike')}
                style={[styles.typeOption, vehicleType === 'motorbike' && styles.typeSelected]}
              >
                <MaterialCommunityIcons
                  name="motorbike"
                  size={26}
                  color={vehicleType === 'motorbike' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeText,
                    vehicleType === 'motorbike' && styles.typeTextSelected,
                  ]}
                >
                  Motorbike
                </Text>
              </Pressable>
            </View>

            <AppInput
              label="Make"
              icon="car-outline"
              placeholder="e.g. Honda, Toyota"
              value={make}
              onChangeText={setMake}
              autoCapitalize="words"
              error={errors.make}
            />

            <AppInput
              label="Model"
              icon="pricetag-outline"
              placeholder="e.g. Civic, RAV4"
              value={model}
              onChangeText={setModel}
              autoCapitalize="words"
              error={errors.model}
            />

            <AppInput
              label="Year"
              icon="calendar-outline"
              placeholder="e.g. 2021"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
              error={errors.year}
            />

            <AppInput
              label="License plate"
              icon="card-outline"
              placeholder="e.g. BP-1-A2109"
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
              error={errors.plate}
            />

            <AppInput
              label="Current odometer (km)"
              icon="speedometer-outline"
              placeholder="e.g. 24500"
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="number-pad"
              maxLength={7}
              error={errors.odometer}
            />

            <AppButton
              title="Save Vehicle"
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
    marginBottom: spacing.xs + 2,
  },
  typeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  typeOption: {
    flex: 1,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  typeSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
  typeTextSelected: { color: colors.primary },
  button: { marginTop: spacing.sm },
});