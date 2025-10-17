import AppText from '@/app/components/ui/AppText';
import { ProfileResponse } from '@/types';
import {
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
import ListItemWrapper from '../ui/ListItemWrapper';
import Pressable from '../ui/Pressable';
import Tag from '../ui/Tag';

interface ProfileViewProps {
  profile: ProfileResponse;
  isLoading?: boolean;
}

/**
 * Reusable ProfileView component that displays a full profile.
 * This component can be used for:
 * - Preview of your own profile
 * - Public profile pages of other users
 * - Any other context where a full profile needs to be displayed
 */
const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
  const screenWidth = Dimensions.get('window').width;

  // Calculate age from birthdate
  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.birthdate);

  return (
    <ScrollView style={styles.container}>
      {/* Image carousel/gallery */}
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

      {/* Profile content */}
      <View style={styles.contentContainer}>
        {/* Name and basic info */}
        <View style={styles.headerSection}>
          <AppText variant="title" style={styles.name}>
            {profile.firstName}, {age}
          </AppText>
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <AppText variant="body">{profile.bio}</AppText>
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="subtitle" indented>
            Details
          </AppText>

          <ListItemWrapper>
            <View style={styles.subSection}>
              <Cake size={20} />
              <AppText>{age} y/o</AppText>
            </View>

            {profile.showGenderOnProfile && profile.gender && (
              <View style={styles.subSection}>
                <GenderIcon gender={profile.gender} size={20} />
                <AppText>{profile.gender}</AppText>
              </View>
            )}

            {profile.showSexualOrientationOnProfile &&
              profile.sexualOrientation &&
              profile.sexualOrientation.length > 0 && (
                <View style={styles.subSection}>
                  <Magnet size={20} />
                  <AppText>{profile.sexualOrientation}</AppText>
                </View>
              )}

            {profile.showHometownOnProfile && profile.hometown && (
              <View style={styles.subSection}>
                <Home size={20} />
                <AppText>{profile.hometown}</AppText>
              </View>
            )}

            {profile.showCollegeOnProfile && profile.school && (
              <View style={styles.subSection}>
                <GraduationCap size={20} />
                <AppText>{`${profile?.year} in ${profile?.school} studying ${profile?.major?.join(', ')}`}</AppText>
              </View>
            )}
          </ListItemWrapper>
        </View>

        {/* Social links - Only show if at least one is available */}
        {(profile.instagram ||
          profile.snapchat ||
          profile.linkedIn ||
          profile.github ||
          profile.website) && (
          <View style={styles.section}>
            <AppText variant="subtitle" indented>
              Socials
            </AppText>

            <View style={styles.socialRow}>
              {profile.instagram && (
                <Pressable
                  style={styles.socialItem}
                  onPress={() =>
                    Linking.openURL(
                      `https://instagram.com/${profile.instagram}`
                    )
                  }
                >
                  <Instagram size={24} />
                </Pressable>
              )}
              {profile.snapchat && (
                <Pressable
                  style={styles.socialItem}
                  onPress={() =>
                    Linking.openURL(
                      `https://snapchat.com/add/${profile.snapchat}`
                    )
                  }
                >
                  <Ghost size={24} />
                </Pressable>
              )}
              {profile.linkedIn && (
                <Pressable
                  style={styles.socialItem}
                  onPress={() => Linking.openURL(profile.linkedIn!)}
                >
                  <Linkedin size={24} />
                </Pressable>
              )}
              {profile.github && (
                <Pressable
                  style={styles.socialItem}
                  onPress={() => Linking.openURL(profile.github!)}
                >
                  <Github size={24} />
                </Pressable>
              )}
              {profile.website && (
                <Pressable
                  style={styles.socialItem}
                  onPress={() => Linking.openURL(profile.website!)}
                >
                  <Globe size={24} color={AppColors.foregroundDefault} />
                </Pressable>
              )}
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

        {profile.showEthnicityOnProfile &&
          profile.ethnicity &&
          profile.ethnicity.length > 0 && (
            <View style={styles.section}>
              <AppText variant="subtitle" indented>
                Ethnicity
              </AppText>

              <View style={styles.tagsContainer}>
                {profile.ethnicity.join(', ')}
              </View>
            </View>
          )}

        {profile.prompts && profile.prompts.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subtitle" indented>
              Prompts
            </AppText>

            {profile.prompts.map((prompt, index) => (
              <View style={styles.tagsContainer} key={index}>
                <AppText variant="body" color="dimmer">
                  {prompt.question}
                </AppText>

                <AppText variant="subtitle">{prompt.answer}</AppText>
              </View>
            ))}
          </View>
        )}
      </View>
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
  headerSection: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
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
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: AppColors.backgroundDimmer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
  },
  promptCard: {
    backgroundColor: AppColors.backgroundDimmer,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  promptQuestion: {
    fontWeight: '600',
    marginBottom: 8,
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
    gap: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  socialItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 4,
  },
});

export default ProfileView;
