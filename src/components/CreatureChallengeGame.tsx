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
  
  const [classNum, setClassNum] = useState<number>(1);
  const [seatNum, setSeatNum] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
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
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameState]);

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
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  const spawnOrganism = () => {
    const randomIndex = Math.floor(Math.random() * ORGANISMS.length);
    setCurrentOrganism(ORGANISMS[randomIndex]);
    setSpawnKey(prev => prev + 1);
    spawnTimeRef.current = Date.now();
  };

  const handleAnswer = (ecosystem: string) => {
    if (!currentOrganism) return;
    const isCorrect = ecosystem === currentOrganism.ecosystem;
    if (isCorrect) {
      const timeTaken = (Date.now() - spawnTimeRef.current) / 1000;
      const speedBonus = Math.max(0, Math.floor(1350 * (1 - timeTaken / 11)));
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
    }, 500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const scriptURL = localStorage.getItem('GAS_DEPLOY_URL') || 'https://script.google.com/macros/s/AKfycbwPl8EhjWCkggj4vxNZcktgtDjwK9meeAVxDkxbnpC-S6Xl9aNAZrPWUiiH6ikqgwWSPg/exec';
      await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'creature',
          className: classNum,
          seatNumber: seatNum,
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 min-h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 p-2 rounded-xl">
              <Zap className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold">生物挑戰</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="text-blue-400" size={18} />
              <span className="font-mono text-2xl font-black">{timeLeft}s</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="text-yellow-400" size={18} />
              <span className="font-mono text-2xl font-black text-yellow-400">{score}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          {gameState === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-400 opacity-20 blur-2xl rounded-full animate-pulse" />
                <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-slate-50">
                  <Zap size={80} className="text-red-500" />
                </div>
              </div>
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-slate-800 tracking-tighter">生物挑戰</h2>
                 <p className="text-xl text-slate-500 max-w-md font-medium leading-relaxed">
                   生物們迷路了！根據畫面上出現的生物，點選它們所居住的生態系。速度越快，積分越高！
                 </p>
              </div>
              <button 
                onClick={startGame}
                className="group relative bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-2xl hover:bg-red-600 transition-all shadow-2xl hover:scale-105 active:scale-95"
              >
                START <Zap size={24} className="ml-2 inline group-hover:animate-bounce" />
              </button>
            </div>
          )}

          {gameState === 'playing' && currentOrganism && (
            <>
              <div className="relative flex-[1.5] bg-white/40 border-b border-slate-100 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={spawnKey}
                    initial={{ x: -400, opacity: 1, top: "15%", left: "10%" }}
                    animate={{ x: 1200, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 11, ease: "linear" }}
                    onAnimationComplete={() => {
                      if (gameState === 'playing') {
                        setScore(prev => Math.max(0, prev - 50));
                        spawnOrganism();
                      }
                    }}
                    className="absolute flex flex-col items-center"
                  >
                    <div className="bg-white p-4 rounded-[3.2rem] shadow-xl border-8 border-white ring-1 ring-slate-100">
                      <img 
                        src={currentOrganism.image} 
                        alt={currentOrganism.name}
                        className="w-40 h-40 rounded-[2rem] object-cover"
                      />
                      <p className="text-center font-black mt-2 text-2xl text-slate-800">{currentOrganism.name}</p>
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
                        "absolute bottom-10 left-1/2 -translate-x-1/2 text-5xl font-black italic z-20",
                        feedback.isCorrect ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {feedback.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 bg-white p-6 flex flex-col justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
                  {ECOSYSTEMS.map(eco => {
                    const isLand = ['針葉林', '落葉林', '闊葉林', '草原', '沙漠', '凍原'].includes(eco);
                    return (
                      <button
                        key={eco}
                        onClick={() => handleAnswer(eco)}
                        className={cn(
                          "p-3 rounded-xl border-2 font-bold transition-all text-sm h-full",
                          isLand 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white" 
                            : "bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-600 hover:text-white"
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
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 overflow-y-auto">
              <div className="text-center">
                <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-4">
                  <Trophy size={48} />
                </div>
                <h3 className="text-4xl font-black text-slate-800">挑戰結束！</h3>
                <div className="mt-2 text-emerald-600 font-black text-6xl">{score} 分</div>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-3xl text-center space-y-3 w-full max-w-md">
                   <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
                   <p className="text-emerald-800 font-black text-xl">成績已上傳至「生物挑戰」！</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl w-full max-w-md space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Users size={14} /> 班級 (1-20)
                      </label>
                      <select 
                        value={classNum}
                        onChange={e => setClassNum(Number(e.target.value))}
                        className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 font-black outline-none focus:border-blue-500"
                      >
                        {Array.from({ length: 20 }, (_, i) => (
                           <option key={i+1} value={i+1}>{i+1} 班</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <User size={14} /> 座號 (1-30)
                      </label>
                      <select 
                        value={seatNum}
                        onChange={e => setSeatNum(Number(e.target.value))}
                        className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 font-black outline-none focus:border-blue-500"
                      >
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i+1} value={i+1}>{i+1} 號</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                    {isSubmitting ? '提交中...' : '提交生物挑戰積分'}
                  </button>
                  {error && <p className="text-red-500 text-center text-xs font-bold">{error}</p>}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button onClick={startGame} className="text-slate-500 hover:text-blue-600 font-bold flex items-center justify-center gap-2">
                   <RefreshCw size={18} /> 重新挑戰
                </button>
                {onComplete && (
                  <button 
                    onClick={() => {
                       onScore?.('creature_challenge', score);
                       onComplete();
                    }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
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
