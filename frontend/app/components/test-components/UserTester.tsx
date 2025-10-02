import { UserResponse } from '@/types';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import useUser from '../../hooks/useUserAPI';
import SearchBar from '../search/SearchBar';
import CustomButton from '../ui/CustomButton';
import SectionCard from '../ui/SectionCard';

const UserTester: React.FC = () => {
  const { loading, fetchAllUsers, fetchUserByNetid, deleteUserByNetid } =
    useUser();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [testNetid, setTestNetid] = useState('');

  const handleGetAllUsers = async () => {
    const allUsers = await fetchAllUsers();
    if (allUsers) setUsers(allUsers);
  };

  const handleGetUserByNetid = async () => {
    if (!testNetid.trim()) return;

    const userData = await fetchUserByNetid(testNetid.trim());
    if (userData) setSelectedUser(userData);
  };

  const handleDeleteUser = async () => {
    if (!testNetid.trim()) return;

    const deleted = await deleteUserByNetid(testNetid.trim());
    if (deleted) {
      // Refresh users list and clear selected user if it was deleted
      handleGetAllUsers();
      if (selectedUser?.netid === testNetid.trim()) {
        setSelectedUser(null);
      }
    }
  };

  const renderUser = (user: UserResponse) => (
    <View
      key={user.netid}
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '500' }}>
        {user.netid} - {user.email}
      </Text>
      <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
        Created: {new Date(user.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SectionCard title="User API Testing">
      <SearchBar
        value={testNetid}
        onChangeText={setTestNetid}
        onSearch={handleGetUserByNetid}
        placeholder="Enter netid for testing (e.g., abc123)"
        loading={loading}
        buttonTitle="GET User by Netid"
      />

      <SectionCard>
        <View style={{ gap: 12 }}>
          <CustomButton
            title="GET All Users"
            onPress={handleGetAllUsers}
            loading={loading}
            fullWidth
          />

          <CustomButton
            title="DELETE User"
            onPress={handleDeleteUser}
            loading={loading}
            variant="danger"
            fullWidth
          />
        </View>
      </SectionCard>

      {users.length > 0 && (
        <SectionCard title={`All Users (${users.length})`}>
          {users.map(renderUser)}
        </SectionCard>
      )}

      {selectedUser && (
        <SectionCard title="Selected User">
          {renderUser(selectedUser)}
        </SectionCard>
      )}
    </SectionCard>
  );
};

export default UserTester;
