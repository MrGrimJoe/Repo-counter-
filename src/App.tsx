/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MainButton } from './components/MainButton';
import { SecondaryControls } from './components/SecondaryControls';
import { MoreSheet } from './components/MoreSheet';
import {
  loadCurrentCount,
  saveCurrentCount,
  loadPersonalBest,
  savePersonalBest,
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  loadSessionStartTime,
  saveSessionStartTime,
  AppSettings,
  WorkoutSession,
} from './utils/storage';
import {
  playRepSound,
  playUndoSound,
  playResetSound,
  playMilestoneSound,
} from './utils/audio';
import { requestScreenWakeLock, releaseScreenWakeLock } from './utils/wakelock';

export default function App() {
  const [count, setCount] = useState<number>(0);
  const [personalBest, setPersonalBest] = useState<number>(0);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial load from local storage and standalone PWA detection
  useEffect(() => {
    const savedCount = loadCurrentCount();
    const savedPB = loadPersonalBest();
    const savedSettings = loadSettings();
    const savedHistory = loadHistory();
    const savedStartTime = loadSessionStartTime();

    setCount(savedCount);
    setPersonalBest(savedPB);
    setSettings(savedSettings);
    setHistory(savedHistory);

    if (savedCount > 0 && savedStartTime) {
      setSessionStartTime(savedStartTime);
    } else if (savedCount === 0) {
      saveSessionStartTime(null);
    }

    // Detect if already installed in standalone mode
    if (typeof window !== 'undefined') {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsStandalone(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    setIsInitialized(true);
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsStandalone(true);
        setDeferredPrompt(null);
      }
    }
  };

  // Update session elapsed time timer when active
  useEffect(() => {
    if (!sessionStartTime || count === 0) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const sec = Math.floor((now - sessionStartTime) / 1000);
      setElapsedSeconds(Math.max(0, sec));
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 500);
    return () => clearInterval(timerId);
  }, [sessionStartTime, count]);

  // Screen Wake Lock effect to keep phone display awake on the floor
  useEffect(() => {
    if (!isInitialized) return;

    if (settings.keepAwake) {
      requestScreenWakeLock();
    } else {
      releaseScreenWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && settings.keepAwake) {
        requestScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseScreenWakeLock();
    };
  }, [settings.keepAwake, isInitialized]);

  // Haptic feedback trigger helper
  const triggerHaptic = useCallback(
    (pattern: number | number[]) => {
      if (!settings.hapticsEnabled) return;
      try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate(pattern);
        }
      } catch {
        // Fallback for devices without vibration support
      }
    },
    [settings.hapticsEnabled]
  );

  // Increment counter (nose-tap)
  const handleIncrement = useCallback(() => {
    setCount((prevCount) => {
      const nextCount = prevCount + 1;
      saveCurrentCount(nextCount);

      // Start session timer on first rep if not already running
      setSessionStartTime((prevStartTime) => {
        if (!prevStartTime || prevCount === 0) {
          const now = Date.now();
          saveSessionStartTime(now);
          return now;
        }
        return prevStartTime;
      });

      // Check if this sets or beats personal best
      setPersonalBest((prevPB) => {
        if (nextCount > prevPB) {
          savePersonalBest(nextCount);
          return nextCount;
        }
        return prevPB;
      });

      // Target goal reached check
      if (settings.targetGoal > 0 && nextCount === settings.targetGoal) {
        if (settings.soundEnabled) playMilestoneSound();
        triggerHaptic([30, 60, 30]);
      } else {
        if (settings.soundEnabled) playRepSound();
        triggerHaptic(18);
      }

      return nextCount;
    });
  }, [settings.targetGoal, settings.soundEnabled, triggerHaptic]);

  // Undo one rep
  const handleUndo = useCallback(() => {
    setCount((prevCount) => {
      if (prevCount <= 0) return 0;
      const nextCount = prevCount - 1;
      saveCurrentCount(nextCount);

      // If count falls to 0, clear session timer
      if (nextCount === 0) {
        setSessionStartTime(null);
        saveSessionStartTime(null);
        setElapsedSeconds(0);
      }

      if (settings.soundEnabled) playUndoSound();
      triggerHaptic(12);
      return nextCount;
    });
  }, [settings.soundEnabled, triggerHaptic]);

  // Reset current session
  const handleReset = useCallback(() => {
    setCount((currentReps) => {
      if (currentReps > 0) {
        // Log completed session to history
        const newEntry: WorkoutSession = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          reps: currentReps,
          timestamp: Date.now(),
        };
        setHistory((prevHistory) => {
          const updated = [newEntry, ...prevHistory].slice(0, 50);
          saveHistory(updated);
          return updated;
        });
      }

      saveCurrentCount(0);
      setSessionStartTime(null);
      saveSessionStartTime(null);
      setElapsedSeconds(0);

      if (settings.soundEnabled) playResetSound();
      triggerHaptic([20, 40, 20]);
      return 0;
    });
  }, [settings.soundEnabled, triggerHaptic]);

  // Settings update handler
  const handleUpdateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Reset personal best
  const handleResetPersonalBest = useCallback(() => {
    setPersonalBest(0);
    savePersonalBest(0);
    triggerHaptic(20);
  }, [triggerHaptic]);

  // Clear history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
    triggerHaptic(20);
  }, [triggerHaptic]);

  // Keyboard shortcuts (Space/Enter: Count, U/Backspace: Undo, Esc: Close menu)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'u' || e.key === 'U' || e.key === 'Backspace') {
        if (!isMoreOpen) {
          e.preventDefault();
          handleUndo();
        }
      } else if (e.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleIncrement, handleUndo, isMoreOpen]);

  // Format mm:ss
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Dynamic Reps Per Minute (RPM) based on current count and elapsed seconds
  const rpm = elapsedSeconds > 0 ? Math.round((count / elapsedSeconds) * 60) : null;

  return (
    <main className="fixed inset-0 flex flex-col justify-between items-center bg-[#080a0e] text-zinc-100 overflow-hidden pt-safe pb-safe pl-safe pr-safe select-none">
      {/* Top area: subtle session timer and RPM indicator visible only when count > 0 */}
      <header className="w-full flex items-center justify-center pt-8 sm:pt-12 min-h-[56px]">
        {count > 0 && (
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tabular-nums text-zinc-400 bg-zinc-900/60 border border-zinc-800/60 transition-opacity duration-300"
            aria-label={`Session duration: ${formatTime(elapsedSeconds)}, pace: ${rpm !== null ? `${rpm} reps per minute` : 'calculating'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            <span className="tracking-wider text-zinc-300">{formatTime(elapsedSeconds)}</span>
            <span className="text-zinc-600 font-sans" aria-hidden="true">·</span>
            <span className="text-zinc-300 flex items-center gap-1">
              <span>{rpm !== null ? rpm : '--'}</span>
              <span className="text-[10px] text-zinc-500 font-sans font-medium uppercase tracking-tight">rpm</span>
            </span>
          </div>
        )}
      </header>

      {/* Main dominant centered section: The Giant Circular Button */}
      <div className="flex-1 w-full flex items-center justify-center py-2">
        <MainButton
          count={count}
          targetGoal={settings.targetGoal}
          onIncrement={handleIncrement}
        />
      </div>

      {/* Bottom secondary controls row */}
      <div className="w-full flex items-center justify-center pb-4 sm:pb-8">
        <SecondaryControls
          count={count}
          onUndo={handleUndo}
          onReset={handleReset}
          onOpenMore={() => setIsMoreOpen(true)}
        />
      </div>

      {/* More Options & Settings Bottom Sheet */}
      <MoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        personalBest={personalBest}
        currentCount={count}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetPersonalBest={handleResetPersonalBest}
        history={history}
        onClearHistory={handleClearHistory}
        isInstallable={!!deferredPrompt}
        isStandalone={isStandalone}
        onInstall={handleTriggerInstall}
      />
    </main>
  );
}
