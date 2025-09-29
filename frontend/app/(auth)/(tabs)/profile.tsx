import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOutUser } from '../../api/authService';

// Mock user profile data
const mockUserProfile = {
  name: 'Arsh',
  age: 32,
  school: 'College of Arts and Sciences',
  major: ['Computer Science', 'Psychology'],
  year: 2026,
  bio: 'Love exploring Ithaca\'s gorges, trying new restaurants on the Commons, and weekend hiking trips. Always up for a good board game night or discovering new music!',
  images: [
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
  ],
  instagram: '@arshoninsta',
  snapchat: 'arshnap',
  interests: ['Hiking', 'Photography', 'Board Games', 'Business', 'Travel'],
};

const profileStats = [
  { label: 'Profile Views', value: '127', icon: 'visibility' },
  { label: 'Matches', value: '23', icon: 'favorite' },
  { label: 'Messages', value: '8', icon: 'chat_bubble' },
];

export default function ProfileScreen() {
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
              await signOutUser();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const renderStatCard = (stat: typeof profileStats[0]) => (
    <View key={stat.label} style={styles.statCard}>
      <MaterialIcons name={stat.icon as any} size={24} color="#FF6B6B" />
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  const renderImageGrid = () => (
    <View style={styles.imageGrid}>
      {mockUserProfile.images.map((image, index) => (
        <TouchableOpacity key={index} style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.profileImage} />
          {index === 0 && (
            <View style={styles.primaryImageBadge}>
              <Text style={styles.primaryImageText}>Main</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.addImageContainer}>
        <MaterialIcons name="add-a-photo" size={32} color="#999" />
        <Text style={styles.addImageText}>Add Photo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="edit" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Stats */}
        <View style={styles.statsContainer}>
          {profileStats.map(renderStatCard)}
        </View>

        {/* Profile Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {renderImageGrid()}
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name & Age</Text>
              <Text style={styles.infoValue}>{mockUserProfile.name}, {mockUserProfile.age}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>School</Text>
              <Text style={styles.infoValue}>{mockUserProfile.school}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Major</Text>
              <Text style={styles.infoValue}>{mockUserProfile.major.join(', ')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Graduation Year</Text>
              <Text style={styles.infoValue}>{mockUserProfile.year}</Text>
            </View>
          </View>
        </View>

        {/* About Me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <View style={styles.infoCard}>
            <Text style={styles.bioText}>{mockUserProfile.bio}</Text>
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <View style={styles.infoCard}>
            <View style={styles.socialRow}>
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
              <Text style={styles.socialText}>{mockUserProfile.instagram}</Text>
            </View>
            <View style={styles.socialRow}>
              <Ionicons name="logo-snapchat" size={24} color="#FFFC00" />
              <Text style={styles.socialText}>{mockUserProfile.snapchat}</Text>
            </View>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {mockUserProfile.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.settingRow}>
              <MaterialIcons name="notifications" size={24} color="#666" />
              <Text style={styles.settingText}>Notifications</Text>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <MaterialIcons name="security" size={24} color="#666" />
              <Text style={styles.settingText}>Privacy & Safety</Text>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <MaterialIcons name="help" size={24} color="#666" />
              <Text style={styles.settingText}>Help & Support</Text>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 0.75,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  primaryImageBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryImageText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  addImageContainer: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  socialText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  interestText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  bottomSpacing: {
    height: 32,
  },
});