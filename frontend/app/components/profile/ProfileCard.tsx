import { ProfileResponse } from '@/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../AppColors';
import { useThemeAware } from '../../contexts/ThemeContext';

interface ProfileCardProps {
  profile: ProfileResponse;
  title?: string;
  compact?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  title,
  compact = false,
}) => {
  useThemeAware(); // Force re-render when theme changes

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <Text style={styles.compactTitle}>
          {profile.netid}
          {profile.school ? ` - ${profile.school}` : ''}
        </Text>
        <Text style={styles.compactBio}>
          {profile.bio.length > 50
            ? `${profile.bio.substring(0, 50)}...`
            : profile.bio}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fullCard}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}

      <ProfileField label="Netid" value={profile.netid} />
      <ProfileField label="Bio" value={profile.bio} />
      {profile.gender && <ProfileField label="Gender" value={profile.gender} />}
      {profile.school && <ProfileField label="School" value={profile.school} />}
      <ProfileField label="Year" value={profile.year} />
      <ProfileField label="Major" value={profile.major.join(', ')} />

      {'instagram' in profile && profile.instagram && (
        <ProfileField label="Instagram" value={profile.instagram} />
      )}
      {'snapchat' in profile && profile.snapchat && (
        <ProfileField label="Snapchat" value={profile.snapchat} />
      )}
      {'phoneNumber' in profile && profile.phoneNumber && (
        <ProfileField label="Phone" value={profile.phoneNumber} />
      )}

      {'createdAt' in profile && profile.createdAt && (
        <Text style={styles.dateText}>
          Created: {new Date(profile.createdAt).toLocaleDateString()}
        </Text>
      )}
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
    backgroundColor: AppColors.backgroundDimmer,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.accentDefault,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.accentDefault,
    marginBottom: 12,
  },
  fieldText: {
    fontSize: 14,
    marginBottom: 4,
    color: AppColors.foregroundDefault,
  },
  fieldLabel: {
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: AppColors.foregroundDimmer,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Compact card styles
  compactCard: {
    backgroundColor: AppColors.backgroundDimmer,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.foregroundDefault,
  },
  compactBio: {
    fontSize: 12,
    color: AppColors.foregroundDimmer,
    marginTop: 4,
  },
});

export default ProfileCard;
