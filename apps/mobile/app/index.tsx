import { StatusBar } from 'expo-status-bar';

import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const handlePress = (): void => {
    // Placeholder action for UI foundation check.
    console.log('Hello from reusable button');
  };

  return (
    <Screen>
      <AppText variant="title">Hello World</AppText>
      <AppText>Expo Router + Query + Forms foundation is ready.</AppText>
      <Button label="Tap me" onPress={handlePress} />
      <StatusBar style="auto" />
    </Screen>
  );
}
