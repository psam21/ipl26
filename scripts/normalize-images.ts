import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/data/ipl_data.json');
const IMAGES_DIR = path.join(process.cwd(), 'public/images/players');

// Known name variations: expected name -> possible file names
const NAME_ALIASES: Record<string, string[]> = {
  'suryakumar yadav': ['surya_kumar_yadav'],
  'mohammed shami': ['mohammad_shami'],
  'shahbaz ahmed': ['shahbaz_ahamad'],
  'am ghazanfar': ['allah_ghazanfar'],
  'mohd izhar': ['mohammad_izhar'],
  'varun chakravarthy': ['varun_chakaravarthy'],
  'manimaran siddharth': ['m_siddharth'],
  'mitchell owen': ['mitch_owen'],
  'praveen dubey': ['pravin_dubey'],
  'rasikh salam': ['rasikh_dar'],
  'vijaykumar vyshak': ['vyshak_vijaykumar'],
  'tilak varma': ['n_tilak_varma'],
  'raj bawa': ['raj_angad_bawa'],
  'digvesh rathi': ['digvesh_singh'],
  'auqib nabi': ['auqib_dar'],
  'tejasvi dahiya': ['tejasvi_singh'],
  'aman rao': ['aman_rao_perala'],
  'ravichandran smaran': ['smaran_ravichandran'],
};

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

// Strip all non-alphanumeric for comparison
function normalizeForComparison(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Calculate similarity score between two strings (0-1)
function similarity(s1: string, s2: string): number {
  const n1 = normalizeForComparison(s1);
  const n2 = normalizeForComparison(s2);
  
  // Exact match after normalization
  if (n1 === n2) return 1.0;
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) {
    const minLen = Math.min(n1.length, n2.length);
    const maxLen = Math.max(n1.length, n2.length);
    return minLen / maxLen;
  }
  
  // Check how many characters match in sequence (LCS-like)
  let matchCount = 0;
  let j = 0;
  for (let i = 0; i < n1.length && j < n2.length; i++) {
    if (n1[i] === n2[j]) {
      matchCount++;
      j++;
    }
  }
  
  return matchCount / Math.max(n1.length, n2.length);
}

// Check if two names likely refer to the same person
function isLikelyMatch(playerName: string, fileName: string): { match: boolean; score: number } {
  const pNorm = normalizeForComparison(playerName);
  const fNorm = normalizeForComparison(fileName.replace('.png', ''));
  
  // Direct normalized match (handles "Suryakumar Yadav" vs "surya_kumar_yadav")
  if (pNorm === fNorm) {
    return { match: true, score: 1.0 };
  }
  
  // Split into parts for partial matching
  const playerParts = playerName.toLowerCase().split(/[\s\._]+/).filter(p => p.length > 1);
  const fileParts = fileName.replace('.png', '').toLowerCase().split(/[_\-]+/).filter(p => p.length > 1);
  
  // Check if last name matches (most important)
  const playerLastName = playerParts[playerParts.length - 1];
  const fileLastName = fileParts[fileParts.length - 1];
  const playerFirstName = playerParts[0];
  const fileFirstName = fileParts[0];
  
  // Last names must match for multi-part names
  const lastNameMatches = playerLastName === fileLastName || 
                          playerLastName.includes(fileLastName) || 
                          fileLastName.includes(playerLastName);
  
  if (!lastNameMatches && playerParts.length > 1 && fileParts.length > 1) {
    // Last names don't match - check if normalized versions are close
    if (pNorm !== fNorm && !pNorm.includes(fNorm) && !fNorm.includes(pNorm)) {
      return { match: false, score: 0 };
    }
  }
  
  // First name similarity check - must have some overlap
  const firstNameSimilar = playerFirstName === fileFirstName ||
                           playerFirstName.includes(fileFirstName) ||
                           fileFirstName.includes(playerFirstName) ||
                           normalizeForComparison(playerFirstName).includes(normalizeForComparison(fileFirstName)) ||
                           normalizeForComparison(fileFirstName).includes(normalizeForComparison(playerFirstName));
  
  // For common last names like "Singh", "Khan", "Sharma" - require first name match too
  const commonLastNames = ['singh', 'khan', 'sharma', 'yadav', 'kumar', 'patel', 'reddy'];
  if (commonLastNames.includes(playerLastName) && !firstNameSimilar) {
    return { match: false, score: 0 };
  }
  
  // Count matching parts
  let matchedParts = 0;
  const usedFileParts = new Set<number>();
  
  for (const pPart of playerParts) {
    for (let i = 0; i < fileParts.length; i++) {
      if (usedFileParts.has(i)) continue;
      const fPart = fileParts[i];
      
      // Check for match: exact, contains, or combined parts
      if (pPart === fPart || pPart.includes(fPart) || fPart.includes(pPart)) {
        matchedParts++;
        usedFileParts.add(i);
        break;
      }
    }
  }
  
  // Also try matching concatenated file parts against player parts
  // e.g., "surya" + "kumar" should match "suryakumar"
  const fileConcatenated = fileParts.join('');
  const playerConcatenated = playerParts.join('');
  
  if (fileConcatenated === playerConcatenated) {
    return { match: true, score: 0.95 };
  }
  
  // Check similarity of normalized full strings
  const sim = similarity(playerName, fileName);
  
  const partRatio = matchedParts / playerParts.length;
  
  // High similarity with first name match
  if (sim >= 0.7 && firstNameSimilar) {
    return { match: true, score: sim };
  }
  
  // Most parts matched AND both first and last name matched
  if (partRatio >= 0.5 && lastNameMatches && firstNameSimilar) {
    return { match: true, score: 0.5 + partRatio * 0.3 };
  }
  
  return { match: false, score: sim };
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

      // Check known aliases first
      const playerKey = player.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      const aliases = NAME_ALIASES[playerKey] || [];
      
      let aliasMatch: string | null = null;
      for (const alias of aliases) {
        const aliasFile = alias + '.png';
        if (existingFiles.includes(aliasFile)) {
          aliasMatch = aliasFile;
          break;
        }
      }
      
      if (aliasMatch) {
        console.log(`Renaming ${aliasMatch} -> ${expectedName} (for ${player.name}, via alias)`);
        fs.renameSync(path.join(teamDir, aliasMatch), expectedPath);
        const index = existingFiles.indexOf(aliasMatch);
        if (index > -1) existingFiles.splice(index, 1);
        continue;
      }

      // Fuzzy search with improved matching
      let bestMatch: string | null = null;
      let bestScore = 0;

      for (const file of existingFiles) {
        const result = isLikelyMatch(player.name, file);
        if (result.match && result.score > bestScore) {
          bestMatch = file;
          bestScore = result.score;
        }
      }

      if (bestMatch) {
        console.log(`Renaming ${bestMatch} -> ${expectedName} (for ${player.name}, score: ${bestScore.toFixed(2)})`);
        fs.renameSync(path.join(teamDir, bestMatch), expectedPath);
        // Remove from list to avoid double usage
        const index = existingFiles.indexOf(bestMatch);
        if (index > -1) existingFiles.splice(index, 1);
      } else {
        console.log(`No match found for ${player.name} (Expected: ${expectedName})`);
      }
    }
  }
}

main();
