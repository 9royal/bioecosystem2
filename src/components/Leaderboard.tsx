import React, { useEffect, useState } from "react";
import { Trophy, Medal, Award, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface LeaderboardItem {
  time: string;
  className: string | number;
  seatNumber: string | number;
  school: string;
  score: number;
}

interface LeaderboardProps {
  type: "creature" | "ecosystem";
  currentScore?: number;
}

export default function Leaderboard({ type, currentScore }: LeaderboardProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const scriptURL =
        import.meta.env.VITE_GAS_DEPLOY_URL ||
        localStorage.getItem("GAS_DEPLOY_URL") ||
        "";
      if (!scriptURL) {
        throw new Error("尚未設定 Google Apps Script 部署網址，無法取得排行榜資料。");
      }
      
      const urlWithParams = `${scriptURL}${scriptURL.includes("?") ? "&" : "?"}type=${type}`;
      const response = await fetch(urlWithParams, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("與 Google 試算表連線失敗");
      }
      const json = await response.json();
      if (json.status === "success" && Array.isArray(json.data)) {
        setData(json.data);
      } else {
        throw new Error(json.message || "取得資料失敗");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-500 w-5 h-5 inline-block" />;
      case 1:
        return <Medal className="text-slate-400 w-5 h-5 inline-block" />;
      case 2:
        return <Award className="text-amber-700 w-5 h-5 inline-block" />;
      default:
        return <span className="font-black text-slate-400 text-sm">{index + 1}</span>;
    }
  };

  return (
    <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-5 sm:p-6 w-full max-w-lg mt-6 shadow-inner text-left">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <h4 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
          <Trophy className="text-yellow-500 animate-pulse shrink-0" size={18} />
          <span>{type === "creature" ? "生物挑戰" : "生態挑戰"} 前十名排行榜</span>
        </h4>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="text-xs font-black text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin w-3 h-3" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span>重新整理</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400 text-xs sm:text-sm font-black">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          <span>載入排行榜最高分...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold space-y-1.5">
          <p className="flex items-center gap-1 font-black">
            <AlertTriangle size={14} className="shrink-0" />
            <span>排行榜讀取失敗</span>
          </p>
          <p className="font-medium text-slate-500 text-[10px] sm:text-xs">{error}</p>
          <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
            注意：本功能需要您在 Google Apps Script 中部署最新包含 `doGet` 的程式碼，並選擇「所有人」均可存取的「網頁應用程式」。
          </p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs sm:text-sm font-bold">
          目前尚未有提交紀錄，快來角逐第一名！🚀
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {data.map((item, index) => {
            const isMatchCurrent = currentScore !== undefined && item.score === currentScore;
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-black transition-all ${
                  index < 3
                    ? "bg-white border-slate-200/60 shadow-sm"
                    : "bg-slate-100/50 border-transparent text-slate-700"
                } ${isMatchCurrent ? "ring-2 ring-yellow-400 bg-yellow-50/50 border-yellow-200" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center shrink-0">{getRankIcon(index)}</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-slate-800 font-black text-xs sm:text-sm truncate">
                      {item.school ? item.school : "未填學校"}
                    </span>
                    <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold">
                      {item.className ? `${item.className} 班` : ""} {item.seatNumber ? `${item.seatNumber} 號` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <span className="text-emerald-600 font-black text-sm sm:text-base">
                    {item.score}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">分</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
