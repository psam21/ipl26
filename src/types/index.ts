export interface Player {
  name: string;
  type: 'BAT' | 'BOWL' | 'AR' | 'WK';
  isNew: boolean;
  basePrice: string;
  soldPrice: string;
}

export interface TeamAnalysis {
  code: string;
  strongPoints: string[];
  weakPoints: string[];
  titleProbability: string;
  spof: string;
  bestXI: string;
}

export interface TeamData {
  code: string;
  name: string;
  purseSpent: string;
  purseLeft: string;
  playersBought: string;
  overseasBuys: string;
  roster: Player[];
  analysis: TeamAnalysis;
}
