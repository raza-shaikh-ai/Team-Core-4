import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

const BestMatchHero = ({ item, onRequestPickup }) => {
  if (!item) return null;

  const score = item.match_score || 0;
  const reasons = item.match_reasons || [];

  return (
    <View style={styles.container}>
      <Text style={styles.badgeLabel}>🤖 AI Smart Match — Top Pick For You</Text>
      
      <View style={styles.card}>
        <View style={styles.header}>
          {/* Circular Score Match */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{score}%</Text>
            <Text style={styles.scoreLabel}>Match</Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.produceName}>{item.produce_name}</Text>
            <Text style={styles.farmerInfo} numberOfLines={1}>
              by {item.farmer_name || 'Anonymous Farmer'}
            </Text>
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {item.location}
            </Text>
          </View>
        </View>

        {/* Reasons Bullet Points */}
        <View style={styles.reasonsContainer}>
          {reasons.map((reason, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.bulletText}>{reason}</Text>
            </View>
          ))}
        </View>

        {/* Card Footer Info */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>📦 {item.quantity} kg</Text>
          <Text style={styles.metaText}>📅 {item.harvest_date}</Text>
          {item.distance_km !== undefined && item.distance_km !== null && (
            <Text style={styles.metaText}>📍 {item.distance_km.toFixed(1)} km</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => onRequestPickup(item.id)}
        >
          <Text style={styles.actionBtnText}>⚡ Request Pickup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 10,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fffbeb',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    padding: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  scoreContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.white,
    borderWidth: 3.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#b45309',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  titleContainer: {
    flex: 1,
  },
  produceName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  farmerInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reasonsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletSymbol: {
    fontSize: 14,
    color: '#d97706',
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 18,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
  },
  actionBtn: {
    backgroundColor: '#b45309',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default BestMatchHero;
