import fs from 'fs';
import path from 'path';
import { scrapeTeams, scrapeTeamPlayers, PlayerBasicInfo } from './scraping/teams';
import { scrapePlayerDetails } from './scraping/players';

const DATA_DIR = path.join(process.cwd(), 'src/data');
const PLAYERS_LIST_FILE = path.join(DATA_DIR, 'scraped_players.json');

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all'; // 'all', 'teams', 'player-details'

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (mode === 'all' || mode === 'teams') {
    const teams = await scrapeTeams();
    let allPlayers: PlayerBasicInfo[] = [];

    for (const team of teams) {
      const players = await scrapeTeamPlayers(team);
      allPlayers = [...allPlayers, ...players];
    }

    // Save the list of players with their profile URLs
    fs.writeFileSync(PLAYERS_LIST_FILE, JSON.stringify(allPlayers, null, 2));
    console.log(`Saved ${allPlayers.length} players to ${PLAYERS_LIST_FILE}`);
  }

  if (mode === 'player-details') {
    // Example of how we would use the saved list to scrape details
    if (fs.existsSync(PLAYERS_LIST_FILE)) {
      const players: PlayerBasicInfo[] = JSON.parse(fs.readFileSync(PLAYERS_LIST_FILE, 'utf-8'));
      
      // Just do one as a test for now
      const testPlayer = players.find(p => p.profileUrl);
      if (testPlayer && testPlayer.profileUrl) {
        await scrapePlayerDetails(testPlayer.profileUrl);
      }
    } else {
      console.log('No players list found. Run with "teams" mode first.');
    }
  }
}

main();
