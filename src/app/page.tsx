import { TeamCard } from '@/components/TeamCard';
import { LeagueTicker } from '@/components/LeagueTicker';
import iplData from '@/data/ipl_data.json';
import { TeamData } from '@/types';

// Map probability strings to numeric values for sorting
function getProbabilityScore(prob: string): number {
  const lower = prob.toLowerCase();
  if (lower.includes('high') && !lower.includes('med')) return 5;
  if (lower.includes('med–high') || lower.includes('med-high')) return 4;
  if (lower.includes('med') && !lower.includes('low') && !lower.includes('high')) return 3;
  if (lower.includes('med-low') || lower.includes('med–low')) return 2;
  if (lower.includes('low')) return 1;
  return 0;
}

// Extract title and top-4 scores from titleProbability string
function getTeamScore(team: TeamData): { title: number; top4: number; combined: number } {
  const probStr = team.analysis?.titleProbability || '';
  const parts = probStr.split('<br>').map(s => s.trim());
  
  let titleScore = 0;
  let top4Score = 0;
  
  for (const part of parts) {
    if (part.toLowerCase().startsWith('title:')) {
      titleScore = getProbabilityScore(part);
    } else if (part.toLowerCase().startsWith('top-4:')) {
      top4Score = getProbabilityScore(part);
    }
  }
  
  // Combined score: Title weight (x2) + Top-4 weight
  const combined = titleScore * 2 + top4Score;
  return { title: titleScore, top4: top4Score, combined };
}

export default function Home() {
  const teams = iplData as TeamData[];
  
  // Sort teams by combined probability score (title weighted higher)
  const sortedTeams = [...teams].sort((a, b) => {
    const scoreA = getTeamScore(a);
    const scoreB = getTeamScore(b);
    
    // Sort by combined score descending, then by title, then by top-4
    if (scoreB.combined !== scoreA.combined) return scoreB.combined - scoreA.combined;
    if (scoreB.title !== scoreA.title) return scoreB.title - scoreA.title;
    return scoreB.top4 - scoreA.top4;
  });

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <LeagueTicker teams={teams} />
      
      <div className="p-6 max-w-[1600px] mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 flex items-baseline gap-4">
            <span>IPL 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">THE GRID</span></span>
            <span className="text-lg font-normal text-zinc-500 tracking-normal">The definitive view of the ten franchises</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sortedTeams.map((team) => (
            <TeamCard key={team.code} team={team} />
          ))}
        </div>
      </div>
    </main>
  );
}
