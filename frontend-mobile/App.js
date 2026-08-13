import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#080808' : '#F7F3ED'}
        translucent={false}
      />
      <AuthProvider>
        <ExpenseProvider>
          <SettingsProvider>
            <AppNavigator />
          </SettingsProvider>
        </ExpenseProvider>
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
