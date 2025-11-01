import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { borderRadius } from './borderRadius';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
};

export type Theme = typeof theme;

export { colors, typography, spacing, shadows, borderRadius };

