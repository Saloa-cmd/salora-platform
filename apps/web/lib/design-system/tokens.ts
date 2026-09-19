/** Runtime-safe mirrors of layout and motion tokens needed by TypeScript APIs. */
export const SALORA_BREAKPOINTS = {
  small: "40rem",
  medium: "48rem",
  large: "64rem",
  extraLarge: "80rem",
  wide: "96rem"
} as const;

export const SALORA_CONTAINERS = {
  reading: "42rem",
  content: "80rem",
  wide: "96rem"
} as const;

export const SALORA_MOTION = {
  fast: 140,
  normal: 220,
  cinematic: 560
} as const;

export const SALORA_Z_INDEX = {
  base: 0,
  raised: 10,
  sticky: 30,
  navigation: 40,
  overlay: 50,
  modal: 60,
  toast: 70
} as const;

export type SaloraBreakpoint = keyof typeof SALORA_BREAKPOINTS;
export type SaloraMotionSpeed = keyof typeof SALORA_MOTION;
export type SaloraLayer = keyof typeof SALORA_Z_INDEX;
