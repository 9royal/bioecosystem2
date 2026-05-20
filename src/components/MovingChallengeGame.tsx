import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Target, User, Users, RefreshCw, Send, AlertTriangle, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ORGANISMS, ECOSYSTEMS, Organism } from '../data/organisms';

export default function MovingChallengeGame() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished' | 'leaderboard'>('idle');
  const [currentOrganism, setCurrentOrganism] = useState<Organism | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [spawnKey, setSpawnKey] = useState(0); // Trigger re-animation
  
  // User Info
  const [classNum, setClassNum] = useState('');
  const [seatNum, setSeatNum] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topScores, setTopScores] = useState<any[]>([]);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const spawnTimeRef = useRef<number>(0);

  // Anti-refresh check
  useEffect(() => {
    const savedState = sessionStorage.getItem('game_active');
    if (savedState === 'true' && gameState === 'idle') {
      // User refreshed during game
      console.warn("Detected game refresh.");
    }
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      sessionStorage.setItem('game_active', 'true');
      gameStartTimeRef.current = Date.now();
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
      sessionStorage.removeItem('game_active');
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameState('playing');
  };

  const endGame = () => {
    setGameState('finished');
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
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
      // Scoring based on speed: base 150 + bonus up to 1350 = total max 1500
      const timeTaken = (Date.now() - spawnTimeRef.current) / 1000;
      const speedBonus = Math.max(0, Math.floor(1350 * (1 - timeTaken / 11)));
      const pointsEarned = 150 + speedBonus;
      
      setScore(prev => prev + pointsEarned);
      setFeedback({ isCorrect: true, text: `極速！+${pointsEarned}` });
    } else {
      setScore(prev => Math.max(0, prev - 100));
      setFeedback({ isCorrect: false, text: '錯誤！-100' });
    }

    setTimeout(() => {
      setFeedback(null);
      spawnOrganism();
    }, 500);
  };

  const submitScore = async () => {
    if (!classNum || !seatNum) {
      alert('請先選擇班級與座號');
      return;
    }

    setIsSubmitting(true);
    const gasUrl = "https://script.google.com/macros/s/AKfycbwXDryjIPwsPhFZFVxJ9VjOUkTBqdpGQzCwMMZS_gSW7qC8BIhuQGJJ2CgblTHnQgO_mA/exec";

    try {
      // Data payload to send to Google Apps Script
      const payload = {
        className: classNum,
        seatNumber: seatNum,
        score: score,
        timestamp: new Date().toLocaleString(),
        gameType: "限時挑戰"
      };

      /**
       * IMPORTANT FOR GOOGLE APPS SCRIPT:
       * 1. Deploy your script as a "Web App" (Settings: Execute as "Me", Access "Anyone").
       * 2. Replace the URL in fetch() if it changes.
       * 
       * COMPLETE SCRIPT FOR YOUR GAS EDITOR:
       * 
       * function doPost(e) {
       *   if (!e || !e.postData) return ContentService.createTextOutput("Testing manually? Use POST requests instead.").setMimeType(ContentService.MimeType.TEXT);
       *   try {
       *     var data = JSON.parse(e.postData.contents);
       *     var ss = SpreadsheetApp.getActiveSpreadsheet();
       *     var sheetName = "限時挑戰";
       *     var sheet = ss.getSheetByName(sheetName);
       *     
       *     if (!sheet) {
       *       sheet = ss.insertSheet(sheetName);
       *       sheet.appendRow(["時間", "班級", "座號", "分數", "遊戲類型"]);
       *     }
       *     
       *     var rows = sheet.getDataRange().getValues();
       *     var foundRowIndex = -1;
       *     for (var i = 1; i < rows.length; i++) {
       *       if (rows[i][1] == data.className && rows[i][2] == data.seatNumber) {
       *         foundRowIndex = i + 1;
       *         break;
       *       }
       *     }
       *     
       *     if (foundRowIndex > -1) {
       *       var oldScore = rows[foundRowIndex-1][3];
       *       if (data.score > oldScore) {
       *         sheet.getRange(foundRowIndex, 1, 1, 5).setValues([[data.timestamp, data.className, data.seatNumber, data.score, data.gameType]]);
       *       }
       *     } else {
       *       sheet.appendRow([data.timestamp, data.className, data.seatNumber, data.score, data.gameType]);
       *     }
       *     
       *     return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
       *   } catch(err) {
       *     return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
       *   }
       * }
       * 
       * function doGet(e) {
       *   var ss = SpreadsheetApp.getActiveSpreadsheet();
       *   var sheet = ss.getSheetByName("限時挑戰");
       *   if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
       *   var data = sheet.getDataRange().getValues();
       *   if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
       *   var scores = data.slice(1).sort(function(a, b) { return b[3] - a[3]; });
       *   var top10 = scores.slice(0, 10).map(function(row, index) {
       *     return { rank: index + 1, classNum: row[1], seatNum: row[2], score: row[3] };
       *   });
       *   return ContentService.createTextOutput(JSON.stringify(top10)).setMimeType(ContentService.MimeType.JSON);
       * }
       */
      
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });
      
      alert('分數已提交！正在讀取排行榜...');
      setGameState('leaderboard');
    } catch (err) {
      console.error(err);
      alert('提交失敗，請檢查網路或 GAS 設定');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLeaderboard = async () => {
    const gasUrl = "https://script.google.com/macros/s/AKfycbwXDryjIPwsPhFZFVxJ9VjOUkTBqdpGQzCwMMZS_gSW7qC8BIhuQGJJ2CgblTHnQgO_mA/exec";
    try {
      const resp = await fetch(gasUrl);
      if (!resp.ok) throw new Error("Fetch failed");
      const data = await resp.json();
      if (Array.isArray(data)) {
        setTopScores(data);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  };

  useEffect(() => {
    if (gameState === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [gameState]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 min-h-[500px]">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 p-2 rounded-xl">
              <Zap className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold">限時生態挑戰賽</h2>
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
        <div className="flex flex-col h-[520px] bg-slate-50 overflow-hidden">
          {gameState === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <Target size={48} />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-800">準備好挑戰了嗎？</h3>
                <p className="text-slate-500 max-w-sm text-lg">生物將從左向右緩慢通過，請在它們消失前選擇正確的生態系。</p>
              </div>
              <button 
                onClick={startGame}
                className="bg-blue-600 text-white px-12 py-5 rounded-full font-black text-2xl hover:bg-blue-700 transition shadow-2xl hover:shadow-blue-200"
              >
                開始挑戰
              </button>
            </div>
          )}

          {gameState === 'playing' && currentOrganism && (
            <>
              {/* Top: Biology Track (The "Stage") */}
              <div className="relative flex-[1.8] bg-white/40 border-b border-slate-100 overflow-hidden shadow-inner">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={spawnKey}
                    initial={{ x: -600, opacity: 1, top: "8%", left: 0 }}
                    animate={{ x: 1500, opacity: 1 }}
                    exit={{ opacity: 1 }}
                    transition={{ duration: 11, ease: "linear" }}
                    onAnimationComplete={() => {
                      if (gameState === 'playing') {
                        setScore(prev => Math.max(0, prev - 50));
                        spawnOrganism();
                      }
                    }}
                    className="absolute flex flex-col items-center group pointer-events-auto cursor-pointer z-10"
                  >
                    <div className="bg-white p-4 rounded-[3.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-white transform group-hover:scale-105 transition-transform ring-1 ring-slate-100">
                      <img 
                        src={currentOrganism.image} 
                        alt={currentOrganism.name}
                        className="w-48 h-48 rounded-[2rem] object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-center font-black mt-3 text-3xl text-slate-800 tracking-tight">{currentOrganism.name}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Feedback Overlay inside Track */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, y: 0 }}
                      animate={{ scale: 1.2, opacity: 1, y: -20 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className={cn(
                        "absolute bottom-4 left-1/2 -translate-x-1/2 text-5xl font-black italic select-none pointer-events-none drop-shadow-lg z-20",
                        feedback.isCorrect ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {feedback.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom: Control Panel (Ecosystem Buttons) */}
              <div className="flex-1 bg-white p-6 flex flex-col justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="text-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">請點選正確的生態系</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                  {ECOSYSTEMS.map(eco => (
                    <button
                      key={eco}
                      onClick={() => handleAnswer(eco)}
                      className="bg-slate-50 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-2xl border-2 border-slate-100 font-black transition-all shadow-sm hover:shadow-blue-200 hover:scale-105 active:scale-95 text-slate-700 text-lg"
                    >
                      {eco}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {gameState === 'finished' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <div className="text-center">
                <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-4">
                  <Trophy size={48} />
                </div>
                <h3 className="text-4xl font-black text-slate-800">遊戲結束！</h3>
                <div className="mt-4 text-emerald-600 font-black text-6xl drop-shadow-sm">{score} 分</div>
              </div>

              <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl w-full max-w-md space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <Users size={12} /> 班級
                     </label>
                     <select 
                       value={classNum}
                       onChange={e => setClassNum(e.target.value)}
                       className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-lg outline-none focus:border-blue-500 transition-colors"
                     >
                       <option value="">選擇</option>
                       {Array.from({ length: 20 }, (_, i) => {
                         const val = 701 + i;
                         return <option key={val} value={val}>{val}</option>;
                       })}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <User size={12} /> 座號
                     </label>
                     <select 
                       value={seatNum}
                       onChange={e => setSeatNum(e.target.value)}
                       className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-lg outline-none focus:border-blue-500 transition-colors"
                     >
                       <option value="">選擇</option>
                       {Array.from({ length: 30 }, (_, i) => (
                         <option key={i+1} value={i+1}>{i+1}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 
                 <button
                   onClick={submitScore}
                   disabled={isSubmitting || !classNum || !seatNum}
                   className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-3"
                 >
                   {isSubmitting ? <RefreshCw className="animate-spin" /> : <Send size={24} />}
                   {isSubmitting ? '提交中...' : '儲存成果並查看排行'}
                 </button>
              </div>

              <div className="text-center">
                 <button onClick={startGame} className="text-slate-400 hover:text-blue-600 text-sm flex items-center justify-center gap-1 mx-auto font-bold transition-colors">
                    <RefreshCw size={14} /> 重新挑戰
                 </button>
              </div>
            </div>
          )}

          {gameState === 'leaderboard' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <h3 className="text-3xl font-black text-center text-slate-800">🏆 本日英雄榜</h3>
              <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {topScores.length > 0 ? (
                    <table className="w-full text-left">
                      <tbody className="text-lg font-black text-slate-700">
                        {topScores.map((row, i) => (
                          <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition">
                            <td className="px-4 py-4 text-2xl">
                              {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : <span className="text-slate-300 text-sm">#{row.rank}</span>}
                            </td>
                            <td className="px-4 py-4 font-bold">{row.classNum} 班 {row.seatNum} 號</td>
                            <td className="px-4 py-4 text-right text-blue-600">{row.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <div className="text-slate-300 animate-pulse flex justify-center">
                        <Trophy size={48} />
                      </div>
                      <p className="text-slate-400 font-bold">目前尚無數據，快來搶佔第一名！</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-2xl text-blue-800 text-xs text-center font-bold">
                  {topScores.length > 0 ? "即時排行榜數據已更新" : "正在從雲端載入最新排行..."}
                </div>
              </div>
              <button 
                onClick={startGame}
                className="w-full max-w-md py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition shadow-lg"
              >
                回到遊戲首頁
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Creature List for confirmation */}
      <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200">
         <h4 className="text-lg font-bold mb-4">本挑戰採用之生物清單：</h4>
         <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {ORGANISMS.map(o => (
              <div key={o.id} className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-xl overflow-hidden mb-2 border border-slate-100">
                   <img src={o.image} alt={o.name} className="w-full h-full object-cover" />
                 </div>
                 <p className="text-xs font-bold">{o.name}</p>
                 <span className="text-[10px] text-slate-400">{o.ecosystem}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
