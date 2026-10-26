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
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { friendlyAuthError, signUp } from '../services/authService';
import { colors, fontSize, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export default function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const newErrors: Errors = {};

    if (!name.trim()) newErrors.name = 'Full name is required';

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!email.includes('@')) newErrors.email = 'Enter a valid email address';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (confirm !== password) newErrors.confirm = 'Passwords do not match';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await signUp(name, email, password);
      // Temporary: the Home screen is added in a later step
      Alert.alert('Account created', 'Your account was created successfully.');
    } catch (error) {
      Alert.alert('Sign up failed', friendlyAuthError(error));
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
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Create account</Text>
            <Text style={styles.headerSub}>Start tracking your vehicle maintenance</Text>
          </View>

          <View style={styles.sheet}>
            <AppInput
              label="Full name"
              icon="person-outline"
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />

            <AppInput
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />

            <AppInput
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <AppInput
              label="Confirm password"
              icon="shield-checkmark-outline"
              placeholder="Re-enter your password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              error={errors.confirm}
            />

            <AppButton
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Log In</Text>
              </Pressable>
            </View>
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
  header: {
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: 68,
    backgroundColor: colors.primary,
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
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
    marginTop: spacing.xs,
  },
  sheet: {
    flex: 1,
    marginTop: -32,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  button: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  footerText: { color: colors.textSecondary, fontSize: fontSize.sm },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});