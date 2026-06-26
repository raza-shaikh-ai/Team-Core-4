import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

// Navigators / Screens
import AuthScreen from '../screens/auth/AuthScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import FarmerTabs from './FarmerTabs';
import NgoTabs from './NgoTabs';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token === null || user === null ? (
        // Non-Authenticated stack
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
        </>
      ) : (
        // Authenticated tabs based on user role (normalize "Food Bank" as NGO)
        <>
          {user.role === 'Farmer' ? (
            <Stack.Screen name="FarmerApp" component={FarmerTabs} />
          ) : (
            <Stack.Screen name="NgoApp" component={NgoTabs} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;
