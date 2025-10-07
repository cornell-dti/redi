import { CreateProfileInput } from '@/types';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppInput from '../ui/AppInput';
import GenderPicker from './GenderPicker';

interface ProfileFormProps {
  initialData?: Partial<CreateProfileInput>;
  onChange: (data: Partial<CreateProfileInput>) => void;
  errors?: Record<string, string>;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData = {},
  onChange,
  errors = {},
}) => {
  const [formData, setFormData] = useState<Partial<CreateProfileInput>>({
    bio: '',
    gender: 'female',
    birthdate: '',
    instagram: '',
    snapchat: '',
    phoneNumber: '',
    year: new Date().getFullYear(),
    school: '',
    major: [],
    ...initialData,
  });

  const updateField = (field: keyof CreateProfileInput, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const updateMajor = (majorString: string) => {
    const majorArray = majorString.trim()
      ? majorString.split(',').map((m) => m.trim())
      : [];
    updateField('major', majorArray);
  };

  return (
    <View style={styles.container}>
      <AppInput
        label="Bio"
        value={formData.bio || ''}
        onChangeText={(value) => updateField('bio', value)}
        placeholder="Tell us about yourself..."
        multiline
        numberOfLines={3}
        required
        error={errors.bio}
      />

      <GenderPicker
        value={formData.gender || 'female'}
        onChange={(gender) => updateField('gender', gender)}
      />

      <AppInput
        label="Birthdate"
        value={
          formData.birthdate
            ? typeof formData.birthdate === 'string'
              ? formData.birthdate
              : formData.birthdate.toISOString().slice(0, 10)
            : ''
        }
        onChangeText={(value) => updateField('birthdate', value)}
        placeholder="YYYY-MM-DD"
        required
        error={errors.birthdate}
      />

      <AppInput
        label="School"
        value={formData.school || ''}
        onChangeText={(value) => updateField('school', value)}
        placeholder="Engineering, Arts & Sciences, etc."
        required
        error={errors.school}
      />

      <AppInput
        label="Year"
        value={formData.year?.toString() || ''}
        onChangeText={(value) =>
          updateField('year', parseInt(value) || new Date().getFullYear())
        }
        placeholder="2025"
        keyboardType="numeric"
        required
        error={errors.year}
      />

      <AppInput
        label="Major(s)"
        value={formData.major?.join(', ') || ''}
        onChangeText={updateMajor}
        placeholder="Computer Science, Mathematics (comma-separated)"
        error={errors.major}
      />

      <AppInput
        label="Instagram"
        value={formData.instagram || ''}
        onChangeText={(value) => updateField('instagram', value)}
        placeholder="@username"
        autoCapitalize="none"
        error={errors.instagram}
      />

      <AppInput
        label="Snapchat"
        value={formData.snapchat || ''}
        onChangeText={(value) => updateField('snapchat', value)}
        placeholder="username"
        autoCapitalize="none"
        error={errors.snapchat}
      />

      <AppInput
        label="Phone Number"
        value={formData.phoneNumber || ''}
        onChangeText={(value) => updateField('phoneNumber', value)}
        placeholder="+1 (555) 123-4567"
        keyboardType="phone-pad"
        error={errors.phoneNumber}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});

export default ProfileForm;
