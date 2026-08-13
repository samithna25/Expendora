import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { UploadReceiptScreen } from '../screens/UploadReceipt';
import { SettingsScreen } from '../screens/Settings';
import { BudgetPlannerScreen } from '../screens/BudgetPlanner';
import { LegalScreen } from '../screens/Legal';
import { AddExpenseModal } from '../screens/AddExpenseModal';
import { ONBOARDING_STORAGE_KEY } from '../utils/constants';
import { SessionExpiredOverlay } from '../components/SessionExpiredOverlay';

const Stack = createNativeStackNavigator();

/**
 * Deep-link config for React Navigation.
 * expendora://reset-password?token=<TOKEN> -> Auth/ResetPassword screen
 * exp://<dev-host>/--/reset-password?token=<TOKEN> -> Auth/ResetPassword screen
 */
const expoGoHost =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoClient?.hostUri ||
  Constants.manifest?.debuggerHost;

const expoGoPrefix = expoGoHost ? `exp://${expoGoHost}/--` : null;

const linking = {
  prefixes: [
    'expendora://',
    'http://localhost:8081',
    'http://localhost:19006',
    ...(expoGoPrefix ? [expoGoPrefix] : []),
  ],
  config: {
    screens: {
      Auth: {
        path: '',
        screens: {
          ResetPassword: {
            path: 'reset-password',
            parse: {
              token: (token) => token,
            },
          },
          Login: 'login',
          Register: 'register',
        },
      },
    },
  },
};

export function AppNavigator() {
  const { isDark } = useTheme();
  const { isAuthenticated, loading, sessionExpired, clearSessionExpired } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then((val) => {
      if (val === 'true') setOnboardingDone(true);
    });
  }, []);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOnboardingDone(true);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <SplashScreen onFinish={() => {}} />;
  }

  return (
    <View style={styles.root}>
      <NavigationContainer
        linking={linking}
        theme={{
          ...DefaultTheme,
          dark: isDark,
          colors: {
            primary: '#FACC15',
            background: isDark ? '#0A0A0F' : '#FFFFFF',
            card: isDark ? '#1A1A2E' : '#F5F5F5',
            text: isDark ? '#FFFFFF' : '#1A1A2E',
            border: isDark ? '#2A2A3E' : '#E2E8F0',
            notification: '#FACC15',
          },
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth">
              {() => (
                <AuthNavigator
                  initialRouteName={onboardingDone ? 'Login' : 'Onboarding'}
                  onOnboardingDone={finishOnboarding}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen
                name="UploadReceipt"
                component={UploadReceiptScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="AddExpenseModal"
                component={AddExpenseModal}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="BudgetPlanner" component={BudgetPlannerScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <View
        pointerEvents={sessionExpired ? 'auto' : 'none'}
        style={styles.overlayContainer}
      >
        {sessionExpired && <SessionExpiredOverlay onLoginPress={clearSessionExpired} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
