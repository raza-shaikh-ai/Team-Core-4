import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const UrgencyBadge = ({ harvestDate }) => {
  const getUrgencyData = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const harvest = new Date(dateStr);
    harvest.setHours(0, 0, 0, 0);
    const daysOld = Math.max(0, (today - harvest) / (1000 * 60 * 60 * 24));

    if (daysOld >= 6) {
      return {
        label: '⚠️ Donate within 24 hrs',
        color: COLORS.urgency.critical,
        bgColor: '#fef2f2',
      };
    } else if (daysOld >= 4) {
      return {
        label: '⚠️ Donate within 48 hrs',
        color: COLORS.urgency.high,
        bgColor: '#fff7ed',
      };
    } else if (daysOld >= 2) {
      return {
        label: '🕐 Donate within 5 days',
        color: COLORS.urgency.medium,
        bgColor: '#fef3c7',
      };
    } else {
      return {
        label: '✅ Fresh',
        color: COLORS.urgency.fresh,
        bgColor: COLORS.primaryLight,
      };
    }
  };

  const badge = getUrgencyData(harvestDate);

  return (
    <View style={[styles.badge, { backgroundColor: badge.bgColor, borderColor: badge.color }]}>
      <Text style={[styles.text, { color: badge.color }]}>{badge.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UrgencyBadge;
