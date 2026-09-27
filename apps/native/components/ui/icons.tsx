import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { theme } from '../../theme';

/**
 * Line icons for the native shell, ported from apps/web's hand-drawn SVGs so the
 * two clients carry the same iconography rather than emoji (the bottom-tab
 * glyphs were 📅📖🛒👤). The tab paths are copied verbatim from
 * apps/web/src/components/BottomNav.tsx and the chevrons from
 * apps/web/src/week/WeekView.tsx, on the shared 24×24 viewBox with rounded
 * caps/joins, so weight and shape match web exactly.
 */
type IconProps = {
  /** Square size in px. */
  size?: number;
  /** Stroke colour; defaults to the faded ink so icons read as quiet by default. */
  color?: ColorValue;
  strokeWidth?: number;
};

const stroke = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Week tab — calendar (BottomNav.tsx). */
export function Calendar({ size = 24, color = theme.colors.inkFaded, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={strokeWidth} {...stroke} />
      <Path d="M3 9h18M8 3v4M16 3v4" stroke={color} strokeWidth={strokeWidth} {...stroke} />
    </Svg>
  );
}

/** Meals side of the Week mode-switch — fork + spoon (matches apps/web WeekView). */
export function Meal({ size = 24, color = theme.colors.inkFaded, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 3v8a2 2 0 0 0 4 0V3M7 11v10" stroke={color} strokeWidth={strokeWidth} {...stroke} />
      <Path
        d="M17 3c-1.5 0-2.5 1.8-2.5 4.5S15.5 12 17 12s2.5-1.8 2.5-4.5S18.5 3 17 3zM17 12v9"
        stroke={color}
        strokeWidth={strokeWidth}
        {...stroke}
      />
    </Svg>
  );
}

/** Library tab — open book (BottomNav.tsx). */
export function Book({ size = 24, color = theme.colors.inkFaded, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" stroke={color} strokeWidth={strokeWidth} {...stroke} />
      <Path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" stroke={color} strokeWidth={strokeWidth} {...stroke} />
    </Svg>
  );
}

/** Shop tab — shopping bag/trolley (BottomNav.tsx). */
export function Cart({ size = 24, color = theme.colors.inkFaded, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth={strokeWidth} {...stroke} />
      <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth={strokeWidth} {...stroke} />
    </Svg>
  );
}

/** Profile tab fallback when there is no user avatar — matches the tab line weight. */
export function Person({ size = 24, color = theme.colors.inkFaded, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={strokeWidth} {...stroke} />
      <Path d="M4 21a8 8 0 0 1 16 0" stroke={color} strokeWidth={strokeWidth} {...stroke} />
    </Svg>
  );
}

/** Previous-week chevron (WeekView.tsx) — drawn at weight 2 like web. */
export function ChevronLeft({ size = 24, color = theme.colors.inkFaded, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={strokeWidth} {...stroke} />
    </Svg>
  );
}

/** Next-week chevron (WeekView.tsx). */
export function ChevronRight({ size = 24, color = theme.colors.inkFaded, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} {...stroke} />
    </Svg>
  );
}
