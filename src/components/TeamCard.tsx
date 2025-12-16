'use client';

import { motion } from 'framer-motion';
import { TeamData } from '@/types';
import { AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import { TeamDrawer } from './TeamDrawer';

interface TeamCardProps {
  team: TeamData;
}

export function TeamCard({ team }: TeamCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse probability for color coding
  const getProbabilityColor = (prob: string) => {
    if (prob.includes('High')) return 'border-green-500 shadow-green-500/20';
    if (prob.includes('Med')) return 'border-yellow-500 shadow-yellow-500/20';
    return 'border-red-500 shadow-red-500/20';
  };

  // Find top 3 most expensive players
  const topBuys = [...team.roster]
    .sort((a, b) => parseFloat(b.soldPrice) - parseFloat(a.soldPrice))
    .slice(0, 3);

  return (
    <>
      <motion.div
        layoutId={`card-${team.code}`}
        whileHover={{ scale: 1.02, y: -5 }}
        onClick={() => setIsOpen(true)}
        className={`
          relative overflow-hidden rounded-xl border-2 bg-zinc-900 p-4 cursor-pointer transition-colors
          ${getProbabilityColor(team.analysis.titleProbability)}
          hover:bg-zinc-800/50 flex flex-col h-full
        `}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative flex-shrink-0">
              <img 
                src={`/logos/teams/${team.code}.png`}
                alt={`${team.code} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if local image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter">{team.code}</h2>
              <p className="text-xs text-zinc-400 truncate max-w-[120px]">{team.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500 uppercase font-bold">Purse Left</div>
            <div className="text-green-400 font-mono font-bold">{team.purseLeft.replace(' Cr', '')} Cr</div>
          </div>
        </div>

        <div className="space-y-3 flex-grow">
          <div className="bg-zinc-950/50 p-2 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-zinc-300">Top Buys</span>
            </div>
            <div className="space-y-1">
              {topBuys.map((player, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 truncate max-w-[120px]">{player.name}</span>
                  <span className="text-zinc-500 font-mono">{player.soldPrice} Cr</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-zinc-950/50 p-2 rounded-lg border border-red-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-zinc-300">SPOF</span>
            </div>
            <div className="text-xs font-bold text-red-200">{team.analysis.spof}</div>
          </div>

          <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
             <div className="text-[10px] text-zinc-500 uppercase mb-1">Title / Top-4 Probability</div>
             <div className="text-xs font-medium text-zinc-300">{team.analysis.titleProbability}</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
            <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">
                {team.playersBought} Players
            </span>
            <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">
                {team.overseasBuys} Overseas
            </span>
        </div>
      </motion.div>

      <TeamDrawer 
        team={team} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
