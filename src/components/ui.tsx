// ui.tsx — shared UI primitives (ports ui.jsx to React Native).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { COLORS, RADIUS } from '../theme';
import { METRICS, MUSCLES } from '../data/constants';
import { muscleColor } from '../data/color';
import { MetricKey } from '../types';
import { AppText, AppTextInput } from './Text';
import { Icon } from './Icon';

let uidCounter = 0;
const useUniqueId = (prefix: string) =>
  useMemo(() => `${prefix}${++uidCounter}`, [prefix]);

// ── Coloured muscle-group chip ──
export function MuscleTag({ m, small }: { m: string; small?: boolean }) {
  const col = muscleColor(m, 0.78, 0.14);
  const bg = muscleColor(m, 0.32, 0.07);
  const bd = muscleColor(m, 0.42, 0.09);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: bd,
        paddingVertical: small ? 2 : 3,
        paddingHorizontal: small ? 7 : 9,
        borderRadius: 999,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 9, backgroundColor: col }} />
      <AppText style={{ fontSize: small ? 10.5 : 12, fontWeight: '600', color: col, letterSpacing: 0.1 }}>
        {MUSCLES[m] ? MUSCLES[m].name : m}
      </AppText>
    </View>
  );
}

// ── Generic selectable chip / filter pill ──
export function Chip({
  active,
  children,
  onPress,
  style,
}: {
  active?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingVertical: 7,
          paddingHorizontal: 13,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? COLORS.accent : COLORS.border,
          backgroundColor: active ? COLORS.accent : COLORS.surface2,
        },
        style,
      ]}
    >
      <AppText
        style={{
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.1,
          color: active ? COLORS.accentInk : COLORS.muted,
        }}
      >
        {children}
      </AppText>
    </Pressable>
  );
}

export function IconBtn({
  name,
  size = 20,
  onPress,
  color = COLORS.muted,
  bg = 'transparent',
  style,
  stroke = 2,
}: {
  name: string;
  size?: number;
  onPress?: () => void;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  stroke?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon name={name} size={size} stroke={stroke} color={color} />
    </Pressable>
  );
}

// ── Number stepper with faded "last time" placeholder ──
const fmtNum = (v: number, dec: number) =>
  dec ? Number(v).toFixed(dec).replace(/\.?0+$/, '') : String(v);

export function Stepper({
  value,
  placeholder,
  metricKey,
  onChange,
  accent,
}: {
  value: number | '';
  placeholder?: number | null;
  metricKey: MetricKey;
  onChange: (v: number | '') => void;
  accent?: boolean;
}) {
  const m = METRICS[metricKey] || { step: 1, dec: 0, short: '', label: '', unit: '' };
  const has = value !== '' && value != null;
  const display = has ? String(value) : '';
  const bump = (dir: number) => {
    const base = has ? Number(value) : placeholder != null ? Number(placeholder) : 0;
    let nv = Math.round((base + dir * m.step) * 100) / 100;
    if (nv < 0) nv = 0;
    onChange(nv);
  };
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: COLORS.surface2,
        borderRadius: RADIUS - 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingTop: 7,
        paddingBottom: 8,
        paddingHorizontal: 5,
        alignItems: 'center',
        gap: 2,
      }}
    >
      <AppText
        style={{
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 0.3,
          color: COLORS.muted,
          textTransform: 'uppercase',
          height: 13,
          lineHeight: 13,
        }}
      >
        {m.label}
        {m.unit ? ` ${m.unit}` : ''}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, width: '100%' }}>
        <Pressable onPress={() => bump(-1)} style={stepBtn}>
          <Icon name="minus" size={15} color={COLORS.muted} />
        </Pressable>
        <AppTextInput
          keyboardType="decimal-pad"
          value={display}
          onChangeText={(t) => {
            const raw = t.replace(',', '.').replace(/[^0-9.]/g, '');
            onChange(raw === '' ? '' : Number(raw));
          }}
          placeholder={placeholder != null ? fmtNum(placeholder, m.dec) : '–'}
          placeholderTextColor="rgba(243,245,248,0.26)"
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'center',
            padding: 0,
            fontSize: 21,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
            color: has ? (accent ? COLORS.accent : COLORS.text) : COLORS.text,
          }}
        />
        <Pressable onPress={() => bump(1)} style={stepBtn}>
          <Icon name="plus" size={15} color={COLORS.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const stepBtn: ViewStyle = {
  width: 24,
  height: 24,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.surface,
  alignItems: 'center',
  justifyContent: 'center',
};

// ── Plain labelled input ──
export function Field({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  keyboardType,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  return (
    <View>
      {label ? (
        <AppText
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            color: COLORS.muted,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </AppText>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.surface2,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: RADIUS - 4,
          paddingHorizontal: 12,
        }}
      >
        <AppTextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor="rgba(243,245,248,0.26)"
          keyboardType={keyboardType}
          onChangeText={onChange}
          style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: '600', paddingVertical: 11 }}
        />
        {suffix ? (
          <AppText style={{ color: COLORS.muted, fontSize: 14, fontWeight: '600' }}>{suffix}</AppText>
        ) : null}
      </View>
    </View>
  );
}

// ── Segmented control ──
type SegOption = string | { value: string | number; label: string };
export function Segmented({
  options,
  value,
  onChange,
  style,
}: {
  options: SegOption[];
  value: string | number;
  onChange: (v: any) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: COLORS.surface2,
          borderRadius: 999,
          padding: 4,
          gap: 4,
          borderWidth: 1,
          borderColor: COLORS.border,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = val === value;
        return (
          <Pressable
            key={String(val)}
            onPress={() => onChange(val)}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 6,
              borderRadius: 999,
              alignItems: 'center',
              backgroundColor: active ? COLORS.accent : 'transparent',
            }}
          >
            <AppText
              style={{
                fontSize: 13,
                fontWeight: '700',
                letterSpacing: 0.2,
                color: active ? COLORS.accentInk : COLORS.muted,
              }}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Checkbox({
  checked,
  onChange,
  size = 28,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        borderWidth: checked ? 1 : 1.5,
        borderColor: checked ? COLORS.accent : COLORS.border,
        backgroundColor: checked ? COLORS.accent : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <Icon name="check" size={size * 0.6} stroke={3} color={COLORS.accentInk} /> : null}
    </Pressable>
  );
}

// ── Striped placeholder for an exercise illustration ──
export function ExerciseThumb({
  label = 'Übungsbild',
  h = 120,
}: {
  label?: string;
  h?: number;
  equipment?: string;
}) {
  const pid = useUniqueId('stripes');
  return (
    <View
      style={{
        width: '100%',
        height: h,
        borderRadius: RADIUS - 4,
        overflow: 'hidden',
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id={pid}
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect width={10} height={20} fill="rgba(255,255,255,0.035)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${pid})`} />
      </Svg>
      <View style={{ alignItems: 'center', opacity: 0.5 }}>
        <Icon name="dumbbell" size={26} color={COLORS.muted} />
        {label ? (
          <AppText
            style={{
              fontSize: 10,
              letterSpacing: 0.5,
              color: COLORS.muted,
              marginTop: 6,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

// ── Bottom sheet modal ──
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  full,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  full?: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(slide, {
        toValue: 1,
        duration: 280,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, slide]);

  if (!mounted) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.scrim }]} />
        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            maxHeight: '88%',
            height: full ? '94%' : undefined,
            borderTopWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flexShrink: 1 }}
          >
            <View style={{ alignItems: 'center', paddingTop: 10 }}>
              <View style={{ width: 38, height: 4, borderRadius: 9, backgroundColor: COLORS.border }} />
            </View>
            {title ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 18,
                  paddingTop: 10,
                  paddingBottom: 12,
                }}
              >
                <AppText style={{ fontSize: 19, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 }}>
                  {title}
                </AppText>
                <IconBtn name="x" onPress={onClose} bg={COLORS.surface2} />
              </View>
            ) : null}
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: 18 }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer ? (
              <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18, borderTopWidth: 1, borderColor: COLORS.border }}>
                {footer}
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function EmptyState({
  icon = 'list',
  title,
  sub,
}: {
  icon?: string;
  title: string;
  sub?: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ padding: 16, borderRadius: 18, backgroundColor: COLORS.surface2, marginBottom: 14 }}>
        <Icon name={icon} size={26} color={COLORS.muted} />
      </View>
      <AppText style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center' }}>{title}</AppText>
      {sub ? (
        <AppText
          style={{
            fontSize: 13.5,
            marginTop: 5,
            maxWidth: 240,
            textAlign: 'center',
            lineHeight: 20,
            color: COLORS.muted,
          }}
        >
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

// Shared primary action button used by sheets/forms.
export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        {
          width: '100%',
          paddingVertical: 15,
          borderRadius: 14,
          alignItems: 'center',
          backgroundColor: disabled ? COLORS.surface2 : COLORS.accent,
        },
        style,
      ]}
    >
      <AppText
        style={{
          fontSize: 15.5,
          fontWeight: '800',
          letterSpacing: 0.2,
          color: disabled ? COLORS.muted : COLORS.accentInk,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export const labelStyle: TextStyle = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.5,
  color: COLORS.muted,
  textTransform: 'uppercase',
  marginBottom: 8,
};
