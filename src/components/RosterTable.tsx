'use client';

import { Player } from '@/types';
import { getPlayerImageUrl } from '@/utils/images';
import { useState } from 'react';

interface RosterTableProps {
  roster: Player[];
  teamCode: string;
}

export function RosterTable({ roster, teamCode }: RosterTableProps) {
  // Sort by price descending
  const sortedRoster = [...roster].sort((a, b) => 
    parseFloat(b.soldPrice) - parseFloat(a.soldPrice)
  );

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
          {sortedRoster.map((player, i) => (
            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
              <td className="px-4 py-3 font-medium text-zinc-200 flex items-center gap-3">
                <PlayerAvatar teamCode={teamCode} name={player.name} />
                <div>
                  {player.name}
                  {player.isNew && (
                    <span className="ml-2 text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/50">
                      NEW
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-400">{player.type}</td>
              <td className="px-4 py-3 font-mono text-zinc-300">{player.soldPrice}</td>
              <td className="px-4 py-3">
                {parseFloat(player.soldPrice) > 10 ? (
                  <span className="text-xs text-yellow-500">Premium</span>
                ) : (
                  <span className="text-xs text-zinc-600">Standard</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerAvatar({ teamCode, name }: { teamCode: string; name: string }) {
  const [error, setError] = useState(false);
  const imageUrl = getPlayerImageUrl(teamCode, name);

  if (error) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className="w-8 h-8 rounded-full object-cover bg-zinc-800"
      onError={() => setError(true)}
    />
  );
}
