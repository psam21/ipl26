'use client';

import { Player } from '@/types';
import { getPlayerImageUrl } from '@/utils/images';
import { useState } from 'react';

interface RosterTableProps {
  roster: Player[];
  teamCode: string;
  bestXI?: string;
}

const TYPE_MAPPING: Record<string, string> = {
  'BAT': 'Batter',
  'BOWL': 'Bowler',
  'AR': 'All Rounder',
  'WK': 'Wicket Keeper'
};

export function RosterTable({ roster, teamCode, bestXI }: RosterTableProps) {
  // Sort by price descending
  const sortedRoster = [...roster].sort((a, b) => 
    parseFloat(b.soldPrice) - parseFloat(a.soldPrice)
  );

  // Extract overseas players from Best XI string if available
  const overseasPlayers = new Set<string>();
  if (bestXI) {
    bestXI.split(',').forEach(p => {
      if (p.includes('✈️')) {
        const cleanName = p.replace('✈️', '').replace(/\*\*/g, '').replace('(c)', '').replace('(wk)', '').trim();
        overseasPlayers.add(cleanName);
      }
    });
  }

  return (
    <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
          <tr>
            <th className="px-4 py-3 rounded-l-lg">Player</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Price (Cr)</th>
            <th className="px-4 py-3 rounded-r-lg">Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedRoster.map((player, i) => {
            // Check if player is in the overseas set
            // We need to be careful with name matching. 
            // The roster name might be "Travis Head" and bestXI might have "Travis Head" (cleaned).
            // But bestXI only has 4 overseas.
            // We can't know for sure for others.
            // However, we can try to match partial names or just use what we have.
            
            // Simple check: is the name in the set?
            const isOverseas = Array.from(overseasPlayers).some(osName => player.name.includes(osName) || osName.includes(player.name));
            
            return (
            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
              <td className="px-4 py-3 font-medium text-zinc-200 flex items-center gap-3">
                <PlayerAvatar teamCode={teamCode} name={player.name} isOverseas={isOverseas} />
                <div>
                  {player.name}
                  {player.isNew && (
                    <span className="ml-2 text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/50">
                      NEW
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-400">{TYPE_MAPPING[player.type] || player.type}</td>
              <td className="px-4 py-3 font-mono text-zinc-300">{player.soldPrice}</td>
              <td className="px-4 py-3">
                {parseFloat(player.soldPrice) > 10 ? (
                  <span className="text-xs text-yellow-500">Premium</span>
                ) : (
                  <span className="text-xs text-zinc-600">Standard</span>
                )}
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}

function PlayerAvatar({ teamCode, name, isOverseas }: { teamCode: string; name: string; isOverseas?: boolean }) {
  const [error, setError] = useState(false);
  const imageUrl = getPlayerImageUrl(teamCode, name);

  const borderColor = isOverseas ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]';

  if (error) {
    return (
      <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 border-2 ${borderColor}`}>
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={`w-8 h-8 rounded-full object-cover bg-zinc-800 border-2 ${borderColor}`}
      onError={() => setError(true)}
    />
  );
}
