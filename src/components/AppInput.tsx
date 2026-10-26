import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function AppInput({ label, error, icon, secureTextEntry, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.textSecondary}
            style={styles.icon}
          />
        )}

        <TextInput
          {...rest}
          secureTextEntry={hidden}
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />

        {secureTextEntry && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
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
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.danger },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: fontSize.md, color: colors.text },
  error: { color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs },
});