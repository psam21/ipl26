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

  // Find most expensive player
  const mostExpensive = [...team.roster].sort((a, b) => 
    parseFloat(b.soldPrice) - parseFloat(a.soldPrice)
  )[0];

  return (
    <>
      <motion.div
        layoutId={`card-${team.code}`}
        whileHover={{ scale: 1.02, y: -5 }}
        onClick={() => setIsOpen(true)}
        className={`
          relative overflow-hidden rounded-xl border-2 bg-zinc-900 p-4 cursor-pointer transition-colors
          ${getProbabilityColor(team.analysis.titleProbability)}
          hover:bg-zinc-800/50
        `}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">{team.code}</h2>
            <p className="text-xs text-zinc-400 truncate max-w-[120px]">{team.name}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500 uppercase font-bold">Purse Left</div>
            <div className="text-green-400 font-mono font-bold">{team.purseLeft} Cr</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-zinc-950/50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-zinc-300">Top Buy</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white">{mostExpensive?.name}</div>
              <div className="text-[10px] text-zinc-500">{mostExpensive?.soldPrice} Cr</div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-zinc-950/50 p-2 rounded-lg border border-red-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-zinc-300">SPOF</span>
            </div>
            <div className="text-xs font-bold text-red-200">{team.analysis.spof}</div>
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
