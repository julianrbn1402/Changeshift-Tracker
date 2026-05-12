/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { 
  Truck, 
  Clock, 
  LogIn, 
  LogOut, 
  History as HistoryIcon, 
  Trash2, 
  AlertCircle,
  Hash,
  Search,
  MessageCircle,
  Share2,
  Download
} from 'lucide-react';

interface ActiveTruck {
  id: string;
  unitNumber: string;
  entryTime: number; // timestamp
}

interface CompletedShift {
  id: string;
  unitNumber: string;
  entryTime: number;
  exitTime: number;
  duration: number; // ms
}

export default function App() {
  const [unitInput, setUnitInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeTrucks, setActiveTrucks] = useState<ActiveTruck[]>([]);
  const [history, setHistory] = useState<CompletedShift[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const historyRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedActive = localStorage.getItem('hdt_active_trucks');
    const savedHistory = localStorage.getItem('hdt_history');
    if (savedActive) setActiveTrucks(JSON.parse(savedActive));
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('hdt_active_trucks', JSON.stringify(activeTrucks));
  }, [activeTrucks]);

  useEffect(() => {
    localStorage.setItem('hdt_history', JSON.stringify(history));
  }, [history]);

  const handleEnter = () => {
    if (!unitInput.trim()) return;
    
    // Check if truck is already active
    if (activeTrucks.some(t => t.unitNumber.toUpperCase() === unitInput.toUpperCase())) {
      alert(`Unit ${unitInput.toUpperCase()} sudah terdaftar di area.`);
      return;
    }

    const newTruck: ActiveTruck = {
      id: crypto.randomUUID(),
      unitNumber: unitInput.toUpperCase(),
      entryTime: Date.now(),
    };

    setActiveTrucks(prev => [newTruck, ...prev]);
    setUnitInput('');
  };

  const handleExit = (id: string) => {
    const truck = activeTrucks.find(t => t.id === id);
    if (!truck) return;

    const exitTime = Date.now();
    const completed: CompletedShift = {
      ...truck,
      exitTime,
      duration: exitTime - truck.entryTime,
    };

    setHistory(prev => [completed, ...prev]);
    setActiveTrucks(prev => prev.filter(t => t.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat?')) {
      setHistory([]);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const displayMinutes = minutes.toString().padStart(2, '0');
    const displaySeconds = seconds.toString().padStart(2, '0');
    
    return `${displayMinutes}:${displaySeconds}`;
  };

  const getLiveDuration = (entryTime: number) => {
    return formatDuration(currentTime.getTime() - entryTime);
  };

  const handleDownloadImage = async () => {
    if (history.length === 0 || !historyRef.current) return;
    setIsSharing(true);

    try {
      const canvas = await html2canvas(historyRef.current, {
        backgroundColor: '#020C1B',
        scale: 3,
        logging: false,
        useCORS: true
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Changeshift_Report_${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      
      // Brief delay before suggesting to open WhatsApp
      setTimeout(() => {
        if (confirm('Laporan gambar telah di-capture dan diunduh. Ingin membuka WhatsApp untuk melampirkannya?')) {
          const text = encodeURIComponent(`*LAPORAN CHANGESHIFT*\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n(Silakan lampirkan gambar yang baru saja diunduh)`);
          window.open(`https://wa.me/?text=${text}`, '_blank');
        }
      }, 500);
    } catch (error) {
      console.error('Error handling report:', error);
      alert('Gagal memproses laporan gambar.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareWhatsAppText = () => {
    if (history.length === 0) return;
    
    let reportText = `*LAPORAN CHANGESHIFT*\n`;
    reportText += `Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    reportText += `--------------------------------\n\n`;
    
    history.forEach((item, index) => {
      reportText += `${index + 1}. *UN: ${item.unitNumber}*\n`;
      reportText += `   ⏱️ Durasi: ${formatDuration(item.duration)}\n`;
      reportText += `   📥 Masuk: ${formatTime(item.entryTime)}\n`;
      reportText += `   📤 Keluar: ${formatTime(item.exitTime)}\n\n`;
    });
    
    reportText += `_Generated by Changeshift-Tracker_`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0A192F] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Structural Decoration */}
      <div className="fixed inset-0 pointer-events-none border-[6px] md:border-[12px] border-white/5 z-50"></div>
      
      {/* Header Area */}
      <header className="border-b border-slate-800 p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 bg-[#0E2238]">
        <div>
            <div className="flex items-center gap-2 mb-1 md:mb-2 text-cyan-500/80">
            <Truck className="w-5 h-5 md:w-8 md:h-8" />
            <h1 className="font-sans font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">Monitoring Sistem</h1>
          </div>
          <h2 className="text-3xl md:text-6xl font-extrabold tracking-tighter leading-none text-white">CHANGESHIFT<br /><span className="text-cyan-500">TRACKER</span></h2>
        </div>
        <div className="text-left md:text-right w-full md:w-auto pt-4 md:pt-0 border-t border-slate-800/50 md:border-none">
          <div className="font-mono text-sm md:text-2xl tracking-tight text-slate-400">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="font-mono text-2xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            {currentTime.toLocaleTimeString('id-ID')}
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Input & Active Section */}
        <section className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-800 p-5 md:p-10">
          <div className="max-w-2xl mx-auto lg:mx-0">
            <div className="flex items-center gap-2 mb-4 md:mb-6 text-slate-500">
              <LogIn className="w-4 h-4 md:w-5 md:h-5" />
              <h3 className="font-sans font-semibold text-[10px] md:text-xs uppercase tracking-widest">Input Unit Masuk</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 md:mb-12">
              <div className="relative flex-grow">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-cyan-500" />
                <input 
                  type="text" 
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                  placeholder="NOMOR UNIT..."
                  className="w-full bg-[#112240] border-2 border-slate-700 p-3 md:p-4 pl-10 md:pl-12 font-mono text-lg md:text-xl text-white focus:border-cyan-500/50 focus:bg-[#1d335a] outline-none transition-all placeholder:text-slate-600 rounded-lg"
                />
              </div>
              <button 
                onClick={handleEnter}
                className="bg-cyan-600 text-white px-6 md:px-8 py-3 md:py-4 font-bold uppercase text-sm md:text-base tracking-widest hover:bg-cyan-500 transition-all active:scale-95 shadow-lg shadow-cyan-900/40 rounded-lg"
              >
                MASUK AREA
              </button>
            </div>

            <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-800 pb-2 gap-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <h3 className="font-sans font-semibold text-[10px] md:text-xs uppercase tracking-widest">Unit Dalam Area</h3>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-grow md:w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                  <input 
                    type="text"
                    value={activeSearch}
                    onChange={(e) => setActiveSearch(e.target.value)}
                    placeholder="Cari unit..."
                    className="w-full bg-[#112240] border border-slate-700 py-1 pl-8 pr-2 text-[10px] text-white focus:border-cyan-500/50 outline-none rounded transition-all placeholder:text-slate-600"
                  />
                </div>
                <span className="font-mono text-[10px] md:text-xs text-cyan-500/60 font-bold whitespace-nowrap">{activeTrucks.length} UNIT AKTIF</span>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode='popLayout'>
                {activeTrucks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#112240]/30 rounded-xl p-8 md:p-12 text-center border border-dashed border-slate-800"
                  >
                    <AlertCircle className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 text-slate-800" />
                    <p className="font-sans font-medium text-xs md:text-sm text-slate-600">Tidak ada unit di dalam area saat ini</p>
                  </motion.div>
                ) : (
                  activeTrucks
                    .filter(t => t.unitNumber.toLowerCase().includes(activeSearch.toLowerCase()))
                    .map((truck) => (
                    <motion.div 
                      key={truck.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ x: 50, opacity: 0 }}
                      className="group p-4 md:p-6 bg-[#112240] rounded-xl border border-slate-800 flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center hover:border-cyan-500/30 transition-all cursor-default shadow-sm"
                    >
                      <div className="flex justify-between items-start md:col-span-3 md:block">
                        <div>
                          <span className="block font-sans font-extrabold text-[9px] uppercase text-cyan-500/60 tracking-wider md:mb-1">Unit ID</span>
                          <span className="font-mono text-xl md:text-2xl font-bold tracking-tighter text-white">{truck.unitNumber}</span>
                        </div>
                        <div className="md:hidden text-right">
                          <span className="block font-sans font-extrabold text-[9px] uppercase text-slate-500 tracking-wider">Live Time</span>
                          <span className="font-mono text-lg text-cyan-400 font-bold tabular-nums">{getLiveDuration(truck.entryTime)}</span>
                        </div>
                      </div>
                      
                      <div className="hidden md:block md:col-span-3">
                        <span className="block font-sans font-extrabold text-[9px] uppercase text-slate-600 tracking-wider mb-1">Check-in</span>
                        <span className="font-mono text-lg text-slate-300">{formatTime(truck.entryTime)}</span>
                      </div>
                      
                      <div className="hidden md:block md:col-span-4">
                        <span className="block font-sans font-extrabold text-[9px] uppercase text-slate-600 tracking-wider mb-1">Duration</span>
                        <span className="font-mono text-lg tabular-nums text-cyan-400 font-bold">{getLiveDuration(truck.entryTime)}</span>
                      </div>

                      <div className="flex md:block items-center justify-between border-t border-slate-800/40 pt-3 md:pt-0 md:border-none md:col-span-2">
                         <div className="md:hidden">
                            <span className="block font-sans font-medium text-[9px] text-slate-500">Check-in: {formatTime(truck.entryTime)}</span>
                         </div>
                        <button 
                          onClick={() => handleExit(truck.id)}
                          className="w-auto md:w-full px-4 py-2 bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-widest hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 border border-transparent transition-all flex items-center justify-center gap-2 rounded"
                        >
                          <LogOut className="w-3 h-3" />
                          SELESAI
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className="lg:col-span-5 p-5 md:p-10 bg-[#020C1B]">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-slate-500">
              <HistoryIcon className="w-4 h-4 md:w-5 md:h-5" />
              <h3 className="font-sans font-semibold text-[10px] md:text-xs uppercase tracking-widest">Riwayat Selesai</h3>
            </div>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                CLEAR ALL
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[60vh] md:max-h-[75vh] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
            <AnimatePresence mode='popLayout'>
              {history.length === 0 ? (
                <p className="p-6 md:p-8 text-center font-sans font-medium text-slate-700 border border-dashed border-slate-800 rounded-xl text-[10px] md:text-xs">Belum ada riwayat tercatat</p>
              ) : (
                history.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#112240]/20 border border-slate-800/60 p-4 rounded-lg flex justify-between items-center hover:bg-[#112240]/40 transition-colors"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-base md:text-lg text-slate-200">{item.unitNumber}</span>
                        <span className="text-[8px] md:text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold tracking-tighter uppercase">Success</span>
                      </div>
                      <div className="flex gap-3 font-mono text-[9px] md:text-[10px] text-slate-600">
                        <span>IN: {formatTime(item.entryTime)}</span>
                        <span>OUT: {formatTime(item.exitTime)}</span>
                      </div>
                    </div>
                    <div className="text-right min-w-fit ml-4">
                      <span className="block font-sans font-bold text-[8px] md:text-[9px] uppercase text-slate-600 tracking-wider">Total</span>
                      <span className="font-mono text-base md:text-xl font-bold tracking-tight text-white">{formatDuration(item.duration)}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          {history.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col gap-3">
              <button 
                onClick={handleDownloadImage}
                disabled={isSharing}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] disabled:bg-emerald-900/50 text-white py-3 rounded-xl font-extrabold uppercase text-[10px] md:text-xs tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/10"
              >
                {isSharing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Share via WhatsApp</span>
                  </>
                )}
              </button>
              
              <p className="text-[8px] text-slate-600 text-center font-mono uppercase tracking-[0.15em] leading-relaxed">
                Klik untuk capture laporan gambar & bagikan ke grup
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Hidden Report Container for html2canvas */}
      <div className="fixed top-0 left-0 -z-50 pointer-events-none overflow-hidden h-0 w-0">
        <div 
          ref={historyRef}
          className="w-[500px] bg-[#020C1B] p-10 text-white font-sans"
        >
          <div className="border-b border-slate-800 pb-8 mb-8 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2 text-cyan-500">
                <Truck className="w-6 h-6" />
                <span className="font-bold text-[10px] uppercase tracking-widest">System Report</span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter leading-none">CHANGESHIFT<br /><span className="text-cyan-500">TRACKER</span></h2>
            </div>
            <div className="text-right">
              <div className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-1">Generated Date</div>
              <div className="font-mono text-xl font-bold">{currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-slate-400 font-sans font-bold text-xs uppercase tracking-widest border-b border-slate-800/50 pb-2 flex justify-between">
              <span>Completed Units</span>
              <span className="text-cyan-500">{history.length} Total</span>
            </h3>
            {history.map((item) => (
              <div key={item.id} className="bg-[#112240] p-5 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-mono font-bold text-2xl text-white mb-1">{item.unitNumber}</div>
                  <div className="flex gap-4 font-mono text-xs text-slate-500">
                    <span>IN: {formatTime(item.entryTime)}</span>
                    <span>OUT: {formatTime(item.exitTime)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Duration</div>
                  <div className="font-mono text-2xl font-bold text-cyan-400">{formatDuration(item.duration)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex justify-between items-center opacity-40">
            <span className="text-[10px] font-mono tracking-widest">INDUSTRIAL CORE SYSTEMS REPORT</span>
            <span className="text-[10px] font-mono">v1.2</span>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 p-4 md:p-6 text-[8px] md:text-[10px] font-mono text-slate-600 flex flex-col md:flex-row justify-between gap-2 uppercase tracking-[0.2em] bg-[#020C1B]">
        <span>CHANGESHIFT-TRACKER v1.2</span>
        <span>&copy; {new Date().getFullYear()} INDUSTRIAL CORE SYSTEMS</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #020C1B;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1d335a;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
