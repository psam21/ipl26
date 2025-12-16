'use client';

import { Player } from '@/types';

interface RosterTableProps {
  roster: Player[];
}

export function RosterTable({ roster }: RosterTableProps) {
  // Sort by price descending
  const sortedRoster = [...roster].sort((a, b) => 
    parseFloat(b.soldPrice) - parseFloat(a.soldPrice)
  );

  return (
    <div className="overflow-x-auto">
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
              <td className="px-4 py-3 font-medium text-zinc-200">
                {player.name}
                {player.isNew && (
                  <span className="ml-2 text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/50">
                    NEW
                  </span>
                )}
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
