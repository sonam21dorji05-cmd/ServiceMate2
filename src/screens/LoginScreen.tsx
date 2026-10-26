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
import { friendlyAuthError, logIn } from '../services/authService';
import { colors, fontSize, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!email.includes('@')) newErrors.email = 'Enter a valid email address';

    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const user = await logIn(email, password);
      // Temporary: the Home screen is added in a later step
      Alert.alert('Logged in', `Welcome back, ${user.displayName ?? user.email}`);
    } catch (error) {
      Alert.alert('Login failed', friendlyAuthError(error));
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
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="car-sport" size={40} color={colors.primary} />
            </View>
            <Text style={styles.appName}>ServiceMate</Text>
            <Text style={styles.tagline}>Your vehicle lifecycle keeper</Text>
          </View>

          <View style={styles.sheet}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Log in to manage your vehicles</Text>

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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <AppButton
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.link}>Sign Up</Text>
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
  hero: {
    alignItems: 'center',
    paddingTop: 90,
    paddingBottom: 72,
    backgroundColor: colors.primary,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  tagline: {
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
  heading: {
    fontSize: fontSize.lg + 2,
    fontWeight: '700',
    color: colors.text,
  },
  subheading: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  button: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: { color: colors.textSecondary, fontSize: fontSize.sm },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});