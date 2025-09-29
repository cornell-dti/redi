import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// Mock data for matches
const mockMatches = [
  {
    id: '1',
    name: 'Emma',
    age: 22,
    school: 'College of Arts and Sciences',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    bio: 'Love hiking around Ithaca and trying new cafes on Commons!',
  },
  {
    id: '2',
    name: 'Sarah',
    age: 21,
    school: 'Engineering',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    bio: 'CS major who loves board games and bubble tea',
  },
  {
    id: '3',
    name: 'Jessica',
    age: 23,
    school: 'Dyson',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    bio: 'Business student with a passion for sustainable fashion',
  },
];

export default function MatchesScreen() {
  const renderMatchCard = (match: typeof mockMatches[0]) => (
    <TouchableOpacity key={match.id} style={styles.matchCard}>
      <Image source={{ uri: match.image }} style={styles.matchImage} />
      <View style={styles.matchInfo}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchName}>
            {match.name}, {match.age}
          </Text>
          <MaterialIcons name="favorite" size={20} color="#FF6B6B" />
        </View>
        <Text style={styles.matchSchool}>{match.school}</Text>
        <Text style={styles.matchBio} numberOfLines={2}>
          {match.bio}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="tune" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Matches Feed */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.matchesContainer}>
          <Text style={styles.sectionTitle}>New Matches</Text>
          {mockMatches.map(renderMatchCard)}

          {/* Load more indicator */}
          <TouchableOpacity style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>Load More Profiles</Text>
            <MaterialIcons name="refresh" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Quick Action Button */}
      <TouchableOpacity style={styles.quickActionButton}>
        <MaterialIcons name="search" size={28} color="white" />
      </TouchableOpacity>
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
  filterButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  matchesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  matchImage: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  matchInfo: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  matchSchool: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  matchBio: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  quickActionButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});