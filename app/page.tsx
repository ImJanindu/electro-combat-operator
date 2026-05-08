'use client';

import Link from 'next/link';

const NAV_ITEMS = [
  {
    href: '/operator',
    label: 'Operator Panel',
    description: 'Master control — timers, recovery, match resolution',
    icon: '⚙️',
    color: 'neon-text-cyan',
    border: 'neon-border-cyan',
  },
  {
    href: '/display',
    label: 'Audience Display',
    description: 'Full-screen projector view for the arena',
    icon: '📺',
    color: 'neon-text-magenta',
    border: 'neon-border-magenta',
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    description: 'Tournament standings & statistics',
    icon: '🏆',
    color: 'neon-text-yellow',
    border: 'neon-border-cyan',
  },
  {
    href: '/history',
    label: 'Match History',
    description: 'Browse past matches & event logs',
    icon: '📜',
    color: 'neon-text-green',
    border: 'neon-border-green',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 scanlines">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-magenta/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl w-full text-center">
        {/* Title */}
        <div className="mb-2">
          <span className="text-xs font-mono tracking-[0.4em] text-muted uppercase">
            University Robot Combat
          </span>
        </div>
        <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3 neon-text-cyan animate-neon-flicker">
          ELECTROCOMBAT
        </h1>
        <p className="font-mono text-sm tracking-[0.3em] text-neon-magenta uppercase mb-10">
          ⚡ OPERATOR SYSTEM ⚡
        </p>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.border} panel group hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="flex items-start gap-3 text-left">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <h2
                    className={`font-mono text-base font-bold tracking-wide ${item.color}`}
                  >
                    {item.label}
                  </h2>
                  <p className="text-sm text-muted mt-1">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted/50 mt-12 font-mono tracking-wider">
          OFFLINE-CAPABLE • BROADCAST SYNC • v1.0
        </p>
      </div>
    </div>
  );
}
