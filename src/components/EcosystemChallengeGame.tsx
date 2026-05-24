import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Target, User, Users, RefreshCw, Send, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

const ECOSYSTEM_OPTIONS = [
  '針葉林', '落葉林', '闊葉林', '草原', '沙漠', '凍原', 
  '河川上游', '河川下游', '湖泊', '河口', '潮間帶', 
  '淺海區', '大洋區上層', '大洋區下層'
];

const QUESTIONS = [
  // 生物描述
  { text: '這裡常見松樹、杉樹，還有松鼠與熊等動物。', answer: '針葉林', type: 'bio' },
  { text: '秋天時，楓樹與銀杏的葉子會轉成黃色或紅色。', answer: '落葉林', type: 'bio' },
  { text: '高大的樹木上常有藤蔓植物，也能看到許多昆蟲與鳥類。', answer: '闊葉林', type: 'bio' },
  { text: '駱駝、仙人掌與蜥蜴是這裡常見的生物。', answer: '沙漠', type: 'bio' },
  { text: '馴鹿、北極狐與地衣能適應這裡寒冷的環境。', answer: '凍原', type: 'bio' },
  { text: '魚類多半身體細長，石頭上常附著昆蟲幼蟲。', answer: '河川上游', type: 'bio' },
  { text: '水中常見浮游生物與大型魚類，也有水鳥活動。', answer: '湖泊', type: 'bio' },
  { text: '招潮蟹、彈塗魚與紅樹林植物常一起出現。', answer: '河口', type: 'bio' },
  { text: '海星、藤壺與寄居蟹需要忍受海浪拍打與潮水變化。', answer: '潮間帶', type: 'bio' },
  { text: '鯨魚、鮪魚與大量浮游植物生活在陽光能照到的海域。', answer: '大洋區上層', type: 'bio' },
  { text: '這裡沒有陽光，常見鮟鱇魚等會發光的深海生物。', answer: '大洋區下層', type: 'bio' },
  // 環境描述
  { text: '冬季寒冷且降雪多，樹木多為葉片細長的常綠樹，地面常覆蓋厚厚松針。', answer: '針葉林', type: 'env' },
  { text: '四季分明，秋天樹葉會變黃、變紅並大量掉落。', answer: '落葉林', type: 'env' },
  { text: '終年高溫多雨，森林中的樹葉寬大濃密，生物種類很多。', answer: '闊葉林', type: 'env' },
  { text: '年降雨量很少，白天炎熱、夜晚寒冷，地表植物稀少。', answer: '沙漠', type: 'env' },
  { text: '地面長期結凍，幾乎沒有高大樹木，只能見到苔蘚與地衣。', answer: '凍原', type: 'env' },
  { text: '河道狹窄、水流湍急，河水清澈且含氧量高。', answer: '河川上游', type: 'env' },
  { text: '河道寬廣、水流較慢，泥沙堆積明顯。', answer: '河川下游', type: 'env' },
  { text: '海水與淡水交會，鹽度會隨潮汐改變。', answer: '河口', type: 'env' },
  { text: '海岸邊會隨潮汐露出或淹沒，生物需適應乾濕交替。', answer: '潮間帶', type: 'env' },
  { text: '陽光難以到達，水壓極大，環境黑暗寒冷。', answer: '大洋區下層', type: 'env' }
];

export default function EcosystemChallengeGame({ onComplete, onScore }: { onComplete?: () => void, onScore?: (id: string, score: number) => void }) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<typeof QUESTIONS[0] | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  
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
      nextQuestion();
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

  const nextQuestion = () => {
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    setCurrentQuestion(QUESTIONS[randomIndex]);
    spawnTimeRef.current = Date.now();
  };

  const handleAnswer = (ecosystem: string) => {
    if (!currentQuestion) return;
    const isCorrect = ecosystem === currentQuestion.answer;
    if (isCorrect) {
      const timeTaken = (Date.now() - spawnTimeRef.current) / 1000;
      const speedBonus = Math.max(0, Math.floor(800 * (1 - timeTaken / 15)));
      const pointsEarned = 200 + speedBonus;
      setScore(prev => prev + pointsEarned);
      setFeedback({ isCorrect: true, text: `正確！+${pointsEarned}` });
    } else {
      setScore(prev => Math.max(0, prev - 150));
      setFeedback({ isCorrect: false, text: '錯誤！-150' });
    }
    setTimeout(() => {
      setFeedback(null);
      nextQuestion();
    }, 600);
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
          type: 'ecosystem',
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
            <div className="bg-orange-500 p-2 rounded-xl">
              <Zap className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold">生態挑戰</h2>
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
                <div className="absolute -inset-4 bg-orange-400 opacity-20 blur-2xl rounded-full animate-pulse" />
                <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-slate-50">
                  <Target size={80} className="text-orange-500" />
                </div>
              </div>
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-slate-800 tracking-tighter">生態挑戰</h2>
                 <p className="text-xl text-slate-500 max-w-md font-medium leading-relaxed">
                   根據畫面中對生態系的「生物描述」或「環境描述」，挑選出對應的生態系種類。速度越快，分數越高！
                 </p>
              </div>
              <button 
                onClick={startGame}
                className="group relative bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-2xl hover:bg-orange-600 transition-all shadow-2xl hover:scale-105 active:scale-95"
              >
                START <Zap size={24} className="ml-2 inline group-hover:animate-bounce" />
              </button>
            </div>
          )}

          {gameState === 'playing' && currentQuestion && (
            <>
              <div className="relative flex-[1.2] bg-white flex items-center justify-center p-12 border-b border-slate-100">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-6"
                  >
                    <div className={cn(
                      "inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                      currentQuestion.type === 'bio' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {currentQuestion.type === 'bio' ? "生物描述判斷" : "環境描述判斷"}
                    </div>
                    <p className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight max-w-2xl">
                      {currentQuestion.text}
                    </p>
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
                  {ECOSYSTEM_OPTIONS.map(eco => {
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
                   <p className="text-emerald-800 font-black text-xl">成績已上傳至「生態挑戰」！</p>
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
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                    {isSubmitting ? '提交中...' : '提交生態挑戰積分'}
                  </button>
                  {error && <p className="text-red-500 text-center text-xs font-bold">{error}</p>}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button onClick={startGame} className="text-slate-500 hover:text-orange-600 font-bold flex items-center justify-center gap-2">
                   <RefreshCw size={18} /> 重新挑戰
                </button>
                {onComplete && (
                  <button 
                    onClick={() => {
                       onScore?.('ecosystem_challenge', score);
                       onComplete();
                    }}
                    className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg"
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
