import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { iconForService } from '../constants/services';
import { formatDate } from '../utils/format';
import type { Reminder, ReminderStatus } from '../utils/reminders';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';

const STATUS_STYLE: Record<ReminderStatus, { label: string; color: string; bg: string }> = {
  overdue: { label: 'OVERDUE', color: colors.danger, bg: colors.dangerLight },
  'due-soon': { label: 'DUE SOON', color: colors.warning, bg: '#FFF3E0' },
  upcoming: { label: 'UPCOMING', color: colors.success, bg: colors.successLight },
};

function plural(n: number, word: string) {
  return `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;
}

function describe(r: Reminder): string {
  if (r.status === 'overdue') {
    const parts: string[] = [];
    if (r.kmRemaining <= 0) parts.push(`${Math.abs(r.kmRemaining).toLocaleString()} km`);
    if (r.daysRemaining < 0) parts.push(plural(Math.abs(r.daysRemaining), 'day'));
    return parts.length > 0 ? `Overdue by ${parts.join(' and ')}` : 'Due today';
  }
  return `Due in ${r.kmRemaining.toLocaleString()} km or ${plural(r.daysRemaining, 'day')}`;
}

type Props = {
  reminder: Reminder;
  onPress?: () => void;
};

export default function ReminderCard({ reminder, onPress }: Props) {
  const style = STATUS_STYLE[reminder.status];
  const { vehicle } = reminder;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: style.bg }]}>
        <MaterialCommunityIcons
          name={iconForService(reminder.serviceType)}
          size={24}
          color={style.color}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{reminder.serviceType}</Text>
        <Text style={styles.vehicle}>
          {vehicle.make} {vehicle.model} {'\u2022'} {vehicle.licensePlate}
        </Text>
        <Text style={[styles.due, { color: style.color }]}>{describe(reminder)}</Text>
        <Text style={styles.last}>
          Last done {formatDate(reminder.lastDate)} at {reminder.lastOdometer.toLocaleString()} km
        </Text>
      </View>

      <View style={[styles.pill, { backgroundColor: style.bg }]}>
        <Text style={[styles.pillText, { color: style.color }]}>{style.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginLeft: spacing.md, marginRight: spacing.sm },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  vehicle: { fontSize: fontSize.xs + 1, color: colors.textSecondary, marginTop: 2 },
  due: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.xs },
  last: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
});