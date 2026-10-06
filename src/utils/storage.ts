// Local persistence utility for PushUp Counter with corruption resilience

export interface WorkoutSession {
  id: string;
  reps: number;
  timestamp: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  keepAwake: boolean;
  targetGoal: number; // 0 means no target
}

const STORAGE_KEYS = {
  CURRENT_COUNT: 'pushup_counter_count_v1',
  PERSONAL_BEST: 'pushup_counter_pb_v1',
  SETTINGS: 'pushup_counter_settings_v1',
  HISTORY: 'pushup_counter_history_v1',
  SESSION_START: 'pushup_counter_session_start_v1',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  keepAwake: true,
  targetGoal: 0,
};

export function loadSessionStartTime(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  } catch {
    return null;
  }
}

export function saveSessionStartTime(timestamp: number | null): void {
  try {
    if (timestamp === null) {
      localStorage.removeItem(STORAGE_KEYS.SESSION_START);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION_START, String(timestamp));
    }
  } catch {
    // Ignore
  }
}

export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateStreak(
  history: WorkoutSession[],
  currentSessionReps: number
): { streak: number; hasWorkedOutToday: boolean } {
  try {
    const workoutDates = new Set<string>();

    for (const session of history) {
      if (session.reps > 0) {
        workoutDates.add(getDateKey(new Date(session.timestamp)));
      }
    }

    const today = new Date();
    const todayKey = getDateKey(today);
    const hasWorkedOutToday = workoutDates.has(todayKey) || currentSessionReps > 0;

    if (hasWorkedOutToday) {
      workoutDates.add(todayKey);
    }

    // Determine starting date for streak verification
    let checkDate = new Date(today);
    if (!hasWorkedOutToday) {
      // Check if worked out yesterday to keep streak active
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayKey = getDateKey(checkDate);
      if (!workoutDates.has(yesterdayKey)) {
        return { streak: 0, hasWorkedOutToday: false };
      }
    }

    let streak = 0;
    while (true) {
      const key = getDateKey(checkDate);
      if (workoutDates.has(key)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { streak, hasWorkedOutToday };
  } catch {
    return { streak: 0, hasWorkedOutToday: false };
  }
}

export function loadCurrentCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_COUNT);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  } catch {
    return 0;
  }
}

export function saveCurrentCount(count: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_COUNT, String(Math.max(0, count)));
  } catch {
    // LocalStorage quota or privacy mode exception handling
  }
}

export function loadPersonalBest(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_BEST);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  } catch {
    return 0;
  }
}

export function savePersonalBest(pb: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_BEST, String(Math.max(0, pb)));
  } catch {
    // Ignore
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : DEFAULT_SETTINGS.hapticsEnabled,
      keepAwake: typeof parsed.keepAwake === 'boolean' ? parsed.keepAwake : DEFAULT_SETTINGS.keepAwake,
      targetGoal: typeof parsed.targetGoal === 'number' && parsed.targetGoal >= 0 ? parsed.targetGoal : DEFAULT_SETTINGS.targetGoal,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadHistory(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => 
      item && 
      typeof item.id === 'string' && 
      typeof item.reps === 'number' && 
      typeof item.timestamp === 'number'
    ).slice(0, 50);
  } catch {
    return [];
  }
}

export function saveHistory(history: WorkoutSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch {
    // Ignore
  }
}
