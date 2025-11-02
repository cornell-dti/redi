import AppText from '@/app/components/ui/AppText';
import { getYearString } from '@/app/utils/profileUtils';
import { ProfileResponse, getProfileAge } from '@/types';
import {
  Bell,
  Cake,
  Ghost,
  Github,
  Globe,
  GraduationCap,
  Home,
  Instagram,
  Linkedin,
  Magnet,
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import GenderIcon from '../icons/GenderIcon';
import Button from '../ui/Button';
import FooterSpacer from '../ui/FooterSpacer';
import ListItemWrapper from '../ui/ListItemWrapper';
import Pressable from '../ui/Pressable';
import Tag from '../ui/Tag';

interface ProfileViewProps {
  profile: ProfileResponse;
  isLoading?: boolean;
  showNudgeButton?: boolean;
  onNudge?: () => void;
  nudgeSent?: boolean;
  nudgeDisabled?: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  showNudgeButton = false,
  onNudge,
  nudgeSent = false,
  nudgeDisabled = false,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const age = getProfileAge(profile);

  type SocialItem = {
    icon: React.ReactNode;
    url: string;
  };

  // Social media fields are only available for own profile and matched profiles
  // Check if profile has these fields before accessing them
  const hasSocials = 'instagram' in profile || 'snapchat' in profile;

  const socialItems: SocialItem[] = hasSocials
    ? ([
        'instagram' in profile &&
          profile.instagram && {
            icon: <Instagram size={24} />,
            url: `https://instagram.com/${profile.instagram}`,
          },
        'snapchat' in profile &&
          profile.snapchat && {
            icon: <Ghost size={24} />,
            url: `https://snapchat.com/add/${profile.snapchat}`,
          },
        'linkedIn' in profile &&
          profile.linkedIn && {
            icon: <Linkedin size={24} />,
            url: profile.linkedIn,
          },
        'github' in profile &&
          profile.github && {
            icon: <Github size={24} />,
            url: profile.github,
          },
        'website' in profile &&
          profile.website && {
            icon: <Globe size={24} color={AppColors.foregroundDefault} />,
            url: profile.website,
          },
      ].filter(Boolean) as SocialItem[])
    : [];

  return (
    <ScrollView style={styles.container}>
      {/* Image carousel */}
      {profile.pictures && profile.pictures.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {profile.pictures.map((picture, index) => (
            <Image
              key={index}
              source={{ uri: picture }}
              style={[styles.profileImage, { width: screenWidth }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.contentContainer}>
        <AppText variant="title">{profile.firstName}</AppText>

        {showNudgeButton && (
          <Button
            title={nudgeDisabled ? "It's a match!" : nudgeSent ? 'Nudged' : 'Nudge'}
            onPress={onNudge || (() => console.log('Nudge pressed'))}
            variant={nudgeDisabled ? 'positive' : nudgeSent ? 'secondary' : 'primary'}
            iconLeft={Bell}
            fullWidth
            disabled={nudgeDisabled || nudgeSent}
          />
        )}

        <View style={styles.section}>
          <AppText variant="subtitle" indented>
            Details
          </AppText>

          <ListItemWrapper>
            <View style={styles.detailRow}>
              <View style={styles.subSection}>
                <Cake size={20} />
                <AppText>{age} y/o</AppText>
              </View>

              {profile.showGenderOnProfile && profile.gender && (
                <View style={styles.subSection}>
                  <GenderIcon gender={profile.gender} size={20} />
                  <AppText>
                    {profile.gender
                      ? profile.gender.charAt(0).toUpperCase() +
                        profile.gender.slice(1)
                      : ''}
                  </AppText>
                </View>
              )}

              {profile.showSexualOrientationOnProfile &&
                profile.sexualOrientation &&
                profile.sexualOrientation.length > 0 && (
                  <View style={styles.subSection}>
                    <Magnet size={20} />
                    <AppText>{profile.sexualOrientation[0]}</AppText>
                  </View>
                )}
            </View>

            {profile.showHometownOnProfile && profile.hometown && (
              <View style={styles.subSection}>
                <Home size={20} />
                <AppText>{profile.hometown}</AppText>
              </View>
            )}

            {profile.showCollegeOnProfile && profile.school && (
              <View style={styles.subSection}>
                <GraduationCap size={20} />
                <AppText>{`${profile.year} in ${profile.school} studying ${profile.major?.join(', ')}`}</AppText>
              </View>
            )}
          </ListItemWrapper>
        </View>

        {socialItems.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subtitle" indented>
              Socials
            </AppText>

            <View style={styles.socialRow}>
              {socialItems.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === socialItems.length - 1;
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.socialItem,
                      isFirst && styles.firstItem,
                      isLast && styles.lastItem,
                    ]}
                    onPress={() => Linking.openURL(item.url!)}
                  >
                    {item.icon}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subtitle" indented>
              Interests
            </AppText>

            <View style={styles.tagsContainer}>
              {profile.interests.map((interest, index) => (
                <Tag key={index} label={`${interest}`} variant="white" />
              ))}
            </View>
          </View>
        )}

        {profile.clubs && profile.clubs.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subtitle" indented>
              Clubs
            </AppText>

            <View style={styles.tagsContainer}>
              {profile.clubs.map((club, index) => (
                <Tag key={index} label={`${club}`} variant="white" />
              ))}
            </View>
          </View>
        )}

        {profile.prompts && profile.prompts.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subtitle" indented>
              Prompts
            </AppText>

            <View style={styles.promptCards}>
              {profile.prompts.map((prompt, index) => (
                <View style={styles.promptCard} key={index}>
                  <AppText variant="body" color="dimmer">
                    {prompt.question}
                  </AppText>
                  <AppText variant="subtitle">{prompt.answer}</AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <FooterSpacer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  imageCarousel: {
    height: 500,
  },
  profileImage: {
    height: 500,
  },
  contentContainer: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  subSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
    borderRadius: 4,
    backgroundColor: AppColors.backgroundDimmer,
    flex: 1,
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderRadius: 24,
    backgroundColor: AppColors.backgroundDimmer,
  },
  socialRow: {
    display: 'flex',
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    gap: 4,
    flex: 1,
    width: '100%',
  },
  socialItem: {
    display: 'flex',
    backgroundColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 4,
    flex: 1,
  },
  firstItem: {
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  lastItem: {
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderRightWidth: 0,
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  promptCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  promptCard: {
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    backgroundColor: AppColors.backgroundDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default ProfileView;
