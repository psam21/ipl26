import path from 'path';
import { BASE_URL, fetchPage, downloadFile, sanitizeFilename } from './utils';

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

export interface TeamInfo {
  name: string;
  code: string;
  url: string;
}

export interface PlayerBasicInfo {
  name: string;
  teamCode: string;
  imageUrl?: string;
  profileUrl?: string;
}

export async function scrapeTeams(): Promise<TeamInfo[]> {
  console.log('Fetching teams...');
  const $ = await fetchPage(TEAMS_URL);
  if (!$) return [];

  const teams: TeamInfo[] = [];

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

      teams.push({ name: teamName, code: teamCode, url: teamPageLink });
    }
  });

  return teams;
}

export async function scrapeTeamPlayers(team: TeamInfo): Promise<PlayerBasicInfo[]> {
  console.log(`Fetching players for ${team.name}...`);
  const $ = await fetchPage(team.url);
  if (!$) return [];

  const players: PlayerBasicInfo[] = [];

  $('li.ih-pcard1').each((_, el) => {
    const playerName = $(el).find('.ih-p-name > h2').text().trim();
    
    // Try data-src first (lazy load), then src
    let playerImgUrl = $(el).find('.ih-p-img > img').attr('data-src');
    if (!playerImgUrl) {
        playerImgUrl = $(el).find('.ih-p-img > img').attr('src');
    }

    // Get profile URL
    // The structure is usually <a href="https://www.iplt20.com/players/..." ...>
    const rawProfileLink = $(el).find('a.ih-p-img').attr('href') || $(el).find('a').attr('href');
    const profileLink = rawProfileLink ? rawProfileLink.trim() : undefined;

    if (playerName) {
      const player: PlayerBasicInfo = {
        name: playerName,
        teamCode: team.code,
        imageUrl: playerImgUrl,
        profileUrl: profileLink
      };

      if (playerImgUrl) {
        const safeName = sanitizeFilename(playerName);
        const ext = path.extname(playerImgUrl) || '.png';
        const playerPath = path.join(PLAYERS_DIR, team.code, `${safeName}${ext}`);
        downloadFile(playerImgUrl, playerPath);
      }

      players.push(player);
    }
  });

  return players;
}
