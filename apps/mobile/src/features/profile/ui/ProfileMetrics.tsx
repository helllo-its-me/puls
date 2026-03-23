import { StyleSheet, View } from 'react-native';

import type { ProfileMetric } from '@/features/profile/model/profile';
import { ProfileCard } from '@/features/profile/ui/ProfileCard';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileMetricsProps = {
  metrics: ProfileMetric[];
};

export function ProfileMetrics({ metrics }: ProfileMetricsProps) {
  return (
    <View style={styles.container}>
      {metrics.map((metric) => (
        <ProfileCard key={metric.label}>
          <AppText>{metric.label}</AppText>
          <AppText variant="title">{metric.value}</AppText>
          <AppText>{metric.caption}</AppText>
        </ProfileCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  }
});
