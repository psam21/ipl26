'use client';

import { getPlayerImageUrl } from '@/utils/images';
import { useState } from 'react';
import { Player } from '@/types';
import { User } from 'lucide-react';

interface PitchViewProps {
  bestXI: string;
  teamCode: string;
  roster?: Player[];
}

export function PitchView({ bestXI, teamCode, roster = [] }: PitchViewProps) {
  // Parse the Best XI string which is comma separated
  const xiPlayers = bestXI.split(',').map(p => p.trim().replace(/\*\*/g, ''));
  
  // Helper to clean names for comparison
  const cleanName = (n: string) => n.replace('✈️', '').replace(/\(.*\)/g, '').replace(/\*\*/g, '').trim().toLowerCase();
  
  // Identify reserves
  const xiCleanNames = new Set(xiPlayers.map(cleanName));
  
  // Filter roster to find players NOT in Best XI
  // We use a fuzzy match: if the roster name contains the XI name (or vice versa), we assume it's the same player
  const reserves = roster.filter(p => {
    const pName = p.name.toLowerCase();
    // Check if this player matches any name in the XI
    const isInXI = Array.from(xiCleanNames).some(xiName => {
        // Check for exact match or substring match (e.g. "Gaikwad" in "Ruturaj Gaikwad")
        // But be careful: "Sharma" might match "Rohit Sharma" and "Ishant Sharma"
        // So we prefer if the XI name is a significant part of the roster name
        return pName.includes(xiName) || xiName.includes(pName);
    });
    return !isInXI;
  });

  // Group reserves by type
  const reserveBatters = reserves.filter(p => p.type === 'BAT' || p.type === 'WK');
  const reserveARs = reserves.filter(p => p.type === 'AR');
  const reserveBowlers = reserves.filter(p => p.type === 'BOWL');

  // Distribute reserves to left and right sides to balance them
  // Strategy: 
  // Top (Openers/Top Order): Batters
  // Middle (Middle Order): ARs
  // Bottom (Bowlers): Bowlers
  
  // We'll split each group into left and right arrays
  const split = (arr: Player[]) => {
    const mid = Math.ceil(arr.length / 2);
    return [arr.slice(0, mid), arr.slice(mid)];
  };

  const [leftBatters, rightBatters] = split(reserveBatters);
  const [leftARs, rightARs] = split(reserveARs);
  const [leftBowlers, rightBowlers] = split(reserveBowlers);

  return (
    <div className="relative w-full h-[400px] bg-green-900/20 rounded-lg border border-green-800/30 overflow-hidden p-4">
      {/* Pitch Markings - Made narrower to allow space on sides */}
      <div className="absolute inset-x-24 top-8 bottom-8 border-2 border-green-800/20 rounded-full" />
      <div className="absolute inset-x-32 top-0 bottom-0 border-x-2 border-dashed border-green-800/10" />
      
      {/* Left Sidebar Reserves */}
      <div className="absolute left-2 top-4 bottom-4 w-24 flex flex-col justify-between py-4 z-10">
        <div className="flex flex-col gap-2 items-start pl-2">
            {leftBatters.map((p, i) => <MiniPlayerPill key={i} player={p} teamCode={teamCode} align="right" />)}
        </div>
        <div className="flex flex-col gap-2 items-start pl-2">
            {leftARs.map((p, i) => <MiniPlayerPill key={i} player={p} teamCode={teamCode} align="right" />)}
        </div>
        <div className="flex flex-col gap-2 items-start pl-2">
            {leftBowlers.map((p, i) => <MiniPlayerPill key={i} player={p} teamCode={teamCode} align="right" />)}
        </div>
      </div>

      {/* Right Sidebar Reserves */}
      <div className="absolute right-2 top-4 bottom-4 w-24 flex flex-col justify-between py-4 z-10">
        <div className="flex flex-col gap-2 items-end pr-2">
            {rightBatters.map((p, i) => <MiniPlayerPill key={i} player={p} teamCode={teamCode} align="left" />)}
        </div>
        <div className="flex flex-col gap-2 items-end pr-2">
            {rightARs.map((p, i) => <MiniPlayerPill key={i} player={p} teamCode={teamCode} align="left" />)}
        </div>
        <div className="flex flex-col gap-2 items-end pr-2">
            {rightBowlers.map((p, i) => <MiniPlayerPill key={i} player={p} teamCode={teamCode} align="left" />)}
        </div>
      </div>

      {/* Players Grid - Best XI */}
      <div className="relative h-full flex flex-col justify-between py-2 mx-16">
        {/* Openers */}
        <div className="flex justify-center gap-8">
          <PlayerPill name={xiPlayers[0]} teamCode={teamCode} roster={roster} />
          <PlayerPill name={xiPlayers[1]} teamCode={teamCode} roster={roster} />
        </div>
        
        {/* Top Order */}
        <div className="flex justify-center">
          <PlayerPill name={xiPlayers[2]} teamCode={teamCode} roster={roster} />
        </div>

        {/* Middle Order */}
        <div className="flex justify-center gap-12">
          <PlayerPill name={xiPlayers[3]} teamCode={teamCode} roster={roster} />
          <PlayerPill name={xiPlayers[4]} teamCode={teamCode} roster={roster} />
        </div>

        {/* Lower Middle / All Rounders */}
        <div className="flex justify-center gap-8">
          <PlayerPill name={xiPlayers[5]} teamCode={teamCode} roster={roster} />
          <PlayerPill name={xiPlayers[6]} teamCode={teamCode} roster={roster} />
        </div>

        {/* Bowlers */}
        <div className="flex justify-center gap-10">
          <PlayerPill name={xiPlayers[7]} teamCode={teamCode} roster={roster} />
          <PlayerPill name={xiPlayers[8]} teamCode={teamCode} roster={roster} />
          <PlayerPill name={xiPlayers[9]} teamCode={teamCode} roster={roster} />
          <PlayerPill name={xiPlayers[10]} teamCode={teamCode} roster={roster} />
        </div>
      </div>
    </div>
  );
}

function MiniPlayerPill({ player, teamCode, align }: { player: Player; teamCode: string; align: 'left' | 'right' }) {
  const [error, setError] = useState(false);
  const imageUrl = getPlayerImageUrl(teamCode, player.name);

  return (
    <div className={`flex items-center gap-2 ${align === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
        {!error ? (
          <img 
            src={imageUrl} 
            alt={player.name}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <User className="w-3 h-3 text-zinc-500" />
        )}
      </div>
      <span className="text-[9px] text-white/80 font-medium whitespace-nowrap shadow-sm bg-black/30 px-1 rounded">
        {player.name}
      </span>
    </div>
  );
}

function PlayerPill({ name, teamCode, roster }: { name: string; teamCode: string; roster?: Player[] }) {
  if (!name) return null;
  const isOverseas = name.includes('✈️');
  const cleanName = name.replace('✈️', '').replace(/\(.*\)/g, '').replace(/\*\*/g, '').trim();
  const isCaptain = name.includes('(c)') || name.includes('(c/wk)');
  const isKeeper = name.includes('(wk)') || name.includes('(c/wk)');
  
  // Try to find full name in roster for better image matching
  const rosterMatch = roster?.find(p => {
      const pName = p.name.toLowerCase();
      const cName = cleanName.toLowerCase();
      return pName.includes(cName) || cName.includes(pName);
  });
  
  const imageName = rosterMatch ? rosterMatch.name : cleanName;
  
  const [error, setError] = useState(false);
  const imageUrl = getPlayerImageUrl(teamCode, imageName);

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
          <User className="w-4 h-4 text-zinc-500" />
        )}
      </div>
      <div className="text-[10px] font-medium text-zinc-400 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap flex gap-1">
        {rosterMatch ? rosterMatch.name : cleanName}
        {isCaptain && <span className="text-yellow-500">©</span>}
        {isKeeper && <span className="text-blue-500">🧤</span>}
      </div>
    </div>
  );
}


