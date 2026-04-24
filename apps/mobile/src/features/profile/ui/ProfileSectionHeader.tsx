import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileSectionHeaderProps = {
  title: string;
  description: string;
};

export function ProfileSectionHeader({ title, description }: ProfileSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="sectionTitle">{title}</AppText>
      <AppText variant="muted">{description}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  }
});
