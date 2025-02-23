export interface DurationConversion {
  /** Raw duration in seconds */
  rawSeconds: number;
  /** Full minutes portion (floor of seconds / 60) */
  minutes: number;
  /** Remaining seconds after minutes are taken out (rounded) */
  seconds: number;
  /** Rounded-up minutes used for subscription/billing purposes */
  usageMinutes: number;
  /** A human-friendly formatted string (e.g., "2m 10s") */
  durationText: string;
}

/**
 * Converts a given duration in seconds into minutes, seconds, usage minutes,
 * and a formatted text.
 *
 * @param durationSeconds - The raw duration in seconds.
 * @returns A DurationConversion object containing various representations.
 */
export function convertDuration(durationSeconds: number): DurationConversion {
  if (durationSeconds < 0) {
    throw new Error("Duration cannot be negative");
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.round(durationSeconds % 60);
  // For subscription usage, round up to the next full minute.
  const usageMinutes = Math.ceil(durationSeconds / 60);
  const durationText = `${minutes}m ${seconds}s`;

  return {
    rawSeconds: durationSeconds,
    minutes,
    seconds,
    usageMinutes,
    durationText,
  };
}
