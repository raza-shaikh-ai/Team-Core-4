import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

const AuthScreen = ({ navigation, route }) => {
  const { login, register } = useContext(AuthContext);

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Farmer'); // Farmer or NGO
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
  };

  const handleDetectLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Please input address manually.');
        setLocLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      setLat(latitude);
      setLng(longitude);

      // Nominatim reverse geocode
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FarmShareMobileApp/1.0',
          },
        }
      );

      if (!response.ok) throw new Error('Reverse geocode failed');
      const data = await response.json();
      setAddress(data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Location Error', 'Could not determine address automatically. Coordinates saved.');
      if (lat && lng) {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } finally {
      setLocLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password.');
      return;
    }

    setLoading(true);

    if (isRegister) {
      if (!name) {
        Alert.alert('Error', 'Please fill in your name.');
        setLoading(false);
        return;
      }
      
      const res = await register(name, email, password, role, lat, lng);
      setLoading(false);

      if (res.success) {
        Alert.alert('OTP Sent', res.message || 'OTP verification code sent to your email.');
        navigation.navigate('OTP', { email });
      } else {
        Alert.alert('Registration Failed', res.message);
      }
    } else {
      const res = await login(email, password);
      setLoading(false);

      if (res.success) {
        // AppNavigator will handle redirection based on token/user context updates
      } else if (res.otpRequired) {
        Alert.alert('Verification Needed', 'Please verify your OTP code to activate your account.');
        navigation.navigate('OTP', { email });
      } else {
        Alert.alert('Login Failed', res.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>🌾 FarmShare</Text>
          <Text style={styles.titleText}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitleText}>
            {isRegister
              ? 'Join our surplus produce distribution network'
              : 'Connect surplus produce with those in need'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {isRegister && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Register As</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'Farmer' && styles.roleButtonActive,
                    ]}
                    onPress={() => setRole('Farmer')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'Farmer' && styles.roleButtonTextActive,
                      ]}
                    >
                      Farmer 🌾
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'NGO' && styles.roleButtonActive,
                    ]}
                    onPress={() => setRole('NGO')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'NGO' && styles.roleButtonTextActive,
                      ]}
                    >
                      NGO / Food Bank 🏢
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.locationHeader}>
                  <Text style={styles.label}>Location / Address</Text>
                  <TouchableOpacity
                    onPress={handleDetectLocation}
                    disabled={locLoading}
                    style={styles.detectBtn}
                  >
                    {locLoading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.detectBtnText}>📍 Detect GPS</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  placeholder="Street, City, State, ZIP..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={2}
                  value={address}
                  onChangeText={setAddress}
                />
                {lat && lng && (
                  <Text style={styles.coordsText}>
                    Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
                  </Text>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRegister ? 'Register' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={handleToggleMode}>
              <Text style={styles.toggleLink}>
                {isRegister ? ' Login here' : ' Register here'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleButtonTextActive: {
    color: COLORS.primary,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  detectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  coordsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default AuthScreen;
