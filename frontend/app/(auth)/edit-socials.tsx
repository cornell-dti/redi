import AppInput from '@/app/components/ui/AppInput';
import { router } from 'expo-router';
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import ListItem from '../components/ui/ListItem';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import Sheet from '../components/ui/Sheet';
import UnsavedChangesSheet from '../components/ui/UnsavedChangesSheet';
import { useThemeAware } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

type SocialType = 'instagram' | 'snapchat' | 'linkedin' | 'github' | 'website';

interface SocialLinks {
  instagram: string;
  snapchat: string;
  linkedin: string;
  github: string;
  website: string;
}

// Utility functions to normalize social links
const normalizeSocialLink = (value: string, type: SocialType): string => {
  if (!value || !value.trim()) return '';

  const trimmed = value.trim();

  switch (type) {
    case 'linkedin':
      return normalizeLinkedIn(trimmed);
    case 'website':
      return normalizeWebsite(trimmed);
    case 'instagram':
    case 'snapchat':
      return normalizeAtUsername(trimmed);
    case 'github':
      return normalizeAtUsername(trimmed);
    default:
      return trimmed;
  }
};

const normalizeLinkedIn = (value: string): string => {
  // Remove protocol and www
  let cleaned = value.replace(/^https?:\/\/(www\.)?/i, '');

  // Remove linkedin.com/ if present
  cleaned = cleaned.replace(/^linkedin\.com\//i, '');

  // Remove trailing slash
  cleaned = cleaned.replace(/\/$/, '');

  // If it starts with 'in/', keep as is
  if (cleaned.startsWith('in/')) {
    return cleaned;
  }

  // If it doesn't start with 'in/', add it
  return `in/${cleaned}`;
};

const normalizeWebsite = (value: string): string => {
  // Remove protocol
  let cleaned = value.replace(/^https?:\/\/(www\.)?/i, '');

  // Remove www if still present
  cleaned = cleaned.replace(/^www\./i, '');

  // Extract only the domain (remove paths, query params, fragments)
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];

  // Remove trailing slash (in case there's only a slash with no path)
  cleaned = cleaned.replace(/\/$/, '');

  return cleaned;
};

const normalizeAtUsername = (value: string): string => {
  // Remove protocol and www
  let cleaned = value.replace(/^https?:\/\/(www\.)?/i, '');

  // Remove common social media domains and paths
  cleaned = cleaned.replace(
    /^(instagram\.com|snapchat\.com|github\.com)\//i,
    ''
  );

  // Remove @ if present at the start
  cleaned = cleaned.replace(/^@/, '');

  // Remove trailing slash
  cleaned = cleaned.replace(/\/$/, '');

  // Add @ at the beginning
  return `@${cleaned}`;
};

export default function EditSocialsPage() {
  useThemeAware();
  const { showToast } = useToast();
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
  const [showUnsavedChangesSheet, setShowUnsavedChangesSheet] = useState(false);

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
      const profileData = await getCurrentUserProfile();

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
      await updateProfile({
        instagram: socials.instagram,
        snapchat: socials.snapchat,
        linkedIn: socials.linkedin,
        github: socials.github,
        website: socials.website,
      });

      setOriginalSocials(socials);

      showToast({
        icon: <Check size={20} color={AppColors.backgroundDefault} />,
        label: 'Social links updated',
      });

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
      setShowUnsavedChangesSheet(true);
    } else {
      router.back();
    }
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    // handleSave already navigates back on success
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesSheet(false);
    router.back();
  };

  const openSocialSheet = (social: SocialType) => {
    setSelectedSocial(social);
    setInputValue(socials[social]);
    setSheetVisible(true);
  };

  const saveSocialLink = () => {
    if (selectedSocial) {
      const normalizedValue = normalizeSocialLink(inputValue, selectedSocial);
      setSocials({ ...socials, [selectedSocial]: normalizedValue });
    }
    setSheetVisible(false);
    setSelectedSocial(null);
    setInputValue('');
  };

  const removeSocialLink = () => {
    if (selectedSocial) {
      setSocials({ ...socials, [selectedSocial]: '' });
      setInputValue('');
      setSheetVisible(false);
      setSelectedSocial(null);
    }
  };

  const socialButtons = [
    {
      type: 'instagram' as SocialType,
      image: require('../../assets/images/social-logos/instagram.png'),
      label: 'Instagram',
      placeholder: '@username',
    },
    {
      type: 'snapchat' as SocialType,
      image: require('../../assets/images/social-logos/snapchat.png'),
      label: 'Snapchat',
      placeholder: '@username',
    },
    {
      type: 'linkedin' as SocialType,
      image: require('../../assets/images/social-logos/linkedin.png'),
      label: 'LinkedIn',
      placeholder: 'in/username',
    },
    {
      type: 'github' as SocialType,
      image: require('../../assets/images/social-logos/github.png'),
      label: 'GitHub',
      placeholder: '@username',
    },
    {
      type: 'website' as SocialType,
      image: require('../../assets/images/social-logos/website.png'),
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
        <ListItemWrapper>
          {socialButtons.map((social) => {
            const socialValue = socials[social.type];
            return (
              <ListItem
                key={social.type}
                title={social.label}
                description={socialValue || ''}
                left={
                  <Image
                    source={social.image}
                    style={styles.socialIcon}
                    resizeMode="contain"
                  />
                }
                right={
                  <ChevronRight size={20} color={AppColors.foregroundDimmer} />
                }
                onPress={() => openSocialSheet(social.type)}
              />
            );
          })}
        </ListItemWrapper>
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
            ? `${selectedSocial && socials[selectedSocial] ? 'Edit' : 'Add'} ${socialButtons.find((s) => s.type === selectedSocial)?.label}`
            : ''
        }
        bottomRound={false}
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
            onSubmitEditing={saveSocialLink}
            keyboardType="url"
            returnKeyType="done"
            autoFocus
          />

          <View style={styles.buttonRow}>
            {/* Contextual buttons based on whether social has a value */}
            {selectedSocial && socials[selectedSocial] ? (
              // Has existing value: Show Save + Discard
              <>
                <Button
                  title="Save"
                  onPress={saveSocialLink}
                  variant="primary"
                  iconLeft={Check}
                />
                <Button
                  title="Remove"
                  onPress={removeSocialLink}
                  variant="negative"
                  iconLeft={Trash2}
                />
              </>
            ) : (
              // No value: Show Add + Cancel
              <>
                <Button
                  title="Add"
                  onPress={saveSocialLink}
                  variant="primary"
                  iconLeft={Plus}
                />
                <Button
                  title="Cancel"
                  onPress={() => {
                    setSheetVisible(false);
                    setSelectedSocial(null);
                    setInputValue('');
                  }}
                  variant="secondary"
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Sheet>

      {/* Unsaved Changes Sheet */}
      <UnsavedChangesSheet
        visible={showUnsavedChangesSheet}
        onSave={handleSaveAndExit}
        onDiscard={handleDiscardChanges}
        onDismiss={() => setShowUnsavedChangesSheet(false)}
      />
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
  sheetContent: {
    gap: 16,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
  socialIcon: {
    width: 32,
    height: 32,
  },
});
