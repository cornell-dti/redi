import AppInput from '@/app/components/ui/AppInput';
import { router } from 'expo-router';
import {
  Check,
  ChevronRight,
  Globe,
  Instagram,
  Plus,
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
import GithubIcon from '../components/icons/GithubIcon';
import LinkedinIcon from '../components/icons/LinkedinIcon';
import SnapchatIcon from '../components/icons/SnapchatIcon';
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
        <ListItemWrapper>
          {socialButtons.map((social) => {
            const IconComp = social.icon;
            const socialValue = socials[social.type];
            return (
              <ListItem
                key={social.type}
                title={social.label}
                description={socialValue || ''}
                left={<IconComp size={24} color={social.accentColor} />}
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
});
