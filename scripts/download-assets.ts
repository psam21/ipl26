import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const BASE_URL = 'https://www.iplt20.com';
const TEAMS_URL = `${BASE_URL}/teams`;

const TEAM_MAPPING: Record<string, string> = {
  'Chennai Super Kings': 'CSK',
  'Delhi Capitals': 'DC',
  'Gujarat Titans': 'GT',
  'Kolkata Knight Riders': 'KKR',
  'Lucknow Super Giants': 'LSG',
  'Mumbai Indians': 'MI',
  'Punjab Kings': 'PBKS',
  'Rajasthan Royals': 'RR',
  'Royal Challengers Bengaluru': 'RCB',
  'Sunrisers Hyderabad': 'SRH'
};

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const LOGOS_DIR = path.join(PUBLIC_DIR, 'logos', 'teams');
const PLAYERS_DIR = path.join(PUBLIC_DIR, 'images', 'players');

async function downloadFile(url: string, outputPath: string) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    await pipeline(response.data, fs.createWriteStream(outputPath));
    // console.log(`Downloaded: ${outputPath}`);
  } catch (error) {
    console.error(`Failed to download ${url}:`, error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  // Ensure directories exist
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  fs.mkdirSync(PLAYERS_DIR, { recursive: true });

  console.log('Fetching teams...');
  const { data: teamsHtml } = await axios.get(TEAMS_URL);
  const $ = cheerio.load(teamsHtml);

  const teamLinks: { name: string; code: string; url: string }[] = [];

  // 1. Scrape Teams
  $('.vn-teamsInnerWrp > li').each((_, el) => {
    const teamName = $(el).find('.ap-team-contn > h3').text().trim();
    const logoUrl = $(el).find('.vn-team-logo > img').attr('src');
    const teamPageLink = $(el).find('a').attr('href');

    const teamCode = TEAM_MAPPING[teamName];

    if (teamCode && logoUrl && teamPageLink) {
      console.log(`Found Team: ${teamName} (${teamCode})`);
      
      // Download Logo
      const logoExt = path.extname(logoUrl) || '.png';
      const logoPath = path.join(LOGOS_DIR, `${teamCode}${logoExt}`);
      downloadFile(logoUrl, logoPath);

      teamLinks.push({ name: teamName, code: teamCode, url: teamPageLink });
    }
  });

  // 2. Scrape Players for each team
  for (const team of teamLinks) {
    console.log(`Fetching players for ${team.name}...`);
    try {
      const { data: teamHtml } = await axios.get(team.url);
      const $team = cheerio.load(teamHtml);
      
      const teamPlayersDir = path.join(PLAYERS_DIR, team.code);
      fs.mkdirSync(teamPlayersDir, { recursive: true });

      $team('li.ih-pcard1').each((_, el) => {
        const playerName = $team(el).find('.ih-p-name > h2').text().trim();
        // Try data-src first (lazy load), then src
        let playerImgUrl = $team(el).find('.ih-p-img > img').attr('data-src');
        if (!playerImgUrl) {
            playerImgUrl = $team(el).find('.ih-p-img > img').attr('src');
        }

        if (playerName && playerImgUrl) {
          // Clean player name for filename
          const safeName = playerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const ext = path.extname(playerImgUrl) || '.png';
          const playerPath = path.join(teamPlayersDir, `${safeName}${ext}`);
          
          // Don't await individually to speed up, but maybe batch?
          // For now, just fire and forget or await to be nice to the server
          downloadFile(playerImgUrl, playerPath);
        }
      });
    } catch (error) {
      console.error(`Error fetching players for ${team.name}:`, error);
    }
  }
  
  console.log('Asset download complete!');
}

main();
