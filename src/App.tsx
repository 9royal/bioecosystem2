import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Map, Snowflake, Trees, Wheat, Sun, Droplets, Waves, BarChart2, Trophy, 
  Lock, CheckCircle2, ChevronRight, AlertCircle, Info, Wind, Thermometer, MapPin,
  Bird, Zap, Anchor, Ship, HelpCircle, Loader2, ArrowRight, ArrowLeft, X, ArrowDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import confetti from 'canvas-confetti';
import { gradeAnswer } from './lib/gemini';
import { cn } from './lib/utils';
import { ECOSYSTEM_TABS, EcosystemId, EcosystemTab } from './types';
import CreatureChallengeGame from './components/CreatureChallengeGame';
import EcosystemChallengeGame from './components/EcosystemChallengeGame';

// Components for different sections will be defined here or imported
// For simplicity and coherence in this single-file request, I'll structure them within main components

export default function App() {
  const [activeTab, setActiveTab] = useState<EcosystemId>('home');
  const [unlockedTabs, setUnlockedTabs] = useState<EcosystemId[]>(['home', 'creature-challenge']);
  const [showUnlockAnim, setShowUnlockAnim] = useState<EcosystemId | null>(null);

  // Scoring System
  const [explorerScore, setExplorerScore] = useState(0);
  const [scoredIds, setScoredIds] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  const handleScore = (questionId: string, isCorrect: boolean | number, componentAttempts?: number) => {
    // For AI challenge, we allow updates if score is higher
    if (scoredIds.has(questionId) && questionId !== 'ai_challenge') return;
    
    if (typeof isCorrect === 'number') {
      if (questionId === 'ai_challenge') {
        const currentBest = bestScores[questionId] || 0;
        if (isCorrect > currentBest) {
          setExplorerScore(prev => prev - currentBest + isCorrect);
          setBestScores(prev => ({ ...prev, [questionId]: isCorrect }));
        }
        setScoredIds(prev => new Set(prev).add(questionId));
        return;
      }
      
      setExplorerScore(prev => prev + isCorrect);
      setScoredIds(prev => new Set(prev).add(questionId));
      return;
    }

    if (isCorrect) {
      const finalAttempts = componentAttempts !== undefined ? (componentAttempts - 1) : (attempts[questionId] || 0);
      let points = 0;
      if (finalAttempts === 0) points = 100;
      else if (finalAttempts === 1) points = 50;
      
      setExplorerScore(prev => prev + points);
      setScoredIds(prev => new Set(prev).add(questionId));
    } else if (componentAttempts === undefined) {
      // Record failed attempt only if not managed by component
      setAttempts(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + 1
      }));
    }
  };

  const unlockNext = (currentId: EcosystemId) => {
    const currentIndex = ECOSYSTEM_TABS.findIndex(t => t.id === currentId);
    if (currentIndex < ECOSYSTEM_TABS.length - 1) {
      const nextId = ECOSYSTEM_TABS[currentIndex + 1].id;
      
      // Special logic: if 'final' is completed, unlock the rest 4 tabs (ai-challenge, submit, creature-challenge, ecosystem-challenge)
      if (currentId === 'final') {
        const lastFourIds: EcosystemId[] = ['ai-challenge', 'submit', 'creature-challenge', 'ecosystem-challenge'];
        const newUnlocks = lastFourIds.filter(id => !unlockedTabs.includes(id));
        
        if (newUnlocks.length > 0) {
          setUnlockedTabs(prev => [...prev, ...newUnlocks]);
          triggerUnlockEffects('ai-challenge');
        }
        return;
      }

      if (!unlockedTabs.includes(nextId)) {
        setUnlockedTabs(prev => [...prev, nextId]);
        triggerUnlockEffects(nextId);
      }
    }
  };

  const triggerUnlockEffects = (id: EcosystemId) => {
    setShowUnlockAnim(id);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });
    setTimeout(() => setShowUnlockAnim(null), 3000);
  };

  const progressPercentage = (unlockedTabs.length / ECOSYSTEM_TABS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 z-[60]">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 overflow-x-auto print:hidden">
        <nav className="max-w-7xl mx-auto px-4 py-2 flex items-center space-x-1 sm:space-x-2">
          {ECOSYSTEM_TABS.map((tab) => {
            const isUnlocked = unlockedTabs.includes(tab.id);
            const isActive = activeTab === tab.id;
            const Icon = getIcon(tab.icon);

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => isUnlocked && setActiveTab(tab.id)}
                disabled={!isUnlocked}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-lg transition-all relative group shrink-0",
                  isActive ? "bg-slate-100 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50",
                  !isUnlocked && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-full mb-1 transition-colors",
                  isActive ? tab.color + " text-white" : "bg-slate-100"
                )}>
                  {isUnlocked ? <Icon size={18} /> : <Lock size={18} />}
                </div>
                <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">
                  {tab.label}
                </span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                  />
                )}
                
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 rounded-lg transition-opacity">
                    <Lock size={12} className="text-slate-400" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {renderSection(activeTab, unlockNext, handleScore, explorerScore)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Unlock Notification Overlay */}
      <AnimatePresence>
        {showUnlockAnim && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <CheckCircle2 className="animate-bounce" />
            </div>
            <div>
              <p className="font-bold">探索進度提升！</p>
              <p className="text-sm opacity-90">已解鎖新章節：{ECOSYSTEM_TABS.find(t => t.id === showUnlockAnim)?.label}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating Info */}
      <div className="fixed bottom-4 right-4 z-50 print:hidden">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-2xl border border-slate-200 flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-2">
          <div className="flex items-center space-x-3 pr-4 sm:pr-0 sm:pb-2 border-r sm:border-r-0 sm:border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest hidden xs:block">探險家進度</p>
              <p className="text-xs font-bold whitespace-nowrap">{Math.round(progressPercentage)}% 完成</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest hidden xs:block">探險積分</p>
              <p className="text-sm font-black text-slate-900">{explorerScore}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getIcon(name: string) {
  const icons: Record<string, any> = { Compass, Map, Snowflake, Trees, Wheat, Sun, Droplets, Waves, BarChart2, Trophy, Bird };
  return icons[name] || Compass;
}

// --- Section Renderers ---

function BackgroundWrapper({ children, bgImage }: { children: React.ReactNode, bgImage?: string }) {
  return (
    <div className="relative min-h-[600px] transition-all duration-500">
      {bgImage && (
        <div 
          className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none grayscale-[0.3] blur-[1px] rounded-[3rem]"
          style={{
            backgroundImage: `url('${bgImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function renderSection(id: EcosystemId, onComplete: (id: EcosystemId) => void, scoreHandler?: (qid: string, isOk: boolean | number, attempts?: number) => void, totalScore: number = 0) {
  switch (id) {
    case 'home': return <BackgroundWrapper><HomeSection onComplete={() => onComplete('home')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'overview': return <BackgroundWrapper><OverviewSection onComplete={() => onComplete('overview')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'tundra': return <BackgroundWrapper bgImage="./assets/凍原.png"><TundraSection onComplete={() => onComplete('tundra')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'forest': return <BackgroundWrapper bgImage="./assets/森林.png"><ForestSection onComplete={() => onComplete('forest')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'grassland': return <BackgroundWrapper bgImage="./assets/草原.png"><GrasslandSection onComplete={() => onComplete('grassland')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'desert': return <BackgroundWrapper bgImage="./assets/沙漠.png"><DesertSection onComplete={() => onComplete('desert')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'creatures': return <BackgroundWrapper bgImage="./assets/森林.png"><CreaturesSection onComplete={() => onComplete('creatures')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'freshwater': return <BackgroundWrapper bgImage="./assets/淡水.png"><FreshwaterSection onComplete={() => onComplete('freshwater')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'estuary': return <BackgroundWrapper bgImage="./assets/河口.png"><EstuarySection onComplete={() => onComplete('estuary')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'marine': return <BackgroundWrapper bgImage="./assets/海洋.png"><MarineSection onComplete={() => onComplete('marine')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'water-creatures': return <BackgroundWrapper bgImage="./assets/海洋.png"><WaterCreaturesSection onComplete={() => onComplete('water-creatures')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'comparison': return <BackgroundWrapper><ComparisonSection onComplete={() => onComplete('comparison')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'final': return <BackgroundWrapper><FinalSection onComplete={() => onComplete('final')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'ai-challenge': return <BackgroundWrapper><AISummaryChallenge onComplete={() => onComplete('ai-challenge')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'creature-challenge': return <BackgroundWrapper><CreatureChallengeGame onComplete={() => onComplete('creature-challenge')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'ecosystem-challenge': return <BackgroundWrapper><EcosystemChallengeGame onComplete={() => onComplete('ecosystem-challenge')} onScore={scoreHandler} /></BackgroundWrapper>;
    case 'submit': return <BackgroundWrapper><ScoreSubmissionSection score={totalScore} onComplete={() => onComplete('submit')} /></BackgroundWrapper>;
    default: return null;
  }
}

function ScoreSubmissionSection({ score, onComplete }: { score: number, onComplete?: () => void }) {
  const [className, setClassName] = useState<number>(1);
  const [seatNumber, setSeatNumber] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Use the provided GAS deployment URL as the default
      const scriptURL = localStorage.getItem('GAS_DEPLOY_URL') || 'https://script.google.com/macros/s/AKfycbwPl8EhjWCkggj4vxNZcktgtDjwK9meeAVxDkxbnpC-S6Xl9aNAZrPWUiiH6ikqgwWSPg/exec';
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // standard for GAS
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'score',
          className,
          seatNumber,
          score
        })
      });
      
      // Since no-cors doesn't return response body, we assume success if no exception
      setSubmitted(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      onComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center bg-white p-12 rounded-[3rem] shadow-2xl border border-emerald-100"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">成績上傳成功！</h2>
        <p className="text-slate-500 mb-8 text-lg">
          {className} 班 {seatNumber} 號，你的總分 {score} 已經記錄在雲端。
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          重新開始探索
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="結算與上傳成績" icon={<Trophy />} color="text-slate-800" />
      
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
        <div className="text-center mb-10">
          <p className="text-slate-400 uppercase font-black tracking-widest text-xs mb-2">探險結束</p>
          <h3 className="text-3xl font-black text-slate-800 mb-2">你的冒險能量值</h3>
          <div className="text-6xl font-black text-blue-600 drop-shadow-sm">{score}</div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-600 ml-2">班級 (1-20)</label>
              <select 
                value={className}
                onChange={(e) => setClassName(Number(e.target.value))}
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none font-bold"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} 班</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-600 ml-2">座號 (1-30)</label>
              <select 
                value={seatNumber}
                onChange={(e) => setSeatNumber(Number(e.target.value))}
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none font-bold"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} 號</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3",
              isSubmitting ? "bg-slate-200 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-95"
            )}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <ChevronRight />}
            {isSubmitting ? "上傳中..." : "確認上傳，領取結業證書"}
          </button>

          {error && (
            <p className="text-red-500 text-center text-sm font-bold flex items-center justify-center gap-2">
              <AlertCircle size={16} /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 1. Home Section
function HomeSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [quizDone, setQuizDone] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleQuiz = (qIdx: number, ans: string) => {
    const correctAns: Record<number, string> = { 1: '沙漠', 2: '北極', 3: '水筆仔' };
    onScore?.(`home_quiz_${qIdx}`, ans === correctAns[qIdx]);
    setAnswers(prev => ({ ...prev, [qIdx]: ans }));
  };

  const isQuizCorrect = answers[1] === '沙漠' && answers[2] === '北極' && answers[3] === '水筆仔';

  return (
    <div className="space-y-12">
      <div className="text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative inline-block"
        >
          <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full" />
          <h1 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight relative">
            多姿多樣的<span className="text-blue-600 italic">生態系</span>
          </h1>
        </motion.div>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          地球上有茂密的森林、廣大無邊的海洋，也有終年積雪的凍原。
          這場旅程將帶你探索：環境因子如何形塑地球上的生物棲所？
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Compass className="text-blue-500" /> 第一站：啟程挑戰
          </h2>
          <p className="text-slate-600 mb-6">
            在開始冒險前，先測測你的「生態直覺」。完成這 3 題小暖身，即可展開探索地圖！
          </p>
          <div className="space-y-6">
            <QuizItem 
              question="1. 你覺得這三者中，哪裡最乾燥？"
              options={['森林', '草原', '沙漠']}
              selected={answers[1]}
              onSelect={(ans) => handleQuiz(1, ans)}
            />
            <QuizItem 
              question="2. 下列哪個地方的氣溫最低？"
              options={['赤道', '北極', '熱帶雨林']}
              selected={answers[2]}
              onSelect={(ans) => handleQuiz(2, ans)}
            />
             <QuizItem 
              question="3. 哪種植物通常生長在河流與海洋的交界？"
              options={['仙人掌', '水筆仔', '地衣']}
              selected={answers[3]}
              onSelect={(ans) => handleQuiz(3, ans)}
            />
          </div>
        </div>
        <div className="hidden md:flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <img 
              src="./assets/地球上的生態系.jpeg" 
              alt="地球上的生態系" 
              className="w-full max-w-lg object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </div>

      {isQuizCorrect && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button 
            onClick={onComplete}
            className="group flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1"
          >
            開始探索地圖 <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

// 2. Overview Section
function OverviewSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [categorized, setCategorized] = useState<Record<string, 'land' | 'water' | null>>({});
  
  const ecosystems = [
    { id: 'tundra', name: '凍原', type: 'land' },
    { id: 'forest', name: '森林', type: 'land' },
    { id: 'grassland', name: '草原', type: 'land' },
    { id: 'desert', name: '沙漠', type: 'land' },
    { id: 'freshwater', name: '淡水', type: 'water' },
    { id: 'estuary', name: '河口', type: 'water' },
    { id: 'marine', name: '海洋', type: 'water' },
  ];

  const handleCategorize = (id: string, category: 'land' | 'water') => {
    setCategorized(prev => ({ ...prev, [id]: category }));
  };

  const isCorrect = ecosystems.every(e => categorized[e.id] === e.type);

  return (
    <div className="space-y-8">
      <SectionHeader title="生態系總覽" icon={<Map />} color="text-blue-500" />
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
           <h3 className="text-xl font-black text-emerald-800 mb-4 flex items-center gap-2">
             <Trees /> 陸域生態系
           </h3>
           <p className="text-emerald-700 leading-relaxed">
             分布於地表陸地。影響陸域生態系類型最關鍵的環境因子為：
             <span className="block mt-2 font-black text-2xl text-emerald-900">「年降雨量」與「溫度」</span>
           </p>
        </div>
        <div className="bg-cyan-50 p-6 rounded-3xl border border-cyan-100">
           <h3 className="text-xl font-black text-cyan-800 mb-4 flex items-center gap-2">
             <Waves /> 水域生態系
           </h3>
           <p className="text-cyan-700 leading-relaxed">
             包含所有的淡水、半鹹水與海水環境。影響水域生態系的關鍵環境因子為：
             <span className="block mt-2 font-black text-2xl text-cyan-900">「水的鹽度」</span>
           </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">任務：生態系大分類</h3>
          <p className="text-slate-400">請觀察照片，將下列生態系歸類到正確的環境類型中</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
          {ecosystems.map(eco => (
            <div key={eco.id} className="flex flex-col items-center gap-3">
              <div className={cn(
                "w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all relative group",
                categorized[eco.id] ? "border-slate-700 opacity-50" : "border-white/20 hover:border-blue-400"
              )}>
                <img 
                  src={`./assets/${encodeURIComponent(eco.name)}.png`} 
                  alt={eco.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/400x400/1e293b/white?text=" + eco.name;
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                   <span className="font-bold text-sm">{eco.name}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleCategorize(eco.id, 'land')}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold transition-all",
                    categorized[eco.id] === 'land' ? "bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  陸域
                </button>
                <button 
                  onClick={() => handleCategorize(eco.id, 'water')}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold transition-all",
                    categorized[eco.id] === 'water' ? "bg-cyan-500 text-white" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  水域
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           <div className="bg-white/5 p-6 rounded-2xl border border-white/10 min-h-[100px]">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">陸域分類組</p>
              <div className="flex flex-wrap gap-2">
                {ecosystems.filter(e => categorized[e.id] === 'land').map(e => (
                  <span key={e.id} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/30">
                    {e.name}
                  </span>
                ))}
              </div>
           </div>
           <div className="bg-white/5 p-6 rounded-2xl border border-white/10 min-h-[100px]">
              <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">水域分類組</p>
              <div className="flex flex-wrap gap-2">
                {ecosystems.filter(e => categorized[e.id] === 'water').map(e => (
                  <span key={e.id} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-bold border border-cyan-500/30">
                    {e.name}
                  </span>
                ))}
              </div>
           </div>
        </div>
      </div>

      {isCorrect && (
        <CompleteButton onClick={onComplete} />
      )}
    </div>
  );
}

// --- Components ---

function FillInTheBlank({ 
  options, 
  correct, 
  onCorrect,
  qid,
  onScore
}: { 
  options: string[], 
  correct: string, 
  onCorrect: () => void,
  qid?: string,
  onScore?: (qid: string, ok: boolean | number) => void
}) {
  const [selected, setSelected] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  const handleChange = (val: string) => {
    setSelected(val);
    if (val === correct) {
      if (qid) onScore?.(qid, true);
      onCorrect();
      setIsWrong(false);
    } else {
      if (qid) onScore?.(qid, false);
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 1000);
    }
  };

  return (
    <span className="inline-flex items-center mx-1">
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "px-2 py-0.5 rounded border-b-2 font-bold transition-all appearance-none cursor-pointer text-center min-w-[80px]",
          selected === correct 
            ? "bg-emerald-100 border-emerald-500 text-emerald-700" 
            : isWrong 
              ? "bg-red-100 border-red-500 text-red-700 animate-shake"
              : "bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100"
        )}
      >
        <option value="" disabled>點擊選擇</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </span>
  );
}

// 3. Tundra Section
function TundraSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [organismConfig, setOrganismConfig] = useState({
    fur: '薄',
    ears: '大',
    fat: '普',
  });
  
  const [survivalStatus, setSurvivalStatus] = useState<null | { score: number, feedback: string }>(null);
  const [antarcticaAnswer, setAntarcticaAnswer] = useState<string | null>(null);

  const testSurvival = () => {
    let score = 0;
    let feedback = [];
    
    if (organismConfig.fur === '厚') {
      score += 33;
    } else {
      feedback.push('身體熱量流失太快，需要更厚的毛皮！');
    }

    if (organismConfig.ears === '小') {
      score += 33;
    } else {
      feedback.push('大耳朵會像散熱片一樣排掉熱量，在極地很危險。');
    }

    if (organismConfig.fat === '厚') {
      score += 34;
    } else {
      feedback.push('缺乏皮下脂肪，無法在長時間暴風雪中維持體溫。');
    }

    const finalScore = score === 100;
    onScore?.('tundra_survival', finalScore);
    
    setSurvivalStatus({ 
      score, 
      feedback: feedback.length === 0 ? '完美適應！你創造了最強的極地王者。' : feedback[0] 
    });
  };

  const checkAntarctica = (ans: string) => {
    setAntarcticaAnswer(ans);
    onScore?.('tundra_antarctica', ans === '被厚冰蓋覆蓋且缺乏土層');
  };

  const isCorrectBlanks = Object.keys(blanks).length === 4;
  const isSurvivalPassed = survivalStatus?.score === 100;
  const isAntarcticaCorrect = antarcticaAnswer === '被厚冰蓋覆蓋且缺乏土層';

  return (
    <div className="space-y-8">
      <SectionHeader title="凍原生態系" icon={<Snowflake />} color="text-sky-400" />
      
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-sky-700">
          <Info size={20} /> 課文學習：生命的極限
        </h3>
        <p className="mb-4">
          凍原生態系位於
          <FillInTheBlank 
            options={['赤道', '高緯度', '低緯度']} 
            correct="高緯度" 
            qid="tundra_blank_1"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 1: true }))}
          />
          或高海拔地區，年均溫極低，降雨量也相當稀少。
        </p>
        <p className="mb-4">
          這裡的土層下方有長年結凍的
          <FillInTheBlank 
            options={['腐植層', '永凍層', '沙土層']} 
            correct="永凍層" 
            qid="tundra_blank_2"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 2: true }))}
          />
          ，使得大型樹木的根系無法深入生長。
        </p>
        <p className="mb-4">
          優勢植物以
          <FillInTheBlank 
            options={['高大喬木', '地衣與苔蘚', '仙人掌']} 
            correct="地衣與苔蘚" 
            qid="tundra_blank_3"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 3: true }))}
          />
          與矮小灌木為主。
        </p>
        <p>
          代表性動物包括
          <FillInTheBlank 
            options={['非洲獅', '無尾熊', '北極熊']} 
            correct="北極熊" 
            qid="tundra_blank_4"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 4: true }))}
          />
          、馴鹿與多種遷徙性的鳥類。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-sky-50 p-8 rounded-[2.5rem] border border-sky-100 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-sky-500 shadow-sm shrink-0">
              <HelpCircle size={32} />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-sky-900 leading-tight">為什麼南極不被放在凍原生態系？</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                凍原生態系的定義包含「永凍層」與「生長季」。南極洲絕大部分地面都被厚達數公里的「冰蓋」覆蓋，下方並非土層，且幾乎沒有植物生長的機會。
              </p>
              <div className="bg-white p-6 rounded-2xl border border-sky-100">
                 <p className="text-sm font-bold text-sky-800 mb-4">南極洲不被歸類為凍原的主因？</p>
                 <div className="grid gap-2">
                    {['氣溫極低', '每年降雪量太多', '被厚冰蓋覆蓋且缺乏土層', '南極沒有地層'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => checkAntarctica(opt)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-between group",
                          antarcticaAnswer === opt 
                            ? (opt === '被厚冰蓋覆蓋且缺乏土層' ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-red-50 border-red-500 text-red-800")
                            : "bg-white border-slate-100 hover:border-sky-300"
                        )}
                      >
                        <span>{opt}</span>
                        {antarcticaAnswer === opt && (
                          opt === '被厚冰蓋覆蓋且缺乏土層' ? <CheckCircle2 className="text-emerald-500" size={16} /> : <AlertCircle className="text-red-500" size={16} />
                        )}
                      </button>
                    ))}
                 </div>
                 {isAntarcticaCorrect && (
                   <p className="mt-3 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                     <CheckCircle2 size={12} /> 正確！南極絕大部分是冰層覆蓋。
                   </p>
                 )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-sky-800">
            <Thermometer size={20} className="text-sky-500" /> 環境重點回顧
          </h3>
          <div className="space-y-6 grow">
            <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sky-500 shadow-sm">
                   <Sun size={16} />
                </div>
                <p className="font-bold text-sky-900">低溫與短生長季</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">年均溫極低，植物僅能在短暫夏季冰融時快速開花結實。</p>
            </div>

            <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sky-500 shadow-sm">
                  <Wind size={16} />
                </div>
                <p className="font-bold text-sky-900">強風與永凍層</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">強風限制植物高度，永凍層則阻礙了喬木深根的可能性。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-sky-900 text-white p-10 rounded-[3rem] overflow-hidden relative group shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Snowflake size={200} /></div>
         
         <div className="flex flex-col md:flex-row gap-12 relative z-10">
            {/* Left: Preview Area */}
            <div className="flex-1 space-y-6">
               <div>
                  <h3 className="text-3xl font-black mb-2 text-sky-100 bg-clip-text">互動實驗：打造極地生物</h3>
                  <p className="text-sky-300 font-medium">調整生物特徵，使其能在 -40°C 與強風中生存</p>
               </div>
               
               <div className="aspect-square w-full rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/20 shadow-inner relative group/image">
                  <img 
                    src={`./assets/北極熊${organismConfig.fur}${organismConfig.ears}${organismConfig.fat}.png`} 
                    alt="北極熊特徵預覽"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/50 to-transparent pointer-events-none" />
                  
                  {survivalStatus && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-tighter opacity-70 italic">生存評估報告</span>
                        <span className={cn("text-xl font-black", isSurvivalPassed ? "text-emerald-400" : "text-amber-400")}>
                           {survivalStatus.score}% 存活率
                        </span>
                      </div>
                      <p className="text-sm font-bold leading-tight">{survivalStatus.feedback}</p>
                    </motion.div>
                  )}
               </div>
            </div>

            {/* Right: Controls Area */}
            <div className="flex-1 flex flex-col justify-center space-y-8">
               <div className="grid gap-6">
                  <div className="space-y-3">
                     <label className="text-[11px] uppercase font-black text-sky-400 tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-sky-400 rounded-full" /> 皮毛厚度
                     </label>
                     <div className="flex gap-3">
                        {['薄', '厚'].map(v => (
                           <button 
                             key={v}
                             onClick={() => setOrganismConfig(p => ({ ...p, fur: v }))}
                             className={cn(
                               "flex-1 py-4 rounded-2xl text-sm font-black transition-all border-2",
                               organismConfig.fur === v ? "bg-sky-400 border-sky-300 text-sky-950 shadow-lg shadow-sky-400/20" : "bg-white/5 border-white/10 hover:bg-white/10"
                             )}
                           >
                             {v === '薄' ? '普通毛皮' : '極厚絨毛'}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] uppercase font-black text-sky-400 tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-sky-400 rounded-full" /> 耳朵型態
                     </label>
                     <div className="flex gap-3">
                        {['大', '小'].map(v => (
                           <button 
                             key={v}
                             onClick={() => setOrganismConfig(p => ({ ...p, ears: v }))}
                             className={cn(
                               "flex-1 py-4 rounded-2xl text-sm font-black transition-all border-2",
                               organismConfig.ears === v ? "bg-sky-400 border-sky-300 text-sky-950 shadow-lg shadow-sky-400/20" : "bg-white/5 border-white/10 hover:bg-white/10"
                             )}
                           >
                             {v === '大' ? '散熱大耳' : '保暖小耳'}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] uppercase font-black text-sky-400 tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-sky-400 rounded-full" /> 皮下脂肪
                     </label>
                     <div className="flex gap-3">
                        {['普', '厚'].map(v => (
                           <button 
                             key={v}
                             onClick={() => setOrganismConfig(p => ({ ...p, fat: v }))}
                             className={cn(
                               "flex-1 py-4 rounded-2xl text-sm font-black transition-all border-2",
                               organismConfig.fat === v ? "bg-sky-400 border-sky-300 text-sky-950 shadow-lg shadow-sky-400/20" : "bg-white/5 border-white/10 hover:bg-white/10"
                             )}
                           >
                             {v === '普' ? '標準體脂' : '極厚脂肪層'}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               <button 
                 onClick={testSurvival}
                 className="w-full py-6 bg-gradient-to-r from-sky-300 to-sky-500 text-sky-950 rounded-3xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-sky-500/20"
               >
                 啟動生存模擬分析
               </button>
            </div>
         </div>
      </div>
      {isCorrectBlanks && isSurvivalPassed && isAntarcticaCorrect && <CompleteButton onClick={onComplete} />}
    </div>
  );
}

function ForestSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [rainfall, setRainfall] = useState(0);
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [traits, setTraits] = useState<Record<string, string>>({});
  const [selectedSource, setSelectedSource] = useState<{type: 'text' | 'img', id: string} | null>(null);
  const [selectedForestOrganisms, setSelectedForestOrganisms] = useState<string[]>([]);

  const pool = {
    texts: [
      { id: 'conifer', content: '年雨量較少、低溫，主要由裸子植物組成的針葉林。' },
      { id: 'mixed', content: '氣候溫和、四季分明，分布落葉闊葉林與針葉林的混合林。' },
      { id: 'evergreen', content: '溫暖濕潤，主要為常綠闊葉林，極為濕熱處形成熱帶雨林。' }
    ],
    imgs: [
      { id: 'needle', src: './assets/針葉林照.png' },
      { id: 'deciduous', src: './assets/落葉林照.png' },
      { id: 'broad', src: './assets/闊葉林照.png' }
    ]
  };

  const shuffledTexts = useMemo(() => [...pool.texts].sort(() => Math.random() - 0.5), []);
  const shuffledImgs = useMemo(() => [...pool.imgs].sort(() => Math.random() - 0.5), []);

  const handlePlace = (type: 'text' | 'img', rowId: string) => {
    if (!selectedSource) return;
    if (selectedSource.type !== type) return;
    
    // Scoring
    const correctMap: Record<string, string> = {
      'text_high': 'conifer', 'img_high': 'needle',
      'text_mid': 'mixed', 'img_mid': 'deciduous',
      'text_low': 'evergreen', 'img_low': 'broad'
    };
    const isCorrect = selectedSource.id === correctMap[`${type}_${rowId}`];
    onScore?.(`forest_taiwan_${type}_${rowId}`, isCorrect);

    setTraits(p => ({ ...p, [`${type}_${rowId}`]: selectedSource.id }));
    setSelectedSource(null);
  };

  const removeItem = (key: string) => {
    setTraits(p => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  };

  const forestTypes = [
    { 
      type: '針葉林', 
      env: '低溫、雨量較少', 
      producer: '裸子植物', 
      consumer: '熊、鹿等大哺乳類',
      taiwan: '寒冷高海拔',
      image: './assets/針葉林.png'
    },
    { 
      type: '落葉闊葉林', 
      env: '四季分明氣候溫和', 
      producer: '落葉木', 
      consumer: '動植物種類繁多',
      taiwan: '中海拔混合林',
      image: './assets/落葉林.png'
    },
    { 
      type: '常綠闊葉林', 
      env: '溫暖降雨豐富', 
      producer: '常綠木/熱帶雨林', 
      consumer: '物種最豐富多樣',
      taiwan: '溫暖低海拔',
      image: './assets/森林.png'
    }
  ];

  const handleTrait = (type: string, attr: string, val: string) => {
    const forest = forestTypes.find(f => f.type === type);
    if (forest) {
      const isCorrect = (attr === 'producer' ? forest.producer : forest.env) === val;
      onScore?.(`forest_trait_${type}_${attr}`, isCorrect);
    }
    setTraits(prev => ({ ...prev, [`${type}-${attr}`]: val }));
  };

  const isForest = rainfall >= 750;
  const isCorrectBlanks = Object.keys(blanks).length === 4;
  
  // Check correctness for basic traits
  const isCorrectTraits = forestTypes.every(f => 
    traits[`${f.type}-producer`] === f.producer && 
    traits[`${f.type}-env`] === f.env
  );

  const isTaiwanCorrect = traits.text_high === 'conifer' && traits.img_high === 'needle' && 
                         traits.text_mid === 'mixed' && traits.img_mid === 'deciduous' && 
                         traits.text_low === 'evergreen' && traits.img_low === 'broad';

  const forestOrganismPool = [
    { id: 'bird', name: '五色鳥', img: './assets/五色鳥.jpg', isForest: true },
    { id: 'deer', name: '台灣水鹿', img: './assets/台灣水鹿.jpg', isForest: true },
    { id: 'pangolin', name: '穿山甲', img: './assets/穿山甲.jpg', isForest: true },
    { id: 'cactus', name: '仙人掌', img: './assets/仙人掌.jpg', isForest: false },
    { id: 'polarbear', name: '北極熊', img: './assets/北極熊.jpg', isForest: false },
    { id: 'lion', name: '獅子', img: './assets/獅子.jpg', isForest: false },
    { id: 'zebra', name: '斑馬', img: './assets/斑馬.jpg', isForest: false },
    { id: 'mudskipper', name: '彈塗魚', img: './assets/彈塗魚.jpg', isForest: false },
  ];

  const shuffledOrganisms = useMemo(() => [...forestOrganismPool].sort(() => Math.random() - 0.5), []);

  const toggleOrganism = (id: string) => {
    const org = forestOrganismPool.find(o => o.id === id);
    if (org) {
      onScore?.(`forest_org_${id}`, org.isForest);
    }
    setSelectedForestOrganisms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isOrganismTaskCorrect = useMemo(() => {
    const forestIds = forestOrganismPool.filter(o => o.isForest).map(o => o.id);
    const nonForestIds = forestOrganismPool.filter(o => !o.isForest).map(o => o.id);
    return forestIds.every(id => selectedForestOrganisms.includes(id)) && 
           !nonForestIds.some(id => selectedForestOrganisms.includes(id));
  }, [selectedForestOrganisms]);

  return (
    <div className="space-y-8">
      <SectionHeader title="森林生態系" icon={<Trees />} color="text-emerald-500" />
      
      {/* Introduction & Learning Objectives */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-700">
          <Info size={20} /> 探秘森林：雨量與海拔的交織
        </h3>
        <p className="mb-4">
          森林生態系的年雨量下限通常在
          <FillInTheBlank 
            options={['250mm', '750mm', '100mm']} 
            correct="750mm" 
            qid="forest_blank_1"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 1: true }))}
          />
          以上。
        </p>
        <p className="mb-4">
          低溫、雨量較少的區域形成
          <FillInTheBlank 
            options={['落葉闊葉林', '針葉林', '常綠闊葉林']} 
            correct="針葉林" 
            qid="forest_blank_2"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 2: true }))}
          />
          ，主要由裸子植物組成。
        </p>
        <p className="mb-4">
          四季分明、氣候溫和，且秋冬會落葉的區域稱為
          <FillInTheBlank 
            options={['常綠闊葉林', '落葉闊葉林', '熱帶雨林']} 
            correct="落葉闊葉林" 
            qid="forest_blank_3"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 3: true }))}
          />
          。
        </p>
        <p>
          溫暖而降雨豐富的區域形成常綠闊葉林，其中的
          <FillInTheBlank 
            options={['針葉林', '熱帶雨林', '草原']} 
            correct="熱帶雨林" 
            qid="forest_blank_4"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 4: true }))}
          />
          是生物種類最豐富多樣的生態系。
        </p>
      </div>

      {/* Interactive Rainfall Lab */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4">環境模擬：年雨量下限測試</h3>
        <div className="space-y-2">
           <label className="text-sm text-slate-500 font-bold">調節雨量 (mm): {rainfall}</label>
           <input 
              type="range" min="0" max="2500" value={rainfall} 
              onChange={(e) => setRainfall(parseInt(e.target.value))}
              className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
           />
        </div>
        <motion.div 
          animate={{ backgroundColor: isForest ? '#ecfdf5' : '#fefce8' }}
          className="mt-6 p-6 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center min-h-[120px]"
        >
          {isForest ? (
            <div className="text-center">
              <Trees className="mx-auto text-emerald-500 mb-2" size={40} />
              <p className="font-bold text-emerald-800">雨量充足！符合森林生態系條件</p>
            </div>
          ) : (
             <div className="text-center">
              <AlertCircle className="mx-auto text-yellow-500 mb-2" size={40} />
              <p className="font-bold text-yellow-800">雨量不足 ({rainfall}mm)</p>
              <p className="text-xs text-yellow-600">這環境的水分難以支持大型森林生長。</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Forest Types Grid */}
      <div className="bg-emerald-900 text-white p-8 rounded-3xl">
        <h3 className="text-xl font-bold mb-6">任務：分類森林特徵</h3>
        <div className="grid md:grid-cols-3 gap-6">
           {forestTypes.map(f => (
             <div key={f.type} className="bg-white/10 p-5 rounded-2xl border border-white/20 space-y-4">
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-emerald-800/50 mb-2">
                   <img src={f.image} alt={f.type} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <p className="font-black text-emerald-400 text-center border-b border-white/20 pb-2">{f.type}</p>
                
                <div className="space-y-1">
                  <label className="text-xs text-emerald-300 font-bold uppercase">環境</label>
                  <select 
                    onChange={(e) => handleTrait(f.type, 'env', e.target.value)}
                    className="w-full bg-slate-800 text-lg border border-white/20 rounded p-2"
                  >
                    <option value="">選擇環境...</option>
                    {forestTypes.map(opt => <option key={opt.env} value={opt.env}>{opt.env}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-300 font-bold uppercase">主要生產者</label>
                  <select 
                    onChange={(e) => handleTrait(f.type, 'producer', e.target.value)}
                    className="w-full bg-slate-800 text-lg border border-white/20 rounded p-2"
                  >
                    <option value="">選擇生產者...</option>
                    {forestTypes.map(opt => <option key={opt.producer} value={opt.producer}>{opt.producer}</option>)}
                  </select>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-emerald-300 font-bold uppercase">主要消費者</p>
                  <p className="text-lg text-white/70">{f.consumer}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Taiwan Forest Section (Assessment Mode) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-emerald-800">
           <MapPin className="text-emerald-500" /> 臺灣森林海拔垂直分佈評量
        </h3>
        
        <p className="text-slate-600 mb-8 font-medium">
           根據海拔高度由高到低，將正確的<strong>文字描述</strong>與<strong>森林照片</strong>從上方選項池放入對應的格位中。
        </p>

        {/* Answer Pool */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-10 shadow-inner">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Text Pool */}
            <div className="space-y-4">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Wheat size={14} className="text-emerald-500" /> 描述選項池
               </p>
               <div className="flex flex-col gap-2">
                  {shuffledTexts.map(t => {
                    const isUsed = Object.values(traits).includes(t.id);
                    return (
                      <button
                        key={t.id}
                        disabled={isUsed}
                        onClick={() => setSelectedSource({ type: 'text', id: t.id })}
                        className={cn(
                          "p-3 rounded-xl border text-sm text-left transition-all relative overflow-hidden group",
                          isUsed ? "opacity-30 border-slate-200 bg-slate-100 cursor-not-allowed" : 
                          selectedSource?.id === t.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 scale-102" : 
                          "border-white bg-white shadow-sm hover:border-emerald-300 hover:shadow-md"
                        )}
                      >
                        {t.content}
                        {isUsed && <CheckCircle2 className="absolute top-2 right-2 text-emerald-500" size={16} />}
                      </button>
                    );
                  })}
               </div>
            </div>
            {/* Image Pool */}
            <div className="space-y-4">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Waves size={14} className="text-blue-500" /> 照片選項池
               </p>
               <div className="flex gap-4 items-center justify-center">
                  {shuffledImgs.map(img => {
                    const isUsed = Object.values(traits).includes(img.id);
                    return (
                      <button
                        key={img.id}
                        disabled={isUsed}
                        onClick={() => setSelectedSource({ type: 'img', id: img.id })}
                        className={cn(
                          "w-24 h-24 rounded-2xl border-4 overflow-hidden transition-all relative group",
                          isUsed ? "opacity-20 border-slate-200 cursor-not-allowed" : 
                          selectedSource?.id === img.id ? "border-emerald-500 ring-4 ring-emerald-500/10 scale-110" : 
                          "border-white shadow-sm hover:border-emerald-400 hover:scale-105"
                        )}
                      >
                        <img src={img.src} alt={img.id} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {isUsed && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="text-white drop-shadow-md" size={32} />
                          </div>
                        )}
                      </button>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>

        {/* Matching Grid */}
        <div className="max-w-4xl mx-auto space-y-6">
           <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="col-span-1 text-center">海拔</div>
              <div className="col-span-7">植被特徵描述</div>
              <div className="col-span-4">代表性林相照片</div>
           </div>

           {[
             { rowId: 'high', label: '高', color: 'bg-blue-500', rowLabel: '高海拔' },
             { rowId: 'mid', label: '中', color: 'bg-emerald-500', rowLabel: '中海拔' },
             { rowId: 'low', label: '低', color: 'bg-orange-500', rowLabel: '低海拔' }
           ].map((row) => (
             <div key={row.rowId} className="grid grid-cols-12 gap-4 items-center group">
                <div className="col-span-1 flex flex-col items-center">
                   <div className={cn("w-10 h-10 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg", row.color)}>
                     {row.label}
                   </div>
                   <div className="mt-1 h-12 w-0.5 bg-slate-100 hidden group-last:hidden" />
                </div>

                <div className="col-span-7">
                   <div 
                     onClick={() => handlePlace('text', row.rowId)}
                     className={cn(
                       "min-h-24 border-2 border-dashed rounded-3xl flex items-center justify-center p-6 transition-all relative cursor-pointer",
                       traits[`text_${row.rowId}`] 
                         ? "border-emerald-200 bg-emerald-50/20 shadow-sm" 
                         : "border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50"
                     )}
                   >
                      {traits[`text_${row.rowId}`] ? (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                           <p className="text-lg font-bold text-slate-800 leading-relaxed italic">
                             「{pool.texts.find(t => t.id === traits[`text_${row.rowId}`])?.content}」
                           </p>
                           <button 
                             onClick={(e) => { e.stopPropagation(); removeItem(`text_${row.rowId}`); }}
                             className="mt-3 text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1 mx-auto"
                           >
                             重置空格
                           </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                           <Wheat size={20} className="text-slate-400" />
                           <span className="text-xs font-bold text-slate-500">點擊放入描述</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="col-span-4">
                   <div 
                     onClick={() => handlePlace('img', row.rowId)}
                     className={cn(
                       "h-24 border-2 border-dashed rounded-3xl overflow-hidden transition-all relative cursor-pointer",
                       traits[`img_${row.rowId}`] 
                         ? "border-emerald-200 ring-2 ring-emerald-500/5 shadow-md" 
                         : "border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50"
                     )}
                   >
                     {traits[`img_${row.rowId}`] ? (
                       <div className="relative w-full h-full group/img animate-in fade-in zoom-in duration-300">
                         <img 
                           src={pool.imgs.find(i => i.id === traits[`img_${row.rowId}`])?.src} 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer" 
                         />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeItem(`img_${row.rowId}`); }}
                              className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-black shadow-lg"
                            >
                              點擊重置
                            </button>
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Waves size={20} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500">放入照片</span>
                       </div>
                     )}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Validation Button */}
        <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
           {isTaiwanCorrect ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-3 shadow-lg"
              >
                <CheckCircle2 /> 分佈認證成功！
              </motion.div>
            ) : (
              <div className="text-slate-400 text-sm font-bold animate-pulse">
                完成上方所有正確配定以通過測驗...
              </div>
            )}
        </div>
      </div>

      {/* Forest Organism Selection Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-emerald-800">
           <Bird className="text-emerald-500" /> 生物多樣性：尋找森林居民
        </h3>
        <p className="text-slate-600 mb-8">
           森林提供了豐富的棲地。請從下方的生物庫中點選，選出那些適合居住在<strong>森林生態系</strong>中的居民。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
           {shuffledOrganisms.map((org) => (
             <button
               key={org.id}
               onClick={() => toggleOrganism(org.id)}
               className={cn(
                 "group relative bg-slate-50 rounded-2xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center gap-2",
                 selectedForestOrganisms.includes(org.id)
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-100 hover:border-emerald-300 hover:bg-white"
               )}
             >
                <div className="aspect-square w-full rounded-xl overflow-hidden shadow-inner">
                   <img 
                     src={org.img} 
                     alt={org.name} 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                     referrerPolicy="no-referrer" 
                   />
                </div>
                <span className={cn(
                  "text-sm font-bold transition-colors",
                  selectedForestOrganisms.includes(org.id) ? "text-emerald-700" : "text-slate-600"
                )}>
                  {org.name}
                </span>

                {selectedForestOrganisms.includes(org.id) && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}
             </button>
           ))}
        </div>

        <div className="mt-8 flex justify-center">
           {isOrganismTaskCorrect ? (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100"
             >
               <CheckCircle2 size={20} /> 森林生物辨識完成！
             </motion.div>
           ) : selectedForestOrganisms.length > 0 && (
              <div className="text-slate-400 text-sm font-medium italic">
                {selectedForestOrganisms.length > 4 ? "似乎選到了一些不屬於這裡的居民喔..." : "點選所有森林居民以完成任務..."}
              </div>
           )}
        </div>
      </div>


      {/* YouTube Video Section for Forest */}
      <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 mt-12 overflow-hidden shadow-sm">
        <h3 className="text-2xl font-black text-emerald-800 mb-4 flex items-center gap-2">
          <Info size={24} className="text-emerald-500" /> 森林生態系：探索延伸
        </h3>
        <div className="mb-6">
          <p className="text-emerald-900 font-bold text-lg mb-1">101環境教室：雨林《國家地理》雜誌</p>
          <p className="text-emerald-700 font-medium">若你完成所有內容，可以回來觀看此段影片。</p>
        </div>
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/OTRVNeOeA4s" 
            title="101環境教室：雨林《國家地理》雜誌" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {isForest && isCorrectBlanks && isCorrectTraits && isTaiwanCorrect && isOrganismTaskCorrect && <CompleteButton onClick={onComplete} />}
    </div>
  );
}

// 5. Grassland Section
function GrasslandSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [population, setPopulation] = useState({
    grass: 1000,
    zebra: 0,
    lion: 0,
  });
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const [selectedGrasslandOrganisms, setSelectedGrasslandOrganisms] = useState<string[]>([]);

  const handleConnect = (item: string) => {
    if (connected.includes(item)) return;
    const nextConnected = [...connected, item];
    setConnected(nextConnected);
    
    if (nextConnected.length === 3) {
      const isCorrect = nextConnected[0] === '草' && nextConnected[1] === '斑馬' && nextConnected[2] === '獅子';
      onScore?.('grassland_food_chain', isCorrect);
    }
  };

  const isChainCorrect = connected.length === 3 && connected[0] === '草' && connected[1] === '斑馬' && connected[2] === '獅子';

  const runSimulation = () => {
    // 1/10 Law validation with 20% tolerance
    const targetZebraLow = population.grass * 0.1 * 0.8;
    const targetZebraHigh = population.grass * 0.1 * 1.2;
    
    if (population.zebra === 0) {
      setSimulationResult('請調節班馬的能量等級。');
      return;
    }

    if (population.zebra < targetZebraLow) {
      setSimulationResult('斑馬群體獲得的能量太少，無法維持族群生存。');
      return;
    }
    
    if (population.zebra > targetZebraHigh) {
      setSimulationResult('斑馬數量過多，會將草本植物吃光導致崩潰！');
      return;
    }

    // Now check lion relative to zebra
    const targetLionLow = population.zebra * 0.1 * 0.8;
    const targetLionHigh = population.zebra * 0.1 * 1.2;

    if (population.lion === 0) {
      setSimulationResult('請調節獅子的能量等級。');
      return;
    }

    if (population.lion < targetLionLow) {
      setSimulationResult('獅子獲得的能量不足以支撐其龐大的代謝需求。');
    } else if (population.lion > targetLionHigh) {
      setSimulationResult('獅子太多了！斑馬將被捕食殆盡。');
    } else {
      setSimulationResult('能量傳遞平衡！符合 1/10 定律的能量金字塔。');
      onScore?.('grassland_energy_simulation', true);
    }
  };

  const isCorrectBlanks = Object.keys(blanks).length === 4;
  const isBalanced = simulationResult === '能量傳遞平衡！符合 1/10 定律的能量金字塔。';

  const grasslandOrganismPool = [
    { id: 'lion', name: '獅子', img: './assets/獅子.jpg', isGrassland: true },
    { id: 'zebra', name: '斑馬', img: './assets/斑馬.jpg', isGrassland: true },
    { id: 'giraffe', name: '長頸鹿', img: './assets/長頸鹿.jpg', isGrassland: true },
    { id: 'warthog', name: '疣豬', img: './assets/疣豬.jpg', isGrassland: true },
    { id: 'hyena', name: '鬣狗', img: './assets/鬣狗.jpg', isGrassland: true },
    { id: 'grass_eleusine', name: '牛筋草', img: './assets/牛筋草.jpg', isGrassland: true },
    { id: 'acacia', name: '金合歡', img: './assets/金合歡.jpg', isGrassland: true },
    { id: 'camel', name: '駱駝', img: './assets/駱駝.jpg', isGrassland: false },
    { id: 'polarbear', name: '北極熊', img: './assets/北極熊.jpg', isGrassland: false },
    { id: 'whale', name: '大翅鯨', img: './assets/大翅鯨.jpg', isGrassland: false },
    { id: 'bird', name: '五色鳥', img: './assets/五色鳥.jpg', isGrassland: false },
  ];

  const shuffledGrasslandOrganisms = useMemo(() => [...grasslandOrganismPool].sort(() => Math.random() - 0.5), []);

  const toggleGrasslandOrganism = (id: string) => {
    const org = grasslandOrganismPool.find(o => o.id === id);
    if (org) {
      onScore?.(`grassland_org_${id}`, org.isGrassland);
    }
    setSelectedGrasslandOrganisms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isGrasslandOrganismTaskCorrect = useMemo(() => {
    const grasslandIds = grasslandOrganismPool.filter(o => o.isGrassland).map(o => o.id);
    const nonGrasslandIds = grasslandOrganismPool.filter(o => !o.isGrassland).map(o => o.id);
    return grasslandIds.every(id => selectedGrasslandOrganisms.includes(id)) && 
           !nonGrasslandIds.some(id => selectedGrasslandOrganisms.includes(id));
  }, [selectedGrasslandOrganisms]);

  return (
    <div className="space-y-8">
      <SectionHeader title="草原生態系" icon={<Wheat />} color="text-lime-500" />
      
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-lime-700">
          <Info size={20} /> 奔跑的樂園
        </h3>
        <p className="mb-4">
          草原生態系的年雨量介於
          <FillInTheBlank 
            options={['凍原與森林', '森林與沙漠', '海洋與河流']} 
            correct="森林與沙漠" 
            qid="grassland_blank_1"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 1: true }))}
          />
          之間，水分不足以支持森林生長。
        </p>
        <p className="mb-4">
          這裡的植物以
          <FillInTheBlank 
            options={['高大喬木', '草本植物', '地衣苔蘚']} 
            correct="草本植物" 
            qid="grassland_blank_2"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 2: true }))}
          />
          為主，景觀開闊。
        </p>
        <p className="mb-4">
          由於缺乏隱蔽處，動物多具備
          <FillInTheBlank 
            options={['擅長攀爬', '善於奔跑', '體積巨大']} 
            correct="善於奔跑" 
            qid="grassland_blank_3"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 3: true }))}
          />
          或穴居的特性。
        </p>
        <p>
          代表性生物包含
          <FillInTheBlank 
            options={['松鼠、樹懶', '斑馬、獅子', '北極狐、馴鹿']} 
            correct="斑馬、獅子" 
            qid="grassland_blank_4"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 4: true }))}
          />
          、土撥鼠、蝗蟲等。
        </p>
      </div>

      {/* Task: Food Chain Moved UP */}
      <div className="bg-lime-50 p-8 rounded-3xl border border-lime-100 text-center">
        <h3 className="font-black text-2xl text-lime-800 mb-8">任務：能量傳遞與食物鏈</h3>
        <p className="text-sm text-lime-700 mb-6 font-bold uppercase tracking-tight">依序選擇生物，建立草原生態系的掠食關係</p>
        
        <div className="flex justify-center gap-8 mb-12">
          {['獅子', '草', '斑馬'].map(item => (
            <button
              key={item}
              onClick={() => handleConnect(item)}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all border-2",
                connected.includes(item) 
                  ? "bg-lime-500 text-white border-lime-600 scale-110" 
                  : "bg-white text-lime-600 border-lime-200 hover:border-lime-500"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
           {connected.map((item, i) => (
             <React.Fragment key={item}>
                <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-lime-200 font-bold text-lime-900">
                  {item}
                </div>
                {i < connected.length - 1 && <ChevronRight className="text-lime-400" />}
             </React.Fragment>
           ))}
        </div>
        
        {connected.length > 0 && !isChainCorrect && connected.length >= 3 && (
          <div className="mt-6 text-red-500 text-sm italic">
             順序好像不對喔！別忘了食物鏈是從「生產者」能量固定開始的。
             <button onClick={() => setConnected([])} className="ml-2 underline">重試</button>
          </div>
        )}
      </div>

      {/* Lab: Energy Pyramid Updated Logic */}
      <div className="bg-lime-50 p-8 rounded-3xl border border-lime-100">
        <h3 className="font-black text-2xl text-lime-800 mb-6 text-center">實驗室：調節能量傳遞 (1/10 定律)</h3>
        <p className="text-sm text-lime-700 mb-8 text-center bg-white/50 py-2 rounded-full">根據「能量金字塔」，生產者的能量只有約 10% 能傳遞給下一層。請調節各族群能量值。</p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-10">
           {/* Producer - FIXED */}
           <div className="bg-slate-100 p-6 rounded-2xl shadow-sm border border-slate-200 opacity-80">
              <div className="flex justify-between items-end mb-2">
                 <span className="font-black text-slate-600">生產者能量 (固定)</span>
                 <span className="text-2xl font-black">{population.grass} kcal</span>
              </div>
              <div className="w-full h-2 bg-emerald-500 rounded-full" />
              <p className="text-[10px] mt-2 text-slate-500">光合作用所固定的總能量</p>
           </div>

           {/* Primary Consumer */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-lime-200">
              <div className="flex justify-between items-end mb-2">
                 <span className="font-black text-lime-600">初級消費者 (斑馬)</span>
                 <span className="text-2xl font-black text-lime-700">{population.zebra} kcal</span>
              </div>
              <input 
                type="range" min="0" max="300" step="10" value={population.zebra} 
                onChange={(e) => setPopulation(p => ({ ...p, zebra: parseInt(e.target.value) }))}
                className="w-full h-2 bg-lime-100 rounded-lg appearance-none cursor-pointer accent-lime-500"
              />
              <p className="text-[10px] mt-2 text-slate-500">攝食草本植物獲得的能量</p>
           </div>

           {/* Secondary Consumer */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-lime-200">
              <div className="flex justify-between items-end mb-2">
                 <span className="font-black text-lime-600">次級消費者 (獅子)</span>
                 <span className="text-2xl font-black text-lime-700">{population.lion} kcal</span>
              </div>
              <input 
                type="range" min="0" max="50" step="1" value={population.lion} 
                onChange={(e) => setPopulation(p => ({ ...p, lion: parseInt(e.target.value) }))}
                className="w-full h-2 bg-lime-100 rounded-lg appearance-none cursor-pointer accent-lime-500"
              />
              <p className="text-[10px] mt-2 text-slate-500">捕食斑馬獲得的能量</p>
           </div>
        </div>

        <div className="flex flex-col items-center gap-6">
           <div className="relative w-full max-w-xs aspect-square border-b-4 border-lime-800 flex flex-col justify-end">
              {/* Visual Pyramid Representation */}
              <motion.div 
                animate={{ height: `${(population.lion / 1000) * 100}%` }}
                className="bg-orange-500 w-1/4 mx-auto mb-1 rounded-t shadow-sm flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
              >
                {population.lion > 0 && '獅子'}
              </motion.div>
              <motion.div 
                animate={{ height: `${(population.zebra / 1000) * 100}%` }}
                className="bg-lime-500 w-2/3 mx-auto mb-1 rounded-t shadow-sm flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
              >
                {population.zebra > 0 && '斑馬'}
              </motion.div>
              <div className="bg-emerald-600 w-full h-[30%] rounded-t shadow-sm flex items-center justify-center text-xs font-bold text-white">
                生產者 (草)
              </div>
           </div>

           <button 
             onClick={runSimulation}
             className="px-12 py-4 bg-lime-600 text-white rounded-2xl font-black text-xl hover:bg-lime-700 hover:scale-105 active:scale-95 transition-all shadow-xl"
           >
             檢測能量平衡
           </button>

           {simulationResult && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className={cn(
                 "p-6 rounded-2xl border-2 text-center max-w-md font-bold",
                 isBalanced 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800" 
                  : "bg-orange-50 border-orange-500 text-orange-800"
               )}
             >
               {isBalanced ? <CheckCircle2 className="mx-auto mb-2" /> : <AlertCircle className="mx-auto mb-2" />}
               {simulationResult}
             </motion.div>
           )}
        </div>
      </div>

      {/* Grassland Organism Selection Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-lime-800">
           <Bird className="text-lime-500" /> 生物多樣性：尋找草原居民
        </h3>
        <p className="text-slate-600 mb-8">
           草原景觀開闊且隱蔽處少。請從下方的生物庫中點選，選出那些適合居住在<strong>草原生態系</strong>中的居民。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
           {shuffledGrasslandOrganisms.map((org) => (
             <button
               key={org.id}
               onClick={() => toggleGrasslandOrganism(org.id)}
               className={cn(
                 "group relative bg-slate-50 rounded-2xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center gap-2",
                 selectedGrasslandOrganisms.includes(org.id)
                  ? "border-lime-500 bg-lime-50 ring-2 ring-lime-500/20 shadow-md"
                  : "border-slate-100 hover:border-lime-300 hover:bg-white"
               )}
             >
                <div className="aspect-square w-full rounded-xl overflow-hidden shadow-inner">
                   <img 
                     src={org.img} 
                     alt={org.name} 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                     referrerPolicy="no-referrer" 
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.src = `https://placehold.co/200x200/f7fee7/65a30d?text=${org.name}`;
                     }}
                   />
                </div>
                <span className={cn(
                  "text-sm font-bold transition-colors",
                  selectedGrasslandOrganisms.includes(org.id) ? "text-lime-700" : "text-slate-600"
                )}>
                  {org.name}
                </span>

                {selectedGrasslandOrganisms.includes(org.id) && (
                  <div className="absolute top-3 right-3 bg-lime-500 text-white rounded-full p-0.5 shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}
             </button>
           ))}
        </div>

        <div className="mt-8 flex justify-center">
           {isGrasslandOrganismTaskCorrect ? (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex items-center gap-2 text-lime-600 font-bold bg-lime-50 px-6 py-3 rounded-full border border-lime-100"
             >
               <CheckCircle2 size={20} /> 草原生物辨識完成！
             </motion.div>
           ) : selectedGrasslandOrganisms.length > 0 && (
              <div className="text-slate-400 text-sm font-medium italic">
                {selectedGrasslandOrganisms.length > 4 ? "有些動物似乎更喜歡森林或沙漠喔..." : "點選所有草原居民以完成任務..."}
              </div>
           )}
        </div>
      </div>

      {/* YouTube Video Section for Grassland */}
      <div className="bg-lime-50 p-8 rounded-3xl border border-lime-100 mt-12 overflow-hidden shadow-sm">
        <h3 className="text-2xl font-black text-lime-800 mb-4 flex items-center gap-2">
          <Info size={24} className="text-lime-500" /> 草原生態系：探索延伸
        </h3>
        <div className="mb-6">
          <p className="text-lime-900 font-bold text-lg mb-1">獅子王中的動物圖鑑</p>
          <p className="text-lime-700 font-medium">若你完成所有內容，可以回來觀看此段影片。</p>
        </div>
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/uYFOvLfS5FA" 
            title="草原生態系" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {isBalanced && isChainCorrect && isCorrectBlanks && isGrasslandOrganismTaskCorrect && <CompleteButton onClick={onComplete} />}
    </div>
  );
}


// 6.5 Creatures Match Section
function CreaturesSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const initialCreatures = useMemo(() => {
    const list = [
      // 凍原
      { name: '北極熊', ecosystem: '凍原', type: 'tundra' },
      // 森林
      { name: '五色鳥', ecosystem: '森林', type: 'forest' },
      { name: '台灣水鹿', ecosystem: '森林', type: 'forest' },
      { name: '穿山甲', ecosystem: '森林', type: 'forest' },
      // 草原
      { name: '牛筋草', ecosystem: '草原', type: 'grassland' },
      { name: '金合歡', ecosystem: '草原', type: 'grassland' },
      { name: '長頸鹿', ecosystem: '草原', type: 'grassland' },
      { name: '疣豬', ecosystem: '草原', type: 'grassland' },
      { name: '斑馬', ecosystem: '草原', type: 'grassland' },
      { name: '獅子', ecosystem: '草原', type: 'grassland' },
      { name: '鬣狗', ecosystem: '草原', type: 'grassland' },
      // 沙漠
      { name: '仙人掌', ecosystem: '沙漠', type: 'desert' },
      { name: '沐霧甲蟲', ecosystem: '沙漠', type: 'desert' },
      { name: '沙漠玫瑰', ecosystem: '沙漠', type: 'desert' },
      { name: '沙漠跳鼠', ecosystem: '沙漠', type: 'desert' },
      { name: '駱駝', ecosystem: '沙漠', type: 'desert' },
      { name: '響尾蛇', ecosystem: '沙漠', type: 'desert' },
    ];
    return [...list].sort(() => Math.random() - 0.5);
  }, []);

  const [quizQueue, setQuizQueue] = useState([...initialCreatures]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCreatures, setWrongCreatures] = useState<string[]>([]);
  const [isWrong, setIsWrong] = useState(false);
  const [showFinished, setShowFinished] = useState(false);

  const current = quizQueue[0];

  const handleGuess = (val: string) => {
    if (!current) return;

    if (val === current.ecosystem) {
      // Correct answer
      setCorrectCount(prev => prev + 1);
      const newQueue = quizQueue.slice(1);
      if (newQueue.length === 0) {
        onScore?.('creatures_match', 200);
        setShowFinished(true);
      } else {
        setQuizQueue(newQueue);
      }
      setIsWrong(false);
    } else {
      // Wrong answer
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 1000);
      if (!wrongCreatures.includes(current.name)) {
        setWrongCreatures(prev => [...prev, current.name]);
      }
      
      // Move to back of queue
      const newQueue = [...quizQueue.slice(1), current];
      setQuizQueue(newQueue);
    }
  };

  const ecosystemOptions = [
    { name: '凍原', color: 'bg-sky-200 text-sky-800' },
    { name: '森林', color: 'bg-emerald-200 text-emerald-800' },
    { name: '草原', color: 'bg-lime-200 text-lime-800' },
    { name: '沙漠', color: 'bg-orange-200 text-orange-800' },
  ];

  if (showFinished) {
    return (
      <div className="space-y-8 text-center">
        <SectionHeader title="陸域生物配對完成" icon={<Bird />} color="text-rose-500" />
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
           <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
              <CheckCircle2 size={40} />
           </div>
           <h3 className="text-2xl font-bold mb-4">太棒了！</h3>
           <p className="text-slate-600 mb-8">你已經成功掌握了陸域生態系中代表生物的居住地。</p>
           <CompleteButton onClick={onComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="陸域生物配對練習" icon={<Bird />} color="text-rose-500" />
      
      <div className="flex justify-between items-center px-4">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          挑戰進度：剩餘 {quizQueue.length} 題
        </span>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-rose-500 transition-all duration-300" 
            style={{ width: `${(correctCount / (correctCount + quizQueue.length)) * 100}%` }} 
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50 flex flex-col md:flex-row gap-12 items-center">
         <div className="w-full md:w-1/2 aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-100 relative group">
            <AnimatePresence mode="wait">
              <motion.img 
                key={current.name}
                src={`./assets/${encodeURIComponent(current.name)}.jpg`} 
                alt={current.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  isWrong ? "brightness-50 grayscale" : ""
                )}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://placehold.co/600x600/fecdd3/e11d48?text=${current.name}`;
                }}
              />
            </AnimatePresence>
            <div className="absolute top-6 left-6">
               <span className="px-6 py-2 bg-white/90 backdrop-blur shadow-lg rounded-full font-black text-xl text-slate-900">
                 {current.name}
               </span>
            </div>
            {isWrong && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-red-500 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl">
                   <AlertCircle size={40} />
                </div>
              </motion.div>
            )}
         </div>

         <div className="w-full md:w-1/2 space-y-8">
            <div className="space-y-4">
               <h3 className="text-2xl font-bold text-slate-800 tracking-tight">這隻生物住在哪個生態系？</h3>
               <p className="text-slate-500 leading-relaxed">觀察生物的外型特徵（如毛量、腳長、體色），判斷其適應的環境類型。</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               {ecosystemOptions.map(opt => (
                 <button
                   key={opt.name}
                   onClick={() => handleGuess(opt.name)}
                   className={cn(
                     "p-6 rounded-2xl border-2 font-black text-lg transition-all flex flex-col items-center gap-2",
                     "hover:scale-105 active:scale-95 shadow-sm",
                     opt.color.split(' ')[0] + "/10 border-transparent hover:border-slate-300"
                   )}
                 >
                   <span className={cn("px-4 py-1 rounded-full text-sm", opt.color)}>
                     {opt.name}
                   </span>
                 </button>
               ))}
            </div>

            {wrongCreatures.includes(current.name) && (
              <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-2">
                <Info size={16} className="shrink-0" />
                <span>提示：{getHint(current.type)}</span>
              </p>
            )}
         </div>
      </div>
    </div>
  );
}

function getHint(type: string) {
  switch(type) {
    case 'tundra': return '這裡終年低溫，生物通常有厚實的毛或脂肪。';
    case 'forest': return '結構穩定，生物多樣性高，有許多擅長攀爬或匿蹤的動物。';
    case 'grassland': return '視野開闊，生物多樣性也高，多數動物善於奔跑。';
    case 'desert': return '極度乾燥且晝夜溫差大，生物有儲水或防止蒸散的構造。';
    case 'river': return '淡水河川水量流動較快，生物常具備吸附或抗流構造。';
    case 'lake': return '淡水湖泊水流靜止，適合浮游生物與沉水植物生長。';
    case 'estuary': return '河流與海洋交界，鹽度變化劇烈，生物多具備調節鹽分的能力，如水筆仔。';
    case 'intertidal': return '每天漲退潮環境劇變，生物需能耐乾旱與海浪衝擊。';
    case 'shallow': return '水深200公尺內，光線充足，是珊湖礁與大型藻類的家。';
    case 'oceanic': return '廣闊深藍的大海，從表層到深海，生物形態各異，如巨大的鯨魚或奇特的深海生物。';
    default: return '';
  }
}

// 6.6 Water Creatures Match Section
function WaterCreaturesSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const initialCreatures = useMemo(() => {
    const list = [
      // 淡水河川
      { name: '溪哥', ecosystem: '淡水河川', type: 'river' },
      { name: '翠鳥', ecosystem: '淡水河川', type: 'river' },
      { name: '蘚苔', ecosystem: '淡水河川', type: 'river' },
      // 淡水湖泊
      { name: '草魚', ecosystem: '淡水湖泊', type: 'lake' },
      { name: '萍蓬草', ecosystem: '淡水湖泊', type: 'lake' },
      { name: '短腹幽蟌', ecosystem: '淡水湖泊', type: 'lake' },
      // 河口
      { name: '弧邊招潮蟹', ecosystem: '河口', type: 'estuary' },
      { name: '彈塗魚', ecosystem: '河口', type: 'estuary' },
      { name: '水筆仔', ecosystem: '河口', type: 'estuary' },
      { name: '沙蠶', ecosystem: '河口', type: 'estuary' },
      // 海洋潮間帶
      { name: '方蟹', ecosystem: '海洋潮間帶', type: 'intertidal' },
      // 海洋淺海區
      { name: '昆布', ecosystem: '海洋淺海區', type: 'shallow' },
      { name: '曲紋唇魚', ecosystem: '海洋淺海區', type: 'shallow' },
      // 海洋大洋區
      { name: '大翅鯨', ecosystem: '海洋大洋區', type: 'oceanic' },
      { name: '大王具足蟲', ecosystem: '海洋大洋區', type: 'oceanic' },
    ];
    return [...list].sort(() => Math.random() - 0.5);
  }, []);

  const [quizQueue, setQuizQueue] = useState([...initialCreatures]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCreatures, setWrongCreatures] = useState<string[]>([]);
  const [isWrong, setIsWrong] = useState(false);
  const [showFinished, setShowFinished] = useState(false);

  const current = quizQueue[0];

  const handleGuess = (val: string) => {
    if (!current) return;

    if (val === current.ecosystem) {
      // Correct answer
      setCorrectCount(prev => prev + 1);
      const newQueue = quizQueue.slice(1);
      if (newQueue.length === 0) {
        onScore?.('water_creatures_match', 200);
        setShowFinished(true);
      } else {
        setQuizQueue(newQueue);
      }
      setIsWrong(false);
    } else {
      // Wrong answer
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 1000);
      if (!wrongCreatures.includes(current.name)) {
        setWrongCreatures(prev => [...prev, current.name]);
      }
      
      // Move to back of queue
      const newQueue = [...quizQueue.slice(1), current];
      setQuizQueue(newQueue);
    }
  };

  const ecosystemOptions = [
    { name: '淡水河川', color: 'bg-cyan-100 text-cyan-800' },
    { name: '淡水湖泊', color: 'bg-blue-100 text-blue-800' },
    { name: '河口', color: 'bg-emerald-100 text-emerald-800' },
    { name: '海洋潮間帶', color: 'bg-indigo-100 text-indigo-800' },
    { name: '海洋淺海區', color: 'bg-blue-200 text-blue-900' },
    { name: '海洋大洋區', color: 'bg-slate-200 text-slate-800' },
  ];

  if (showFinished) {
    return (
      <div className="space-y-8 text-center">
        <SectionHeader title="水域生物配對完成" icon={<Droplets />} color="text-cyan-500" />
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
           <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 text-cyan-500">
              <CheckCircle2 size={40} />
           </div>
           <h3 className="text-2xl font-bold mb-4">做得好！</h3>
           <p className="text-slate-600 mb-8">你已經成功將這些水域生物歸位到更精確的生態系了。</p>
           <CompleteButton onClick={onComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="水域生物配對練習" icon={<Droplets />} color="text-cyan-500" />
      
      <div className="flex justify-between items-center px-4">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          挑戰進度：剩餘 {quizQueue.length} 題
        </span>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-500 transition-all duration-300" 
            style={{ width: `${(correctCount / (correctCount + quizQueue.length)) * 100}%` }} 
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50 flex flex-col md:flex-row gap-12 items-center">
         <div className="w-full md:w-1/2 aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-100 relative group">
            <AnimatePresence mode="wait">
              <motion.img 
                key={current.name}
                src={`./assets/${encodeURIComponent(current.name)}.jpg`} 
                alt={current.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  isWrong ? "brightness-50 grayscale" : ""
                )}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://placehold.co/600x600/bae6fd/0284c7?text=${current.name}`;
                }}
              />
            </AnimatePresence>
            <div className="absolute top-6 left-6">
               <span className="px-6 py-2 bg-white/90 backdrop-blur shadow-lg rounded-full font-black text-xl text-slate-900">
                 {current.name}
               </span>
            </div>
            {isWrong && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-red-500 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl">
                   <AlertCircle size={40} />
                 </div>
              </motion.div>
            )}
         </div>

         <div className="w-full md:w-1/2 space-y-8">
            <div className="space-y-4">
               <h3 className="text-2xl font-bold text-slate-800 tracking-tight">這隻水域生物住在哪裡？</h3>
               <p className="text-slate-500 leading-relaxed">請將生物歸類到正確的水域子系統中。注意河川、湖泊與海洋各區的分別。</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               {ecosystemOptions.map(opt => (
                 <button
                   key={opt.name}
                   onClick={() => handleGuess(opt.name)}
                   className={cn(
                     "p-4 rounded-2xl border-2 font-black text-sm transition-all flex flex-col items-center gap-2",
                     "hover:scale-105 active:scale-95 shadow-sm",
                     opt.color.split(' ')[0] + " border-transparent hover:border-slate-300"
                   )}
                 >
                   <span className={cn("px-4 py-1 rounded-full text-xs", opt.color)}>
                     {opt.name}
                   </span>
                 </button>
               ))}
            </div>

            {wrongCreatures.includes(current.name) && (
              <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-2">
                <Info size={16} className="shrink-0" />
                <span>提示：{getHint(current.type)}</span>
              </p>
            )}
         </div>
      </div>
    </div>
  );
}

function DesertSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [cactusData, setCactusData] = useState<Record<string, { feature?: string, benefit?: string }>>({});
  const [selectedDesertOrganisms, setSelectedDesertOrganisms] = useState<string[]>([]);
  
  const organisms = [
    { name: '仙人掌', desert: true },
    { name: '駱駝', desert: true },
    { name: '草魚', desert: false },
    { name: '響尾蛇', desert: true },
    { name: '萍蓬草', desert: false },
    { name: '跳鼠', desert: true },
  ];

  const handleRemove = (name: string) => {
    const org = organisms.find(o => o.name === name);
    if (org) {
      onScore?.(`desert_remove_${name}`, !org.desert);
    }
    setRemoved(prev => [...prev, name]);
  };

  const cactusOptions = {
    root: {
      features: ['分布廣而淺', '分布極深', '無根系'],
      benefits: ['短時間內吸收大量水分', '尋找地下水', '減少能量消耗'],
      correct: { feature: '分布廣而淺', benefit: '短時間內吸收大量水分' }
    },
    stem: {
      features: ['肥厚多汁', '木質化硬莖', '中空結構'],
      benefits: ['儲存大量水分', '支撐重量', '增加強度'],
      correct: { feature: '肥厚多汁', benefit: '儲存大量水分' }
    },
    leaf: {
      features: ['演化成針狀', '廣大薄片', '具備厚皮層'],
      benefits: ['減少水分散失', '增加光合作用', '抵禦外敵'],
      correct: { feature: '演化成針狀', benefit: '減少水分散失' }
    }
  };

  const traitOptions = [
    { id: 'water_stem', label: '肥厚莖部儲水', correct: true },
    { id: 'big_leaves', label: '廣大葉片蒸散', correct: false },
    { id: 'urine', label: '尿液極濃且少', correct: true },
    { id: 'sweat', label: '皮膚大量排汗', correct: false },
  ];

  const toggleTrait = (id: string) => {
    const trait = traitOptions.find(t => t.id === id);
    if (trait) {
      onScore?.(`desert_trait_${id}`, trait.correct);
    }
    setSelectedTraits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const remainingIncorrect = organisms.filter(o => !o.desert && !removed.includes(o.name));
  const isDoneRemoving = remainingIncorrect.length === 0;
  const isCorrectBlanks = Object.keys(blanks).length === 4;
  const isCorrectTraits = traitOptions.filter(t => t.correct).every(t => selectedTraits.includes(t.id)) && 
                          !selectedTraits.some(id => !traitOptions.find(t => t.id === id)?.correct);

  const isCactusCorrect = 
    cactusData.root?.feature === cactusOptions.root.correct.feature &&
    cactusData.root?.benefit === cactusOptions.root.correct.benefit &&
    cactusData.stem?.feature === cactusOptions.stem.correct.feature &&
    cactusData.stem?.benefit === cactusOptions.stem.correct.benefit &&
    cactusData.leaf?.feature === cactusOptions.leaf.correct.feature &&
    cactusData.leaf?.benefit === cactusOptions.leaf.correct.benefit;

  const desertOrganismPool = [
    { id: 'camel', name: '駱駝', img: './assets/駱駝.jpg', isDesert: true },
    { id: 'snake', name: '響尾蛇', img: './assets/響尾蛇.jpg', isDesert: true },
    { id: 'cactus_item', name: '仙人掌', img: './assets/仙人掌.jpg', isDesert: true },
    { id: 'jerboa', name: '沙漠跳鼠', img: './assets/沙漠跳鼠.jpg', isDesert: true },
    { id: 'beetle', name: '沐霧甲蟲', img: './assets/沐霧甲蟲.jpg', isDesert: true },
    { id: 'desert_rose', name: '沙漠玫瑰', img: './assets/沙漠玫瑰.jpg', isDesert: true },
    { id: 'lion', name: '獅子', img: './assets/獅子.jpg', isDesert: false },
    { id: 'polarbear', name: '北極熊', img: './assets/北極熊.jpg', isDesert: false },
    { id: 'kingfisher', name: '翠鳥', img: './assets/翠鳥.jpg', isDesert: false },
    { id: 'deer', name: '台灣水鹿', img: './assets/台灣水鹿.jpg', isDesert: false },
  ];

  const shuffledDesertOrganisms = useMemo(() => [...desertOrganismPool].sort(() => Math.random() - 0.5), []);

  const toggleDesertOrganism = (id: string) => {
    const isCorrect = desertOrganismPool.find(o => o.id === id)?.isDesert;
    onScore?.(`desert_org_${id}`, !!isCorrect);
    setSelectedDesertOrganisms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isDesertOrganismTaskCorrect = useMemo(() => {
    const desertIds = desertOrganismPool.filter(o => o.isDesert).map(o => o.id);
    const nonDesertIds = desertOrganismPool.filter(o => !o.isDesert).map(o => o.id);
    return desertIds.every(id => selectedDesertOrganisms.includes(id)) && 
           !nonDesertIds.some(id => selectedDesertOrganisms.includes(id));
  }, [selectedDesertOrganisms]);

  return (
    <div className="space-y-8">
      <SectionHeader title="沙漠生態系" icon={<Sun />} color="text-orange-500" />
      
      {/* 1. Context Block */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-orange-700">
          <Info size={20} /> 沙漠環境特徵
        </h3>
        <div className="space-y-6 text-slate-700">
           <p>
             沙漠可能形成於年雨量少於
             <FillInTheBlank options={['100mm', '250mm', '500mm']} correct="250mm" qid="desert_blank_1" onScore={onScore} onCorrect={() => setBlanks(p => ({ ...p, 1: true }))} />
             毫米，或者<strong>蒸發速率遠大於降雨量</strong>的地方。
           </p>
           <p>
             沙漠植被稀少，日夜溫差相當大，一年中
             <FillInTheBlank options={['雨量均勻', '只有幾次降雨機會', '四季如春']} correct="只有幾次降雨機會" qid="desert_blank_2" onScore={onScore} onCorrect={() => setBlanks(p => ({ ...p, 2: true }))} />
             ，生物不容易在此生存。
           </p>
           <p>
             生產者主要為各種耐旱植物；消費者大都是能適應
             <FillInTheBlank options={['潮濕', '乾旱', '寒冷']} correct="乾旱" qid="desert_blank_3" onScore={onScore} onCorrect={() => setBlanks(p => ({ ...p, 3: true }))} />
             環境的昆蟲、爬蟲類和哺乳類。這裡的生物種類較其他生態系
             <FillInTheBlank options={['多', '少', '不變']} correct="少" qid="desert_blank_4" onScore={onScore} onCorrect={() => setBlanks(p => ({ ...p, 4: true }))} />
             。
           </p>
           <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-sm italic">
             一些雙子葉或較大型植物也能在此區生長，一年可落葉多次以減少水分散失，且在雨後迅速開花結果。駱駝、跳鼠等動物則具備特殊的生理構造來保存水分。
           </div>
        </div>
      </div>

      {/* 2. Cactus Special Section */}
      <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-200">
        <h3 className="text-xl font-bold mb-6 text-emerald-900 flex items-center gap-2">
           <Zap className="text-emerald-500" /> 仙人掌生存密碼
        </h3>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
           {/* Visual Cactus (using Tailwind) */}
           <div className="flex justify-center py-10 scale-110">
              <div className="relative w-32 h-56 bg-emerald-500 rounded-t-full border-4 border-emerald-700 shadow-lg">
                 {/* Spikes */}
                 <div className="absolute top-10 left-4 w-1 h-3 bg-emerald-900 rotate-45 rounded-full" />
                 <div className="absolute top-20 right-4 w-1 h-3 bg-emerald-900 -rotate-45 rounded-full" />
                 <div className="absolute top-32 left-8 w-1 h-3 bg-emerald-900 rotate-12 rounded-full" />
                 <div className="absolute bottom-16 right-8 w-1 h-3 bg-emerald-900 -rotate-12 rounded-full" />
                 
                 {/* Arms */}
                 <div className="absolute -left-10 top-20 w-10 h-14 bg-emerald-500 border-4 border-emerald-700 rounded-t-full rounded-bl-full rotate-[-20deg]" />
                 <div className="absolute -right-8 top-12 w-8 h-12 bg-emerald-500 border-4 border-emerald-700 rounded-t-full rounded-br-full rotate-[30deg]" />
                 
                 {/* Pings for interaction mapping */}
                 <div className={cn("absolute top-2 left-1/2 -translate-x-1/2 -mt-2 w-4 h-4 rounded-full animate-pulse", cactusData.leaf?.feature === cactusOptions.leaf.correct.feature ? "bg-emerald-400" : "bg-orange-400")} />
                 <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -mt-2 w-4 h-4 rounded-full animate-pulse", cactusData.stem?.feature === cactusOptions.stem.correct.feature ? "bg-emerald-400" : "bg-orange-400")} />
                 <div className={cn("absolute -bottom-10 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full animate-pulse", cactusData.root?.feature === cactusOptions.root.correct.feature ? "bg-emerald-400" : "bg-orange-400")} />
                 
                 {/* Sand */}
                 <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-8 bg-orange-200/50 rounded-full blur-sm -z-10" />
              </div>
           </div>

           {/* Matching Controls */}
           <div className="space-y-4">
              {['leaf', 'stem', 'root'].map((part) => {
                const p = part as keyof typeof cactusOptions;
                return (
                  <div key={part} className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs uppercase">
                        {part === 'leaf' ? '葉' : part === 'stem' ? '莖' : '根'}
                      </span>
                      <h4 className="font-bold text-slate-800">
                        {part === 'leaf' ? '葉子特徵與好處' : part === 'stem' ? '莖部特徵與好處' : '根部特徵與好處'}
                      </h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <select 
                        value={cactusData[part]?.feature || ''}
                        className="text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-emerald-400 transition-colors"
                        onChange={(e) => {
                          const val = e.target.value;
                          onScore?.(`desert_cactus_${part}_feature`, val === cactusOptions[p].correct.feature);
                          setCactusData(prev => ({ ...prev, [part]: { ...prev[part], feature: val } }));
                        }}
                      >
                        <option value="">選擇特徵...</option>
                        {cactusOptions[p].features.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select 
                        value={cactusData[part]?.benefit || ''}
                        className="text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-emerald-400 transition-colors"
                        onChange={(e) => {
                          const val = e.target.value;
                          onScore?.(`desert_cactus_${part}_benefit`, val === cactusOptions[p].correct.benefit);
                          setCactusData(prev => ({ ...prev, [part]: { ...prev[part], benefit: val } }));
                        }}
                      >
                        <option value="">選擇好處...</option>
                        {cactusOptions[p].benefits.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
          <h4 className="font-bold flex items-center gap-2 mb-4 text-orange-900">
            <AlertCircle size={20} /> 任務 A：清除外來者
          </h4>
          <p className="text-xs text-orange-700 mb-4 italic">點擊「不適合」存活在沙漠中的生物：</p>
          <div className="flex flex-wrap gap-3">
            {organisms.map(o => (
              <button
                key={o.name}
                onClick={() => handleRemove(o.name)}
                disabled={removed.includes(o.name)}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold transition-all border-2",
                  removed.includes(o.name) 
                    ? "bg-slate-100 text-slate-300 border-slate-100 opacity-30" 
                    : "bg-white text-orange-600 border-orange-100 hover:border-orange-500 shadow-sm"
                )}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-orange-900 text-white p-6 rounded-3xl">
          <h4 className="font-bold mb-4">任務 B：沙漠生存技能包</h4>
          <p className="text-xs text-orange-200 mb-4">選出正確的沙漠生物適應特徵：</p>
          <div className="space-y-2">
            {traitOptions.map(t => (
              <button
                key={t.id}
                onClick={() => toggleTrait(t.id)}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  selectedTraits.includes(t.id) 
                    ? "bg-orange-500 border-orange-400 text-white" 
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desert Organism Selection Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-orange-800">
           <Zap className="text-orange-500" /> 生物多樣性：尋找沙漠居民
        </h3>
        <p className="text-slate-600 mb-8">
           沙漠極其乾旱且溫差劇烈。請從下方的生物庫中點選，選出那些適合居住在<strong>沙漠生態系</strong>中的居民。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
           {shuffledDesertOrganisms.map((org) => (
             <button
               key={org.id}
               onClick={() => toggleDesertOrganism(org.id)}
               className={cn(
                 "group relative bg-slate-50 rounded-2xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center gap-2",
                 selectedDesertOrganisms.includes(org.id)
                  ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 shadow-md"
                  : "border-slate-100 hover:border-orange-300 hover:bg-white"
               )}
             >
                <div className="aspect-square w-full rounded-xl overflow-hidden shadow-inner">
                   <img 
                     src={org.img} 
                     alt={org.name} 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                     referrerPolicy="no-referrer" 
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.src = `https://placehold.co/200x200/fff7ed/ea580c?text=${org.name}`;
                     }}
                   />
                </div>
                <span className={cn(
                  "text-sm font-bold transition-colors",
                  selectedDesertOrganisms.includes(org.id) ? "text-orange-700" : "text-slate-600"
                )}>
                  {org.name}
                </span>

                {selectedDesertOrganisms.includes(org.id) && (
                  <div className="absolute top-3 right-3 bg-orange-500 text-white rounded-full p-0.5 shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}
             </button>
           ))}
        </div>

        <div className="mt-8 flex justify-center">
           {isDesertOrganismTaskCorrect ? (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex items-center gap-2 text-orange-600 font-bold bg-orange-50 px-6 py-3 rounded-full border border-orange-100"
             >
               <CheckCircle2 size={20} /> 沙漠生物辨識完成！
             </motion.div>
           ) : selectedDesertOrganisms.length > 0 && (
              <div className="text-slate-400 text-sm font-medium italic">
                {selectedDesertOrganisms.length > 5 ? "這隻動物在那邊大概會渴死喔..." : "點選所有沙漠居民以完成任務..."}
              </div>
           )}
        </div>
      </div>

      {/* YouTube Video Section for Desert */}
      <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 mt-12 overflow-hidden shadow-sm">
        <h3 className="text-2xl font-black text-orange-800 mb-4 flex items-center gap-2">
          <Info size={24} className="text-orange-500" /> 沙漠生態系：探索延伸
        </h3>
        <div className="mb-6">
          <p className="text-orange-900 font-bold text-lg mb-1">適應沙漠環境的動物是如何做到的？| 奇怪動物紀錄片</p>
          <p className="text-orange-700 font-medium">若你完成所有內容，可以回來觀看此段影片。</p>
        </div>
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/zVZ3k0rnbYw" 
            title="沙漠生態系" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {isDoneRemoving && isCorrectBlanks && isCorrectTraits && isCactusCorrect && isDesertOrganismTaskCorrect && <CompleteButton onClick={onComplete} />}
    </div>
  );
}

// 7. Freshwater Section
function FreshwaterSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [selectedFreshwaterOrganisms, setSelectedFreshwaterOrganisms] = useState<string[]>([]);
  const [riverType, setRiverType] = useState<'upstream' | 'downstream'>('upstream');

  const freshwaterOrganismPool = [
    { id: 'carp', name: '草魚', img: './assets/草魚.jpg', isFreshwater: true },
    { id: 'zacco', name: '溪哥', img: './assets/溪哥.jpg', isFreshwater: true },
    { id: 'water_lily', name: '萍蓬草', img: './assets/萍蓬草.jpg', isFreshwater: true },
    { id: 'moss', name: '蘚苔', img: './assets/蘚苔.jpg', isFreshwater: true },
    { id: 'kingfisher', name: '翠鳥', img: './assets/翠鳥.jpg', isFreshwater: true },
    { id: 'mangrove', name: '水筆仔', img: './assets/水筆仔.jpg', isFreshwater: false },
    { id: 'fiddler_crab', name: '弧邊招潮蟹', img: './assets/弧邊招潮蟹.jpg', isFreshwater: false },
    { id: 'mudskipper', name: '彈塗魚', img: './assets/彈塗魚.jpg', isFreshwater: false },
  ];

  const shuffledFreshwaterOrganisms = useMemo(() => [...freshwaterOrganismPool].sort(() => Math.random() - 0.5), []);

  const toggleFreshwaterOrganism = (id: string) => {
    const isCorrect = freshwaterOrganismPool.find(o => o.id === id)?.isFreshwater;
    onScore?.(`fresh_org_${id}`, !!isCorrect);
    setSelectedFreshwaterOrganisms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isOrganismTaskCorrect = useMemo(() => {
    const freshIds = freshwaterOrganismPool.filter(o => o.isFreshwater).map(o => o.id);
    const nonFreshIds = freshwaterOrganismPool.filter(o => !o.isFreshwater).map(o => o.id);
    return freshIds.every(id => selectedFreshwaterOrganisms.includes(id)) && 
           !nonFreshIds.some(id => selectedFreshwaterOrganisms.includes(id));
  }, [selectedFreshwaterOrganisms]);

  const isCorrectBlanks = Object.keys(blanks).length === 2;

  const riverData = {
    upstream: {
      flow: "湍急",
      oxygen: "溶氧量高 (水面快速翻動)",
      temp: "低",
      bottom: "主要為大岩石或礫石",
      traits: "生物具流線型、吸盤或附著功能，避免被沖走。",
      examples: "溪哥、苔蘚、吸口鰍"
    },
    downstream: {
      flow: "緩慢",
      oxygen: "溶氧量較低",
      temp: "較高",
      bottom: "主要為泥沙堆積",
      traits: "底棲挖掘生物、浮游生物較多。",
      examples: "草魚、螺類、水蚤"
    }
  };

  const [riverMatching, setRiverMatching] = useState<Record<string, 'upstream' | 'downstream' | null>>({});
  const [riverSubmitted, setRiverSubmitted] = useState(false);
  const [tableAnswers, setTableAnswers] = useState<Record<string, string>>({});
  
  const handleTableSelect = (id: string, value: string, correct: string) => {
    setTableAnswers(prev => ({ ...prev, [id]: value }));
    if (value === correct) {
      onScore?.(`river_table_${id}`, true);
    }
  };
  
  const riverQuizItems = [
    { id: 'suction', text: '具備吸盤或附著構造，能固定在岩石上', correct: 'upstream', hint: '提示：上游水流湍急，生物需要「抓得住」岩石。' },
    { id: 'streamline', text: '身體呈流線型，泳力強，不怕激流', correct: 'upstream', hint: '提示：上游水流快，流線型能減少阻力。' },
    { id: 'bottom_dweller', text: '多為底棲挖掘生物，生活在泥沙環境', correct: 'downstream', hint: '提示：下游水流慢，泥沙堆積，適合挖掘。' },
    { id: 'plankton', text: '含有較多浮游生物，水流緩慢有利繁殖', correct: 'downstream', hint: '提示：下游水流緩慢，浮游生物不會被輕易沖走。' },
  ];

  const handleRiverMatch = (id: string, type: 'upstream' | 'downstream') => {
    if (riverSubmitted) return;
    setRiverMatching(prev => ({ ...prev, [id]: type }));
  };

  const handleSubmitRiverQuiz = () => {
    setRiverSubmitted(true);
    riverQuizItems.forEach(item => {
      const selection = riverMatching[item.id];
      if (selection) {
        onScore?.(`river_match_${item.id}`, selection === item.correct);
      }
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="淡水生態系" icon={<Droplets />} color="text-cyan-500" />
      
      {/* Introduction */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-700">
          <Info size={20} /> 淡水環境：流動與靜止
        </h3>
        <p className="mb-4">
          淡水生態系依水流速度可分為
          <FillInTheBlank 
            options={['流動與靜止', '鹹水與淡水', '深海與淺海']} 
            correct="流動與靜止" 
            qid="fresh_blank_1"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 1: true }))}
          />
          兩大類型。
        </p>
        <p>
          流動水域（如溪流）溶氧量通常較高；靜止水域（如湖泊、潭）則容易累積
          <FillInTheBlank 
            options={['營養鹽', '氧氣', '海鹽']} 
            correct="營養鹽" 
            qid="fresh_blank_2"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 2: true }))}
          />
          ，水面較平靜。
        </p>
      </div>

      {/* River Upstream/Downstream Section */}
      <div className="bg-cyan-50 p-8 rounded-3xl border border-cyan-100">
        <h3 className="text-xl font-bold mb-6 text-cyan-800 flex items-center gap-2">
           <Waves className="text-cyan-500" /> 河流環境比較：上游與下游
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-cyan-600 text-white">
                <th className="p-4 text-left font-black">環境因子</th>
                <th className="p-4 text-left font-black">河流上游</th>
                <th className="p-4 text-left font-black">河流下游</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-50">
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">水流速度</td>
                <td className="p-4">
                  <select 
                    value={tableAnswers['u_flow'] || ''} 
                    onChange={(e) => handleTableSelect('u_flow', e.target.value, riverData.upstream.flow)}
                    className={cn(
                      "w-full p-2 rounded-lg border-2 font-bold transition-all",
                      !tableAnswers['u_flow'] ? "border-slate-200" : (tableAnswers['u_flow'] === riverData.upstream.flow ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700")
                    )}
                  >
                    <option value="">選擇...</option>
                    <option value="湍急">湍急</option>
                    <option value="緩慢">緩慢</option>
                  </select>
                </td>
                <td className="p-4">
                  <select 
                    value={tableAnswers['d_flow'] || ''} 
                    onChange={(e) => handleTableSelect('d_flow', e.target.value, riverData.downstream.flow)}
                    className={cn(
                      "w-full p-2 rounded-lg border-2 font-bold transition-all",
                      !tableAnswers['d_flow'] ? "border-slate-200" : (tableAnswers['d_flow'] === riverData.downstream.flow ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700")
                    )}
                  >
                    <option value="">選擇...</option>
                    <option value="湍急">湍急</option>
                    <option value="緩慢">緩慢</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">溶氧含量</td>
                <td className="p-4">
                   <select 
                    value={tableAnswers['u_oxy'] || ''} 
                    onChange={(e) => handleTableSelect('u_oxy', e.target.value, riverData.upstream.oxygen)}
                    className={cn(
                      "w-full p-2 rounded-lg border-2 font-bold transition-all text-xs",
                      !tableAnswers['u_oxy'] ? "border-slate-200" : (tableAnswers['u_oxy'] === riverData.upstream.oxygen ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700")
                    )}
                  >
                    <option value="">選擇...</option>
                    <option value="溶氧量高 (水面快速翻動)">高 (快速翻動)</option>
                    <option value="溶氧量較低">較低</option>
                  </select>
                </td>
                <td className="p-4">
                   <select 
                    value={tableAnswers['d_oxy'] || ''} 
                    onChange={(e) => handleTableSelect('d_oxy', e.target.value, riverData.downstream.oxygen)}
                    className={cn(
                      "w-full p-2 rounded-lg border-2 font-bold transition-all text-xs",
                      !tableAnswers['d_oxy'] ? "border-slate-200" : (tableAnswers['d_oxy'] === riverData.downstream.oxygen ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700")
                    )}
                  >
                    <option value="">選擇...</option>
                    <option value="溶氧量高 (水面快速翻動)">高 (快速翻動)</option>
                    <option value="溶氧量較低">較低</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">河床底質</td>
                <td className="p-4 text-cyan-700 font-bold">{riverData.upstream.bottom}</td>
                <td className="p-4 text-cyan-600">{riverData.downstream.bottom}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">水溫環境</td>
                <td className="p-4 text-cyan-700 font-bold">{riverData.upstream.temp}</td>
                <td className="p-4 text-cyan-600">{riverData.downstream.temp}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">常見生物</td>
                <td className="p-4 text-cyan-700 font-bold text-sm italic">{riverData.upstream.examples}</td>
                <td className="p-4 text-cyan-600 text-sm italic">{riverData.downstream.examples}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 space-y-4">
          <h4 className="font-black text-cyan-800 flex items-center gap-2">
            <Zap size={18} /> 生物適應挑戰：請將生物特徵配對到正確區域
          </h4>
          <div className="grid gap-3">
            {riverQuizItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-cyan-100 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <p className="font-bold text-slate-700">{item.text}</p>
                  <div className="flex gap-2">
                    {(['upstream', 'downstream'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => handleRiverMatch(item.id, type)}
                        disabled={riverSubmitted}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-black transition-all",
                          riverMatching[item.id] === type
                            ? (riverSubmitted 
                                ? (item.correct === type ? "bg-emerald-500 text-white" : "bg-red-500 text-white")
                                : "bg-cyan-500 text-white shadow-md")
                            : "bg-slate-100 text-slate-500 hover:bg-cyan-100 hover:text-cyan-600 disabled:hover:bg-slate-100 disabled:hover:text-slate-500"
                        )}
                      >
                        {type === 'upstream' ? '上游生物' : '下游生物'}
                        {riverSubmitted && riverMatching[item.id] === type && (
                          <span className="ml-2">
                            {item.correct === type ? '✓' : '✗'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {riverSubmitted && riverMatching[item.id] !== item.correct && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-bold"
                  >
                    {item.hint}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
             <button
               onClick={handleSubmitRiverQuiz}
               disabled={riverSubmitted || Object.keys(riverMatching).length < riverQuizItems.length}
               className={cn(
                 "px-12 py-4 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center gap-3",
                 riverSubmitted 
                   ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                   : "bg-cyan-600 text-white hover:bg-cyan-700 hover:scale-105 active:scale-95"
               )}
             >
               {riverSubmitted ? '評分完成' : '送出生物挑戰'}
               {!riverSubmitted && <ArrowRight />}
             </button>
             
             {riverSubmitted && (
               <button
                 onClick={() => {
                   setRiverSubmitted(false);
                   setRiverMatching({});
                 }}
                 className="ml-4 px-6 py-4 rounded-2xl font-bold bg-white border-2 border-cyan-100 text-cyan-600 hover:bg-cyan-50 transition-all"
               >
                 重新挑戰
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Lake Ecosystem Schematic Section */}
      <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 overflow-hidden relative">
        <h3 className="text-xl font-bold mb-8 text-emerald-800 flex items-center gap-2">
           <Sun className="text-amber-500" /> 湖泊生態：分層與生產者
        </h3>
        
        <div className="relative aspect-[16/9] w-full max-w-4xl mx-auto border-4 border-white shadow-2xl rounded-[2.5rem] bg-gradient-to-b from-sky-200 via-sky-400 to-blue-900 overflow-hidden group">
          {/* Surface */}
          <div className="absolute top-[25%] left-0 right-0 h-[2px] bg-white/40 z-20" />
          
          {/* Shore Plants */}
          <div className="absolute top-[10%] left-[-2%] bottom-[60%] w-[15%] z-30">
             <div className="flex flex-col items-center justify-end h-full gap-1">
                <div className="w-1 h-32 bg-emerald-600 rounded-full" />
                <div className="w-1 h-24 bg-emerald-500 rounded-full translate-x-2" />
                <p className="text-[10px] font-black bg-white rounded-full px-2 py-0.5 shadow-sm text-emerald-600 border border-emerald-200">岸邊植物</p>
             </div>
          </div>
          <div className="absolute top-[10%] right-[-2%] bottom-[60%] w-[15%] z-30">
             <div className="flex flex-col items-center justify-end h-full gap-1">
                <div className="w-1 h-40 bg-emerald-600 rounded-full" />
                <div className="w-1 h-28 bg-emerald-500 rounded-full -translate-x-2" />
                <p className="text-[10px] font-black bg-white rounded-full px-2 py-0.5 shadow-sm text-emerald-600 border border-emerald-200 text-center">水生高等植物</p>
             </div>
          </div>

          {/* Sun Rays (Photic Zone) */}
          <div className="absolute top-0 inset-x-0 h-[60%] bg-white/10 [mask-image:linear-gradient(to_bottom,white,transparent)] z-10" />

          {/* Producers - Algae in water */}
          <div className="absolute top-[35%] left-[30%] z-20">
             <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="p-1 bg-white/80 rounded-lg shadow-sm border border-emerald-200">
                <p className="text-[9px] font-bold text-emerald-700">浮游藻類</p>
             </motion.div>
          </div>
          <div className="absolute top-[45%] right-[25%] z-20">
             <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="p-1 bg-white/80 rounded-lg shadow-sm border border-emerald-200">
                <p className="text-[9px] font-bold text-emerald-700">水草 / 沉水植物</p>
             </motion.div>
          </div>

          {/* Zone Labels */}
          <div className="absolute top-[40%] left-4 z-40 border-l-2 border-dashed border-white/50 pl-2">
             <p className="text-white text-xs font-black drop-shadow-md">透光區 (Euphotic Zone)</p>
             <p className="text-white/70 text-[9px]">生產者聚集，行光合作用</p>
          </div>
          <div className="absolute bottom-[15%] left-4 z-40 border-l-2 border-dashed border-white/30 pl-2">
             <p className="text-slate-200 text-xs font-black drop-shadow-md opacity-60">不透光區 / 深水區 (Aphotic Zone)</p>
             <p className="text-slate-400 text-[9px] opacity-60">缺乏陽光，生產者極少</p>
          </div>

          {/* Organisms (Lake dwellers) */}
          <div className="absolute top-[45%] left-[50%] z-20">
             <motion.div animate={{ x: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 5 }}>
                <Bird size={24} className="text-white opacity-40" />
             </motion.div>
          </div>

          {/* Bottom Mud */}
          <div className="absolute bottom-0 inset-x-0 h-[10%] bg-slate-900/40 blur-sm" />
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-emerald-100">
              <h4 className="font-black text-emerald-700 text-sm mb-2">🌱 岸邊與淺水</h4>
              <p className="text-xs text-slate-600 leading-relaxed">生長大型水生植物（如蘆葦、睡蓮），提供生物棲息與產卵空間。</p>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-emerald-100">
              <h4 className="font-black text-emerald-700 text-sm mb-2">🌊 湖泊中央 (透光)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">主要是微小的**浮游藻類**負責光合作用，支撐整個水域食物網。</p>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-emerald-100">
              <h4 className="font-black text-emerald-700 text-sm mb-2">🌑 深水不透光</h4>
              <p className="text-xs text-slate-600 leading-relaxed">陽光無法透達，植物難以生存。主要依賴上方掉落的**有機碎屑**為生。</p>
           </div>
        </div>
      </div>

      {/* Organism Selection List */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-cyan-800">
           <Bird className="text-cyan-500" /> 生物探勘：尋找淡水居民
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
           {shuffledFreshwaterOrganisms.map((org) => (
             <button
               key={org.id}
               onClick={() => toggleFreshwaterOrganism(org.id)}
               className={cn(
                 "group relative bg-slate-50 rounded-2xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center gap-2",
                 selectedFreshwaterOrganisms.includes(org.id)
                  ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/20 shadow-md"
                  : "border-slate-100 hover:border-cyan-300 hover:bg-white"
               )}
             >
                <div className="aspect-square w-full rounded-xl overflow-hidden">
                   <img 
                     src={org.img} 
                     alt={org.name} 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                     referrerPolicy="no-referrer"
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.src = `https://placehold.co/200x200/ecfeff/0891b2?text=${org.name}`;
                     }}
                   />
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  selectedFreshwaterOrganisms.includes(org.id) ? "text-cyan-700" : "text-slate-600"
                )}>
                  {org.name}
                </span>
                {selectedFreshwaterOrganisms.includes(org.id) && (
                  <div className="absolute top-3 right-3 bg-cyan-500 text-white rounded-full p-0.5 shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}
             </button>
           ))}
        </div>
        <div className="mt-8 flex justify-center">
           {isOrganismTaskCorrect ? (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-cyan-600 font-bold bg-cyan-50 px-6 py-3 rounded-full border border-cyan-100 flex items-center gap-2">
               <CheckCircle2 size={20} /> 淡水生物辨識完成！
             </motion.div>
           ) : selectedFreshwaterOrganisms.length > 0 && <p className="text-slate-400 text-sm italic">點選所有淡水居民以完成任務...</p>}
        </div>
      </div>

      {isCorrectBlanks && isOrganismTaskCorrect && <CompleteButton onClick={onComplete} />}
    </div>
  );
}

// 7.5 Estuary Section
function EstuarySection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [placedChain, setPlacedChain] = useState<Record<string, string>>({});
  const [selectedEstuaryOrganisms, setSelectedEstuaryOrganisms] = useState<string[]>([]);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [adaptationAnswers, setAdaptationAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<string | null>(null);
  
  const adaptationStructures = ["支持根", "胎生苗", "氣生根", "板根"];
  const adaptationAdvantages = [
    "增加支撐力，防止傾倒",
    "避免被潮水沖走，下落即定植",
    "輔助呼吸作用",
    "儲存更多的營養"
  ];

  const handleAdaptationScore = (key: string, val: string) => {
    const correct: Record<string, string> = { 
      'roots_s': "支持根", 
      'roots_a': "增加支撐力，防止傾倒", 
      'seeds_s': "胎生苗",
      'seeds_a': "避免被潮水沖走，下落即定植"
    };
    onScore?.(`estuary_adaptation_${key}`, val === correct[key]);
    setAdaptationAnswers(p => ({ ...p, [key]: val }));
  };

  const tideData = [
    { time: '06:15', height: -125, type: '退潮' },
    { time: '08:47', height: 0, type: '漲潮中' },
    { time: '11:20', height: 213, type: '滿潮' },
    { time: '15:00', height: 0, type: '退潮中' },
    { time: '18:47', height: -187, type: '乾潮' },
  ];

  const setEstuaryQuizAns = (key: string, val: string) => {
    const correctAns: Record<string, string> = { time: '11:20', tide: '滿潮', feature: '隨漲退潮劇烈變化' };
    onScore?.(`estuary_quiz_${key}`, val === correctAns[key]);
    setQuizAnswers(p => ({ ...p, [key]: val }));
  };

  const currentTide = tideData[selectedTimeIndex];
  const salinity = Math.max(5, Math.round(((currentTide.height + 250) / 500) * 35));

  const estuaryOrganismPool = [
    { id: 'mangrove', name: '水筆仔', img: './assets/水筆仔.jpg', isEstuary: true },
    { id: 'fiddler_crab', name: '弧邊招潮蟹', img: './assets/弧邊招潮蟹.jpg', isEstuary: true },
    { id: 'mudskipper', name: '彈塗魚', img: './assets/彈塗魚.jpg', isEstuary: true },
    { id: 'whale', name: '大翅鯨', img: './assets/大翅鯨.jpg', isEstuary: false },
    { id: 'giant_isopod', name: '大王具足蟲', img: './assets/大王具足蟲.jpg', isEstuary: false },
    { id: 'yellow_water_lily', name: '萍蓬草', img: './assets/萍蓬草.jpg', isEstuary: false },
    { id: 'zacco', name: '溪哥', img: './assets/溪哥.jpg', isEstuary: false },
    { id: 'moss', name: '蘚苔', img: './assets/蘚苔.jpg', isEstuary: false },
  ];

  const shuffledEstuaryOrganisms = useMemo(() => [...estuaryOrganismPool].sort(() => Math.random() - 0.5), []);

  const toggleEstuaryOrganism = (id: string) => {
    const isCorrect = estuaryOrganismPool.find(o => o.id === id)?.isEstuary;
    onScore?.(`estuary_org_${id}`, !!isCorrect);
    setSelectedEstuaryOrganisms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isOrganismTaskCorrect = useMemo(() => {
    const estuaryIds = estuaryOrganismPool.filter(o => o.isEstuary).map(o => o.id);
    const nonEstuaryIds = estuaryOrganismPool.filter(o => !o.isEstuary).map(o => o.id);
    return estuaryIds.every(id => selectedEstuaryOrganisms.includes(id)) && 
           !nonEstuaryIds.some(id => selectedEstuaryOrganisms.includes(id));
  }, [selectedEstuaryOrganisms]);

  const handlePlaceInChain = (name: string, pos: string) => {
    const correctAnswers: Record<string, string> = { '1': '有機碎屑', '2': '弧邊招潮蟹', '3': '彈塗魚' };
    onScore?.(`estuary_chain_${pos}`, name === correctAnswers[pos]);
    setPlacedChain(p => ({ ...p, [pos]: name }));
  };

  const isCorrectBlanks = Object.keys(blanks).length === 3;
  const isCorrectChain = placedChain['1'] === '有機碎屑' && placedChain['2'] === '弧邊招潮蟹' && placedChain['3'] === '彈塗魚';
  
  const isQuizCorrect = quizAnswers.time === '11:20' && 
                       quizAnswers.tide === '滿潮' && 
                       quizAnswers.feature === '隨漲退潮劇烈變化';
  
  const isAdaptationCorrect = 
    adaptationAnswers.roots_s === "支持根" && 
    adaptationAnswers.roots_a === "增加支撐力，防止傾倒" &&
    adaptationAnswers.seeds_s === "胎生苗" && 
    adaptationAnswers.seeds_a === "避免被潮水沖走，下落即定植";

  return (
    <div className="space-y-8">
      <SectionHeader title="河口生態系" icon={<Anchor />} color="text-teal-500" />
      
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-teal-700">
          <Info size={20} /> 生生不息的灘地
        </h3>
        <p className="mb-4">
          河口生態系位於河流與海洋的交界處，其
          <FillInTheBlank 
            options={['鹽度變化劇烈', '溫度恆定', '淡水流動']} 
            correct="鹽度變化劇烈" 
            qid="estuary_blank_1"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 1: true }))}
          />
          ，是高度挑戰性的環境。
        </p>
        <p className="mb-4">
          著名的紅樹林植物（如水筆仔）具有特殊的
          <FillInTheBlank 
            options={['胎生苗', '針狀葉', '防風構造']} 
            correct="胎生苗" 
            qid="estuary_blank_2"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 2: true }))}
          />
          ，避免幼苗被潮水沖走。
        </p>
        <p>
          河口充滿了大量漂浮的
          <FillInTheBlank 
            options={['有機碎屑', '大型海草', '冰山碎片']} 
            correct="有機碎屑" 
            qid="estuary_blank_3"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 3: true }))}
          />
          ，吸引了多樣生物前來覓食及繁殖。
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: Tide & Salinity Simulation - Full Width with Horizontal Split */}
        <div className={cn("p-8 rounded-3xl transition-all duration-500 border border-slate-200 shadow-sm", salinity < 10 ? "bg-cyan-50" : salinity < 25 ? "bg-teal-50" : "bg-blue-50")}>
          <div className="mb-6">
             <h3 className="text-2xl font-bold flex items-center gap-2 text-teal-800">
               <Anchor /> 漲退潮與鹽度模擬
             </h3>
             <p className="text-sm text-slate-500 mt-1">地理觀測：新竹頭前溪河口 5 月某日潮位與鹽度變化聯動數據</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left side: Tide Graph */}
            <div className="space-y-6">
              <div className="h-64 relative z-0 bg-white/40 p-4 rounded-2xl border border-teal-100">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tideData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="time" hide />
                       <YAxis domain={[-250, 250]} hide />
                       <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} label={{ value: '平均海平面', position: 'insideBottomRight', fontSize: 10, fill: '#94a3b8' }} />
                       <Line 
                         type="monotone" 
                         dataKey="height" 
                         stroke="#0d9488" 
                         strokeWidth={4} 
                         dot={{ r: 8, fill: '#0d9488', strokeWidth: 3, stroke: '#fff' }} 
                         activeDot={{ r: 10 }}
                       />
                       <Tooltip 
                         content={({ active, payload }) => {
                           if (active && payload && payload.length) {
                             return (
                               <div className="bg-white p-2 rounded shadow-lg border border-teal-100 text-xs">
                                 <p className="font-bold text-teal-700">{payload[0].payload.time}</p>
                                 <p>潮位: {payload[0].value} cm</p>
                               </div>
                             );
                           }
                           return null;
                         }}
                       />
                    </LineChart>
                 </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">觀測時間</p>
                    <p className="text-2xl font-black text-teal-700">{currentTide.time}</p>
                 </div>
                 <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm text-right">
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">模擬鹽度值</p>
                    <p className={cn("text-2xl font-black", salinity < 10 ? "text-cyan-600" : "text-teal-600")}>
                       {salinity} ‰
                    </p>
                 </div>
              </div>

              <div className="flex gap-2">
                {tideData.map((d, i) => (
                  <button
                    key={d.time}
                    onClick={() => setSelectedTimeIndex(i)}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold rounded-xl transition-all border-2",
                      selectedTimeIndex === i 
                        ? "bg-teal-500 text-white border-teal-600 shadow-lg scale-105" 
                        : "bg-white text-slate-500 border-slate-100 hover:bg-teal-50 hover:border-teal-200"
                    )}
                  >
                    {d.time}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Quiz Content */}
            <div className="bg-white/50 p-8 rounded-3xl border border-teal-100/50 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-teal-100">
                <div className="bg-teal-500 text-white p-2 rounded-lg">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-teal-900">觀測任務：鹽度科學探究</h4>
                  <p className="text-sm text-slate-500 italic">請根據圖表與模擬器的數據變化進行研判</p>
                </div>
              </div>

              <div className="space-y-8 py-2">
                 <div className="space-y-4">
                    <p className="text-lg font-bold text-slate-700">1. 根據數據，哪個時間點水域鹽度會達到最高？</p>
                    <div className="flex gap-3 flex-wrap">
                      {['06:15', '11:20', '18:47'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setEstuaryQuizAns('time', t)}
                          className={cn(
                            "px-6 py-3 text-lg font-bold rounded-xl transition-all border-2", 
                            quizAnswers.time === t ? "bg-teal-600 text-white border-teal-700 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-lg font-bold text-slate-700">2. 此時河口水位的物理狀態是？</p>
                    <div className="flex gap-3">
                      {['滿潮', '乾潮'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setEstuaryQuizAns('tide', t)}
                          className={cn(
                            "px-8 py-3 text-lg font-bold rounded-xl transition-all border-2", 
                            quizAnswers.tide === t ? "bg-teal-600 text-white border-teal-700 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-lg font-bold text-slate-700">3. 頭前溪河口生態系的鹽度環境有什麼特色？</p>
                    <div className="grid grid-cols-1 gap-3">
                      {['穩定不變', '隨漲退潮劇烈變化', '永遠跟淡水一樣'].map(f => (
                        <button 
                          key={f}
                          onClick={() => setEstuaryQuizAns('feature', f)}
                          className={cn(
                            "text-left px-6 py-3 text-lg font-bold rounded-xl transition-all border-2", 
                            quizAnswers.feature === f ? "bg-teal-600 text-white border-teal-700 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Ecological Features - Standalone Block */}
        <div className="bg-teal-900 text-white p-10 rounded-3xl border border-teal-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400 opacity-5 blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10">
            <div>
              <h3 className="text-3xl font-black flex items-center gap-3 mb-4 text-white">
                 <Info className="text-teal-400" size={32} /> 河口生態環境特色
              </h3>
              <p className="text-teal-100/60 text-base font-bold tracking-widest mb-8">ESTUARINE ENVIRONMENTAL CHARACTERISTICS</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-105 group">
                  <div className="bg-teal-400/20 p-4 rounded-2xl shrink-0 w-fit group-hover:bg-teal-400 group-hover:text-teal-950 transition-colors">
                    <Droplets size={32} />
                  </div>
                  <div>
                     <p className="text-xl font-black text-teal-200 mb-2">劇烈變化的棲地</p>
                     <p className="text-teal-100/70 text-lg leading-relaxed">此區生物必須能忍受鹽度在短時間內的極端漲跌，以及水位高低的頻繁交替。</p>
                  </div>
               </div>
               <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-105 group">
                  <div className="bg-teal-400/20 p-4 rounded-2xl shrink-0 w-fit group-hover:bg-teal-400 group-hover:text-teal-950 transition-colors">
                    <Zap size={32} />
                  </div>
                  <div>
                     <p className="text-xl font-black text-teal-200 mb-2">豐富的生命能量源</p>
                     <p className="text-teal-100/70 text-lg leading-relaxed">河川攔截來自上游的有機物質，在此堆積形成豐富的「有機碎屑」，成為生產力的基礎。</p>
                  </div>
               </div>
               <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-105 group">
                  <div className="bg-teal-400/20 p-4 rounded-2xl shrink-0 w-fit group-hover:bg-teal-400 group-hover:text-teal-950 transition-colors">
                    <Bird size={32} />
                  </div>
                  <div>
                     <p className="text-xl font-black text-teal-200 mb-2">幼生生物的避風港</p>
                     <p className="text-teal-100/70 text-lg leading-relaxed">茂密的紅樹林根系提供了絕佳的隱蔽場所與豐沛食物，是沿海魚類與節肢動物的育幼室。</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Section 3: Kandelia obovata Adaptation - Standalone Block */}
        <div className="bg-slate-900 text-white p-10 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-30" />
           
           <div className="flex flex-col lg:flex-row gap-12">
             {/* Left side: Interactive Image */}
             <div className="lg:w-1/2 flex flex-col">
                <div className="mb-8">
                   <h3 className="text-3xl font-black flex items-center gap-3 text-white">
                      <Trees className="text-teal-400" size={32} /> 水筆仔的生存挑戰
                   </h3>
                   <p className="text-teal-300/60 font-bold tracking-widest mt-1">STRUCTURAL ADAPTATIONS & SURVIVAL STRATEGY</p>
                </div>

                <div className="relative flex-1 rounded-3xl border-4 border-teal-500/30 overflow-hidden shadow-2xl bg-teal-950/40 aspect-[3/4] max-h-[700px] mx-auto lg:mx-0">
                  <img src="./assets/水筆仔支持根胎生苗.jpeg" alt="水筆仔示意圖" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-transparent to-transparent opacity-60" />
                  
                  {/* Interactive Hotspots */}
                  <div className="absolute inset-0">
                     <button 
                       onClick={() => setShowExplanation('roots')}
                       className="absolute bottom-[20%] left-1/3 bg-white/90 hover:bg-teal-400 text-teal-950 px-6 py-3 rounded-full text-base font-black shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center gap-2"
                     >
                       <HelpCircle size={20} /> 觀察支持根
                     </button>
                     <button 
                       onClick={() => setShowExplanation('seeds')}
                       className="absolute top-[30%] right-1/4 bg-white/90 hover:bg-teal-400 text-teal-950 px-6 py-3 rounded-full text-base font-black shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center gap-2"
                     >
                       <HelpCircle size={20} /> 觀察胎生苗
                     </button>
                  </div>

                  {/* Square Explanation Panel */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex items-center justify-center p-8 z-20 pointer-events-none"
                      >
                         <div className="bg-teal-950/95 w-full aspect-square max-w-[320px] rounded-2xl border-2 border-teal-400/50 p-8 shadow-2xl pointer-events-auto relative flex flex-col justify-center">
                            <button onClick={() => setShowExplanation(null)} className="absolute top-4 right-4 text-teal-300 hover:text-white transition-colors bg-white/10 p-1 rounded-full">
                              <X size={24} />
                            </button>
                            <div className="text-center space-y-6">
                               <div className="mx-auto w-20 h-20 bg-teal-400/20 rounded-full flex items-center justify-center">
                                  {showExplanation === 'roots' ? <Anchor className="text-teal-400" size={40} /> : <Trees className="text-teal-400" size={40} />}
                               </div>
                               <div>
                                 <h5 className="font-black text-2xl text-teal-100 italic mb-2">
                                   {showExplanation === 'roots' ? "支持根" : "胎生苗"}
                                 </h5>
                                 <p className="text-lg text-teal-50/90 leading-relaxed font-medium">
                                   {showExplanation === 'roots' 
                                     ? "分布於地表底部，放射狀撐開，防止因軟泥不穩而隨時傾斜。" 
                                     : "種子在母體上發芽，發育成筆狀胚莖，具備重力下墜直接定植的優勢。"}
                                 </p>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             </div>

             {/* Right side: Dual Selection Quiz */}
             <div className="lg:w-1/2 flex flex-col justify-center space-y-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-6 py-2 rounded-full text-base font-black border border-rose-500/30 shadow-lg">
                    <AlertCircle size={20} /> 生存課題一：河口鬆軟淤泥
                  </div>
                  <h4 className="text-3xl font-black text-white leading-tight">任務：選擇對應的生存構造與優勢</h4>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                       <p className="text-base font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-4 bg-teal-400 rounded-full" /> 步驟 1：選擇對應構造
                       </p>
                       <div className="flex flex-wrap gap-3">
                         {adaptationStructures.map(s => (
                           <button
                             key={s}
                             onClick={() => handleAdaptationScore('roots_s', s)}
                             className={cn(
                               "px-6 py-3 text-lg font-black rounded-xl border-2 transition-all",
                               adaptationAnswers.roots_s === s 
                                ? (s === "支持根" ? "bg-teal-500 border-teal-400 text-teal-950 shadow-lg" : "bg-red-500/20 border-red-500 text-red-200")
                                : "bg-white/5 border-white/10 hover:border-teal-400/50"
                             )}
                           >
                             {s}
                           </button>
                         ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-base font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-4 bg-teal-400 rounded-full" /> 步驟 2：對應生存優勢
                       </p>
                       <div className="grid gap-3">
                         {adaptationAdvantages.map(a => (
                           <button
                             key={a}
                             onClick={() => handleAdaptationScore('roots_a', a)}
                             className={cn(
                               "text-left px-6 py-4 text-base font-bold rounded-xl border-2 transition-all",
                               adaptationAnswers.roots_a === a 
                                 ? (a.includes("支撐") ? "bg-teal-500/30 border-teal-500 text-teal-50" : "bg-red-500/20 border-red-500 text-red-200")
                                 : "bg-white/5 border-white/10 hover:border-teal-400/50"
                             )}
                           >
                             {a}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-6 py-2 rounded-full text-base font-black border border-blue-500/30 shadow-lg">
                    <Waves size={20} /> 生存課題二：潮汐每日沖刷
                  </div>
                  <h4 className="text-3xl font-black text-white">任務：選擇對應的開拓構造與優勢</h4>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                       <p className="text-base font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-4 bg-teal-400 rounded-full" /> 步驟 1：選擇對應構造
                       </p>
                       <div className="flex flex-wrap gap-3">
                         {adaptationStructures.map(s => (
                           <button
                             key={s}
                             onClick={() => handleAdaptationScore('seeds_s', s)}
                             className={cn(
                               "px-6 py-3 text-lg font-black rounded-xl border-2 transition-all",
                               adaptationAnswers.seeds_s === s 
                                 ? (s === "胎生苗" ? "bg-teal-500 border-teal-400 text-teal-950 shadow-lg" : "bg-red-500/20 border-red-500 text-red-200")
                                 : "bg-white/5 border-white/10 hover:border-teal-400/50"
                             )}
                           >
                             {s}
                           </button>
                         ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-base font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-4 bg-teal-400 rounded-full" /> 步驟 2：對應生存優勢
                       </p>
                       <div className="grid gap-3">
                         {adaptationAdvantages.map(a => (
                           <button
                             key={a}
                             onClick={() => handleAdaptationScore('seeds_a', a)}
                             className={cn(
                               "text-left px-6 py-4 text-base font-bold rounded-xl border-2 transition-all",
                               adaptationAnswers.seeds_a === a 
                                 ? (a.includes("潮水") ? "bg-teal-500/30 border-teal-500 text-teal-50" : "bg-red-500/20 border-red-500 text-red-200")
                                 : "bg-white/5 border-white/10 hover:border-teal-400/50"
                             )}
                           >
                             {a}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>

                {isAdaptationCorrect && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mt-8 p-8 bg-teal-500/20 rounded-3xl text-center border-2 border-teal-500/50 shadow-2xl"
                   >
                     <p className="text-teal-300 font-black text-2xl flex items-center justify-center gap-3">
                       <Trophy size={32} /> 適應成功：水筆仔已成功紮根立足！
                     </p>
                   </motion.div>
                )}
             </div>
           </div>
        </div>

        {/* Section 4: Food Chain Mission - Standalone Block */}
        <div className="bg-teal-900 text-white p-12 rounded-3xl border border-teal-800 shadow-2xl overflow-hidden relative">
           <div className="text-center mb-12">
             <h3 className="text-3xl font-black text-teal-100 mb-4 flex items-center justify-center gap-3">
               <Zap className="text-teal-400" /> 重建紅樹林食物鏈
             </h3>
             <p className="text-teal-200/60 text-lg font-medium">請將生物名稱點選至正確的營養層級位置</p>
           </div>

           <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-16">
              {['1', '2', '3'].map((pos, idx) => (
                <React.Fragment key={pos}>
                  <div className="flex flex-col items-center gap-4 group">
                    <div className="bg-white/10 w-48 h-24 rounded-3xl border-2 border-dashed border-teal-400/50 flex items-center justify-center text-xl font-black text-teal-200 shadow-inner group-hover:border-teal-400 transition-all">
                      {placedChain[pos] || `層級 ${pos}`}
                    </div>
                    <div className="bg-teal-800 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest text-teal-400 border border-teal-700">
                      {pos === '1' ? '基礎生產者 (碎屑)' : pos === '2' ? '初級消費者' : '次級消費者'}
                    </div>
                  </div>
                  {idx < 2 && (
                    <div className="flex items-center justify-center">
                      <ArrowRight className="hidden md:block text-teal-500/50" size={32} />
                      <ArrowDown className="block md:hidden text-teal-500/50" size={32} />
                    </div>
                  )}
                </React.Fragment>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {['有機碎屑', '弧邊招潮蟹', '彈塗魚'].map(creature => (
                <div key={creature} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-6 hover:bg-white/10 transition-all hover:scale-105">
                  <span className="text-xl font-black text-teal-100">{creature}</span>
                  <div className="flex gap-2 w-full">
                    {['1', '2', '3'].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePlaceInChain(creature, p)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-sm font-black transition-all border",
                          placedChain[p] === creature 
                            ? "bg-teal-400 border-teal-400 text-teal-950 scale-110 shadow-lg ring-4 ring-teal-400/30" 
                            : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-teal-400/50 text-white"
                        )}
                      >
                        P{p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-teal-800">
           <Bird className="text-teal-500" /> 生物多樣性：尋找河口居民
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           {shuffledEstuaryOrganisms.map((org) => (
             <button
               key={org.id}
               onClick={() => toggleEstuaryOrganism(org.id)}
               className={cn(
                 "group relative bg-slate-50 rounded-2xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center gap-2",
                 selectedEstuaryOrganisms.includes(org.id)
                  ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20 shadow-md"
                  : "border-slate-100 hover:border-teal-300 hover:bg-white"
               )}
             >
                <div className="aspect-square w-full rounded-xl overflow-hidden">
                   <img 
                     src={org.img} 
                     alt={org.name} 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                     referrerPolicy="no-referrer"
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.src = `https://placehold.co/200x200/f0fdfa/0d9488?text=${org.name}`;
                     }}
                   />
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  selectedEstuaryOrganisms.includes(org.id) ? "text-teal-700" : "text-slate-600"
                )}>
                  {org.name}
                </span>
                {selectedEstuaryOrganisms.includes(org.id) && (
                  <div className="absolute top-3 right-3 bg-teal-500 text-white rounded-full p-0.5 shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}
             </button>
           ))}
        </div>
      </div>

      {/* YouTube Video Section for Estuary */}
      <div className="bg-teal-50 p-8 rounded-3xl border border-teal-100 mt-12 overflow-hidden shadow-sm">
        <h3 className="text-2xl font-black text-teal-800 mb-4 flex items-center gap-2">
          <Info size={24} className="text-teal-500" /> 河口生態系：探索延伸
        </h3>
        <p className="text-teal-700 mb-8 font-medium">若你完成所有內容，可以回來觀看此段影片。</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-teal-900 font-bold text-lg">紅樹林保衛河口生態系　過濾雜質淨化海洋</p>
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-teal-900/10">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/PeqRCcmPzkQ" 
                title="紅樹林保衛河口生態系　過濾雜質淨化海洋" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-teal-900 font-bold text-lg">濁水溪北岸紅樹林危機 環團批影響生態、排水</p>
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-teal-900/10">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/FJyAm3H56sY" 
                title="濁水溪北岸紅樹林危機 環團批影響生態、排水" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {isCorrectBlanks && isCorrectChain && isOrganismTaskCorrect && isQuizCorrect && isAdaptationCorrect && <CompleteButton onClick={onComplete} />}
    </div>
  );
}

// 8. Marine Section
function MarineSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [scrollDepth, setScrollDepth] = useState(0);
  const [horizontalDist, setHorizontalDist] = useState(0);
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [confirmedZones, setConfirmedZones] = useState<string[]>([]);
  const [marineQuiz, setMarineQuiz] = useState<Record<string, string>>({});

  const [producerQuiz, setProducerQuiz] = useState<Record<string, string>>({});
  const [discoveredMarineSnow, setDiscoveredMarineSnow] = useState(false);

  const handleProducerClick = (zone: string, type: string) => {
    const isCorrect = (zone === '潮間帶' && type === '大型藻類') ||
                      (zone === '淺海區' && type === '大型藻類') ||
                      (zone === '大洋區上層' && type === '浮游藻類') ||
                      (zone === '大洋區下層' && type === '無生產者');
    
    onScore?.(`marine_producer_${zone}`, isCorrect);
    setProducerQuiz(p => ({ ...p, [zone]: type }));
  };

  const getRegionInfo = () => {
    if (scrollDepth === 0) return { id: 'surface', label: '大洋區表面', desc: '海洋的最表層，與大氣直接接觸，陽光最充足。', color: 'text-sky-400' };
    if (scrollDepth <= 200) return { id: 'photic', label: '大洋區透光區', desc: '陽光可穿透的區域，生產者主要是浮游藻類，生物種類豐富。', color: 'text-blue-400' };
    return { id: 'aphotic', label: '大洋區不透光區', desc: '陽光無法到達，完全黑暗且壓力大。生物需依賴上方下沉的生物屍體、糞便 or 有機碎片形成的「海雪」作為主食。', color: 'text-indigo-900' };
  };

  const getHorizontalInfo = () => {
    if (horizontalDist < 10) return { id: 'intertidal_h', label: '潮間帶', desc: '陸地與海洋的交界', color: 'from-amber-500 to-amber-600' };
    if (horizontalDist < 45) return { id: 'neritic_h', label: '淺海區域', desc: '水深 200m 以內的大陸棚', color: 'from-emerald-500 to-emerald-600' };
    return { id: 'oceanic_h', label: '大洋區域', desc: '遠離陸地，深不見底的區域', color: 'from-blue-600 to-blue-700' };
  };

  const region = getRegionInfo();
  const hRegion = getHorizontalInfo();
  const isBlanksDone = Object.keys(blanks).length === 4;
  
  const isQuizCorrect = marineQuiz.shelf === '200' && 
                        marineQuiz.light === '200' && 
                        marineQuiz.vertical === '大洋區透光區' && 
                        marineQuiz.neritic === '大陸棚';

  const isProducerCorrect = 
    producerQuiz['潮間帶'] === '大型藻類' &&
    producerQuiz['淺海區'] === '大型藻類' &&
    producerQuiz['大洋區上層'] === '浮游藻類' &&
    producerQuiz['大洋區下層'] === '無生產者';

  const confirmZone = () => {
    if (!confirmedZones.includes(region.id)) {
      setConfirmedZones([...confirmedZones, region.id]);
      onScore?.(`marine_zone_${region.id}`, true);
    }
  };

  return (
    <div className="space-y-16">
      <SectionHeader title="海洋生態系" icon={<Waves />} color="text-blue-500" />

      {/* 1. 基本重點 (Basic Points) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-700">
          <Info size={20} /> 海洋環境概況
        </h3>
        <p className="mb-4">
          海洋佔地球表面積約
          <FillInTheBlank 
            options={['70%', '50%', '90%']} 
            correct="70%" 
            qid="marine_blank_1"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 1: true }))}
          />
          ，是地球上最大的生態系。
        </p>
        <p className="mb-4">
          海洋含有豐富的
          <FillInTheBlank 
            options={['鹽分', '淡水', '重金屬']} 
            correct="鹽分" 
            qid="marine_blank_2"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 2: true }))}
          />
          ，平均鹽度約為 3.5%。
        </p>
        <p className="mb-4">
          海洋的透光區通常指水深
          <FillInTheBlank 
            options={['100', '200', '1000']} 
            correct="200" 
            qid="marine_blank_3"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 3: true }))}
          />
          公尺以內的區域。
        </p>
        <p>
          在淺海區，水深 200m 以內的平緩地殼區稱為
          <FillInTheBlank 
            options={['大陸棚', '大陸坡', '海溝']} 
            correct="大陸棚" 
            qid="marine_blank_4"
            onScore={onScore}
            onCorrect={() => setBlanks(p => ({ ...p, 4: true }))}
          />
          。
        </p>
      </div>

      {/* 2. 海洋水平結構 (水平探索) */}
      <div className="bg-white p-8 rounded-[3rem] border border-blue-100 shadow-xl overflow-hidden relative">
        <div className="mb-8">
           <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Map className="text-blue-500" /> 海洋水平結構 (水平探索)
           </h3>
           <p className="text-slate-500 mt-2">拖動下方拉桿，觀察潮間帶、淺海區與大洋區的劃分區別</p>
        </div>

        <div className="relative h-80 rounded-3xl mb-12 shadow-inner overflow-hidden border-4 border-white/50 bg-blue-100">
           {/* Background Image */}
           <div 
             className="absolute inset-0 bg-cover bg-bottom opacity-90 transition-opacity"
             style={{ backgroundImage: `url('./assets/海洋地形圖.png')` }}
           />
           
           {/* Marker Component */}
           <motion.div 
             className="absolute bottom-12 left-0 z-20"
             animate={{ left: `${horizontalDist}%` }}
             transition={{ type: 'spring', damping: 25, stiffness: 120 }}
             style={{ x: '-50%' }}
           >
             <Ship size={50} className="text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
             <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-blue-600 mt-1 whitespace-nowrap shadow-xl border border-blue-100">
               探索位置: {Math.round(horizontalDist)}%
             </div>
           </motion.div>

           {/* Labels on Map */}
           <div className="absolute inset-x-0 bottom-4 flex h-6 text-[10px] font-black text-white/80 pointer-events-none">
              <div className="h-full flex items-center justify-center" style={{ width: '20%' }}>
                 <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">潮間帶</span>
              </div>
              <div className="h-full flex items-center justify-center" style={{ width: '40%' }}>
                 <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">淺海區 (大陸棚)</span>
              </div>
              <div className="h-full flex items-center justify-center" style={{ width: '40%' }}>
                 <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">大洋區</span>
              </div>
           </div>
        </div>

        {/* 1. Visible Slider Control */}
        <div className="max-w-2xl mx-auto mb-12 px-8">
           <div className="flex flex-col gap-2">
             <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                <span>海岸線</span>
                <span>核心大洋</span>
             </div>
             <div className="relative flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <ArrowLeft className="text-blue-400" size={20} />
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={horizontalDist}
                  onChange={(e) => setHorizontalDist(parseInt(e.target.value))}
                  className="flex-1 h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
                />
                <ArrowRight className="text-blue-400" size={20} />
             </div>
           </div>
        </div>

        {/* 2. Horizontal Regions Layout A, B, C */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className={cn(
             "p-6 rounded-[2rem] border-2 transition-all cursor-pointer", 
             horizontalDist < 20 ? "bg-amber-50 border-amber-200 shadow-md scale-[1.02]" : "bg-white border-slate-100 opacity-60 grayscale-[0.5]"
           )} onClick={() => setHorizontalDist(10)}>
              <div className="flex items-center gap-2 mb-2">
                 <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">A</span>
                 <h4 className="font-black text-slate-800">潮間帶</h4>
              </div>
              <p className="text-xs text-slate-500 leading-tight">漲潮與退潮之間的區域，環境變化極端，生物需克服缺水與波浪衝擊。</p>
           </div>

           <div className={cn(
             "p-6 rounded-[2rem] border-2 transition-all cursor-pointer", 
             horizontalDist >= 20 && horizontalDist < 60 ? "bg-emerald-50 border-emerald-200 shadow-md scale-[1.02]" : "bg-white border-slate-100 opacity-60 grayscale-[0.5]"
           )} onClick={() => setHorizontalDist(40)}>
              <div className="flex items-center gap-2 mb-2">
                 <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">B</span>
                 <h4 className="font-black text-slate-800">淺海區 (大陸棚)</h4>
              </div>
              <p className="text-xs text-slate-500 leading-tight">水深 200m 內的大陸棚，陽光充足且多營養鹽，生物種類最豐富。</p>
           </div>

           <div className={cn(
             "p-6 rounded-[2rem] border-2 transition-all cursor-pointer", 
             horizontalDist >= 60 ? "bg-blue-50 border-blue-200 shadow-md scale-[1.02]" : "bg-white border-slate-100 opacity-60 grayscale-[0.5]"
           )} onClick={() => setHorizontalDist(80)}>
              <div className="flex items-center gap-2 mb-2">
                 <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">C</span>
                 <h4 className="font-black text-slate-800">大洋區</h4>
              </div>
              <p className="text-xs text-slate-500 leading-tight">遠離陸地、海床陡降的區域。分為上方透光區與深層黑暗區。</p>
           </div>
        </div>
      </div>

      {/* 3. 海洋深度探索 (垂直分層) */}
      <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200">
        <div className="mb-8">
           <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Anchor className="text-blue-600" /> 海洋深度探索 (垂直分層)
           </h3>
           <p className="text-slate-500 mt-2">利用潛水艇拉桿，觀察不同深度的海洋樣貌與分層特徵</p>
        </div>

        <div className="relative h-[500px] bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl">
          <div 
             className="absolute inset-0 transition-opacity duration-1000 bg-cover bg-center"
             style={{ 
               backgroundImage: `url('./assets/${scrollDepth === 0 ? '海洋表面.png' : scrollDepth <= 200 ? '海洋透光.png' : '海洋不透光.png'}')`,
               opacity: 0.6
             }}
          />
          <div 
             className="absolute inset-0 transition-colors duration-1000"
             style={{ backgroundColor: `rgba(0, 30, 80, ${scrollDepth / 1000})` }}
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 pointer-events-none">
              <motion.div 
                initial={false}
                animate={{ y: scrollDepth > 300 ? -20 : 0 }}
                className="bg-white/95 p-6 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-md max-w-sm text-center pointer-events-auto"
              >
                 <p className={cn("text-3xl font-black mb-1", region.color)}>水深: {scrollDepth} m</p>
                 <p className="text-lg font-bold text-slate-900 mb-2">{region.label}</p>
                 <p className="text-sm text-slate-500 mb-4 px-4">{region.desc}</p>
                 
                 {region.id === 'aphotic' && (
                   <div className="mb-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-left">
                      <p className="text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1">
                        <Droplets size={12} className="text-indigo-400" /> 黑暗中的能量來源：海雪
                      </p>
                      <p className="text-[10px] text-indigo-600 leading-tight">
                        在缺乏光合作用的深海，生物依賴上方下沉的生物屍體、糞便 or 有機碎片形成的「海雪」作為主食。
                      </p>
                      {!discoveredMarineSnow && (
                        <button 
                          onClick={() => {
                            setDiscoveredMarineSnow(true);
                            onScore?.('marine_snow', true);
                          }}
                          className="mt-2 w-full py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          採集海雪樣本
                        </button>
                      )}
                      {discoveredMarineSnow && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle2 size={12} /> 已了解深海食物來源
                        </div>
                      )}
                   </div>
                 )}

                 <button 
                  onClick={confirmZone}
                  className={cn(
                    "px-8 py-2.5 rounded-full font-black text-sm transition-all shadow-lg",
                    confirmedZones.includes(region.id) ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "bg-blue-600 text-white hover:scale-105 active:scale-95"
                  )}
                 >
                   {confirmedZones.includes(region.id) ? "探索完成 ✓" : "點擊探索此區域"}
                 </button>
              </motion.div>
          </div>

          {/* Vertical Control Area */}
          <div 
             className="absolute right-12 top-10 bottom-10 w-16 group cursor-pointer"
             onMouseDown={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const handleMove = (moveEvent: MouseEvent) => {
                 const y = Math.max(0, Math.min(moveEvent.clientY - rect.top, rect.height));
                 setScrollDepth(Math.round((y / rect.height) * 600));
               };
               const handleUp = () => {
                 window.removeEventListener('mousemove', handleMove);
                 window.removeEventListener('mouseup', handleUp);
               };
               window.addEventListener('mousemove', handleMove);
               window.addEventListener('mouseup', handleUp);
               handleMove(e.nativeEvent as unknown as MouseEvent);
             }}
             onTouchStart={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const touch = e.touches[0];
               const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
               setScrollDepth(Math.round((y / rect.height) * 600));
             }}
             onTouchMove={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const touch = e.touches[0];
               const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
               setScrollDepth(Math.round((y / rect.height) * 600));
             }}
          >
             {/* Slider Track */}
             <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-white/10 rounded-full border border-white/5 overflow-hidden pointer-events-none">
                <div className="w-full bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all" style={{ height: `${(scrollDepth/600)*100}%` }} />
             </div>

             {/* Submarine (Anchor) Thumb Visual */}
             <motion.div 
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                animate={{ top: `${(scrollDepth/600)*100}%` }}
                style={{ y: '-50%' }}
             >
                <div className="relative group-hover:scale-110 transition-transform">
                   <div className="absolute inset-0 bg-blue-500/40 blur-xl rounded-full scale-150 animate-pulse" />
                   <Anchor size={48} className="text-blue-400 rotate-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" fill="currentColor" fillOpacity={0.2} />
                   <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-white/95 text-blue-900 px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap shadow-xl">
                      {scrollDepth} m
                   </div>
                </div>
             </motion.div>

             {/* Depth Markers */}
             <div className="absolute -left-12 inset-y-0 flex flex-col justify-between py-2 text-[10px] font-black text-white/30 lowercase">
                <span>0m</span>
                <span>200m</span>
                <span>400m</span>
                <span>600m</span>
             </div>
          </div>
        </div>
      </div>

      {/* 4. 海洋知識檢測 (Marine Knowledge Test) */}
      <div className="bg-white p-8 rounded-[3rem] border border-blue-100 shadow-xl">
         <h4 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-blue-500" /> 海洋知識檢測
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div className="space-y-3">
                  <p className="text-md font-bold text-slate-700">1. 常見的大陸棚水深限值約為多少公尺？</p>
                  <div className="flex gap-2">
                    {['50', '200', '1000'].map(v => (
                      <button 
                         key={v}
                         onClick={() => {
                            setMarineQuiz(p => ({ ...p, shelf: v }));
                            onScore?.('marine_quiz_shelf', v === '200');
                         }}
                         className={cn(
                           "flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all",
                           marineQuiz.shelf === v ? "bg-blue-600 text-white border-blue-700 shadow-md" : "bg-white text-slate-600 hover:border-blue-200"
                         )}
                      >
                        {v}m
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <p className="text-md font-bold text-slate-700">2. 根據光線穿透力，水深 0~200 公尺的垂直層稱為？</p>
                  <div className="flex gap-2">
                    {['大洋區透光區', '大洋區不透光區'].map(v => (
                      <button 
                         key={v}
                         onClick={() => {
                            setMarineQuiz(p => ({ ...p, vertical: v }));
                            onScore?.('marine_quiz_vertical', v === '大洋區透光區');
                         }}
                         className={cn(
                           "flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all",
                           marineQuiz.vertical === v ? "bg-blue-600 text-white border-blue-700 shadow-md" : "bg-white text-slate-600 hover:border-blue-200"
                         )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                  <p className="text-md font-bold text-slate-700">3. 在海洋中，行光合作用者的垂直分佈深度極限約是？</p>
                  <div className="flex gap-2">
                    {['50', '200', '1000'].map(v => (
                      <button 
                         key={v}
                         onClick={() => {
                            setMarineQuiz(p => ({ ...p, light: v }));
                            onScore?.('marine_quiz_light', v === '200');
                         }}
                         className={cn(
                           "flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all",
                           marineQuiz.light === v ? "bg-blue-600 text-white border-blue-700 shadow-md" : "bg-white text-slate-600 hover:border-blue-200"
                         )}
                      >
                        {v} m
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <p className="text-md font-bold text-slate-700">4. 淺海區底部平緩的地殼表面地形稱為？</p>
                  <div className="flex gap-2">
                    {['大陸棚', '深海溝', '中洋脊'].map(v => (
                      <button 
                         key={v}
                         onClick={() => {
                            setMarineQuiz(p => ({ ...p, neritic: v }));
                            onScore?.('marine_quiz_neritic', v === '大陸棚');
                         }}
                         className={cn(
                           "flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all",
                           marineQuiz.neritic === v ? "bg-blue-600 text-white border-blue-700 shadow-md" : "bg-white text-slate-600 hover:border-blue-200"
                         )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 5. 生產者大挑戰：誰住在哪裡？ */}
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8">
        <div>
           <h3 className="text-2xl font-bold flex items-center gap-2">
             <Sun className="text-yellow-400" /> 生產者大挑戰：誰住在哪裡？
           </h3>
           <p className="text-slate-400 mt-2 text-sm italic">根據環境光照與地形，正確排列各種海洋生產者</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {['潮間帶', '淺海區', '大洋區上層', '大洋區下層'].map(zone => (
             <div key={zone} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                <p className="text-sm font-black text-blue-400">{zone}</p>
                <div className="flex flex-col gap-2">
                   {['大型藻類', '浮游藻類', '無生產者'].map(type => (
                     <button
                       key={type}
                       onClick={() => handleProducerClick(zone, type)}
                       className={cn(
                         "py-2 px-4 rounded-xl text-xs font-bold transition-all border-2",
                         producerQuiz[zone] === type
                          ? "bg-blue-600 border-blue-400 text-white"
                          : "bg-white/5 border-white/5 hover:border-white/20 text-slate-400"
                       )}
                     >
                       {type}
                     </button>
                   ))}
                </div>
                {producerQuiz[zone] && (
                  <div className={cn(
                    "text-[10px] font-black text-center py-1 rounded-md",
                    ((zone === '潮間帶' && producerQuiz[zone] === '大型藻類') ||
                     (zone === '淺海區' && producerQuiz[zone] === '大型藻類') ||
                     (zone === '大洋區上層' && producerQuiz[zone] === '浮游藻類') ||
                     (zone === '大洋區下層' && producerQuiz[zone] === '無生產者')) 
                      ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {((zone === '潮間帶' && producerQuiz[zone] === '大型藻類') ||
                     (zone === '淺海區' && producerQuiz[zone] === '大型藻類') ||
                     (zone === '大洋區上層' && producerQuiz[zone] === '浮游藻類') ||
                     (zone === '大洋區下層' && producerQuiz[zone] === '無生產者')) 
                      ? "正確 ✓" : "再試試"}
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* YouTube Video Section for Marine */}
      <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 mt-12 overflow-hidden shadow-sm">
        <h3 className="text-2xl font-black text-blue-800 mb-4 flex items-center gap-2">
          <Info size={24} className="text-blue-500" /> 海洋生態系：探索延伸
        </h3>
        <div className="mb-6">
          <p className="text-blue-900 font-bold text-lg mb-1">一場碰撞促成了地球上數一數二壯觀的食物鏈...【深海殺手】短片精華版</p>
          <p className="text-blue-700 font-medium">若你完成所有內容，可以回來觀看此段影片。</p>
        </div>
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-blue-900/10">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/0vi3NaMpuBM" 
            title="一場碰撞促成了地球上數一數二壯觀的食物鏈...【深海殺手】短片精華版" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {isBlanksDone && confirmedZones.length >= 3 && isQuizCorrect && isProducerCorrect && discoveredMarineSnow && <CompleteButton onClick={onComplete} />}
    </div>
  );
}


// 9. Comparison Section
function ComparisonSection({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  
  const factors = [
    { id: 'rain_max', q: '陸域生態系中，哪一個年雨量最多？', a: '森林', options: ['森林', '草原', '沙漠'] },
    { id: 'rain_min', q: '陸域生態系中，哪一個年雨量最少？', a: '沙漠', options: ['草原', '沙漠', '凍原'] },
    { id: 'temp_min', q: '哪一個生態系的溫度最低且有永凍層？', a: '凍原', options: ['沙漠', '凍原', '溪流'] },
    { id: 'temp_diff', q: '日夜溫差最大的是哪一個生態系？', a: '沙漠', options: ['沙漠', '草原', '森林'] },
    { id: 'biodiversity', q: '陸域生態系中，哪一個的生物種類最多？', a: '森林', options: ['森林', '草原', '凍原'] },
    { id: 'no_light', q: '沒有陽光且能量來源依賴「海雪」的是？', a: '大洋區下層', options: ['淺海區', '大洋區下層', '河口'] },
    { id: 'salinity', q: '哪一個生態系的鹽度波動最大？', a: '河口', options: ['淡水', '海洋', '河口'] },
    { id: 'light', q: '海洋中哪一區光照最充足且生物最豐富？', a: '淺海區', options: ['潮間帶', '淺海區', '大洋區'] },
  ];

  const handleSelect = (id: string, val: string) => {
    setSelections(prev => ({ ...prev, [id]: val }));
    const f = factors.find(x => x.id === id);
    if (f) {
      onScore?.(`compare_${id}`, val === f.a);
    }
  };

  const isAllCorrect = factors.every(f => selections[f.id] === f.a);

  return (
    <div className="space-y-8">
      <SectionHeader title="生態系超級比一比" icon={<BarChart2 />} color="text-purple-500" />
      
      <div className="bg-white p-8 rounded-3xl shadow-xl space-y-8 border border-slate-100">
        <p className="text-sm text-slate-500 italic">只有搞清楚環境差異，才能成為真正的生態專家！</p>
        
        <div className="space-y-4">
           {factors.map(f => (
             <div key={f.id} className="flex flex-col gap-4 p-5 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm">
                <span className="font-bold text-purple-900 leading-snug">{f.q}</span>
                <div className="flex flex-wrap gap-2">
                  {f.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleSelect(f.id, opt)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-sm font-black transition-all border-2",
                        selections[f.id] === opt 
                          ? "bg-purple-600 text-white border-purple-700 shadow-lg scale-105" 
                          : "bg-white text-purple-600 border-purple-100 hover:border-purple-300"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selections[f.id] && selections[f.id] !== f.a && (
                  <p className="text-xs text-red-500 font-bold animate-pulse">再想一想喔！</p>
                )}
             </div>
           ))}
        </div>
      </div>

      {isAllCorrect && <CompleteButton onClick={onComplete} />}
    </div>
  );
}
// 10. Final Assessment
function FinalSection({ onComplete, onScore }: { onComplete?: () => void, onScore?: (qid: string, ok: boolean | number, attempts: number) => void }) {
  const [step, setStep] = useState(1);
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  
  const finalQuiz = [
    { 
      q: '關於「凍原生態系」的敘述，何者正確？', 
      options: ['降雨量非常豐富', '具有永凍層且生長季短', '以高大喬木為優勢植物'], 
      a: '具有永凍層且生長季短' 
    },
    { 
      q: '沙漠植物（如仙人掌）如何適應乾旱？', 
      options: ['葉片退化成針狀以減少蒸散', '具有廣大的葉片以吸收露水', '具有胎生苗以增加存活率'], 
      a: '葉片退化成針狀以減少蒸散' 
    },
    { 
      q: '哪一類生物「善於奔跑」或「具有穴居習性」，以適應遮蔽物少的環境？', 
      options: ['森林動物', '草原動物', '凍原動物'], 
      a: '草原動物' 
    },
    { 
      q: '關於「河口生態系」的特色，下列何者正確？', 
      options: ['鹽度非常穩定', '生物種類最多但數量最少', '含有豐富的營養鹽，生產力極高'], 
      a: '含有豐富的營養鹽，生產力極高' 
    },
    { 
      q: '「水筆仔」具備特殊的繁殖方式，稱為？', 
      options: ['胎生苗', '孢子繁殖', '營養器官繁殖'], 
      a: '胎生苗' 
    },
    { 
      q: '海洋中深度在 200 公尺以內的區域稱為？', 
      options: ['潮間帶', '淺海區', '大洋區'], 
      a: '淺海區' 
    },
    { 
      q: '下列哪一項對「潮間帶」生物的挑戰最大？', 
      options: ['陽光不足', '水壓過大', '水分喪失與海浪衝擊'], 
      a: '水分喪失與海浪衝擊' 
    },
    { 
      q: '大洋區透光帶最主要的生產者是？', 
      options: ['珊瑚', '浮游藻類', '大型海草'], 
      a: '浮游藻類' 
    },
  ];

  const handleAnswer = (ans: string) => {
    const currentAttempt = (attempts[step] || 0) + 1;
    const isCorrect = ans === finalQuiz[step-1].a;
    
    if (isCorrect) {
      onScore?.(`final_q_${step}`, true, currentAttempt);
      setWrongChoices([]);
      setStep(prev => prev + 1);
      
      if (step === finalQuiz.length) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#3b82f6', '#10b981']
        });
      }
    } else {
      if (!wrongChoices.includes(ans)) {
        setWrongChoices(prev => [...prev, ans]);
        setAttempts(prev => ({ ...prev, [step]: currentAttempt }));
        onScore?.(`final_q_${step}`, false, currentAttempt);
      }
    }
  };

  if (step > finalQuiz.length) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-2xl mx-auto"
      >
        <Trophy size={80} className="mx-auto text-yellow-500 mb-6 drop-shadow-lg" />
        <h2 className="text-4xl font-black mb-4">榮譽成就：生態大師</h2>
        <p className="text-xl text-slate-500 mb-8">
           恭喜！你已經完整探索並掌握了地球上所有的主要生態系。
        </p>
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-10 rounded-[2.5rem] border-2 border-yellow-200 inline-block relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
             <Trophy size={100} />
          </div>
          <p className="text-yellow-800 font-black text-3xl mb-2 relative z-10">🥇 官方認證探險家 🥇</p>
          <p className="text-slate-600 italic relative z-10">完成了所有的挑戰與考核。</p>
        </div>
        <div className="mt-12 flex flex-col items-center gap-4">
           <p className="text-sm text-slate-400">分享你的成就給朋友吧！</p>
           <div className="flex gap-4">
             <button 
               onClick={() => window.location.reload()}
               className="bg-slate-200 text-slate-700 px-8 py-3 rounded-full font-bold hover:bg-slate-300 transition-all active:scale-95"
             >
               再挑戰一次
             </button>
             <button 
               onClick={onComplete}
               className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
             >
               進入 AI 終極挑戰
             </button>
           </div>
        </div>
      </motion.div>
    );
  }

  const current = finalQuiz[step-1];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-4">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">最終考核 - 進度 {step} / {finalQuiz.length}</span>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${(step/finalQuiz.length)*100}%` }} />
        </div>
      </div>
      
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
        <h3 className="text-2xl font-bold mb-10 leading-relaxed text-slate-800">{current.q}</h3>
        <div className="space-y-4">
          {current.options.map((opt, i) => {
            const isWrong = wrongChoices.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => !isWrong && handleAnswer(opt)}
                disabled={isWrong}
                className={cn(
                  "w-full text-left px-8 py-5 rounded-2xl border-2 transition-all font-bold text-lg group flex items-center gap-4",
                  isWrong 
                    ? "bg-red-50 border-red-200 text-red-400 opacity-60 cursor-not-allowed" 
                    : "border-slate-50 hover:border-blue-500 hover:bg-blue-50"
                )}
              >
                <span className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isWrong ? "bg-red-100 text-red-500" : "bg-slate-100 group-hover:bg-blue-200 group-hover:text-blue-700"
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="grow">{opt}</span>
                {!isWrong && <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />}
                {isWrong && <AlertCircle className="text-red-400" size={20} />}
              </button>
            );
          })}
        </div>
        {wrongChoices.length > 0 && (
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center text-red-500 font-bold flex items-center justify-center gap-2"
          >
            <AlertCircle size={16} /> 答錯囉！再想一想（第一次就答對加100分，第二次加50分喔）
          </motion.p>
        )}
      </div>
    </div>
  );
}


function AISummaryChallenge({ onComplete, onScore }: { onComplete: () => void, onScore?: (qid: string, ok: boolean | number, attempts?: number) => void }) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{ score: number, feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await gradeAnswer(answer);
      
      setResult(data);
      setAttempts(prev => prev + 1);
      
      if (data.score >= 50) {
        onScore?.('ai_challenge', data.score, attempts + 1);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      console.error('Grading failed:', err);
      setError(err.message || '連線失敗或 API Key 尚未設定');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="AI 終極挑戰：生態圖表判讀" icon={<Zap />} color="text-indigo-600" />
      
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <img 
            src="./assets/生態系雨量溫度圖.png" 
            alt="生態系雨量溫度圖" 
            className="w-full h-auto rounded-2xl shadow-sm hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 italic text-sm text-indigo-800">
            提示：觀察圖表中的 X 軸（年平均降雨量）與 Y 軸（年平均溫度）。請記得「森林」形成的雨量門檻。
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4">題目：</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              請根據上圖，判斷標註為 <strong>甲、乙、丙、丁</strong> 的區域分別代表哪種生態系？並簡述你的判斷理由（請考慮降雨量對植被特徵的影響）。
            </p>
            
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="請在這裡輸入你的回答..."
              className="w-full h-48 p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-slate-700 font-medium"
              disabled={loading}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !answer.trim()}
              className={cn(
                "w-full mt-6 py-4 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3",
                loading 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  AI 老師閱卷中...
                </>
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  交給 AI 老師評分
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-8 rounded-[2.5rem] border-4 shadow-2xl relative overflow-hidden",
                result.score >= 80 ? "bg-emerald-50 border-emerald-500" : 
                result.score >= 60 ? "bg-amber-50 border-amber-500" : "bg-red-50 border-red-500"
              )}
            >
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <h4 className={cn(
                    "text-4xl font-black mb-2",
                    result.score >= 80 ? "text-emerald-700" : 
                    result.score >= 60 ? "text-amber-700" : "text-red-700"
                  )}>
                    得分：{result.score}
                  </h4>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">AI 老師評核意見</span>
                    <div className="h-[1px] grow bg-slate-200" />
                  </div>
                  <p className="text-slate-700 leading-relaxed font-bold italic">「{result.feedback}」</p>
                </div>
                {result.score >= 80 && <Trophy className="text-emerald-500 shrink-0" size={48} />}
              </div>
              
              {result.score >= 50 && (
                <div className="mt-8 flex justify-center">
                   <button 
                     onClick={() => onComplete?.()}
                     className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                   >
                     結業與領證 <Trophy size={18} />
                   </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Score Display in Challenge Area */}
      {result && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-36 right-8 z-40 hidden sm:block"
        >
          <div className="bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 p-5 rounded-[2rem] flex items-center gap-4 ring-1 ring-black/5">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
              result.score >= 80 ? "bg-emerald-100 text-emerald-600" : 
              result.score >= 60 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
            )}>
              <Zap size={24} fill="currentColor" className="opacity-20 absolute" />
              <Zap size={24} className="relative z-10" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter mb-0.5">當前 AI 挑戰得分</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800">{result.score}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Helper Components ---

function SectionHeader({ title, icon, color }: { title: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className={cn("p-3 rounded-2xl bg-white shadow-sm border border-slate-100", color)}>
        {React.cloneElement(icon as React.ReactElement, { size: 28 })}
      </div>
      <h2 className={cn("text-3xl font-black tracking-tight", color)}>{title}</h2>
    </div>
  );
}

function QuizItem({ question, options, selected, onSelect, dark }: { 
  question: string, options: string[], selected: string, onSelect: (s: string) => void, dark?: boolean 
}) {
  return (
    <div className="space-y-3">
      <p className={cn("font-bold text-sm", dark ? "text-slate-300" : "text-slate-700")}>{question}</p>
      <div className="flex gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
              selected === opt 
                ? (dark ? "bg-white text-slate-900 border-white" : "bg-blue-500 text-white border-blue-600 scale-105 shadow-md shadow-blue-200") 
                : (dark ? "bg-white/5 border-white/20 hover:bg-white/10" : "bg-white border-slate-200 hover:border-blue-300 text-slate-600")
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompleteButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-12 flex justify-center"
    >
      <button 
        onClick={onClick}
        className="group flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-xl hover:shadow-emerald-200 hover:-translate-y-1"
      >
        完成任務，解鎖下一區 <ChevronRight className="group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
}
