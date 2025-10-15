// src/screens/ProfileScreen.js - Complete with Camera & Gallery Support
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalWaterGlasses: 0,
    joinDate: '',
    currentStreak: 0,
    favoriteWorkoutType: 'None'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  useEffect(() => {
    fetchUserData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        console.log('Camera permission not granted');
      }

      // Request media library permissions
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus !== 'granted') {
        console.log('Media library permission not granted');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setProfileImageUri(data.profileImageUrl || null);
      }

      await calculateUserStats();
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = async () => {
    try {
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => doc.data());

      const totalDuration = workouts.reduce((sum, workout) => sum + (workout.duration || 0), 0);

      const workoutTypes = workouts.reduce((acc, workout) => {
        acc[workout.type] = (acc[workout.type] || 0) + 1;
        return acc;
      }, {});
      
      const favoriteWorkoutType = Object.keys(workoutTypes).length > 0 
        ? Object.keys(workoutTypes).reduce((a, b) => workoutTypes[a] > workoutTypes[b] ? a : b)
        : 'None';

      const now = new Date();
      const last7Days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last7Days.push(date.toDateString());
      }

      const workoutDays = new Set(workouts.map(w => {
        try {
          return new Date(w.createdAt.toDate()).toDateString();
        } catch (error) {
          return null;
        }
      }).filter(Boolean));

      let currentStreak = 0;
      for (const day of last7Days) {
        if (workoutDays.has(day)) {
          currentStreak++;
        } else {
          break;
        }
      }

      setStats({
        totalWorkouts: workouts.length,
        totalDuration,
        totalWaterGlasses: 0,
        joinDate: userData?.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'Unknown',
        currentStreak,
        favoriteWorkoutType: favoriteWorkoutType.charAt(0).toUpperCase() + favoriteWorkoutType.slice(1)
      });
    } catch (error) {
      console.error('Error calculating user stats:', error);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: profileImageUri ? 3 : -1,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              openCamera();
              break;
            case 2:
              openImageLibrary();
              break;
            case 3:
              if (profileImageUri) removeProfileImage();
              break;
          }
        }
      );
    } else {
      // For Android
      Alert.alert(
        'Update Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Gallery', onPress: openImageLibrary },
          ...(profileImageUri ? [{ 
            text: 'Remove Photo', 
            onPress: removeProfileImage, 
            style: 'destructive' 
          }] : [])
        ]
      );
    }
  };

  const openCamera = async () => {
    try {
      // Check permission
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Camera access is needed to take photos. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
            ]
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openImageLibrary = async () => {
    try {
      // Check permission
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Photo library access is needed. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
            ]
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to open image library. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri) => {
    setUploadingImage(true);
    try {
      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create storage reference with timestamp to ensure uniqueness
      const timestamp = Date.now();
      const imageRef = ref(storage, `profile_images/${auth.currentUser.uid}_${timestamp}`);
      
      // Delete old image if exists
      if (userData?.profileImageUrl) {
        try {
          const oldImagePath = userData.profileImageUrl.split('/o/')[1]?.split('?')[0];
          if (oldImagePath) {
            const oldImageRef = ref(storage, decodeURIComponent(oldImagePath));
            await deleteObject(oldImageRef);
          }
        } catch (deleteError) {
          console.log('Could not delete old image:', deleteError);
        }
      }

      // Upload new image
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      // Update user document with new image URL
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        profileImageUrl: downloadURL,
        updatedAt: new Date()
      });

      // Update local state
      setProfileImageUri(downloadURL);
      setUserData(prev => ({ ...prev, profileImageUrl: downloadURL }));

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfileImage = async () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingImage(true);

              // Delete image from storage
              if (userData?.profileImageUrl) {
                try {
                  const imagePath = userData.profileImageUrl.split('/o/')[1]?.split('?')[0];
                  if (imagePath) {
                    const imageRef = ref(storage, decodeURIComponent(imagePath));
                    await deleteObject(imageRef);
                  }
                } catch (deleteError) {
                  console.log('Could not delete storage image:', deleteError);
                }
              }

              // Update user document
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await updateDoc(userRef, {
                profileImageUrl: null,
                updatedAt: new Date()
              });

              // Update local state
              setProfileImageUri(null);
              setUserData(prev => ({ ...prev, profileImageUrl: null }));

              Alert.alert('Success', 'Profile picture removed');
            } catch (error) {
              console.error('Error removing image:', error);
              Alert.alert('Error', 'Failed to remove profile picture');
            } finally {
              setUploadingImage(false);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const StatCard = ({ icon, title, value, subtitle, color = '#007AFF' }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const InfoRow = ({ label, value, onPress }) => (
    <TouchableOpacity 
      style={styles.infoRow} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
        {onPress && <Text style={styles.infoArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  const ActionButton = ({ title, onPress, color = '#007AFF', icon }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
      {icon && <Text style={styles.actionIcon}>{icon}</Text>}
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header with Avatar */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={showImagePickerOptions}
            disabled={uploadingImage}
          >
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
            
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.profileName}>{userData?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{userData?.email || auth.currentUser?.email}</Text>
          <Text style={styles.joinDate}>Member since {stats.joinDate}</Text>
          
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={showImagePickerOptions}
            disabled={uploadingImage}
          >
            <Text style={styles.changePhotoText}>
              {profileImageUri ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="🏋️‍♂️"
              title="Total Workouts"
              value={stats.totalWorkouts}
              color="#FF6B6B"
            />
            <StatCard
              icon="⏱️"
              title="Hours Trained"
              value={Math.round(stats.totalDuration / 60 * 10) / 10}
              color="#4ECDC4"
            />
            <StatCard
              icon="🔥"
              title="Current Streak"
              value={stats.currentStreak}
              subtitle="days"
              color="#FF9500"
            />
            <StatCard
              icon="💪"
              title="Favorite Type"
              value={stats.favoriteWorkoutType}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <InfoRow 
              label="Full Name" 
              value={userData?.name} 
              onPress={() => navigation.navigate('EditProfile')}
            />
            <InfoRow 
              label="Age" 
              value={userData?.age ? `${userData.age} years` : null}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <InfoRow 
              label="Height" 
              value={userData?.height ? `${userData.height} cm` : null}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <InfoRow 
              label="Weight" 
              value={userData?.weight ? `${userData.weight} kg` : null}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <InfoRow 
              label="Email" 
              value={userData?.email || auth.currentUser?.email}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              title="Edit Profile"
              icon="✏️"
              onPress={() => navigation.navigate('EditProfile')}
              color="#007AFF"
            />
            <ActionButton
              title="View Progress"
              icon="📊"
              onPress={() => navigation.navigate('Progress')}
              color="#34C759"
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  cameraIconText: {
    fontSize: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  joinDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  changePhotoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  infoArrow: {
    fontSize: 18,
    color: '#ccc',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;