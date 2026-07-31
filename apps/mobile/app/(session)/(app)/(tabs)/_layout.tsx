import { Tabs } from 'expo-router';

import { useTranslation } from '@/i18n/LocalizationProvider';
import { colors, typography } from '@/theme/tokens';
import { TabBarIcon } from '@/ui/navigation/TabBarIcon';

export default function AuthenticatedTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: typography.caption,
          fontWeight: '700'
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              activeName="home"
              color={color}
              focused={focused}
              inactiveName="home-outline"
              size={size}
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              activeName="person"
              color={color}
              focused={focused}
              inactiveName="person-outline"
              size={size}
            />
          )
        }}
      />
    </Tabs>
  );
}
