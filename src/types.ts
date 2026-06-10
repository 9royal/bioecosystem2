export type EcosystemId = 
  | 'home' 
  | 'overview' 
  | 'tundra' 
  | 'forest' 
  | 'grassland' 
  | 'desert' 
  | 'creatures'
  | 'freshwater' 
  | 'estuary' 
  | 'marine' 
  | 'water-creatures'
  | 'comparison' 
  | 'final'
  | 'ai-challenge'
  | 'creature-challenge'
  | 'ecosystem-challenge'
  | 'submit';

export interface EcosystemTab {
  id: EcosystemId;
  label: string;
  icon: string;
  color: string;
  locked: boolean;
}

export const ECOSYSTEM_TABS: EcosystemTab[] = [
  { id: 'home', label: '啟程', icon: 'Compass', color: 'bg-slate-500', locked: false },
  { id: 'overview', label: '總覽', icon: 'Map', color: 'bg-blue-500', locked: true },
  { id: 'tundra', label: '凍原', icon: 'Snowflake', color: 'bg-sky-200', locked: true },
  { id: 'forest', label: '森林', icon: 'Trees', color: 'bg-emerald-600', locked: true },
  { id: 'grassland', label: '草原', icon: 'Wheat', color: 'bg-lime-400', locked: true },
  { id: 'desert', label: '沙漠', icon: 'Sun', color: 'bg-orange-400', locked: true },
  { id: 'creatures', label: '陸域生物', icon: 'Bird', color: 'bg-rose-400', locked: true },
  { id: 'freshwater', label: '淡水', icon: 'Droplets', color: 'bg-cyan-500', locked: true },
  { id: 'estuary', label: '河口', icon: 'Anchor', color: 'bg-teal-500', locked: true },
  { id: 'marine', label: '海洋', icon: 'Waves', color: 'bg-blue-800', locked: true },
  { id: 'water-creatures', label: '水域生物', icon: 'Droplets', color: 'bg-cyan-600', locked: true },
  { id: 'comparison', label: '挑戰', icon: 'BarChart2', color: 'bg-purple-500', locked: true },
  { id: 'final', label: '總評量', icon: 'Trophy', color: 'bg-yellow-500', locked: true },
  { id: 'ai-challenge', label: 'AI挑戰', icon: 'Zap', color: 'bg-indigo-500', locked: false },
  { id: 'submit', label: '上傳積分', icon: 'CheckCircle2', color: 'bg-slate-800', locked: false },
  { id: 'creature-challenge', label: '生物挑戰', icon: 'Zap', color: 'bg-red-500', locked: true },
  { id: 'ecosystem-challenge', label: '生態挑戰', icon: 'Zap', color: 'bg-orange-500', locked: true },
];
