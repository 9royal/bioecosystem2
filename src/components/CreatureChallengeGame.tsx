import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Target, User, Users, RefreshCw, Send, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ORGANISMS, ECOSYSTEMS, Organism } from '../data/organisms';
import { cn } from '../lib/utils';

export default function CreatureChallengeGame({ onComplete, onScore }: { onComplete?: () => void, onScore?: (id: string, score: number) => void }) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [currentOrganism, setCurrentOrganism] = useState<Organism | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [spawnKey, setSpawnKey] = useState(0); 
  const [questionTimeLeft, setQuestionTimeLeft] = useState(5);
  
  const [classNum, setClassNum] = useState<number>(1);
  const [seatNum, setSeatNum] = useState<number>(1);
  const [school, setSchool] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimeRef = useRef<number>(0);

  useEffect(() => {
    if (gameState === 'playing') {
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      spawnOrganism();
    } else {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (qTimerRef.current) clearInterval(qTimerRef.current);
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (qTimerRef.current) clearInterval(qTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && currentOrganism) {
      setQuestionTimeLeft(5);
      if (qTimerRef.current) clearInterval(qTimerRef.current);
      
      qTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 0.1) {
            handleTimeout();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => {
      if (qTimerRef.current) clearInterval(qTimerRef.current);
    };
  }, [gameState, spawnKey]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setSubmitted(false);
    setError(null);
    setGameState('playing');
  };

  const endGame = () => {
    setGameState('finished');
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (qTimerRef.current) clearInterval(qTimerRef.current);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  const spawnOrganism = () => {
    const randomIndex = Math.floor(Math.random() * ORGANISMS.length);
    setCurrentOrganism(ORGANISMS[randomIndex]);
    setSpawnKey(prev => prev + 1);
    spawnTimeRef.current = Date.now();
  };

  const handleTimeout = () => {
    if (qTimerRef.current) clearInterval(qTimerRef.current);
    setScore(prev => Math.max(0, prev - 50));
    setFeedback({ isCorrect: false, text: '太慢了！-50' });
    setTimeout(() => {
      setFeedback(null);
      spawnOrganism();
    }, 400);
  };

  const handleAnswer = (ecosystem: string) => {
    if (!currentOrganism || gameState !== 'playing') return;
    
    if (qTimerRef.current) clearInterval(qTimerRef.current);

    const isCorrect = ecosystem === currentOrganism.ecosystem;
    if (isCorrect) {
      const timeTaken = (Date.now() - spawnTimeRef.current) / 1000;
      const speedBonus = Math.max(0, Math.floor(1350 * (1 - timeTaken / 5)));
      const pointsEarned = 150 + speedBonus;
      setScore(prev => prev + pointsEarned);
      setFeedback({ isCorrect: true, text: `正確！+${pointsEarned}` });
    } else {
      setScore(prev => Math.max(0, prev - 100));
      setFeedback({ isCorrect: false, text: '錯誤！-100' });
    }
    
    setTimeout(() => {
      setFeedback(null);
      spawnOrganism();
    }, feedback ? 250 : 400); // Slightly longer if timeout occurred previously
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const scriptURL = import.meta.env.VITE_GAS_DEPLOY_URL || localStorage.getItem('GAS_DEPLOY_URL') || '';
      if (!scriptURL) {
        throw new Error("尚未設定 Google Apps Script 部署網址（VITE_GAS_DEPLOY_URL）。請在 Vercel 環境變數或 LocalStorage 中設定此網址。");
      }
      await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'creature',
          className: classNum,
          seatNumber: seatNum,
          school: school,
          score: score
        })
      });
      setSubmitted(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 min-h-[650px] sm:min-h-[800px] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500 rounded-xl">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight">生物挑戰</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-widest uppercase">Creature Challenge</p>
            </div>
          </div>
          
          <div className="flex space-x-4 sm:space-x-8">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Time</p>
              <p className={cn(
                "text-xl sm:text-3xl font-black tabular-nums transition-colors flex items-center gap-1 sm:gap-2",
                timeLeft < 10 ? "text-red-500 animate-pulse" : "text-white"
              )}>
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 opacity-60" /> {timeLeft}s
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider text-yellow-400">Score</p>
              <p className="text-xl sm:text-3xl font-black text-yellow-400 tabular-nums flex items-center gap-1 sm:gap-2">
                <Trophy className="w-4 h-4 sm:w-6 sm:h-6 opacity-80" /> {score}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          {gameState === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6 sm:space-y-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-400 opacity-20 blur-2xl rounded-full animate-pulse" />
                <div className="relative bg-white p-6 sm:p-8 rounded-[3rem] shadow-2xl border-4 border-slate-50">
                  <Zap size={60} className="text-red-500 sm:w-20 sm:h-20" />
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                 <h2 className="text-4xl sm:text-6xl font-black text-slate-800 tracking-tighter">生物挑戰</h2>
                 <p className="text-lg sm:text-xl text-slate-500 max-w-md font-medium leading-relaxed px-4">
                   生物們迷路了！根據畫面上出現的生物，點選它們所居住的生態系。速度越快，積分越高！
                 </p>
              </div>
              <button 
                onClick={startGame}
                className="group relative bg-slate-900 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-xl sm:text-2xl hover:bg-red-600 transition-all shadow-2xl hover:scale-105 active:scale-95"
              >
                START <Zap size={24} className="ml-2 inline group-hover:animate-bounce" />
              </button>
            </div>
          )}

          {gameState === 'playing' && currentOrganism && (
            <>
              <div className="relative flex-[3] bg-white/40 border-b border-slate-100 overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                {/* Per-question Timer Progress Bar */}
                <div 
                  className={cn(
                    "absolute top-0 left-0 h-1.5 transition-all duration-100 ease-linear z-10",
                    questionTimeLeft < 2 ? "bg-red-500" : "bg-blue-500"
                  )} 
                  style={{ width: `${(questionTimeLeft / 5) * 100}%` }} 
                />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={spawnKey}
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1, 
                      y: 0,
                      x: questionTimeLeft < 2 ? [0, -3, 3, -3, 3, 0] : 0
                    }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    transition={{ 
                      x: { repeat: Infinity, duration: 0.1 },
                      scale: { duration: 0.3 },
                      opacity: { duration: 0.3 }
                    }}
                    className="relative flex flex-col items-center"
                  >
                    <div className="bg-white p-4 sm:p-8 rounded-[3rem] sm:rounded-[4rem] shadow-2xl border-4 sm:border-8 border-white ring-1 ring-slate-100 max-w-[260px] sm:max-w-none">
                      <img 
                        src={currentOrganism.image} 
                        alt={currentOrganism.name}
                        className="w-32 h-32 sm:w-64 sm:h-64 rounded-[2rem] sm:rounded-[2.5rem] object-cover mx-auto"
                      />
                      <p className="text-center font-black mt-3 sm:mt-6 text-2xl sm:text-5xl text-slate-800">{currentOrganism.name}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, y: 0 }}
                      animate={{ scale: 1.2, opacity: 1, y: -20 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className={cn(
                        "absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl sm:text-7xl font-black italic z-20 drop-shadow-lg",
                        feedback.isCorrect ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {feedback.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-[2.5] bg-white p-4 sm:p-10 flex flex-col justify-center overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto w-full">
                  {ECOSYSTEMS.map(eco => {
                    const isLand = ['針葉林', '落葉林', '闊葉林', '草原', '沙漠', '凍原'].includes(eco);
                    return (
                      <button
                        key={eco}
                        onClick={() => handleAnswer(eco)}
                        className={cn(
                          "group relative px-4 py-6 sm:py-10 rounded-[2rem] sm:rounded-[2.5rem] text-lg sm:text-3xl font-black transition-all active:scale-95 shadow-lg hover:shadow-2xl border-b-8 border-slate-200",
                          isLand 
                            ? "bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white hover:border-amber-700" 
                            : "bg-blue-50 text-blue-800 hover:bg-blue-600 hover:text-white hover:border-blue-700"
                        )}
                      >
                        {eco}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {gameState === 'finished' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 space-y-6 sm:space-y-10 overflow-y-auto">
              <div className="text-center">
                <div className="bg-yellow-100 w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-4 sm:mb-6">
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
                <h3 className="text-3xl sm:text-5xl font-black text-slate-800">挑戰結束！</h3>
                <div className="mt-2 sm:mt-4 text-emerald-600 font-black text-6xl sm:text-8xl">{score} 分</div>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border-2 border-emerald-100 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] text-center space-y-4 w-full max-w-lg">
                   <CheckCircle2 className="mx-auto text-emerald-500" size={64} />
                   <p className="text-emerald-800 font-black text-2xl sm:text-3xl">成績已上傳至「生物挑戰」！</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl w-full max-w-lg space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Users size={16} /> 班級 (1-20)
                      </label>
                      <select 
                        value={classNum}
                        onChange={e => setClassNum(Number(e.target.value))}
                        className="w-full p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-lg sm:text-2xl outline-none focus:border-blue-500 text-center"
                      >
                        {Array.from({ length: 20 }, (_, i) => (
                           <option key={i+1} value={i+1}>{i+1} 班</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <User size={16} /> 座號 (1-30)
                      </label>
                      <select 
                        value={seatNum}
                        onChange={e => setSeatNum(Number(e.target.value))}
                        className="w-full p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-lg sm:text-2xl outline-none focus:border-blue-500 text-center"
                      >
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i+1} value={i+1}>{i+1} 號</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      學校
                    </label>
                    <input 
                      type="text"
                      value={school}
                      onChange={e => setSchool(e.target.value)}
                      placeholder="東興（不用填國中）"
                      className="w-full p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-sm sm:text-lg outline-none focus:border-blue-500 placeholder:text-slate-300"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-5 sm:py-7 bg-slate-900 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-xl sm:text-3xl hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin w-8 h-8" /> : <Send size={32} />}
                    {isSubmitting ? '提交中...' : '提交生物挑戰積分'}
                  </button>
                  {error && <p className="text-red-500 text-center text-sm sm:text-lg font-bold">{error}</p>}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
                <button onClick={startGame} className="flex-1 py-4 sm:py-5 border-2 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all shrink-0">
                   <RefreshCw size={24} /> 重新挑戰
                </button>
                {onComplete && (
                  <button 
                    onClick={() => {
                       onScore?.('creature_challenge', score);
                       onComplete();
                    }}
                    className="flex-1 py-4 sm:py-5 bg-blue-600 text-white rounded-2xl font-black text-lg sm:text-xl hover:bg-blue-700 transition-all shadow-xl active:scale-95 shrink-0"
                  >
                    完成挑戰
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
