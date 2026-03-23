import { Alert, StyleSheet, View } from 'react-native';

import type { ProfileAction } from '@/features/profile/model/profile';
import { ProfileCard } from '@/features/profile/ui/ProfileCard';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

type ProfileActionsProps = {
  actions: ProfileAction[];
};

export function ProfileActions({ actions }: ProfileActionsProps) {
  const handlePress = (label: string): void => {
    Alert.alert(label, 'Action is not connected yet.');
  };

  return (
    <ProfileCard>
      <AppText variant="title">Quick Actions</AppText>
      <View style={styles.list}>
        {actions.map((action) => (
          <View key={action.label} style={styles.item}>
            <View style={styles.textBlock}>
              <AppText>{action.label}</AppText>
              <AppText>{action.description}</AppText>
            </View>
            <Button label={action.label} onPress={() => handlePress(action.label)} />
          </View>
        ))}
      </View>
    </ProfileCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg
  },
  item: {
    gap: spacing.md
  },
  textBlock: {
    gap: spacing.xs
  }
});
