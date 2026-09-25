"use client";

import { useEffect, useRef, useState } from "react";
import type { CompanionState, StudentActivity } from "@/lib/types";

const STATE_LABEL: Record<CompanionState, string> = {
  idle: "Idle",
  listening: "Listening",
  reacting: "Reacting",
  charged: "Charged",
};

/** Original friendly orb companion — corner-mounted; tap to switch activities. */
export function Companion({
  state,
  corner = false,
  activity,
  onSelectActivity,
}: {
  state: CompanionState;
  corner?: boolean;
  activity?: StudentActivity;
  onSelectActivity?: (next: StudentActivity) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const glow =
    state === "charged"
      ? "0 0 18px 5px rgba(255, 201, 74, 0.65)"
      : state === "reacting"
        ? "0 0 14px 4px rgba(255, 107, 74, 0.5)"
        : state === "listening"
          ? "0 0 14px 4px rgba(59, 157, 224, 0.5)"
          : "0 0 10px 3px rgba(62, 207, 142, 0.4)";

  const bodyFill =
    state === "charged"
      ? "#ffc94a"
      : state === "reacting"
        ? "#ff6b4a"
        : state === "listening"
          ? "#3b9de0"
          : "#3ecf8e";

  const pulseClass =
    state === "idle"
      ? "motion-safe:animate-[companion-breathe_3s_ease-in-out_infinite]"
      : state === "listening"
        ? "motion-safe:animate-[companion-listen_1.2s_ease-in-out_infinite]"
        : state === "reacting"
          ? "motion-safe:animate-[companion-react_0.6s_ease-in-out_infinite]"
          : "motion-safe:animate-[companion-charge_1.4s_ease-in-out_infinite]";

  const shell = (
    <div className="flex flex-col items-center gap-0.5" aria-live="polite">
      <svg
        width={corner ? 52 : 60}
        height={corner ? 60 : 68}
        viewBox="0 0 56 64"
        className={pulseClass}
        style={{ filter: `drop-shadow(${glow})` }}
        aria-hidden={Boolean(onSelectActivity)}
        role={onSelectActivity ? undefined : "img"}
        aria-label={
          onSelectActivity ? undefined : `Companion: ${STATE_LABEL[state]}`
        }
      >
        <defs>
          <radialGradient id="orbCoreKid" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="50%" stopColor={bodyFill} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1a3a5c" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        <ellipse cx="28" cy="30" rx="18" ry="20" fill="url(#orbCoreKid)" />
        <circle cx="28" cy="12" r="4.5" fill={bodyFill} />
        <path
          d="M28 8 C28 3, 36 3, 35 9"
          fill="none"
          stroke="#1a3a5c"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="22" cy="28" r="2.4" fill="#1a3a5c" />
        <circle cx="34" cy="28" r="2.4" fill="#1a3a5c" />
        <circle cx="22.7" cy="27.3" r="0.8" fill="#fff" />
        <circle cx="34.7" cy="27.3" r="0.8" fill="#fff" />
        {state === "listening" ? (
          <ellipse cx="28" cy="36" rx="3.2" ry="4.2" fill="#1a3a5c" />
        ) : state === "reacting" ? (
          <path
            d="M21 34 Q28 43 35 34"
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : state === "charged" ? (
          <path
            d="M21 35 Q28 41 35 35"
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M23 36 Q28 39 33 36"
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
        {state === "charged" && (
          <>
            <path
              d="M44 16 L46 21 L51 22 L46 24 L44 29 L42 24 L37 22 L42 21 Z"
              fill="#ffc94a"
              stroke="#e8910f"
              strokeWidth="0.5"
            />
            <path
              d="M9 38 L10.5 41.5 L14 42 L10.5 43.5 L9 47 L7.5 43.5 L4 42 L7.5 41.5 Z"
              fill="#ffc94a"
              opacity="0.9"
            />
          </>
        )}
      </svg>
      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
        {onSelectActivity ? "Menu" : STATE_LABEL[state]}
      </span>
    </div>
  );

  if (!corner) return shell;

  const interactive = Boolean(onSelectActivity);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6"
    >
      {menuOpen && onSelectActivity && (
        <div
          className="absolute bottom-full right-0 mb-3 min-w-[12rem] rounded-2xl border-2 border-[var(--border)] bg-white p-2 shadow-[0_4px_0_rgba(59,157,224,0.2)]"
          role="menu"
          aria-label="Switch activity"
        >
          <p className="px-2 pb-1.5 pt-1 text-xs font-bold text-[var(--text-faint)]">
            Go to…
          </p>
          {(
            [
              { id: "lesson" as const, label: "Lesson" },
              { id: "group" as const, label: "Group tasks" },
              { id: "reading" as const, label: "Reading" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectActivity(opt.id);
                setMenuOpen(false);
              }}
              className={`mb-1 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-base font-bold transition last:mb-0 ${
                activity === opt.id
                  ? "bg-[var(--mint-dim)] text-[var(--mint)]"
                  : "text-[var(--text)] hover:bg-[#dff0fb]"
              }`}
            >
              {opt.label}
              {activity === opt.id ? " ✓" : ""}
            </button>
          ))}
        </div>
      )}

      {interactive ? (
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Open activity menu. Companion is ${STATE_LABEL[state]}.`}
          className="rounded-3xl border-2 border-[var(--border)] bg-white/95 p-2.5 shadow-[0_4px_0_rgba(59,157,224,0.2)] backdrop-blur-sm transition hover:brightness-105"
        >
          {shell}
        </button>
      ) : (
        <div className="rounded-3xl border-2 border-[var(--border)] bg-white/95 p-2.5 shadow-[0_4px_0_rgba(59,157,224,0.2)] backdrop-blur-sm">
          {shell}
        </div>
      )}
    </div>
  );
}
