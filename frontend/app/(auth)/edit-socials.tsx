import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Pressable from '@/app/components/ui/Pressable';
import { router } from 'expo-router';
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Trash2,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import Sheet from '../components/ui/Sheet';
import { useThemeAware } from '../contexts/ThemeContext';

type SocialType = 'instagram' | 'snapchat' | 'linkedin' | 'github' | 'website';

interface SocialLinks {
  instagram: string;
  snapchat: string;
  linkedin: string;
  github: string;
  website: string;
}

export default function EditSocialsPage() {
  useThemeAware();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [socials, setSocials] = useState<SocialLinks>({
    instagram: '',
    snapchat: '',
    linkedin: '',
    github: '',
    website: '',
  });
  const [originalSocials, setOriginalSocials] = useState<SocialLinks>({
    instagram: '',
    snapchat: '',
    linkedin: '',
    github: '',
    website: '',
  });
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState<SocialType | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile(user.uid);

      if (profileData) {
        const socialData: SocialLinks = {
          instagram: profileData.instagram || '',
          snapchat: profileData.snapchat || '',
          linkedin: profileData.linkedIn || '',
          github: profileData.github || '',
          website: profileData.website || '',
        };
        setSocials(socialData);
        setOriginalSocials(socialData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.uid, {
        instagram: socials.instagram,
        snapchat: socials.snapchat,
        linkedIn: socials.linkedin,
        github: socials.github,
        website: socials.website,
      });

      setOriginalSocials(socials);
      Alert.alert('Success', 'Social links updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update socials:', error);
      Alert.alert('Error', 'Failed to update social links');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(socials) !== JSON.stringify(originalSocials);
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const openSocialSheet = (social: SocialType) => {
    setSelectedSocial(social);
    setInputValue(socials[social]);
    setSheetVisible(true);
  };

  const saveSocialLink = () => {
    if (selectedSocial) {
      setSocials({ ...socials, [selectedSocial]: inputValue });
    }
    setSheetVisible(false);
    setSelectedSocial(null);
    setInputValue('');
  };

  const socialButtons = [
    {
      type: 'instagram' as SocialType,
      icon: Instagram,
      label: 'Instagram',
      placeholder: 'instagram.com/username',
    },
    {
      type: 'snapchat' as SocialType,
      icon: MessageCircle,
      label: 'Snapchat',
      placeholder: 'snapchat.com/username',
    },
    {
      type: 'linkedin' as SocialType,
      icon: Linkedin,
      label: 'LinkedIn',
      placeholder: 'linkedin.com/in/username',
    },
    {
      type: 'github' as SocialType,
      icon: Github,
      label: 'GitHub',
      placeholder: 'github.com/username',
    },
    {
      type: 'website' as SocialType,
      icon: Globe,
      label: 'Website',
      placeholder: 'yourwebsite.com',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        title="Edit Socials"
        onSave={handleSave}
        onBack={handleBack}
        isSaving={saving}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {socialButtons.map((social) => {
            const IconComp = social.icon;
            const hasValue = socials[social.type].length > 0;
            return (
              <Pressable
                key={social.type}
                onPress={() => openSocialSheet(social.type)}
                style={[
                  styles.socialButton,
                  hasValue && styles.socialButtonActive,
                ]}
              >
                <IconComp
                  size={32}
                  color={
                    hasValue
                      ? AppColors.accentDefault
                      : AppColors.foregroundDimmer
                  }
                />
                <AppText
                  style={[
                    styles.socialLabel,
                    hasValue && styles.socialLabelActive,
                  ]}
                >
                  {social.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Edit Social Link Sheet */}
      <Sheet
        visible={sheetVisible}
        onDismiss={() => {
          setSheetVisible(false);
          setSelectedSocial(null);
          setInputValue('');
        }}
        title={
          selectedSocial
            ? `Edit ${socialButtons.find((s) => s.type === selectedSocial)?.label}`
            : ''
        }
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <AppInput
            placeholder={
              selectedSocial
                ? socialButtons.find((s) => s.type === selectedSocial)
                    ?.placeholder
                : ''
            }
            value={inputValue}
            onChangeText={setInputValue}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Button title="Save" onPress={saveSocialLink} variant="primary" />

          {inputValue.length > 0 && (
            <Button
              title="Remove"
              onPress={() => {}}
              variant="negative"
              iconLeft={Trash2}
            />
          )}
        </KeyboardAvoidingView>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  socialButton: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  socialButtonActive: {
    borderColor: AppColors.accentDefault,
    backgroundColor: AppColors.backgroundDefault,
  },
  socialLabel: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    fontWeight: '500',
  },
  socialLabelActive: {
    color: AppColors.accentDefault,
  },
  sheetContent: {
    gap: 16,
  },
});
