import { StyleSheet, View } from 'react-native';

import type { ProfileInsight } from '@/features/profile/model/profile';
import { ProfileCard } from '@/features/profile/ui/ProfileCard';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileInsightsProps = {
  insights: ProfileInsight[];
};

export function ProfileInsights({ insights }: ProfileInsightsProps) {
  return (
    <ProfileCard>
      <AppText variant="title">Insights</AppText>
      <View style={styles.list}>
        {insights.map((insight) => (
          <View key={insight.title} style={styles.item}>
            <AppText>{insight.title}</AppText>
            <AppText>{insight.description}</AppText>
          </View>
        ))}
      </View>
    </ProfileCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  item: {
    gap: spacing.xs
  }
});
