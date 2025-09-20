import auth from '@react-native-firebase/auth';
import { useState } from 'react';
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  deleteUser,
  getAllUsers,
  getUserByNetid,
  UserResponse
} from '../api/userApi';

const Page = () => {
  const user = auth().currentUser;
  const [testNetid, setTestNetid] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const handleSignOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  /**
   * Test GET /api/users - Get all users
   */
  const handleGetAllUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      Alert.alert(
        'Success', 
        `Retrieved ${allUsers.length} users`,
        [
          {
            text: 'OK',
            onPress: () => console.log('All users:', allUsers)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to get users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test GET /api/users/:netid - Get user by netid
   */
  const handleGetUserByNetid = async () => {
    if (!testNetid.trim()) {
      Alert.alert('Error', 'Please enter a netid to search for');
      return;
    }

    setLoading(true);
    try {
      const userData = await getUserByNetid(testNetid.trim());
      setSelectedUser(userData);
      Alert.alert(
        'User Found', 
        `Email: ${userData.email}\nCreated: ${new Date(userData.createdAt).toLocaleDateString()}`,
        [
          {
            text: 'OK',
            onPress: () => console.log('User data:', userData)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to get user');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test DELETE /api/users/:netid - Delete user
   */
  const handleDeleteUser = async () => {
    if (!testNetid.trim()) {
      Alert.alert('Error', 'Please enter a netid to delete');
      return;
    }

    // Prevent users from deleting themselves
    const currentUserNetid = user?.email?.split('@')[0];
    if (testNetid.trim() === currentUserNetid) {
      Alert.alert('Error', 'Cannot delete your own account through this test');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete user "${testNetid.trim()}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteUser(testNetid.trim());
              Alert.alert(
                'User Deleted', 
                result.message,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      console.log('Delete result:', result);
                      // Refresh the users list
                      handleGetAllUsers();
                      // Clear the selected user if it was deleted
                      if (selectedUser?.netid === testNetid.trim()) {
                        setSelectedUser(null);
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete user');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome to redi {user?.email}
        </Text>
        <Text style={styles.infoText}>
          Your netid: {user?.email?.split('@')[0]}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Endpoint Testing</Text>
        
        {/* Input field for testing */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter netid for testing (e.g., abc123)"
            value={testNetid}
            onChangeText={setTestNetid}
            autoCapitalize="none"
          />
        </View>

        {/* API Testing Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Loading..." : "GET All Users"}
            onPress={handleGetAllUsers}
            disabled={loading}
          />
          
          <Button
            title={loading ? "Loading..." : "GET User by Netid"}
            onPress={handleGetUserByNetid}
            disabled={loading}
          />
          
          <Button
            title={loading ? "Loading..." : "DELETE User"}
            onPress={handleDeleteUser}
            disabled={loading}
            color="red"
          />
        </View>
      </View>

      {/* Display current data */}
      {users.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
          {users.map((userData, index) => (
            <View key={index} style={styles.userItem}>
              <Text style={styles.userText}>
                {userData.netid} - {userData.email}
              </Text>
              <Text style={styles.userDate}>
                Created: {new Date(userData.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {selectedUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected User</Text>
          <View style={styles.userItem}>
            <Text style={styles.userText}>
              {selectedUser.netid} - {selectedUser.email}
            </Text>
            <Text style={styles.userDate}>
              Created: {new Date(selectedUser.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.signOutContainer}>
        <Button title="Sign out" onPress={handleSignOut} color="gray" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
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
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    gap: 10,
  },
  userItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  signOutContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default Page;