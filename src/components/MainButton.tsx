import React, { useRef, useState, useCallback } from 'react';

interface MainButtonProps {
  count: number;
  targetGoal: number;
  onIncrement: () => void;
}

export const MainButton: React.FC<MainButtonProps> = ({
  count,
  targetGoal,
  onIncrement,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const lastTapTimeRef = useRef<number>(0);

  const handleTrigger = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // Prevent synthetic click and multiple simultaneous touch events
      e.preventDefault();
      
      const now = performance.now();
      // 140ms debounce to prevent nose-bounce double-tap
      if (now - lastTapTimeRef.current < 140) {
        return;
      }
      lastTapTimeRef.current = now;

      setIsPressed(true);
      setAnimKey((prev) => prev + 1);
      onIncrement();

      // Release pressed state quickly for responsive visual return
      setTimeout(() => {
        setIsPressed(false);
      }, 100);
    },
    [onIncrement]
  );

  // Calculate target progress if a goal is active
  const progressRatio = targetGoal > 0 ? Math.min(count / targetGoal, 1) : 0;
  const strokeDashoffset = 100 - progressRatio * 100;
  const isGoalReached = targetGoal > 0 && count >= targetGoal;

  return (
    <div className="relative flex items-center justify-center select-none w-full px-4">
      {/* Target reached ambient glow effect - subtle and restrained */}
      {isGoalReached && (
        <div
          className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none transition-opacity duration-500"
          aria-hidden="true"
        />
      )}

      {/* Main Giant Circular Button with CSS tactile scale animation */}
      <button
        key={animKey}
        type="button"
        onPointerDown={handleTrigger}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`Push-up count: ${count}. Tap to count one rep.`}
        className={`group relative flex flex-col items-center justify-center rounded-full aspect-square cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#080a0e]
          w-[270px] h-[270px] xs:w-[290px] xs:h-[290px] sm:w-[320px] sm:h-[320px] md:w-[350px] md:h-[350px] max-w-[84vw] max-h-[84vw]
          ${animKey > 0 ? 'animate-tactile-scale' : ''}
          ${isPressed ? 'translate-y-0.5' : ''}`}
        style={{
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Outer Bevel / Base Ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-200 ${
            isGoalReached
              ? 'bg-gradient-to-b from-emerald-500/20 via-zinc-800/80 to-zinc-950 p-[2px]'
              : 'bg-gradient-to-b from-zinc-700/40 via-zinc-800/60 to-zinc-950 p-[2px]'
          }`}
          style={{
            boxShadow: isPressed
              ? '0 10px 25px -10px rgba(0,0,0,0.8), inset 0 2px 4px 0 rgba(0,0,0,0.6)'
              : '0 24px 48px -12px rgba(0,0,0,0.7), 0 8px 16px -6px rgba(0,0,0,0.5)',
          }}
        >
          {/* Inner Surface with Soft Radial Gradient */}
          <div
            className={`w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-150 ${
              isPressed
                ? 'bg-gradient-to-b from-[#111419] to-[#0c0e12]'
                : 'bg-gradient-to-b from-[#181c23] via-[#12151b] to-[#0c0e12]'
            }`}
          >
            {/* Soft top-edge light rim for physical depth */}
            <div
              className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Optional SVG Goal Ring - only active when user set a target */}
            {targetGoal > 0 && (
              <svg
                className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] -rotate-90 pointer-events-none"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {/* Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="stroke-zinc-800/60"
                  strokeWidth="2.5"
                  fill="none"
                />
                {/* Progress */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="stroke-emerald-500 transition-all duration-300 ease-out"
                  strokeWidth="2.5"
                  strokeDasharray="289"
                  strokeDashoffset={`${289 * (1 - progressRatio)}`}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            )}

            {/* Subtle concentric guide line for depth */}
            <div
              className="absolute inset-5 rounded-full border border-zinc-800/40 pointer-events-none"
              aria-hidden="true"
            />

            {/* Rep Count Number */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span
                key={`num-${animKey}`}
                className={`font-mono tabular-nums font-semibold tracking-tighter text-zinc-100 select-none ${
                  animKey > 0 ? 'animate-number-bump' : ''
                } ${
                  count >= 1000
                    ? 'text-6xl sm:text-7xl'
                    : count >= 100
                    ? 'text-7xl sm:text-8xl'
                    : 'text-8xl sm:text-9xl'
                } ${isPressed ? 'text-emerald-400' : ''}`}
                style={{
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                }}
              >
                {count}
              </span>

              {/* Subtle label below the number */}
              <span className="mt-3 text-[11px] sm:text-xs font-semibold tracking-[0.28em] text-zinc-400 uppercase select-none transition-colors duration-150 group-hover:text-zinc-300">
                PUSH UPS
              </span>

              {/* Optional tiny goal indicator underneath label if goal active */}
              {targetGoal > 0 && (
                <span className="mt-1 text-[10px] font-mono tabular-nums text-zinc-500 select-none">
                  {count} / {targetGoal}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};
