
import fs from 'fs';
import path from 'path';
import { TeamData } from '../src/types';

const dataPath = path.join(process.cwd(), 'src', 'data', 'ipl_data.json');
const teams: TeamData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const missingData: string[] = [];

teams.forEach(team => {
  team.roster.forEach(player => {
    if (!player.age || !player.totalYears) {
      missingData.push(`${player.name} (${team.code})`);
    }
  });
});

console.log(`Found ${missingData.length} players with missing data.`);
console.log(missingData.join('\n'));
