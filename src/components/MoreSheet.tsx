import React, { useState } from 'react';
import { X, Volume2, VolumeX, Smartphone, Eye, Award, Flame, Download, Check } from 'lucide-react';
import { AppSettings, WorkoutSession, calculateStreak } from '../utils/storage';
import { isWakeLockSupported } from '../utils/wakelock';
import { playRepSound } from '../utils/audio';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  personalBest: number;
  currentCount: number;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetPersonalBest: () => void;
  history: WorkoutSession[];
  onClearHistory: () => void;
  isInstallable?: boolean;
  isStandalone?: boolean;
  onInstall?: () => void;
}

export const MoreSheet: React.FC<MoreSheetProps> = ({
  isOpen,
  onClose,
  personalBest,
  currentCount,
  settings,
  onUpdateSettings,
  onResetPersonalBest,
  history,
  onClearHistory,
  isInstallable = false,
  isStandalone = false,
  onInstall,
}) => {
  const [showConfirmResetPB, setShowConfirmResetPB] = useState(false);
  const [showConfirmClearHistory, setShowConfirmClearHistory] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  if (!isOpen) return null;

  const wakeLockAvailable = isWakeLockSupported();
  const streakInfo = calculateStreak(history, currentCount);

  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    onUpdateSettings({ soundEnabled: next });
    if (next) {
      setTimeout(() => playRepSound(), 50);
    }
  };

  const handleToggleHaptics = () => {
    const next = !settings.hapticsEnabled;
    onUpdateSettings({ hapticsEnabled: next });
    if (next && 'vibrate' in navigator) {
      navigator.vibrate?.([20]);
    }
  };

  const handleToggleWakeLock = () => {
    onUpdateSettings({ keepAwake: !settings.keepAwake });
  };

  const targets = [0, 20, 30, 50, 100];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Options and settings"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-[2px] transition-opacity select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#0f1217] border-t sm:border border-zinc-800/90 shadow-2xl p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Grab handle for mobile ergonomics */}
        <div className="w-10 h-1 bg-zinc-700/60 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/70">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-200">
            Options & Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Row: Personal Best & Daily Streak */}
        <div className="py-4 border-b border-zinc-800/70 grid grid-cols-2 gap-3">
          {/* Personal Best */}
          <div className="flex flex-col justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium tracking-tight">Best</span>
              </div>
              {personalBest > 0 && (
                <div>
                  {showConfirmResetPB ? (
                    <button
                      type="button"
                      onClick={() => {
                        onResetPersonalBest();
                        setShowConfirmResetPB(false);
                      }}
                      className="text-[10px] text-rose-400 font-medium hover:underline"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmResetPB(true)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-400"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="text-xl font-mono tabular-nums font-semibold text-zinc-100">
                {personalBest} <span className="text-xs font-sans font-normal text-zinc-400">reps</span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Highest single set</p>
            </div>
          </div>

          {/* Daily Streak Indicator */}
          <div className="flex flex-col justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Flame className={`w-3.5 h-3.5 ${streakInfo.streak > 0 ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span className="text-[11px] font-medium tracking-tight">Daily Streak</span>
              </div>
              {streakInfo.hasWorkedOutToday && streakInfo.streak > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Completed today" />
              )}
            </div>
            <div>
              <p className="text-xl font-mono tabular-nums font-semibold text-zinc-100">
                {streakInfo.streak}{' '}
                <span className="text-xs font-sans font-normal text-zinc-400">
                  {streakInfo.streak === 1 ? 'day' : 'days'}
                </span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {streakInfo.hasWorkedOutToday
                  ? 'Completed today'
                  : streakInfo.streak > 0
                  ? 'Do 1+ rep today'
                  : 'Start streak today'}
              </p>
            </div>
          </div>
        </div>

        {/* Target Goal Selector */}
        <div className="py-4 border-b border-zinc-800/70">
          <p className="text-xs font-medium text-zinc-400 mb-2.5">
            Session Target
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {targets.map((tgt) => {
              const isSelected = settings.targetGoal === tgt;
              return (
                <button
                  key={tgt}
                  type="button"
                  onClick={() => onUpdateSettings({ targetGoal: tgt })}
                  className={`py-2 rounded-lg text-xs font-mono tabular-nums font-medium transition-colors border
                    ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
                    }`}
                >
                  {tgt === 0 ? 'Off' : tgt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Utility Toggles */}
        <div className="py-4 space-y-3.5 border-b border-zinc-800/70">
          <p className="text-xs font-medium text-zinc-400">Preferences</p>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
              <div>
                <p className="text-xs font-medium text-zinc-200">Tap Sound</p>
                <p className="text-[11px] text-zinc-500">Audio feedback on each nose tap</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 absolute top-1 ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Haptics Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-zinc-200">Haptic Vibration</p>
                <p className="text-[11px] text-zinc-500">Tactile buzz on supported phones</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.hapticsEnabled}
              onClick={handleToggleHaptics}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.hapticsEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 absolute top-1 ${
                  settings.hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Screen Wake Lock Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-zinc-200">Keep Screen Awake</p>
                <p className="text-[11px] text-zinc-500">
                  {wakeLockAvailable
                    ? 'Prevents phone locking while on floor'
                    : 'Not supported in this browser'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.keepAwake}
              disabled={!wakeLockAvailable}
              onClick={handleToggleWakeLock}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                !wakeLockAvailable
                  ? 'opacity-40 cursor-not-allowed bg-zinc-800'
                  : settings.keepAwake
                  ? 'bg-emerald-500'
                  : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 absolute top-1 ${
                  settings.keepAwake && wakeLockAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Android / Home Screen App Installation */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-zinc-200">Android / Home Screen App</p>
                <p className="text-[11px] text-zinc-500">
                  {isStandalone ? 'Installed as standalone app' : 'Install for full-screen floor workout'}
                </p>
              </div>
            </div>

            {isStandalone ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40">
                <Check className="w-3 h-3" />
                <span>Installed</span>
              </span>
            ) : isInstallable && onInstall ? (
              <button
                type="button"
                onClick={onInstall}
                className="px-3 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer"
              >
                Install
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowInstallHelp((prev) => !prev)}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline-offset-2 hover:underline cursor-pointer"
              >
                How to install
              </button>
            )}
          </div>

          {showInstallHelp && !isStandalone && (
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-300 space-y-1">
              <p className="font-semibold text-zinc-200">To install on Android:</p>
              <p>In Chrome / browser menu (⋮), tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
              <p className="text-zinc-400">It launches in true full-screen without address bars, just like a native app.</p>
            </div>
          )}
        </div>

        {/* History / Recent Sessions */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-zinc-400">Recent Sessions</p>
            {history.length > 0 && (
              <div>
                {showConfirmClearHistory ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setShowConfirmClearHistory(false);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Confirm clear
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmClearHistory(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-zinc-600 py-2">
              No completed sessions yet. Reset a session to log it here.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {history.slice(0, 10).map((item) => {
                const date = new Date(item.timestamp);
                const timeStr = date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                }) + ' · ' + date.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-900/40 text-xs text-zinc-300 font-mono"
                  >
                    <span className="text-zinc-400 font-sans text-[11px]">{timeStr}</span>
                    <span className="tabular-nums font-semibold text-emerald-400">
                      {item.reps} reps
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
