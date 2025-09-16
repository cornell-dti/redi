import { ProfileResponse } from '@/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProfileCardProps {
  profile: ProfileResponse;
  title?: string;
  compact?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  title,
  compact = false 
}) => {
  if (compact) {
    return (
      <View style={styles.compactCard}>
        <Text style={styles.compactTitle}>{profile.netid} - {profile.school}</Text>
        <Text style={styles.compactBio}>
          {profile.bio.length > 50 ? `${profile.bio.substring(0, 50)}...` : profile.bio}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fullCard}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      
      <ProfileField label="Netid" value={profile.netid} />
      <ProfileField label="Bio" value={profile.bio} />
      <ProfileField label="Gender" value={profile.gender} />
      <ProfileField label="School" value={profile.school} />
      <ProfileField label="Year" value={profile.year.toString()} />
      <ProfileField label="Major" value={profile.major.join(', ')} />
      
      {profile.instagram && (
        <ProfileField label="Instagram" value={profile.instagram} />
      )}
      {profile.snapchat && (
        <ProfileField label="Snapchat" value={profile.snapchat} />
      )}
      {profile.phoneNumber && (
        <ProfileField label="Phone" value={profile.phoneNumber} />
      )}
      
      <Text style={styles.dateText}>
        Created: {new Date(profile.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
};

interface ProfileFieldProps {
  label: string;
  value: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, value }) => (
  <Text style={styles.fieldText}>
    <Text style={styles.fieldLabel}>{label}:</Text> {value}
  </Text>
);

const styles = StyleSheet.create({
  // Full card styles
  fullCard: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  fieldText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  fieldLabel: {
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Compact card styles
  compactCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  compactBio: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ProfileCard;