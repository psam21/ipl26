
import fs from 'fs';
import path from 'path';
import { TeamData, Player } from '../src/types';

const dataPath = path.join(process.cwd(), 'src', 'data', 'ipl_data.json');
const teams: TeamData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log('Validating Best XI vs Roster names...\n');

teams.forEach(team => {
  const bestXIString = team.analysis.bestXI;
  const roster = team.roster;

  // Parse Best XI
  const xiPlayers = bestXIString.split(',').map(p => p.trim().replace(/\*\*/g, ''));
  
  // Helper to clean names for comparison (same as PitchView.tsx)
  const cleanName = (n: string) => n.replace('✈️', '').replace('(c)', '').replace('(wk)', '').replace(/\*\*/g, '').trim().toLowerCase();
  
  const xiCleanNames = new Set(xiPlayers.map(cleanName));
  
  // Find which Best XI players are NOT matching anyone in the roster
  const unmatchedXIPlayers: string[] = [];
  
  xiPlayers.forEach(xiPlayer => {
      const xiClean = cleanName(xiPlayer);
      const match = roster.find(p => {
          const pName = p.name.toLowerCase();
          return pName.includes(xiClean) || xiClean.includes(pName);
      });
      
      if (!match) {
          unmatchedXIPlayers.push(xiPlayer);
      }
  });

  if (unmatchedXIPlayers.length > 0) {
      console.log(`❌ ${team.code}: Found ${unmatchedXIPlayers.length} unmatched players in Best XI:`);
      unmatchedXIPlayers.forEach(p => console.log(`   - "${p}" (No fuzzy match in roster)`));
      
      // Suggest potential matches?
      console.log('   Potential roster candidates:');
      roster.forEach(p => {
          // Simple check if first letter matches to narrow down list
           if (unmatchedXIPlayers.some(u => cleanName(u)[0] === p.name.toLowerCase()[0])) {
               console.log(`     - ${p.name}`);
           }
      });
      console.log('');
  } else {
      console.log(`✅ ${team.code}: All Best XI players matched.`);
  }
});
