import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { UploadReceiptScreen } from '../screens/UploadReceipt';
import { SettingsScreen } from '../screens/Settings';
import { BudgetPlannerScreen } from '../screens/BudgetPlanner';
import { ONBOARDING_STORAGE_KEY } from '../utils/constants';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { isDark } = useTheme();
  const { isAuthenticated, loading } = useAuth();
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
    <NavigationContainer
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
              <AuthNavigator onOnboardingDone={finishOnboarding} />
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
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="BudgetPlanner" component={BudgetPlannerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
