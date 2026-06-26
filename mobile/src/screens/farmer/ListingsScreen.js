import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import client from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import UrgencyBadge from '../../components/UrgencyBadge';

const ListingsScreen = () => {
  const { token } = useContext(AuthContext);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [locationStr, setLocationStr] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await client.get('/produce/my');
      // Filter out delivered items (which go to history)
      const active = response.data.filter((item) => item.status !== 'delivered');
      setListings(active);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load your produce listings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant camera roll permissions to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const localUri = result.assets[0].uri;
      setImageUri(localUri);
      uploadImage(localUri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      });

      const response = await client.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImageUrl(response.data.url);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Error', 'Failed to upload image to cloud.');
      setImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDetectLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission denied. Please enter address manually.');
        setLocLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setLat(latitude);
      setLng(longitude);

      // reverse geocode
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FarmShareMobileApp/1.0',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLocationStr(data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } else {
        setLocationStr(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Location Error', 'Failed to fetch GPS location.');
    } finally {
      setLocLoading(false);
    }
  };

  const handleSubmitProduce = async () => {
    if (!name || !quantity || !locationStr) {
      Alert.alert('Error', 'Please fill in name, quantity and location.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        produce_name: name,
        quantity: parseFloat(quantity),
        harvest_date: harvestDate,
        location: locationStr,
        image_url: imageUrl,
        latitude: lat,
        longitude: lng,
      };

      await client.post('/produce', payload);
      Alert.alert('Success', 'Produce listing created successfully!');
      
      // Reset form
      setName('');
      setQuantity('');
      setHarvestDate(new Date().toISOString().split('T')[0]);
      setLocationStr('');
      setLat(null);
      setLng(null);
      setImageUri(null);
      setImageUrl(null);
      
      setModalVisible(false);
      fetchListings();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to list produce.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (id) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/produce/${id}`);
            Alert.alert('Success', 'Listing deleted.');
            fetchListings();
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete listing.');
          }
        },
      },
    ]);
  };

  const renderListingCard = ({ item }) => (
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
        <Text style={styles.cardMeta} numberOfLines={1}>📍 {item.location}</Text>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteListing(item.id)}
        >
          <Text style={styles.deleteBtnText}>Delete Listing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Surplus Produce</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Produce</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active listings yet. Add produce to get started!</Text>
            </View>
          }
        />
      )}

      {/* Add Produce Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Surplus Produce</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Produce Item</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Tomatoes, Potatoes"
                  placeholderTextColor={COLORS.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 150"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Harvest Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                  value={harvestDate}
                  onChangeText={setHarvestDate}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.locHeader}>
                  <Text style={styles.label}>Farm Location</Text>
                  <TouchableOpacity onPress={handleDetectLocation} style={styles.detectLink}>
                    {locLoading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.detectLinkText}>📍 Detect GPS</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  placeholder="Enter Farm Address..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  value={locationStr}
                  onChangeText={setLocationStr}
                />
              </View>

              {/* Image Picker Section */}
              <View style={styles.imagePickerSection}>
                <Text style={styles.label}>Produce Image</Text>
                <TouchableOpacity style={styles.pickerBox} onPress={handlePickImage}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                  ) : (
                    <View style={styles.pickerPlaceholder}>
                      <Text style={styles.pickerIcon}>📷</Text>
                      <Text style={styles.pickerText}>Upload Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {uploading && <ActivityIndicator style={styles.uploadLoader} color={COLORS.primary} />}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (uploading || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmitProduce}
                disabled={uploading || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Listing</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardMeta: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  deleteBtnText: {
    color: COLORS.urgency.critical,
    fontSize: 14,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalForm: {
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  locHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectLink: {
    paddingVertical: 2,
  },
  detectLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  imagePickerSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  pickerBox: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  pickerPlaceholder: {
    alignItems: 'center',
  },
  pickerIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  pickerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  uploadLoader: {
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ListingsScreen;
