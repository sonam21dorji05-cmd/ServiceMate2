import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fontSize, radius } from '../theme/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'outline' && styles.outline,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
  text: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  outlineText: { color: colors.primary },
});