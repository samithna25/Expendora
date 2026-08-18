import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <AuthProvider>
        <ExpenseProvider>
          <SettingsProvider>
            <AppNavigator />
          </SettingsProvider>
        </ExpenseProvider>
      </AuthProvider>
      
      <View 
        pointerEvents="none"
        style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, 
          height: insets.top, 
          backgroundColor: isDark ? '#080808' : '#F7F3ED' 
        }} 
      />
    </View>
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
