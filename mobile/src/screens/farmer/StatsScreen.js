import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { AuthContext } from '../../context/AuthContext';

const StatsScreen = () => {
  const { logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await client.get('/stats/farmer');
      setStats(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load farmer statistics.');
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (icon, label, value, bg) => (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Impact Analytics</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchStats}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Summary Dashboard</Text>
          
          <View style={styles.grid}>
            {renderStatCard('🌾', 'Total Produce Uploaded', stats?.total_uploaded || 0, '#ecfdf5')}
            {renderStatCard('📋', 'Active Listings', stats?.active_listings || 0, '#eff6ff')}
            {renderStatCard('⏳', 'Pending Requests', stats?.pending_requests || 0, '#fffbeb')}
            {renderStatCard('📦', 'Completed Donations', stats?.completed_donations || 0, '#faf5ff')}
          </View>

          <View style={styles.wideCard}>
            <Text style={styles.wideIcon}>⚖️</Text>
            <View>
              <Text style={styles.wideLabel}>Total Quantity Donated</Text>
              <Text style={styles.wideValue}>{stats?.total_kg_donated || 0} kg</Text>
            </View>
          </View>

          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Your Green Footprint 💚</Text>
            <Text style={styles.impactDescription}>
              By sharing surplus food, you have helped prevent organic waste from going to landfills, directly reducing CO₂ greenhouse emissions and feeding local communities in need. Keep up the amazing work!
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout 🚪</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    fontSize: 24,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  wideCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: '#ccfbf1',
    marginBottom: 20,
  },
  wideIcon: {
    fontSize: 32,
  },
  wideLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d9488',
  },
  wideValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f766e',
    marginTop: 2,
  },
  impactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  impactDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default StatsScreen;
