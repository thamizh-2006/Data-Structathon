"use client";

import React from "react";

/**
 * FloatingDSIcons
 * Renders scattered, floating data structure vector icons in varying sizes
 * and natural staggered positions along the left and right gutters.
 */

interface DSIconItem {
  id: string;
  top: string;
  edgeOffset: string; // e.g. "12px", "48px", "20px" to create scattered look
  size: "sm" | "md" | "lg";
  delay: string;
  duration: string;
  amplitude: number;
  icon: React.ReactNode;
}

const ICONS = {
  tree: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="4" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <line x1="10.5" y1="6" x2="7.5" y2="15.5" />
      <line x1="13.5" y1="6" x2="16.5" y2="15.5" />
    </svg>
  ),
  stack: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 6l8-3 8 3-8 3-8-3z" />
      <path d="M4 11l8 3 8-3" />
      <path d="M4 16l8 3 8-3" />
    </svg>
  ),
  graph: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <line x1="8.5" y1="6" x2="15.5" y2="6" />
      <line x1="18" y1="8.5" x2="18" y2="15.5" />
      <line x1="8.5" y1="18" x2="15.5" y2="18" />
      <line x1="6" y1="8.5" x2="6" y2="15.5" />
      <line x1="8" y1="8" x2="16" y2="16" />
    </svg>
  ),
  linkedList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="2" y="7" width="8" height="10" rx="1.5" />
      <line x1="6" y1="7" x2="6" y2="17" />
      <line x1="10" y1="12" x2="14" y2="12" />
      <polyline points="12 10 14 12 12 14" />
      <rect x="14" y="7" width="8" height="10" rx="1.5" />
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="13" y1="6" x2="13" y2="18" />
      <line x1="18" y1="6" x2="18" y2="18" />
      <polyline points="1 12 3 10 3 14" />
    </svg>
  ),
  bst: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="4" r="2" />
      <circle cx="6" cy="11" r="2" />
      <circle cx="18" cy="11" r="2" />
      <circle cx="3" cy="18" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <line x1="10.5" y1="5.5" x2="7.5" y2="9.5" />
      <line x1="13.5" y1="5.5" x2="16.5" y2="9.5" />
      <line x1="5" y1="13" x2="4" y2="16.5" />
      <line x1="7" y1="13" x2="8" y2="16.5" />
    </svg>
  ),
  array: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="7" y1="7" x2="7" y2="17" />
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="17" y1="7" x2="17" y2="17" />
    </svg>
  ),
  hash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  doublyLinked: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="3" y="8" width="6" height="8" rx="1" />
      <rect x="15" y="8" width="6" height="8" rx="1" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <polyline points="13 8 15 10 13 12" />
      <line x1="15" y1="14" x2="9" y2="14" />
      <polyline points="11 12 9 14 11 16" />
    </svg>
  ),
  trie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="3" r="2" />
      <circle cx="5" cy="10" r="1.5" />
      <circle cx="12" cy="10" r="1.5" />
      <circle cx="19" cy="10" r="1.5" />
      <circle cx="3" cy="19" r="1.5" />
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <circle cx="21" cy="19" r="1.5" />
      <line x1="10.5" y1="4.5" x2="6" y2="9" />
      <line x1="12" y1="5" x2="12" y2="8.5" />
      <line x1="13.5" y1="4.5" x2="18" y2="9" />
      <line x1="4.5" y1="11.5" x2="3.5" y2="17.5" />
      <line x1="5.5" y1="11.5" x2="6.5" y2="17.5" />
      <line x1="18.5" y1="11.5" x2="17.5" y2="17.5" />
      <line x1="19.5" y1="11.5" x2="20.5" y2="17.5" />
    </svg>
  ),
  heap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polygon points="12 3 3 20 21 20" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="5.5" y1="16" x2="18.5" y2="16" />
    </svg>
  ),
  dag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="4" cy="12" r="2.5" />
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="12" cy="19" r="2.5" />
      <circle cx="20" cy="12" r="2.5" />
      <line x1="6" y1="10.5" x2="10" y2="6.5" />
      <polyline points="8 6 10 6.5 10.5 8.5" />
      <line x1="6" y1="13.5" x2="10" y2="17.5" />
      <polyline points="8 18 10 17.5 10.5 15.5" />
      <line x1="14" y1="6.5" x2="18" y2="10.5" />
      <line x1="14" y1="17.5" x2="18" y2="13.5" />
    </svg>
  ),
  circularQueue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      <circle cx="20" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  dsu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="7" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5" />
      <path d="M14 17c.5-.7 1.5-1.2 3-1.2 2.5 0 4.5 1.8 4.5 4.2" />
    </svg>
  ),
};

// Organically scattered across the left side at varying distances from the edge
const LEFT_ITEMS: DSIconItem[] = [
  { id: "l1", top: "6%",  edgeOffset: "16px", size: "lg", delay: "0s",   duration: "7.5s", amplitude: 12, icon: ICONS.tree },
  { id: "l2", top: "16%", edgeOffset: "52px", size: "sm", delay: "1.2s", duration: "8s",   amplitude: 9,  icon: ICONS.circularQueue },
  { id: "l3", top: "28%", edgeOffset: "22px", size: "md", delay: "2.4s", duration: "8.5s", amplitude: 14, icon: ICONS.stack },
  { id: "l4", top: "40%", edgeOffset: "60px", size: "sm", delay: "0.8s", duration: "7.8s", amplitude: 10, icon: ICONS.dsu },
  { id: "l5", top: "52%", edgeOffset: "18px", size: "md", delay: "3.1s", duration: "9s",   amplitude: 13, icon: ICONS.linkedList },
  { id: "l6", top: "64%", edgeOffset: "50px", size: "lg", delay: "1.6s", duration: "8.2s", amplitude: 15, icon: ICONS.hash },
  { id: "l7", top: "76%", edgeOffset: "14px", size: "sm", delay: "2.8s", duration: "7.2s", amplitude: 8,  icon: ICONS.trie },
  { id: "l8", top: "88%", edgeOffset: "44px", size: "md", delay: "0.5s", duration: "9.5s", amplitude: 12, icon: ICONS.heap },
];

// Organically scattered across the right side at varying distances from the edge
const RIGHT_ITEMS: DSIconItem[] = [
  { id: "r1", top: "8%",  edgeOffset: "48px", size: "md", delay: "0.7s", duration: "8s",   amplitude: 13, icon: ICONS.graph },
  { id: "r2", top: "18%", edgeOffset: "18px", size: "lg", delay: "2.1s", duration: "7.6s", amplitude: 11, icon: ICONS.queue },
  { id: "r3", top: "30%", edgeOffset: "56px", size: "sm", delay: "1.5s", duration: "8.8s", amplitude: 9,  icon: ICONS.bst },
  { id: "r4", top: "42%", edgeOffset: "20px", size: "md", delay: "3.3s", duration: "8.2s", amplitude: 14, icon: ICONS.doublyLinked },
  { id: "r5", top: "54%", edgeOffset: "54px", size: "sm", delay: "0.4s", duration: "7.4s", amplitude: 10, icon: ICONS.array },
  { id: "r6", top: "66%", edgeOffset: "16px", size: "lg", delay: "2.5s", duration: "9.2s", amplitude: 16, icon: ICONS.dag },
  { id: "r7", top: "78%", edgeOffset: "46px", size: "md", delay: "1.8s", duration: "8.6s", amplitude: 12, icon: ICONS.tree },
  { id: "r8", top: "90%", edgeOffset: "14px", size: "sm", delay: "3.6s", duration: "7.9s", amplitude: 9,  icon: ICONS.stack },
];

const SIZE_STYLES = {
  sm: {
    container: "w-7 h-7 rounded-lg p-1.5",
  },
  md: {
    container: "w-9 h-9 rounded-xl p-2",
  },
  lg: {
    container: "w-11 h-11 rounded-xl p-2.5",
  },
};

interface Props {
  side?: "both" | "left" | "right";
  opacity?: number;
  density?: "low" | "normal";
}

export default function FloatingDSIcons({
  side = "both",
  opacity = 0.85,
  density = "normal",
}: Props) {
  const leftItems = density === "low" ? LEFT_ITEMS.slice(0, 4) : LEFT_ITEMS;
  const rightItems = density === "low" ? RIGHT_ITEMS.slice(0, 4) : RIGHT_ITEMS;
  const renderItem = (item: DSIconItem, idx: number, edge: "left" | "right") => {
    const sizeConfig = SIZE_STYLES[item.size];

    return (
      <div
        key={`${edge}-${item.id}`}
        className="pointer-events-none fixed select-none"
        style={{
          top: item.top,
          [edge]: item.edgeOffset,
          opacity,
          zIndex: 10,
          animation: `ds-float-${edge}-${idx} ${item.duration} ${item.delay} ease-in-out infinite`,
        }}
      >
        <div
          className={`flex items-center justify-center transition-transform ${sizeConfig.container}`}
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            color: "var(--color-palette-burgundy, #8B0000)",
            boxShadow: "0 4px 14px rgba(139, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05)",
            backdropFilter: "blur(8px)",
          }}
        >
          {item.icon}
        </div>

        <style>{`
          @keyframes ds-float-left-${idx} {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50%       { transform: translateY(-${item.amplitude}px) rotate(4deg); }
          }
          @keyframes ds-float-right-${idx} {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50%       { transform: translateY(-${item.amplitude}px) rotate(-4deg); }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="hidden md:block pointer-events-none fixed inset-0 overflow-hidden z-10">
      {(side === "both" || side === "left") && leftItems.map((item, i) => renderItem(item, i, "left"))}
      {(side === "both" || side === "right") && rightItems.map((item, i) => renderItem(item, i, "right"))}
    </div>
  );
}

