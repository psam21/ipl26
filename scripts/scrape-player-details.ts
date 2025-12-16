
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const PLAYERS_FILE = path.join(process.cwd(), 'src', 'data', 'scraped_players.json');

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

async function scrapeDetails(url: string) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);

    // Extract DOB
    // Structure: <div ...>07 July 1981</div> <div ...>Date of Birth</div>
    // We look for the text "Date of Birth" and find the preceding element or text
    let dob = '';
    let iplDebut = '';

    // Iterate over all elements to find the labels
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      if (text === 'Date of Birth') {
        // The value is usually in the previous sibling or parent's previous sibling
        // Based on the text dump: "07 July 1981\n\nDate of Birth"
        // It might be in a grid.
        // Let's try to find the value relative to the label.
        const value = $(el).prev().text().trim();
        if (value) dob = value;
      }
      if (text === 'IPL Debut') {
        const value = $(el).prev().text().trim();
        if (value) iplDebut = value;
      }
    });

    // Fallback: Try to find by class if known, but generic text search is safer if classes change.
    // Let's try a more specific selector if the above fails.
    // The IPL site usually uses a specific structure for these stats.
    // .ap-p-player-overview__col -> .ap-p-player-overview__info (Label) / .ap-p-player-overview__num (Value)
    
    if (!dob) {
        const dobLabel = $('.ap-p-player-overview__info:contains("Date of Birth")');
        dob = dobLabel.prev('.ap-p-player-overview__num').text().trim();
    }
    if (!iplDebut) {
        const debutLabel = $('.ap-p-player-overview__info:contains("IPL Debut")');
        iplDebut = debutLabel.prev('.ap-p-player-overview__num').text().trim();
    }

    return { dob, iplDebut };
  } catch (error: any) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  }
}

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
  // Assuming current season is 2026
  return 2026 - debutYear + 1;
}

async function main() {
  if (!fs.existsSync(PLAYERS_FILE)) {
    console.error('Players file not found');
    return;
  }

  const players: ScrapedPlayer[] = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf-8'));
  let updatedCount = 0;

  console.log(`Found ${players.length} players. Starting scrape...`);

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    
    // Skip if already has data or no URL
    if ((player.age && player.totalYears) || !player.profileUrl) {
      continue;
    }

    console.log(`[${i + 1}/${players.length}] Scraping ${player.name}...`);
    
    const details = await scrapeDetails(player.profileUrl.trim());
    
    if (details) {
      if (details.dob) {
        player.dob = details.dob;
        player.age = calculateAge(details.dob);
      }
      if (details.iplDebut) {
        player.iplDebut = details.iplDebut;
        player.totalYears = calculateTotalYears(details.iplDebut);
      }
      updatedCount++;
    }

    // Save every 10 players
    if (updatedCount % 10 === 0) {
      fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
    }

    // Sleep to be nice
    await sleep(100);
  }

  // Final save
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
  console.log(`Done. Updated ${updatedCount} players.`);
}

main();
