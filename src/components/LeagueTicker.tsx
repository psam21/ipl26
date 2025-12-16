'use client';

import { motion } from 'framer-motion';
import { TeamData } from '@/types';

interface LeagueTickerProps {
  teams: TeamData[];
}

export function LeagueTicker({ teams }: LeagueTickerProps) {
  // Find top 5 most expensive players across league
  const allPlayers = teams.flatMap(t => t.roster.map(p => ({ ...p, team: t.code })));
  const topBuys = allPlayers
    .sort((a, b) => parseFloat(b.soldPrice) - parseFloat(a.soldPrice))
    .slice(0, 5);

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800 overflow-hidden whitespace-nowrap py-2 flex items-center">
      <div className="flex items-center gap-6 px-4 border-r border-zinc-800 z-10 bg-zinc-950">
        <div className="flex flex-col leading-none">
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Top Buys</span>
        </div>
      </div>

      <motion.div 
        className="flex items-center gap-8 px-4"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
      >
        {topBuys.map((player, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">#{i + 1}</span>
            <span className="font-bold text-white">{player.name}</span>
            <span className="text-zinc-400">({player.team})</span>
            <span className="text-green-400 font-mono">₹{player.soldPrice} Cr</span>
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {topBuys.map((player, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">#{i + 1}</span>
            <span className="font-bold text-white">{player.name}</span>
            <span className="text-zinc-400">({player.team})</span>
            <span className="text-green-400 font-mono">₹{player.soldPrice} Cr</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
