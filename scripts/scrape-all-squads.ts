
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const LINKS_FILE = path.join(process.cwd(), 'src', 'data', 'player_links.json');

const TEAMS_MAP: Record<string, string> = {
  'chennai-super-kings': 'CSK',
  'delhi-capitals': 'DC',
  'gujarat-titans': 'GT',
  'kolkata-knight-riders': 'KKR',
  'lucknow-super-giants': 'LSG',
  'mumbai-indians': 'MI',
  'punjab-kings': 'PBKS',
  'rajasthan-royals': 'RR',
  'royal-challengers-bengaluru': 'RCB',
  'sunrisers-hyderabad': 'SRH'
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeSquad(teamSlug: string) {
  const url = `https://www.iplt20.com/teams/${teamSlug}/squad`;
  console.log(`Scraping ${url}...`);
  
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    
    const players: { name: string, url: string }[] = [];
    
    $('a[href*="/players/"]').each((i, el) => {
      const href = $(el).attr('href');
      let name = $(el).text().trim();
      
      // Clean name: "SURYA KUMAR YADAV Batter" -> "SURYA KUMAR YADAV"
      name = name.replace(/\s+(Batter|Bowler|All-Rounder|WK-Batter)$/i, '').trim();
      
      if (href && name) {
        players.push({ name, url: href });
      }
    });
    
    return players;
  } catch (e: any) {
    console.error(`Error scraping ${teamSlug}:`, e.message);
    return [];
  }
}

async function main() {
  // Store as array of objects to allow flexible searching
  let allPlayers: { name: string, url: string, teamCode: string }[] = [];
  
  for (const [slug, code] of Object.entries(TEAMS_MAP)) {
    const players = await scrapeSquad(slug);
    players.forEach(p => {
      allPlayers.push({
        name: p.name,
        url: p.url,
        teamCode: code
      });
    });
    await sleep(1000);
  }
  
  fs.writeFileSync(LINKS_FILE, JSON.stringify(allPlayers, null, 2));
  console.log(`Saved ${allPlayers.length} player links.`);
}

main();
