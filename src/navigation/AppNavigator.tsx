import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import { colors } from '../theme/theme';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  AddVehicle: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  // Firebase tells us whether someone is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });
    return unsubscribe;
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}