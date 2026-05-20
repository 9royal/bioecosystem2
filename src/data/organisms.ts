export interface Organism {
  id: string;
  name: string;
  ecosystem: string;
  image: string;
}

export const ORGANISMS: Organism[] = [
  // 沙漠
  { id: 'd1', name: '仙人掌', ecosystem: '沙漠', image: '/assets/仙人掌.jpg' },
  { id: 'd2', name: '駱駝', ecosystem: '沙漠', image: '/assets/駱駝.jpg' },
  { id: 'd3', name: '沙漠玫瑰', ecosystem: '沙漠', image: '/assets/沙漠玫瑰.jpg' },
  { id: 'd4', name: '沙漠跳鼠', ecosystem: '沙漠', image: '/assets/沙漠跳鼠.jpg' },
  { id: 'd5', name: '響尾蛇', ecosystem: '沙漠', image: '/assets/響尾蛇.jpg' },
  
  // 草原
  { id: 'g1', name: '斑馬', ecosystem: '草原', image: '/assets/斑馬.jpg' },
  { id: 'g2', name: '獅子', ecosystem: '草原', image: '/assets/獅子.jpg' },
  { id: 'g3', name: '疣豬', ecosystem: '草原', image: '/assets/疣豬.jpg' },
  { id: 'g4', name: '金合歡', ecosystem: '草原', image: '/assets/金合歡.jpg' },
  { id: 'g5', name: '長頸鹿', ecosystem: '草原', image: '/assets/長頸鹿.jpg' },
  
  // 森林
  { id: 'f1', name: '台灣水鹿', ecosystem: '森林', image: '/assets/台灣水鹿.jpg' },
  { id: 'f2', name: '五色鳥', ecosystem: '森林', image: '/assets/五色鳥.jpg' },
  { id: 'f3', name: '穿山甲', ecosystem: '森林', image: '/assets/穿山甲.jpg' },
  
  // 凍原
  { id: 't1', name: '北極熊', ecosystem: '凍原', image: '/assets/北極熊.jpg' },
  { id: 't2', name: '蘚苔', ecosystem: '凍原', image: '/assets/蘚苔.jpg' },
  
  // 河口
  { id: 'e1', name: '彈塗魚', ecosystem: '河口', image: '/assets/彈塗魚.jpg' },
  { id: 'e2', name: '水筆仔', ecosystem: '河口', image: '/assets/水筆仔.jpg' },
  { id: 'e3', name: '弧邊招潮蟹', ecosystem: '河口', image: '/assets/弧邊招潮蟹.jpg' },
  { id: 'e4', name: '沙蠶', ecosystem: '河口', image: '/assets/沙蠶.jpg' },
  
  // 淡水
  { id: 'fw1', name: '溪哥', ecosystem: '淡水', image: '/assets/溪哥.jpg' },
  { id: 'fw2', name: '草魚', ecosystem: '淡水', image: '/assets/草魚.jpg' },
  { id: 'fw3', name: '翠鳥', ecosystem: '淡水', image: '/assets/翠鳥.jpg' },
  { id: 'fw4', name: '萍蓬草', ecosystem: '淡水', image: '/assets/萍蓬草.jpg' },

  // 海洋
  { id: 'm1', name: '大翅鯨', ecosystem: '海洋', image: '/assets/大翅鯨.jpg' },
  { id: 'm2', name: '大王具足蟲', ecosystem: '海洋', image: '/assets/大王具足蟲.jpg' },
  { id: 'm3', name: '昆布', ecosystem: '海洋', image: '/assets/昆布.jpg' },
  { id: 'm4', name: '曲紋唇魚', ecosystem: '海洋', image: '/assets/曲紋唇魚.jpg' },
];

export const ECOSYSTEMS = ['沙漠', '草原', '森林', '凍原', '河口', '淡水', '海洋'];
