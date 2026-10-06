import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface SecondaryControlsProps {
  count: number;
  onUndo: () => void;
  onReset: () => void;
  onOpenMore: () => void;
}

export const SecondaryControls: React.FC<SecondaryControlsProps> = ({
  count,
  onUndo,
  onReset,
  onOpenMore,
}) => {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  // Auto-cancel reset confirmation after 3.5 seconds
  useEffect(() => {
    if (isConfirmingReset) {
      resetTimerRef.current = window.setTimeout(() => {
        setIsConfirmingReset(false);
      }, 3500);
    }
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [isConfirmingReset]);

  // If count becomes 0, reset confirmation state is no longer needed
  useEffect(() => {
    if (count === 0 && isConfirmingReset) {
      setIsConfirmingReset(false);
    }
  }, [count, isConfirmingReset]);

  const handleResetClick = () => {
    if (count === 0) return;

    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
    } else {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      setIsConfirmingReset(false);
      onReset();
    }
  };

  const handleCancelReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingReset(false);
  };

  return (
    <div className="w-full max-w-sm px-6 pb-6 pt-2 flex items-center justify-between gap-3 select-none">
      {/* Undo Button */}
      <button
        type="button"
        onClick={onUndo}
        disabled={count === 0}
        aria-label="Undo one rep"
        className={`flex items-center justify-center gap-1.5 min-h-[48px] px-4 rounded-full text-xs font-medium transition-all duration-150 border
          ${
            count === 0
              ? 'opacity-30 cursor-not-allowed bg-zinc-900/30 text-zinc-600 border-zinc-900'
              : 'cursor-pointer bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80 active:scale-95'
          }`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Undo</span>
      </button>

      {/* Reset Button with Lightweight Inline Confirmation */}
      <div className="relative">
        <button
          type="button"
          onClick={handleResetClick}
          disabled={count === 0 && !isConfirmingReset}
          aria-label={isConfirmingReset ? 'Confirm reset session' : 'Reset session'}
          className={`flex items-center justify-center min-h-[48px] px-4 rounded-full text-xs font-medium transition-all duration-150 border cursor-pointer
            ${
              isConfirmingReset
                ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700/60 shadow-lg shadow-rose-950/30 active:scale-95'
                : count === 0
                ? 'opacity-30 cursor-not-allowed bg-zinc-900/30 text-zinc-600 border-zinc-900'
                : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80 active:scale-95'
            }`}
        >
          {isConfirmingReset ? (
            <span className="flex items-center gap-1 text-rose-200 font-semibold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Tap to Reset</span>
            </span>
          ) : (
            <span>Reset</span>
          )}
        </button>
      </div>

      {/* More Button */}
      <button
        type="button"
        onClick={onOpenMore}
        aria-label="Open settings and options"
        className="flex items-center justify-center gap-1.5 min-h-[48px] px-4 rounded-full text-xs font-medium cursor-pointer bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 active:scale-95 transition-all duration-150"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>More</span>
      </button>
    </div>
  );
};
