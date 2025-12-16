'use client';

import { getPlayerImageUrl } from '@/utils/images';
import { useState } from 'react';

interface PitchViewProps {
  bestXI: string;
  teamCode: string;
}

export function PitchView({ bestXI, teamCode }: PitchViewProps) {
  // Parse the Best XI string which is comma separated
  // e.g. "**Gaikwad**, Short ✈️, **Samson**, Dube..."
  // We need to clean it up
  const players = bestXI.split(',').map(p => p.trim().replace(/\*\*/g, ''));

  return (
    <div className="relative w-full h-[400px] bg-green-900/20 rounded-lg border border-green-800/30 overflow-hidden p-4">
      {/* Pitch Markings */}
      <div className="absolute inset-x-12 top-8 bottom-8 border-2 border-green-800/20 rounded-full" />
      <div className="absolute inset-x-24 top-0 bottom-0 border-x-2 border-dashed border-green-800/10" />
      
      {/* Players Grid - Simple visualization for now */}
      <div className="relative h-full flex flex-col justify-between py-2">
        {/* Openers */}
        <div className="flex justify-center gap-8">
          <PlayerPill name={players[0]} teamCode={teamCode} />
          <PlayerPill name={players[1]} teamCode={teamCode} />
        </div>
        
        {/* Top Order */}
        <div className="flex justify-center">
          <PlayerPill name={players[2]} teamCode={teamCode} />
        </div>

        {/* Middle Order */}
        <div className="flex justify-center gap-12">
          <PlayerPill name={players[3]} teamCode={teamCode} />
          <PlayerPill name={players[4]} teamCode={teamCode} />
        </div>

        {/* Lower Middle / All Rounders */}
        <div className="flex justify-center gap-8">
          <PlayerPill name={players[5]} teamCode={teamCode} />
          <PlayerPill name={players[6]} teamCode={teamCode} />
        </div>

        {/* Bowlers */}
        <div className="flex justify-center gap-4">
          <PlayerPill name={players[7]} teamCode={teamCode} />
          <PlayerPill name={players[8]} teamCode={teamCode} />
          <PlayerPill name={players[9]} teamCode={teamCode} />
          <PlayerPill name={players[10]} teamCode={teamCode} />
        </div>
      </div>
    </div>
  );
}

function PlayerPill({ name, teamCode }: { name: string; teamCode: string }) {
  if (!name) return null;
  const isOverseas = name.includes('✈️');
  const cleanName = name.replace('✈️', '').replace('(c)', '').replace('(wk)', '').trim();
  const isCaptain = name.includes('(c)');
  const isKeeper = name.includes('(wk)');
  
  const [error, setError] = useState(false);
  const imageUrl = getPlayerImageUrl(teamCode, cleanName);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 overflow-hidden transition-all duration-300
        ${isOverseas 
          ? 'bg-purple-900/50 border-purple-500 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.6)]' 
          : 'bg-blue-900/30 border-blue-500 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.6)]'}
      `}>
        {!error ? (
          <img 
            src={imageUrl} 
            alt={cleanName}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          cleanName.charAt(0)
        )}
      </div>
      <div className="text-[10px] font-medium text-zinc-400 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap flex gap-1">
        {cleanName}
        {isCaptain && <span className="text-yellow-500">©</span>}
        {isKeeper && <span className="text-blue-500">🧤</span>}
      </div>
    </div>
  );
}
