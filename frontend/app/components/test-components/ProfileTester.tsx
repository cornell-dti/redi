import { CreateProfileInput, ProfileResponse, UpdateProfileInput } from '@/types';
import auth from '@react-native-firebase/auth';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  createProfile,
  deleteProfile,
  getAllProfiles,
  getCurrentUserProfile,
  getMatches,
  getProfileByNetid,
  updateProfile,
} from '../../api/profileApi';

const ProfileTester = () => {
  const user = auth().currentUser;
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<ProfileResponse | null>(null);
  const [searchNetid, setSearchNetid] = useState('');
  const [searchedProfile, setSearchedProfile] = useState<ProfileResponse | null>(null);
  const [matches, setMatches] = useState<ProfileResponse[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileResponse[]>([]);

  // Form state for creating/updating profile
  const [bio, setBio] = useState('Testing bio from mobile app');
  const [gender, setGender] = useState<'female' | 'male' | 'non-binary'>('female');
  const [birthdate, setBirthdate] = useState('2000-01-01');
  const [instagram, setInstagram] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [year, setYear] = useState('2025');
  const [school, setSchool] = useState('Engineering');
  const [major, setMajor] = useState('Computer Science,Mathematics');

  // Filter state
  const [filterGender, setFilterGender] = useState<'female' | 'male' | 'non-binary' | ''>('');
  const [filterSchool, setFilterSchool] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Test GET /api/profiles/me - Get current user's profile
   */
  const handleGetCurrentProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const profile = await getCurrentUserProfile(user.uid);
      setCurrentProfile(profile);
      Alert.alert(
        'Profile Retrieved',
        `Bio: ${profile.bio}\nSchool: ${profile.school}\nYear: ${profile.year}`,
        [{ text: 'OK', onPress: () => console.log('Current profile:', profile) }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to get profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test POST /api/profiles - Create new profile
   */
  const handleCreateProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!bio.trim() || !birthdate.trim() || !year.trim() || !school.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (bio, birthdate, year, school)');
      return;
    }

    const profileData: CreateProfileInput = {
      bio: bio.trim(),
      gender,
      birthdate,
      instagram: instagram.trim() || undefined,
      snapchat: snapchat.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      year: parseInt(year),
      school: school.trim(),
      major: major.trim() ? major.split(',').map(m => m.trim()) : []
    };

    setLoading(true);
    try {
      const result = await createProfile(user.uid, profileData);
      Alert.alert(
        'Profile Created',
        `${result.message}\nNetid: ${result.netid}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Create result:', result);
              handleGetCurrentProfile(); // Refresh current profile
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test PUT /api/profiles/me - Update current user's profile
   */
  const handleUpdateProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const updateData: UpdateProfileInput = {};
    
    if (bio.trim()) updateData.bio = bio.trim();
    if (instagram.trim()) updateData.instagram = instagram.trim();
    if (snapchat.trim()) updateData.snapchat = snapchat.trim();
    if (phoneNumber.trim()) updateData.phoneNumber = phoneNumber.trim();
    if (year.trim()) updateData.year = parseInt(year);
    if (school.trim()) updateData.school = school.trim();
    if (major.trim()) updateData.major = major.split(',').map(m => m.trim());

    if (Object.keys(updateData).length === 0) {
      Alert.alert('Error', 'Please provide at least one field to update');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(user.uid, updateData);
      Alert.alert(
        'Profile Updated',
        result.message,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Update result:', result);
              handleGetCurrentProfile(); // Refresh current profile
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test DELETE /api/profiles/me - Delete current user's profile
   */
  const handleDeleteProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteProfile(user.uid);
              setCurrentProfile(null);
              Alert.alert('Profile Deleted', result.message);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete profile');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  /**
   * Test GET /api/profiles/:netid - Get profile by netid
   */
  const handleGetProfileByNetid = async () => {
    if (!searchNetid.trim()) {
      Alert.alert('Error', 'Please enter a netid to search for');
      return;
    }

    setLoading(true);
    try {
      const profile = await getProfileByNetid(searchNetid.trim());
      setSearchedProfile(profile);
      Alert.alert(
        'Profile Found',
        `${profile.netid}\nBio: ${profile.bio}\nSchool: ${profile.school}`,
        [{ text: 'OK', onPress: () => console.log('Searched profile:', profile) }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to get profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test GET /api/profiles/matches - Get matches for current user
   */
  const handleGetMatches = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const matchResults = await getMatches(user.uid, 10);
      setMatches(matchResults);
      Alert.alert(
        'Matches Retrieved',
        `Found ${matchResults.length} potential matches`,
        [{ text: 'OK', onPress: () => console.log('Matches:', matchResults) }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to get matches');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test GET /api/profiles - Get all profiles with filters
   */
  const handleGetAllProfiles = async () => {
    const options: any = { limit: 20 };
    
    if (filterGender) options.gender = filterGender;
    if (filterSchool.trim()) options.school = filterSchool.trim();
    if (user?.email) {
      options.excludeNetid = user.email.split('@')[0];
    }

    setLoading(true);
    try {
      const profiles = await getAllProfiles(options);
      setAllProfiles(profiles);
      Alert.alert(
        'All Profiles Retrieved',
        `Found ${profiles.length} profiles`,
        [{ text: 'OK', onPress: () => console.log('All profiles:', profiles) }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to get profiles');
    } finally {
      setLoading(false);
    }
  };

  const renderProfile = (profile: ProfileResponse, title: string) => (
    <View style={styles.profileCard}>
      <Text style={styles.profileTitle}>{title}</Text>
      <Text style={styles.profileText}><Text style={styles.bold}>Netid:</Text> {profile.netid}</Text>
      <Text style={styles.profileText}><Text style={styles.bold}>Bio:</Text> {profile.bio}</Text>
      <Text style={styles.profileText}><Text style={styles.bold}>Gender:</Text> {profile.gender}</Text>
      <Text style={styles.profileText}><Text style={styles.bold}>School:</Text> {profile.school}</Text>
      <Text style={styles.profileText}><Text style={styles.bold}>Year:</Text> {profile.year}</Text>
      <Text style={styles.profileText}><Text style={styles.bold}>Major:</Text> {profile.major.join(', ')}</Text>
      {profile.instagram && <Text style={styles.profileText}><Text style={styles.bold}>Instagram:</Text> {profile.instagram}</Text>}
      {profile.snapchat && <Text style={styles.profileText}><Text style={styles.bold}>Snapchat:</Text> {profile.snapchat}</Text>}
      <Text style={styles.profileDate}>Created: {new Date(profile.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Profile API Testing</Text>

      {/* Profile Form */}
      <View style={styles.formSection}>
        <Text style={styles.formTitle}>Profile Form Data</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Bio (required)"
          value={bio}
          onChangeText={setBio}
          multiline
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Gender:</Text>
          <View style={styles.genderButtons}>
            {['female', 'male', 'non-binary'].map((g) => (
              <Button
                key={g}
                title={g}
                onPress={() => setGender(g as any)}
                color={gender === g ? '#007AFF' : '#8E8E93'}
              />
            ))}
          </View>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Birthdate (YYYY-MM-DD, required)"
          value={birthdate}
          onChangeText={setBirthdate}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Instagram handle"
          value={instagram}
          onChangeText={setInstagram}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Snapchat username"
          value={snapchat}
          onChangeText={setSnapchat}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Year (required)"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="School (required)"
          value={school}
          onChangeText={setSchool}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Major (comma-separated)"
          value={major}
          onChangeText={setMajor}
        />
      </View>

      {/* Profile Action Buttons */}
      <View style={styles.buttonSection}>
        <Button
          title={loading ? "Loading..." : "GET My Profile"}
          onPress={handleGetCurrentProfile}
          disabled={loading}
        />
        
        <Button
          title={loading ? "Loading..." : "CREATE Profile"}
          onPress={handleCreateProfile}
          disabled={loading}
          color="green"
        />
        
        <Button
          title={loading ? "Loading..." : "UPDATE Profile"}
          onPress={handleUpdateProfile}
          disabled={loading}
          color="orange"
        />
        
        <Button
          title={loading ? "Loading..." : "DELETE Profile"}
          onPress={handleDeleteProfile}
          disabled={loading}
          color="red"
        />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.formTitle}>Search Profile by Netid</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter netid (e.g., abc123)"
          value={searchNetid}
          onChangeText={setSearchNetid}
          autoCapitalize="none"
        />
        <Button
          title={loading ? "Loading..." : "Search Profile"}
          onPress={handleGetProfileByNetid}
          disabled={loading}
        />
      </View>

      {/* Discovery Buttons */}
      <View style={styles.buttonSection}>
        <Button
          title={loading ? "Loading..." : "GET My Matches"}
          onPress={handleGetMatches}
          disabled={loading}
          color="purple"
        />
      </View>

      {/* Filters Section */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.formTitle}>All Profiles Filters</Text>
          <Switch value={showFilters} onValueChange={setShowFilters} />
        </View>
        
        {showFilters && (
          <View>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Filter by Gender:</Text>
              <View style={styles.genderButtons}>
                {['', 'female', 'male', 'non-binary'].map((g) => (
                  <Button
                    key={g}
                    title={g || 'Any'}
                    onPress={() => setFilterGender(g as any)}
                    color={filterGender === g ? '#007AFF' : '#8E8E93'}
                  />
                ))}
              </View>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Filter by School"
              value={filterSchool}
              onChangeText={setFilterSchool}
            />
          </View>
        )}
        
        <Button
          title={loading ? "Loading..." : "GET All Profiles"}
          onPress={handleGetAllProfiles}
          disabled={loading}
          color="blue"
        />
      </View>

      {/* Display Results */}
      {currentProfile && renderProfile(currentProfile, "My Profile")}
      {searchedProfile && renderProfile(searchedProfile, "Searched Profile")}
      
      {matches.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Matches ({matches.length})</Text>
          {matches.slice(0, 3).map((match, index) => (
            <View key={index} style={styles.miniProfile}>
              <Text style={styles.miniProfileText}>{match.netid} - {match.school}</Text>
              <Text style={styles.miniProfileBio}>{match.bio.substring(0, 50)}...</Text>
            </View>
          ))}
        </View>
      )}
      
      {allProfiles.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>All Profiles ({allProfiles.length})</Text>
          {allProfiles.slice(0, 5).map((profile, index) => (
            <View key={index} style={styles.miniProfile}>
              <Text style={styles.miniProfileText}>{profile.netid} - {profile.school}</Text>
              <Text style={styles.miniProfileBio}>{profile.bio.substring(0, 50)}...</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  formSection: {
    marginBottom: 15,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
  },
  pickerContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 5,
  },
  buttonSection: {
    gap: 8,
    marginBottom: 15,
  },
  searchSection: {
    marginBottom: 15,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  profileText: {
    fontSize: 13,
    marginBottom: 3,
    color: '#333',
  },
  profileDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  miniProfile: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  miniProfileText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  miniProfileBio: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});

export default ProfileTester;