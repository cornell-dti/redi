import AppText from '@/app/components/ui/AppText';
import { useThemeAware } from '@/app/contexts/ThemeContext';
import { getProfileAge, ProfileResponse, WeeklyPromptResponse } from '@/types';
import {
  Bell,
  Cake,
  Check,
  Globe,
  GraduationCap,
  Home,
  Instagram,
  Magnet,
  MessageCircle,
} from 'lucide-react-native';
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import GenderIcon from '../icons/GenderIcon';
import GithubIcon from '../icons/GithubIcon';
import LinkedinIcon from '../icons/LinkedinIcon';
import SnapchatIcon from '../icons/SnapchatIcon';
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
  showOpenChatButton?: boolean;
  onOpenChat?: () => void;
  weeklyPrompt?: WeeklyPromptResponse | null;
  weeklyPromptAnswer?: string;
  onEditWeeklyPrompt?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  showNudgeButton = false,
  onNudge,
  nudgeSent = false,
  nudgeDisabled = false,
  showOpenChatButton = false,
  onOpenChat,
  weeklyPrompt,
  weeklyPromptAnswer,
  onEditWeeklyPrompt,
}) => {
  useThemeAware();

  const screenWidth = Dimensions.get('window').width;
  const age = getProfileAge(profile);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  // Track scroll position for real-time dot animation
  const scrollX = useRef(new Animated.Value(0)).current;

  type SocialItem = {
    icon: React.ReactNode;
    url: string;
  };

  // Social media fields are only available for own profile and matched profiles
  // Check if profile has these fields before accessing them
  const hasSocials = 'instagram' in profile || 'snapchat' in profile;

  // Helper function to ensure URL has protocol
  const ensureProtocol = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  // Helper function to open URL with error handling
  const openSocialLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const socialItems: SocialItem[] = hasSocials
    ? ([
        'instagram' in profile &&
          profile.instagram && {
            icon: <Instagram size={24} />,
            url: `https://instagram.com/${profile.instagram.replace(/^@/, '')}`,
          },
        'snapchat' in profile &&
          profile.snapchat && {
            icon: (
              <SnapchatIcon size={24} color={AppColors.foregroundDefault} />
            ),
            url: `https://snapchat.com/add/${profile.snapchat.replace(/^@/, '')}`,
          },
        'linkedIn' in profile &&
          profile.linkedIn && {
            icon: (
              <LinkedinIcon size={24} color={AppColors.foregroundDefault} />
            ),
            url: profile.linkedIn.startsWith('in/')
              ? `https://linkedin.com/${profile.linkedIn}`
              : ensureProtocol(profile.linkedIn),
          },
        'github' in profile &&
          profile.github && {
            icon: <GithubIcon size={24} color={AppColors.foregroundDefault} />,
            url: `https://github.com/${profile.github.replace(/^@/, '')}`,
          },
        'website' in profile &&
          profile.website && {
            icon: <Globe size={24} color={AppColors.foregroundDefault} />,
            url: ensureProtocol(profile.website),
          },
      ].filter(Boolean) as SocialItem[])
    : [];

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveImageIndex(index);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Image carousel */}
      {profile.pictures && profile.pictures.length > 0 && (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageCarousel}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              {
                useNativeDriver: false,
                listener: handleScroll,
              }
            )}
            scrollEventThrottle={16}
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

          {/* Pagination dots */}
          {profile.pictures.length > 1 && (
            <View style={styles.paginationContainer}>
              {profile.pictures.map((_, index) => {
                // Create input range for smooth transitions between dots
                const inputRange = [
                  (index - 1) * screenWidth,
                  index * screenWidth,
                  (index + 1) * screenWidth,
                ];

                const width = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 20, 8],
                  extrapolate: 'clamp',
                });

                const height = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 10, 8],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.5, 1, 0.5],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        width,
                        height,
                        opacity,
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      <View style={styles.contentContainer}>
        <AppText variant="title" style={{ marginBottom: -32 }}>
          {profile.firstName}
        </AppText>

        <View style={styles.buttonCont}>
          {showNudgeButton && (
            <Button
              title={
                nudgeDisabled ? "It's a match!" : nudgeSent ? 'Nudged' : 'Nudge'
              }
              onPress={onNudge || (() => console.log('Nudge pressed'))}
              variant={nudgeSent ? 'secondary' : 'primary'}
              iconLeft={nudgeDisabled ? Check : Bell}
              disabled={nudgeDisabled || nudgeSent}
              fullWidth
            />
          )}
          {showOpenChatButton && (
            <Button
              title="Open Chat"
              onPress={onOpenChat || (() => console.log('Open Chat pressed'))}
              variant="primary"
              iconLeft={MessageCircle}
              fullWidth
            />
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" indented>
            Details
          </AppText>

          <ListItemWrapper>
            <View style={styles.detailRow}>
              <View style={styles.subSection}>
                <Cake size={20} color={AppColors.foregroundDefault} />
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
                    fullWidth
                    key={index}
                    style={[
                      styles.socialItem,
                      isFirst && styles.firstItem,
                      isLast && styles.lastItem,
                    ]}
                    onPress={() => openSocialLink(item.url)}
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

        {weeklyPrompt && weeklyPromptAnswer && (
          <View style={styles.section}>
            <AppText variant="subtitle" indented>
              Weekly Prompt
            </AppText>

            <ListItemWrapper>
              <View style={styles.promptQuestion}>
                <AppText color="dimmer">{weeklyPrompt.question}</AppText>
                <AppText variant="subtitle">{weeklyPromptAnswer}</AppText>
              </View>
            </ListItemWrapper>
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
    backgroundColor: AppColors.backgroundDefault,
  },
  buttonCont: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    gap: 16,
    marginTop: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
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
    gap: 4,
  },
  socialItem: {
    display: 'flex',
    backgroundColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    flex: 1,
    borderRadius: 4,
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
    borderRadius: 24,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    backgroundColor: AppColors.backgroundDimmer,
    elevation: 4,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    borderRadius: 5,
    backgroundColor: AppColors.surfaceWhite,
    shadowColor: AppColors.shadowDefault,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5, // For Android
  },
  promptQuestion: {
    padding: 16,
    gap: 8,
    borderRadius: 4,
    backgroundColor: AppColors.backgroundDimmer,
  },
  answerCard: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 4,
    padding: 16,
    gap: 8,
  },
});

export default ProfileView;
