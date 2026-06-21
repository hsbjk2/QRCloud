/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  QrCode, 
  Scan, 
  History, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Award,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRGenerator from './components/QRGenerator';
import QRScanner from './components/QRScanner';
import QRHistory from './components/QRHistory';
import ThemeToggle from './components/ThemeToggle';
import { QRHistoryItem } from './types';

export default function App() {
  // Navigation active tab index
  const [activeTab, setActiveTab] = useState<'create' | 'scan' | 'history'>('create');

  // Load history from localStorage safely
  const [historyItems, setHistoryItems] = useState<QRHistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qrflow_history');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse local history', e);
          return [];
        }
      }
    }
    return [];
  });

  // Sync state data to localStorage
  useEffect(() => {
    localStorage.setItem('qrflow_history', JSON.stringify(historyItems));
  }, [historyItems]);

  const handleAddHistory = (item: QRHistoryItem) => {
    // Check if duplicate scan/item exists next-to-next, if so, ignore to avoid clutter
    setHistoryItems((prev) => {
      const exists = prev.some((p) => p.content === item.content && p.type === item.type && p.scanned === item.scanned);
      if (exists) {
        // Just move to the top of list (by deleting old and prepending)
        const filtered = prev.filter((p) => !(p.content === item.content && p.type === item.type));
        return [item, ...filtered];
      }
      return [item, ...prev];
    });
  };

  const handleDeleteItem = (id: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete your entire QR scan/generation history? This is irreversible.')) {
      setHistoryItems([]);
    }
  };

  // State metrics
  const generatedCount = historyItems.filter((i) => !i.scanned).length;
  const scannedCount = historyItems.filter((i) => i.scanned).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative font-sans flex overflow-x-hidden">
      
      {/* Background Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-radial-overlay opacity-[0.4] dark:opacity-[0.2] pointer-events-none z-0" />

      {/* Modern gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/15 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sidebar - Desktop Layout (Hidden on Mobile) */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex h-screen sticky top-0 shrink-0 z-30 justify-between">
        <div className="flex-1 flex flex-col">
          {/* Logo Brand with Micro Glow */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-250 dark:border-slate-800/60 mb-6">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/15 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-xl" />
              <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[10px] flex items-center justify-center text-white relative z-10">
                <QrCode className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <span className="font-display text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-white bg-clip-text text-transparent">
                QR<span className="font-medium text-indigo-500">Flow</span>
              </span>
              <a 
                href="https://hsbjk.in" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block text-[8px] font-mono font-bold tracking-widest text-slate-400 hover:text-indigo-500 uppercase leading-none mt-0.5 transition-colors"
              >
                by hsbjk
              </a>
            </div>
          </div>

          {/* Navigation Links inside Sidebar */}
          <nav className="flex-1 px-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">
              Tools & Services
            </div>
            
            <button
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'create'
                  ? 'sidebar-active shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4 mr-3 stroke-[2]" />
              Generate QR
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'scan'
                  ? 'sidebar-active shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Scan className="w-4 h-4 mr-3 stroke-[2]" />
              Scan & Extract
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'history'
                  ? 'sidebar-active shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4 mr-3 stroke-[2]" />
              <span className="flex-1 text-left">History Library</span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                {historyItems.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Branding / Support Info */}
        <div className="p-4 text-center mt-auto">
          <div className="py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center">
            <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Made by <a href="https://hsbjk.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">hsbjk</a>
            </span>
            <a 
              href="https://hsbjk.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              hsbjk software company
            </a>
            <a
              href="mailto:support.hsbjk@gmail.com"
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-indigo-650 dark:text-indigo-400 hover:underline font-semibold"
            >
              Contact support.hsbjk@gmail.com
            </a>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 w-0">
        
        {/* Global Header Area */}
        <header className="sticky top-0 z-40 h-16 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/80 px-6 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4">
            {/* Mobile Brand / Logo */}
            <div className="flex md:hidden items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                Q
              </div>
              <span className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                QRFlow
              </span>
            </div>

            {/* Desktop current action title */}
            <h1 className="hidden md:block text-base font-bold text-slate-800 dark:text-slate-100">
              {activeTab === 'create' ? 'Generate New Code' : activeTab === 'scan' ? 'Scan & Extract Data' : 'History Log Archive'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <a
              href="mailto:support.hsbjk@gmail.com"
              className="hidden sm:inline-flex py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-300 transition-all duration-300 shadow-sm"
            >
              Support Helpdesk
            </a>
          </div>
        </header>

        {/* Main Content Body */}
        <main id="sass-content-body" className="flex-1 p-4 sm:p-8 flex flex-col gap-8 md:gap-10">
          
          {/* Hero Pitch Showcase */}
          <section id="hero-pitch" className="text-center space-y-4 max-w-2xl mx-auto pt-2 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/40 dark:border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-700 dark:text-indigo-350 uppercase tracking-widest mx-auto shadow-sm">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
              Professional Polish Design
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white capitalize">
              Generate, scan <span className="relative inline-block"><span className="text-indigo-600 dark:text-indigo-400">&amp; extract</span>
              <span className="absolute bottom-1 left-0 -right-1 h-0.5 bg-indigo-500 dark:bg-indigo-400/40 rounded" /></span> QR codes instantly
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
              Designed for modern professionals. Create beautifully branded QR codes with custom logos, dynamic palettes, rounded dot matrices, and scan physical labels in real-time.
            </p>

            <div className="flex items-center gap-6 justify-center flex-wrap pt-1">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold font-sans">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                100% Secure Client-side Privacy
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold font-sans">
                <Zap className="w-4 h-4 text-indigo-500" />
                SVG Vector Press Export
              </span>
            </div>
          </section>

          {/* Integrated Quick Statistics Dashboard Bar */}
          <section id="analytics-overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 shadow-sm w-full">
            <div className="p-2 sm:p-4 border-r border-slate-200/40 dark:border-slate-800/60 last:border-0 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none mb-1">Generated</span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{generatedCount}</span>
              </div>
            </div>
            
            <div className="p-2 sm:p-4 border-r border-slate-200/40 dark:border-slate-800/60 last:border-0 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 shrink-0">
                <Scan className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none mb-1">Decoded / Scans</span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{scannedCount}</span>
              </div>
            </div>

            <div className="p-2 sm:p-4 border-r border-slate-200/40 dark:border-slate-800/60 last:border-0 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/10 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none mb-1">Vault Status</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">Secure (Offline)</span>
              </div>
            </div>

            <div className="p-2 sm:p-4 last:border-0 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 shrink-0">
                <Heart className="w-5 h-5 text-indigo-500 fill-indigo-500/10" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none mb-1">Billing Type</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-bold font-sans">100% Free Forever</span>
              </div>
            </div>
          </section>

          {/* Tab Navigation for Mobile / Tablet Flow */}
          <div className="md:hidden flex bg-white/90 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-1 rounded-2xl w-full sticky top-18 z-20 shadow-md">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Create
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'scan'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Scan className="w-4 h-4" />
              Scan
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-[10px] font-bold transition-all relative ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <History className="w-4 h-4" />
              History ({historyItems.length})
            </button>
          </div>

          {/* Dynamic Display Panel with Animating Slide Triggers */}
          <section id="module-display-panel" className="relative z-10">
            <AnimatePresence mode="wait">
              {activeTab === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <QRGenerator onAddHistory={handleAddHistory} />
                </motion.div>
              )}

              {activeTab === 'scan' && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <QRScanner onAddHistory={handleAddHistory} />
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <QRHistory 
                    items={historyItems} 
                    onClearAll={handleClearHistory} 
                    onDeleteItem={handleDeleteItem} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </main>

        {/* Modern SaaS Footer layout */}
        <footer className="border-t border-slate-200/50 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/40 mt-auto transition-colors z-10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-extrabold text-slate-800 dark:text-white">
                QR<span className="text-indigo-500">Flow</span>
              </span>
              <span className="text-[11px] text-slate-400">
                | Powered by <a href="https://hsbjk.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 hover:underline font-semibold">hsbjk company</a>. 100% Free Service. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <a href="#privacy" className="hover:text-indigo-500 transition-colors">Privacy Shield</a>
              <a href="mailto:support.hsbjk@gmail.com" className="hover:text-indigo-500 transition-colors">Support Helpdesk</a>
              <a href="#docs" className="hover:text-indigo-500 transition-colors">Offline API Documentation</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

