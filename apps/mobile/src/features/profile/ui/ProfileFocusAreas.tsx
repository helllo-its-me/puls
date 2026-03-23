import { StyleSheet, View } from 'react-native';

import { ProfileCard } from '@/features/profile/ui/ProfileCard';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileFocusAreasProps = {
  focusAreas: string[];
};

export function ProfileFocusAreas({ focusAreas }: ProfileFocusAreasProps) {
  return (
    <ProfileCard>
      <AppText variant="title">Focus Areas</AppText>
      <View style={styles.list}>
        {focusAreas.map((area) => (
          <View key={area} style={styles.badge}>
            <AppText>{area}</AppText>
          </View>
        ))}
      </View>
    </ProfileCard>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  badge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background
  }
});
