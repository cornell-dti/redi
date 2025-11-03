import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Pressable from '@/app/components/ui/Pressable';
import { router } from 'expo-router';
import { Check, Globe, Instagram, Trash2 } from 'lucide-react-native';
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
import GithubIcon from '../components/icons/GithubIcon';
import LinkedinIcon from '../components/icons/LinkedinIcon';
import SnapchatIcon from '../components/icons/SnapchatIcon';
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
      icon: Instagram,
      label: 'Instagram',
      placeholder: 'instagram.com/username',
      accentColor: '#E32B72',
      backgroundColor: '#FCEAF1',
    },
    {
      type: 'snapchat' as SocialType,
      icon: SnapchatIcon,
      label: 'Snapchat',
      placeholder: 'snapchat.com/username',
      accentColor: '#C5C000',
      backgroundColor: '#FFFEF5',
    },
    {
      type: 'linkedin' as SocialType,
      icon: LinkedinIcon,
      label: 'LinkedIn',
      placeholder: 'linkedin.com/in/username',
      accentColor: '#006FAA',
      backgroundColor: '#F2F8FB',
    },
    {
      type: 'github' as SocialType,
      icon: GithubIcon,
      label: 'GitHub',
      placeholder: 'github.com/username',
      accentColor: '#151513',
      backgroundColor: '#F3F3F3',
    },
    {
      type: 'website' as SocialType,
      icon: Globe,
      label: 'Website',
      placeholder: 'yourwebsite.com',
      accentColor: '#4442F5',
      backgroundColor: '#F6F6FE',
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
            return (
              <Pressable
                key={social.type}
                onPress={() => openSocialSheet(social.type)}
                style={[
                  styles.socialButton,
                  { backgroundColor: social.backgroundColor },
                ]}
              >
                <IconComp size={32} color={social.accentColor} />

                <AppText style={[{ color: social.accentColor }]}>
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

          <Button
            title="Save"
            onPress={saveSocialLink}
            variant="primary"
            iconLeft={Check}
          />

          {inputValue.length > 0 && (
            <Button
              title="Remove"
              onPress={removeSocialLink}
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
    gap: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  socialButton: {
    width: '30%',
    height: 130,
    aspectRatio: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sheetContent: {
    gap: 16,
  },
});
