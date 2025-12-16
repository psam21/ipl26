import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/data/ipl_data.json');
const IMAGES_DIR = path.join(process.cwd(), 'public/images/players');

// Duplicate logic from src/utils/images.ts to ensure consistency
function getExpectedFilename(playerName: string): string {
  return playerName
    .toLowerCase()
    .replace(/✈️/g, '')
    .replace(/\(c\)/g, '')
    .replace(/\(wk\)/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_') + '.png';
}

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('Data file not found:', DATA_FILE);
    return;
  }

  const teams = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  for (const team of teams) {
    const teamDir = path.join(IMAGES_DIR, team.code);
    if (!fs.existsSync(teamDir)) {
      console.log(`Directory not found for team ${team.code}, skipping...`);
      continue;
    }

    const existingFiles = fs.readdirSync(teamDir);
    console.log(`Processing ${team.code} (${existingFiles.length} files)...`);

    for (const player of team.roster) {
      const expectedName = getExpectedFilename(player.name);
      const expectedPath = path.join(teamDir, expectedName);

      if (fs.existsSync(expectedPath)) {
        // Exact match exists
        continue;
      }

      // Fuzzy search
      // 1. Try to find a file that contains all parts of the player name
      const nameParts = player.name.toLowerCase().split(/[\s\.]+/).filter((p: string) => p.length > 1);
      
      let bestMatch: string | null = null;
      let bestMatchScore = 0;

      for (const file of existingFiles) {
        const fileBase = file.toLowerCase().replace('.png', '');
        const fileParts = fileBase.split(/[_]+/).filter(p => p.length > 0);

        // Check how many name parts are present in file parts
        let matches = 0;
        for (const part of nameParts) {
            if (fileBase.includes(part)) {
                matches++;
            }
        }

        if (matches > 0 && matches >= nameParts.length) {
             // Potential match
             // Check if it's a better match than previous
             // Prefer shorter filenames (less noise) or exact matches
             if (!bestMatch || file.length < bestMatch.length) {
                 bestMatch = file;
                 bestMatchScore = matches;
             }
        }
      }

      if (bestMatch) {
        console.log(`Renaming ${bestMatch} -> ${expectedName} (for ${player.name})`);
        fs.renameSync(path.join(teamDir, bestMatch), expectedPath);
        // Update existingFiles list so we don't use it again? 
        // Actually, we should remove it from our local list to avoid double usage
        const index = existingFiles.indexOf(bestMatch);
        if (index > -1) existingFiles.splice(index, 1);
      } else {
        console.log(`No match found for ${player.name} (Expected: ${expectedName})`);
      }
    }
  }
}

main();
