import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ServiceIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const CURRENCY = 'Nu.';

export const SERVICE_TYPES: { label: string; icon: ServiceIconName }[] = [
  { label: 'Oil Change', icon: 'oil' },
  { label: 'Tire Rotation', icon: 'tire' },
  { label: 'Brake Service', icon: 'car-brake-alert' },
  { label: 'Battery Replacement', icon: 'car-battery' },
  { label: 'Air Filter', icon: 'air-filter' },
  { label: 'General Inspection', icon: 'clipboard-check-outline' },
  { label: 'Other', icon: 'wrench' },
];

export function iconForService(label: string): ServiceIconName {
  return SERVICE_TYPES.find((s) => s.label === label)?.icon ?? 'wrench';
}