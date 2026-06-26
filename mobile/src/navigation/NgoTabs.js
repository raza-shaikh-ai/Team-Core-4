import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

// Screens
import BrowseScreen from '../screens/ngo/BrowseScreen';
import RequestsScreen from '../screens/ngo/RequestsScreen';
import HistoryScreen from '../screens/ngo/HistoryScreen';
import MapScreen from '../screens/ngo/MapScreen';
import StatsScreen from '../screens/ngo/StatsScreen';

const Tab = createBottomTabNavigator();

const NgoTabs = () => {
  const { logout } = useContext(AuthContext);

  const renderLogoutButton = () => (
    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
      <Text style={styles.logoutText}>Logout 🚪</Text>
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let emoji = '🔍';
          if (route.name === 'Browse') emoji = '🔍';
          else if (route.name === 'Requests') emoji = '📋';
          else if (route.name === 'History') emoji = '📦';
          else if (route.name === 'Map') emoji = '📍';
          else if (route.name === 'Stats') emoji = '📈';

          return (
            <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              {emoji}
            </Text>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerRight: renderLogoutButton,
        headerShadowVisible: false,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen 
        name="Browse" 
        component={BrowseScreen} 
        options={{ headerShown: false, tabBarLabel: 'Browse' }} 
      />
      <Tab.Screen 
        name="Requests" 
        component={RequestsScreen} 
        options={{ headerShown: false, tabBarLabel: 'Pickups' }} 
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ headerShown: false, tabBarLabel: 'History' }} 
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ headerShown: false, tabBarLabel: 'Map' }} 
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{ headerShown: false, tabBarLabel: 'Stats' }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  logoutBtn: {
    marginRight: 16,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.urgency.critical,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: COLORS.text,
  },
});

export default NgoTabs;
