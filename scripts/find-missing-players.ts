
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { TeamData } from '../src/types';

const IPL_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'ipl_data.json');
const SCRAPED_FILE = path.join(process.cwd(), 'src', 'data', 'scraped_players.json');

interface ScrapedPlayer {
  name: string;
  teamCode: string;
  imageUrl?: string;
  profileUrl?: string;
  age?: number;
  totalYears?: number;
  dob?: string;
  iplDebut?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to calculate age/years (copied from scrape-player-details)
function calculateAge(dobStr: string): number | undefined {
  if (!dobStr) return undefined;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return undefined;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function calculateTotalYears(debutYearStr: string): number | undefined {
  if (!debutYearStr) return undefined;
  const debutYear = parseInt(debutYearStr);
  if (isNaN(debutYear)) return undefined;
  return 2026 - debutYear + 1;
}

async function searchPlayer(name: string): Promise<string | null> {
  const searchUrl = `https://www.iplt20.com/players?search=${encodeURIComponent(name)}`;
  try {
    const { data } = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    
    // Find the first player card link
    // Selector might need adjustment based on actual site structure
    // Usually .ap-p-player-list__item a
    const link = $('.ap-p-player-list__item a').first().attr('href');
    
    if (link) {
      // Ensure absolute URL
      return link.startsWith('http') ? link : `https://www.iplt20.com${link}`;
    }
    return null;
  } catch (e: any) {
    console.error(`Search failed for ${name}:`, e.message);
    return null;
  }
}

async function scrapeDetails(url: string) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);

    let dob = '';
    let iplDebut = '';

    // Try specific selectors first
    const dobLabel = $('.ap-p-player-overview__info:contains("Date of Birth")');
    dob = dobLabel.prev('.ap-p-player-overview__num').text().trim();

    const debutLabel = $('.ap-p-player-overview__info:contains("IPL Debut")');
    iplDebut = debutLabel.prev('.ap-p-player-overview__num').text().trim();

    // Fallback to text search if selectors fail
    if (!dob) {
        $('*').each((i, el) => {
            if ($(el).text().trim() === 'Date of Birth') {
                dob = $(el).prev().text().trim();
            }
        });
    }
    if (!iplDebut) {
        $('*').each((i, el) => {
            if ($(el).text().trim() === 'IPL Debut') {
                iplDebut = $(el).prev().text().trim();
            }
        });
    }

    return { dob, iplDebut };
  } catch (error: any) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  }
}

const LINKS_FILE = path.join(process.cwd(), 'src', 'data', 'player_links.json');

// Known name mappings: auction name -> IPL website search name
const NAME_ALIASES: Record<string, string> = {
  'matthew short': 'matthew william short',
  'lungi ngidi': 'lungisani ngidi',
  'm shahrukh khan': 'shahrukh khan',
  'gurnoor brar': 'gurnoor singh brar',
  'arshad khan': 'mohd. arshad khan',
  'suryakumar yadav': 'surya kumar yadav',
  'tilak varma': 'n. tilak varma',
  'am ghazanfar': 'allah ghazanfar',
  'raj bawa': 'raj angad bawa',
  'vijaykumar vyshak': 'vyshak vijaykumar',
  'harnoor singh': 'harnoor pannu',
  'praveen dubey': 'pravin dubey',
  'yudhvir singh': 'yudhvir singh charak',
  'rasikh salam': 'rasikh dar',
  'ravichandran smaran': 'smaran ravichandran',
  'digvesh rathi': 'digvesh singh',
  'manimaran siddharth': 'm siddharth',
  'auqib nabi': 'auqib dar',
  'tejasvi dahiya': 'tejasvi singh',
  'mohd izhar': 'mohammad izhar',
  'aman rao': 'aman rao perala',
};

// Direct URL mappings for players not found via search
const DIRECT_URLS: Record<string, string> = {
  'auqib nabi': 'https://www.iplt20.com/players/auqib-dar/22341',
  'tejasvi dahiya': 'https://www.iplt20.com/players/tejasvi-singh/22428',
  'mohd izhar': 'https://www.iplt20.com/players/mohammad-izhar/10841',
  'aman rao': 'https://www.iplt20.com/players/aman-rao-perala/22399',
};

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findBestMatch(targetName: string, candidates: { name: string, url: string }[]): string | null {
  const target = targetName.toLowerCase().replace(/[^a-z ]/g, '');
  const targetParts = target.split(' ').filter(p => p.length > 1);
  let bestMatch = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const source = candidate.name.toLowerCase().replace(/[^a-z ]/g, '');
    
    // 1. Check for direct inclusion (e.g. "Suryakumar" in "Surya Kumar")
    if (source.replace(/\s/g, '') === target.replace(/\s/g, '')) {
        return candidate.url;
    }

    // 2. Check if all significant name parts match
    const sourceParts = source.split(' ').filter(p => p.length > 1);
    const lastNameMatch = targetParts.length > 0 && sourceParts.length > 0 &&
      (targetParts[targetParts.length - 1] === sourceParts[sourceParts.length - 1] ||
       targetParts[targetParts.length - 1].includes(sourceParts[sourceParts.length - 1]) ||
       sourceParts[sourceParts.length - 1].includes(targetParts[targetParts.length - 1]));
    
    // Require last name match for multi-word names
    if (targetParts.length > 1 && sourceParts.length > 1 && !lastNameMatch) {
      continue;
    }

    // 3. Levenshtein distance
    const dist = levenshtein(target, source);
    
    // Normalize distance by length to get a ratio
    const maxLength = Math.max(target.length, source.length);
    const ratio = dist / maxLength;

    // Threshold: 25% difference allowed (tighter than before)
    if (ratio < 0.25 && dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate.url;
    }
  }

  return bestMatch;
}

async function main() {
  const teams: TeamData[] = JSON.parse(fs.readFileSync(IPL_DATA_FILE, 'utf-8'));
  let scrapedPlayers: ScrapedPlayer[] = [];
  
  if (fs.existsSync(SCRAPED_FILE)) {
    scrapedPlayers = JSON.parse(fs.readFileSync(SCRAPED_FILE, 'utf-8'));
  }

  const playerLinks: { name: string, url: string, teamCode: string }[] = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf-8'));

  // Build a map of existing scraped names for quick lookup
  const scrapedMap = new Set(scrapedPlayers.map(p => p.name.toLowerCase()));

  const missingPlayers: { name: string, teamCode: string }[] = [];

  teams.forEach(team => {
    team.roster.forEach(player => {
      if (!scrapedMap.has(player.name.toLowerCase())) {
        missingPlayers.push({ name: player.name, teamCode: team.code });
      }
    });
  });

  console.log(`Found ${missingPlayers.length} players missing from scraped data.`);

  for (const p of missingPlayers) {
    console.log(`Searching for ${p.name} (${p.teamCode})...`);
    
    // Check if there's a known alias for this name
    const normalizedName = p.name.toLowerCase().trim();
    const aliasName = NAME_ALIASES[normalizedName] || p.name;
    
    // Check for direct URL mapping first
    let profileUrl = DIRECT_URLS[normalizedName] || null;
    
    if (profileUrl) {
      console.log(`  Using direct URL: ${profileUrl}`);
    } else {
      // Filter candidates by team
      const teamCandidates = playerLinks.filter(l => l.teamCode === p.teamCode);
      
      // Try with original name first, then alias
      profileUrl = findBestMatch(p.name, teamCandidates);
      
      if (!profileUrl && aliasName !== p.name) {
        console.log(`  Trying alias: ${aliasName}`);
        profileUrl = findBestMatch(aliasName, teamCandidates);
      }
      
      // Fallback: try all teams if not found in specific team
      if (!profileUrl) {
        profileUrl = findBestMatch(aliasName, playerLinks);
      }
    }

    if (profileUrl) {
        // Ensure absolute URL
        if (!profileUrl.startsWith('http')) {
            profileUrl = `https://www.iplt20.com${profileUrl}`;
        }
        console.log(`  Found URL: ${profileUrl}`);
    } else {
        // Last resort: try IPL website search
        console.log(`  Trying IPL search for: ${aliasName}`);
        profileUrl = await searchPlayer(aliasName);
        
        if (!profileUrl && aliasName !== p.name) {
          profileUrl = await searchPlayer(p.name);
        }
        
        if (profileUrl) {
          console.log(`  Found via search: ${profileUrl}`);
        } else {
          console.log(`  ❌ Could not find profile for ${p.name} in ${p.teamCode}`);
        }
    }

    if (profileUrl) {
      const details = await scrapeDetails(profileUrl);
      if (details) {
        const newPlayer: ScrapedPlayer = {
          name: p.name,
          teamCode: p.teamCode,
          profileUrl,
          dob: details.dob,
          iplDebut: details.iplDebut,
          age: calculateAge(details.dob),
          totalYears: calculateTotalYears(details.iplDebut)
        };
        scrapedPlayers.push(newPlayer);
        console.log(`  Scraped: Age ${newPlayer.age}, Years ${newPlayer.totalYears}`);
      }
    }

    // Save periodically
    fs.writeFileSync(SCRAPED_FILE, JSON.stringify(scrapedPlayers, null, 2));
    await sleep(200);
  }
  
  console.log('Done.');
}

main();
