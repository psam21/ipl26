
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data_source', 'IPL 2026 Team Analysis.txt');
const fileContent = fs.readFileSync(filePath, 'utf-8');
const lines = fileContent.split('\n');

const updates: Record<string, { s: string, w: string }> = {
  "CSK": {
    s: "Stable top order (Gaikwad, Samson, Dhoni) <br> Spin control (Noor Ahmad, Rahul Chahar) <br> AR depth (Shivam Dube, Overton) <br> Chepauk Fortress Advantage <br> Batting Depth (Chahar at 8) <br> Experienced Leadership Core",
    w: "Aging core & recovery load (Dhoni, Overton) <br> Death bowling inconsistency (Khaleel Ahmed, Mukesh Choudhary) <br> Middle-order volatility (Brevis, Sarfaraz Khan) <br> Lack of Express Pace <br> Fielding Agility Concerns <br> Reliance on Specific Matchups"
  },
  "DC": {
    s: "Strike bowling (Starc, Kuldeep, Natarajan) <br> WK-batting spine (KL Rahul, Stubbs) <br> Indian ARs (Axar Patel, Nitish Rana) <br> Left-Hand Batting Variety <br> Powerplay Wicket Potential <br> Flexible Batting Order",
    w: "Pace injury exposure (Starc, Ngidi, Chameera) <br> Middle-order softness (Stubbs, Ashutosh Sharma) <br> Leadership transition risk (Axar Patel, KL Rahul) <br> Spin Depth Concerns <br> Finishing Power vs Pace <br> Reliance on Starc for Early Wickets"
  },
  "GT": {
    s: "Elite bowling spine (Rashid Khan, Rabada, Siraj) <br> Top-order class (Gill, Buttler, Sudharsan) <br> Finishers (Tewatia, Shahrukh) <br> Strong Indian Core <br> Chase Master Pedigree <br> Versatile Spin Attack",
    w: "Lower-order fragility (Anuj Rawat, Kushagra) <br> OS bowling dependency (Rashid, Rabada) <br> Aging backups & legs (Ishant Sharma, Jayant Yadav) <br> Powerplay Batting Intent <br> Middle Overs Acceleration <br> Backup Keeper Quality"
  },
  "KKR": {
    s: "Premium ARs (Green, Narine, Rachin) <br> Mystery bowling (Varun, Pathirana) <br> Batting depth (Rinku, Allen) <br> Six-Hitting Power <br> Eden Gardens Suitability <br> Aggressive Brand of Cricket",
    w: "Top-order inconsistency (Rahane, Manish Pandey) <br> Cost concentration risk (Green, Pathirana) <br> Death-over reliability (Harshit Rana, Vaibhav Arora) <br> Pace Attack Experience <br> High-Risk Batting Approach <br> Reliance on Mystery Spin"
  },
  "LSG": {
    s: "Explosive batting (Pant, Pooran) <br> Raw pace ceiling (Mayank Yadav, Shami) <br> Match-winner density (Pant, Pooran, Marsh) <br> Left-Arm Pace Variety <br> Impact Player Flexibility <br> Strong Keeping Options",
    w: "Injury-heavy core (Shami, Nortje, Marsh) <br> Spin thinness (Hasaranga, Siddharth) <br> Role overlap risk (Pooran, Inglis, Badoni) <br> Top-Heavy Batting <br> Finger Spin Quality <br> Home Pitch Adaptability"
  },
  "MI": {
    s: "Elite Indian core (Bumrah, Rohit, SKY) <br> New-ball dominance (Bumrah, Boult, Chahar) <br> Big-match temperament (Hardik, SKY) <br> Wankhede Suited Batting <br> Leadership Experience <br> Pace Battery Depth",
    w: "Aging workload risk (Rohit, Boult, Chahar) <br> Lower-order hitting depth (Santner, Bosch) <br> Limited attacking spin (Markande, Ghazanfar) <br> Spin on Turning Tracks <br> Hardik Fitness Management <br> Lack of Lefties in Top 4"
  },
  "PBKS": {
    s: "Indian bowling spine (Arshdeep, Chahal) <br> AR volume (Stoinis, Jansen, Shashank) <br> Batting anchor (Shreyas Iyer) <br> Death Overs Hitting <br> New Ball Swing <br> Athletic Fielding",
    w: "Overseas batting ceiling (Omarzai, Owen) <br> Finishing reliability (Prabhsimran, Wadhera) <br> Death bowling depth (Vyshak, Yash Thakur) <br> Top Order Stability <br> Spin Variety <br> Mid-Season Slump History"
  },
  "RR": {
    s: "AR cluster (Jadeja, Curran, Parag) <br> Indian batting (Jaiswal, Jurel) <br> Strike bowling (Archer, Bishnoi) <br> Top 3 Stability <br> Fielding Standards <br> Fortress SMS",
    w: "Fitness dependency (Archer) <br> Overseas batting swings (Hetmyer, Ferreira) <br> Middle-order congestion (Parag, Curran, Jurel) <br> Death Bowling Economy <br> Lower Order Power <br> Spin Depth"
  },
  "RCB": {
    s: "Top-order strength (Kohli, Salt, Patidar) <br> New-ball skill (Hazlewood, Bhuvi) <br> AR flexibility (Krunal, Venkatesh) <br> Chinnaswamy Suited <br> Chasing Ability <br> Pace Bounce Exploitation",
    w: "Death-over trust (Yash Dayal, Rasikh Salam) <br> Middle-order collapses (Tim David, Jitesh Sharma) <br> Run dependency (Virat Kohli) <br> Spin Penetration <br> Overseas Finisher Reliance <br> Defending Low Totals"
  },
  "SRH": {
    s: "Destructive batting (Head, Klaasen, Livingstone) <br> Captain aggression (Cummins) <br> Power ARs (Abhishek, Nitish Reddy) <br> Six Hitting Records <br> Batting Depth <br> Aggressive Intent",
    w: "Bowling depth beyond XI (Unadkat, Mavi) <br> High-risk batting variance (Head, Klaasen) <br> Thin Indian bench (Salil Arora, Aniket Verma) <br> Spin Economy <br> Collapse Prone <br> Defending on Small Grounds"
  }
};

const newLines = lines.map(line => {
  if (!line.trim().startsWith('| **')) return line;
  
  const parts = line.split('|');
  if (parts.length < 4) return line;

  const teamName = parts[1].trim().replace(/\*\*/g, '');
  const update = updates[teamName];

  if (update) {
    parts[2] = ` ${update.s} `;
    parts[3] = ` ${update.w} `;
  }

  return parts.join('|');
});

fs.writeFileSync(filePath, newLines.join('\n'));
console.log('Updated analysis file.');
