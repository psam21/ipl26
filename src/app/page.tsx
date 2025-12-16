import { TeamCard } from '@/components/TeamCard';
import { LeagueTicker } from '@/components/LeagueTicker';
import iplData from '@/data/ipl_data.json';
import { TeamData } from '@/types';

export default function Home() {
  const teams = iplData as TeamData[];

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <LeagueTicker teams={teams} />
      
      <div className="p-6 max-w-[1600px] mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            IPL 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">THE GRID</span>
          </h1>
          <p className="text-zinc-400">The definitive view of the ten franchises</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {teams.map((team) => (
            <TeamCard key={team.code} team={team} />
          ))}
        </div>
      </div>
    </main>
  );
}
