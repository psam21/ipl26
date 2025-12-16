import fs from 'fs';
import path from 'path';
import { Redis } from 'ioredis';

// Types based on our data
interface Player {
  name: string;
  type: string;
  isNew: boolean;
  basePrice: string;
  soldPrice: string;
}

interface TeamStats {
  code: string;
  name: string;
  purseSpent: string;
  purseLeft: string;
  playersBought: string;
  overseasBuys: string;
  roster: Player[];
}

interface TeamAnalysis {
  code: string;
  strongPoints: string[];
  weakPoints: string[];
  titleProbability: string;
  spof: string;
  bestXI: string;
}

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const AUCTION_FILE = path.join(PROJECT_ROOT, 'IPL 2026 Auction Complete Players List.txt');
const ANALYSIS_FILE = path.join(PROJECT_ROOT, 'IPL 2026 Team Analysis.txt');

async function parseAuctionFile(): Promise<TeamStats[]> {
  const content = fs.readFileSync(AUCTION_FILE, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  
  const teams: TeamStats[] = [];
  let currentTeam: Partial<TeamStats> | null = null;
  let parsingRoster = false;

  // Helper to identify team codes
  const teamCodes = ['CSK', 'DC', 'GT', 'KKR', 'LSG', 'MI', 'PBKS', 'RR', 'RCB', 'SRH'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (teamCodes.includes(line) && !parsingRoster) {
      // Start of a new team section
      if (currentTeam) {
        teams.push(currentTeam as TeamStats);
      }
      currentTeam = {
        code: line,
        roster: []
      };
      continue;
    }

    if (!currentTeam) continue;

    if (!currentTeam.name && !teamCodes.includes(line)) {
        // The line after the code is usually the full name
        // But we need to be careful. The file structure is:
        // CSK
        // Chennai Super Kings
        // Purse spent
        if (line === 'Chennai Super Kings' || line === 'Delhi Capitals' || line === 'Gujarat Titans' || 
            line === 'Kolkata Knight Riders' || line === 'Lucknow Super Giants' || line === 'Mumbai Indians' ||
            line === 'Punjab Kings' || line === 'Rajasthan Royals' || line === 'Royal Challengers Bengaluru' ||
            line === 'Sunrisers Hyderabad') {
            currentTeam.name = line;
            continue;
        }
    }

    if (line.startsWith('Purse spent')) {
      currentTeam.purseSpent = lines[i + 1];
      i++;
      continue;
    }
    if (line.startsWith('Purse left')) {
      currentTeam.purseLeft = lines[i + 1];
      i++;
      continue;
    }
    if (line.startsWith('Players bought')) {
      currentTeam.playersBought = lines[i + 1];
      i++;
      continue;
    }
    if (line.startsWith('Overseas buys')) {
      currentTeam.overseasBuys = lines[i + 1];
      i++;
      continue;
    }

    if (line === 'Players' && lines[i+1] === 'Type') {
      parsingRoster = true;
      i += 3; // Skip Players, Type, Base, Sold header lines
      continue;
    }

    // If we hit the next team code, stop parsing roster
    if (teamCodes.includes(line) && parsingRoster) {
        // Backtrack one step so the main loop catches the new team
        i--; 
        parsingRoster = false;
        continue;
    }

    if (parsingRoster) {
      // Parse player line
      // Format is tricky. It could be:
      // Name
      // Type Base Sold
      // OR
      // Name
      // NEW
      // Type Base Sold
      
      // Let's look at the structure again.
      // Ruturaj Gaikwad
      // BAT - 18.00
      // Kartik Sharma
      // NEW
      // BAT 0.30 14.20
      
      let playerName = line;
      let isNew = false;
      let detailsLine = lines[i+1];
      
      if (detailsLine === 'NEW') {
        isNew = true;
        i++; // Move to NEW
        detailsLine = lines[i+1]; // Move to details
      }
      
      // detailsLine should be like "BAT - 18.00" or "BAT 0.30 14.20"
      // We need to split by tab or space. The file seems to use tabs or multiple spaces.
      // Let's assume whitespace split.
      const parts = detailsLine.split(/\s+/);
      const type = parts[0];
      const base = parts[1];
      const sold = parts[2];

      if (currentTeam.roster) {
        currentTeam.roster.push({
            name: playerName,
            type,
            isNew,
            basePrice: base,
            soldPrice: sold
        });
      }
      i++; // Advance past details line
    }
  }
  
  // Push the last team
  if (currentTeam) {
    teams.push(currentTeam as TeamStats);
  }

  return teams;
}

async function parseAnalysisFile(): Promise<TeamAnalysis[]> {
  const content = fs.readFileSync(ANALYSIS_FILE, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  // Skip header lines of the markdown table
  // | Team | 3 Strong Points ...
  // | --- | ---
  
  const analysis: TeamAnalysis[] = [];
  
  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Strong Points')) continue;
    
    const cols = line.split('|').map(c => c.trim()).filter(c => c);
    if (cols.length < 6) continue;

    // cols[0] is Team (e.g. **CSK**)
    const code = cols[0].replace(/\*\*/g, '');
    
    // cols[1] is Strong Points (HTML breaks <br>)
    const strongPoints = cols[1].split('<br>').map(s => s.trim());
    
    // cols[2] is Weak Points
    const weakPoints = cols[2].split('<br>').map(s => s.trim());
    
    // cols[3] is Title / Top-4 Probability
    const titleProbability = cols[3];
    
    // cols[4] is SPOF
    const spof = cols[4];
    
    // cols[5] is Best XI
    const bestXI = cols[5];

    analysis.push({
      code,
      strongPoints,
      weakPoints,
      titleProbability,
      spof,
      bestXI
    });
  }
  
  return analysis;
}

async function main() {
  console.log('Parsing data...');
  const auctionData = await parseAuctionFile();
  const analysisData = await parseAnalysisFile();

  const combinedData = auctionData.map(team => {
    const analysis = analysisData.find(a => a.code === team.code);
    return {
      ...team,
      analysis: analysis || {}
    };
  });

  console.log(`Parsed ${combinedData.length} teams.`);
  
  // Save to a local JSON file for now, which acts as our "database" for the build
  // In a real scenario, we would push this to Redis here.
  const outputPath = path.join(__dirname, '../src/data/ipl_data.json');
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2));
  console.log(`Data written to ${outputPath}`);
}

main().catch(console.error);
