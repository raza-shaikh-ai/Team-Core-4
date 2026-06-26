import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import client from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import UrgencyBadge from '../../components/UrgencyBadge';
import BestMatchHero from '../../components/BestMatchHero';

const BrowseScreen = () => {
  const { user, updateLocation } = useContext(AuthContext);

  const [listings, setListings] = useState([]);
  const [bestMatch, setBestMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // NGO Coords
  const [ngoCoords, setNgoCoords] = useState(null);

  useEffect(() => {
    initializeLocationAndFetch();
  }, []);

  const initializeLocationAndFetch = async () => {
    setLoading(true);
    let coords = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setNgoCoords(coords);
        // Persist NGO location to backend
        await updateLocation(coords.lat, coords.lng);
      } else {
        // Fallback to profile coordinates
        if (user?.latitude && user?.longitude) {
          coords = { lat: user.latitude, lng: user.longitude };
          setNgoCoords(coords);
        }
      }
    } catch (e) {
      console.warn('Geolocation check error:', e);
      if (user?.latitude && user?.longitude) {
        coords = { lat: user.latitude, lng: user.longitude };
        setNgoCoords(coords);
      }
    }

    fetchSmartMatches(coords);
  };

  const fetchSmartMatches = async (coords = ngoCoords) => {
    try {
      const params = {};
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }
      params.limit = 100;

      const response = await client.get('/match/smart', { params });
      const items = response.data.items || [];
      
      setListings(items);

      // Best match is the first available listing (sorted by backend scoring engine)
      const topPick = items.find((i) => i.status === 'available');
      setBestMatch(topPick || null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to retrieve produce matches.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPickup = async (produceId) => {
    try {
      await client.post(`/requests/${produceId}`);
      Alert.alert('Success', 'Pickup request submitted successfully!');
      // Refresh browse feed
      fetchSmartMatches();
    } catch (error) {
      console.error(error);
      Alert.alert('Request Failed', error.response?.data?.detail || 'Failed to request pickup.');
    }
  };

  // Client-side filtering logic
  const filteredListings = listings.filter((item) => {
    const matchesName = item.produce_name.toLowerCase().includes(searchName.toLowerCase());
    const matchesLocation = item.location.toLowerCase().includes(searchLocation.toLowerCase());
    // Exclude the hero best match from the main grid list to avoid duplication
    const isNotHero = bestMatch ? item.id !== bestMatch.id : true;
    return matchesName && matchesLocation && isNotHero;
  });

  const renderProduceCard = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500' }}
        style={styles.cardImage}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.produce_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: COLORS[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: COLORS[item.status] }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <UrgencyBadge harvestDate={item.harvest_date} />

        <Text style={styles.cardMeta}>📦 Quantity: {item.quantity} kg</Text>
        <Text style={styles.cardMeta}>📅 Harvested: {item.harvest_date}</Text>
        <Text style={styles.cardMeta}>🌾 Farmer: {item.farmer_name || 'Anonymous'}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>📍 Location: {item.location}</Text>

        {item.distance_km !== undefined && item.distance_km !== null && (
          <Text style={styles.distanceText}>📍 Distance: {item.distance_km.toFixed(1)} km away</Text>
        )}
        
        {item.match_score !== undefined && (
          <Text style={styles.scoreText}>🤖 Match Score: {item.match_score}%</Text>
        )}

        <TouchableOpacity
          style={[styles.requestBtn, item.status !== 'available' && styles.requestBtnDisabled]}
          onPress={() => handleRequestPickup(item.id)}
          disabled={item.status !== 'available'}
        >
          <Text style={styles.requestBtnText}>
            {item.status === 'available' ? 'Request Pickup' : item.status.replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Surplus Food</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchSmartMatches()}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Inputs */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="🔍 Search produce (e.g. Tomato)"
          placeholderTextColor={COLORS.textSecondary}
          value={searchName}
          onChangeText={setSearchName}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="📍 Filter by location"
          placeholderTextColor={COLORS.textSecondary}
          value={searchLocation}
          onChangeText={setSearchLocation}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderProduceCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            bestMatch && !searchName && !searchLocation ? (
              <BestMatchHero item={bestMatch} onRequestPickup={handleRequestPickup} />
            ) : null
          }
          ListHeaderComponentStyle={{ marginBottom: 10 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No available produce matching your criteria.</Text>
            </View>
          }
        />
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
    paddingBottom: 16,
    backgroundColor: COLORS.white,
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
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  filterInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f1f5f9',
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
    marginTop: 4,
  },
  requestBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  requestBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  requestBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default BrowseScreen;
