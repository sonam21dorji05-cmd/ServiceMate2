import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export default function ScreenHeader({ title, subtitle, onBack }: Props) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.white },
  subtitle: { fontSize: fontSize.sm, color: colors.primaryLight, marginTop: spacing.xs },
});