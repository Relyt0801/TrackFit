// Toast.tsx — accent-filled confirmation toast with near-black ink, slide/fade in.
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { COLORS } from '../theme';
import { Icon } from './Icon';
import { AppText } from './Text';

export function Toast({ msg }: { msg: string | null }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (msg) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [msg, anim]);

  if (!msg) return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', zIndex: 200 }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: COLORS.accent,
          paddingVertical: 11,
          paddingHorizontal: 18,
          borderRadius: 999,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
          shadowColor: COLORS.accent,
          shadowOpacity: 0.4,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <Icon name="check" size={16} stroke={3} color={COLORS.accentInk} />
        <AppText style={{ fontSize: 13.5, fontWeight: '800', color: COLORS.accentInk }}>{msg}</AppText>
      </Animated.View>
    </View>
  );
}
