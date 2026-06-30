// TabBar.tsx — bottom tab bar (translucent background; active tab is accent-colored
// with a heavier icon stroke and bolder label). Uses safe-area inset for the home bar.
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { Icon } from './Icon';
import { BrandGlyph, BrandGlyphName } from './ExerciseIcon';
import { AppText } from './Text';
import { selection } from '../utils/haptics';

export type TabId = 'training' | 'overview' | 'stats' | 'settings';

// Training and Einstellungen use the provided brand SVGs (dumbbell / double-gear);
// the others use the built-in stroke icons.
const TABS: { id: TabId; label: string; icon: string; glyph?: BrandGlyphName }[] = [
  { id: 'training', label: 'Training', icon: 'dumbbell', glyph: 'dumbbell' },
  { id: 'overview', label: 'Übersicht', icon: 'grid' },
  { id: 'stats', label: 'Diagramme', icon: 'chart' },
  { id: 'settings', label: 'Einstellungen', icon: 'gear', glyph: 'gears' },
];

export function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.tabBarBg,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
      }}
    >
      {TABS.map((t) => {
        const on = tab === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => {
              if (!on) selection();
              setTab(t.id);
            }}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              gap: 4,
              paddingVertical: 4,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            {t.glyph ? (
              <BrandGlyph name={t.glyph} size={24} color={on ? COLORS.accent : COLORS.muted} />
            ) : (
              <Icon name={t.icon} size={23} stroke={on ? 2.4 : 2} color={on ? COLORS.accent : COLORS.muted} />
            )}
            <AppText
              style={{
                fontSize: 10.5,
                fontWeight: on ? '800' : '600',
                letterSpacing: 0.1,
                color: on ? COLORS.accent : COLORS.muted,
              }}
            >
              {t.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
