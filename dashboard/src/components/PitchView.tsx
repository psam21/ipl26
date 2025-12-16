'use client';

interface PitchViewProps {
  bestXI: string;
}

export function PitchView({ bestXI }: PitchViewProps) {
  // Parse the Best XI string which is comma separated
  // e.g. "**Gaikwad**, Short ✈️, **Samson**, Dube..."
  // We need to clean it up
  const players = bestXI.split(',').map(p => p.trim().replace(/\*\*/g, ''));

  return (
    <div className="relative w-full aspect-[3/4] bg-green-900/20 rounded-lg border border-green-800/30 overflow-hidden p-4">
      {/* Pitch Markings */}
      <div className="absolute inset-x-12 top-12 bottom-12 border-2 border-green-800/20 rounded-full" />
      <div className="absolute inset-x-24 top-0 bottom-0 border-x-2 border-dashed border-green-800/10" />
      
      {/* Players Grid - Simple visualization for now */}
      <div className="relative h-full flex flex-col justify-between py-4">
        {/* Openers */}
        <div className="flex justify-center gap-8">
          <PlayerPill name={players[0]} />
          <PlayerPill name={players[1]} />
        </div>
        
        {/* Top Order */}
        <div className="flex justify-center">
          <PlayerPill name={players[2]} />
        </div>

        {/* Middle Order */}
        <div className="flex justify-center gap-12">
          <PlayerPill name={players[3]} />
          <PlayerPill name={players[4]} />
        </div>

        {/* Lower Middle / All Rounders */}
        <div className="flex justify-center gap-8">
          <PlayerPill name={players[5]} />
          <PlayerPill name={players[6]} />
        </div>

        {/* Bowlers */}
        <div className="flex justify-center gap-4">
          <PlayerPill name={players[7]} />
          <PlayerPill name={players[8]} />
          <PlayerPill name={players[9]} />
          <PlayerPill name={players[10]} />
        </div>
      </div>
    </div>
  );
}

function PlayerPill({ name }: { name: string }) {
  if (!name) return null;
  const isOverseas = name.includes('✈️');
  const cleanName = name.replace('✈️', '').replace('(c)', '').replace('(wk)', '').trim();
  const isCaptain = name.includes('(c)');
  const isKeeper = name.includes('(wk)');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
        ${isOverseas ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'bg-zinc-800 border-zinc-600 text-zinc-300'}
      `}>
        {cleanName.charAt(0)}
      </div>
      <div className="text-[10px] font-medium text-zinc-400 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap flex gap-1">
        {cleanName}
        {isCaptain && <span className="text-yellow-500">©</span>}
        {isKeeper && <span className="text-blue-500">🧤</span>}
      </div>
    </div>
  );
}
