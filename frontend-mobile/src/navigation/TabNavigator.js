import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, ListTree, ScanLine, PieChart, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { colors as themeColors } from '../theme/colors';
import { DashboardScreen } from '../screens/Dashboard';
import { ExpenseListScreen } from '../screens/ExpenseList';
import { ReportsScreen } from '../screens/Reports';
import { ProfileScreen } from '../screens/Profile';

const Tab = createBottomTabNavigator();

function ScanTabButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('UploadReceipt')} style={styles.scanBtn}>
      <View style={styles.scanInner}>
        <ScanLine size={24} color={themeColors.black} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}

export function TabNavigator() {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: themeColors.card[colorScheme],
          borderTopColor: themeColors.border[colorScheme],
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: themeColors.gold,
        tabBarInactiveTintColor: themeColors.muted[colorScheme],
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ListTree size={size} color={color} />,
          tabBarLabel: 'Expenses',
        }}
      />
      <Tab.Screen
        name="Scan"
        component={DashboardScreen}
        options={{
          tabBarButton: () => <ScanTabButton />,
          tabBarLabel: 'Scan',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('UploadReceipt');
          },
        })}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PieChart size={size} color={color} />,
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scanBtn: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: themeColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(250,204,21,0.65)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 4,
    borderColor: themeColors.background.light,
  },
});
