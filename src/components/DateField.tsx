import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../utils/format';
import { colors, fontSize, radius, spacing } from '../theme/theme';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
};

export default function DateField({ label, value, onChange, maximumDate }: Props) {
  const [show, setShow] = useState(false);
  const isIos = Platform.OS === 'ios';

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!isIos) {
      // Android shows a dialog that closes itself
      setShow(false);
      if (event.type === 'set' && selected) onChange(selected);
      return;
    }
    if (selected) onChange(selected);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setShow(!show)}
        style={[styles.field, show && styles.fieldActive]}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={show ? colors.primary : colors.textSecondary}
          style={styles.icon}
        />
        <Text style={styles.value}>{formatDate(value.getTime())}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>

      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display={isIos ? 'inline' : 'default'}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}

      {show && isIos && (
        <Pressable onPress={() => setShow(false)} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  fieldActive: { borderColor: colors.primary },
  icon: { marginRight: spacing.sm },
  value: { flex: 1, fontSize: fontSize.md, color: colors.text },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  doneText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
});