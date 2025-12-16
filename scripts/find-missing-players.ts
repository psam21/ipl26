
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
  let bestMatch = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const source = candidate.name.toLowerCase().replace(/[^a-z ]/g, '');
    
    // 1. Check for direct inclusion (e.g. "Suryakumar" in "Surya Kumar")
    if (source.replace(/\s/g, '') === target.replace(/\s/g, '')) {
        return candidate.url;
    }

    // 2. Levenshtein distance
    const dist = levenshtein(target, source);
    
    // Normalize distance by length to get a ratio
    const maxLength = Math.max(target.length, source.length);
    const ratio = dist / maxLength;

    // Threshold: 30% difference allowed
    if (ratio < 0.3 && dist < minDistance) {
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
    
    // Filter candidates by team
    const teamCandidates = playerLinks.filter(l => l.teamCode === p.teamCode);
    
    let profileUrl = findBestMatch(p.name, teamCandidates);

    if (profileUrl) {
        // Ensure absolute URL
        if (!profileUrl.startsWith('http')) {
            profileUrl = `https://www.iplt20.com${profileUrl}`;
        }
        console.log(`  Found URL: ${profileUrl}`);
    } else {
        // Fallback to global search if team match fails (maybe team code mismatch?)
        // But let's stick to team context first as requested.
        console.log(`  ❌ Could not find profile for ${p.name} in ${p.teamCode}`);
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
