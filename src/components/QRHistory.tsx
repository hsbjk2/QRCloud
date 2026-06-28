import { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Globe, 
  Wifi, 
  Mail, 
  Phone, 
  MessageSquare, 
  FileText, 
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRHistoryItem } from '../types';

interface QRHistoryProps {
  items: QRHistoryItem[];
  onClearAll: () => void;
  onDeleteItem: (id: string) => void;
}

export default function QRHistory({ items, onClearAll, onDeleteItem }: QRHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'generated' | 'scanned'>('all');
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Selected item modal details
  const [selectedItem, setSelectedItem] = useState<QRHistoryItem | null>(null);

  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'generated') return matchesSearch && !item.scanned;
    if (filterType === 'scanned') return matchesSearch && item.scanned;
    return matchesSearch;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'url':
      case 'social':
        return <Globe className="w-4 h-4 text-indigo-500" />;
      case 'wifi':
        return <Wifi className="w-4 h-4 text-emerald-500" />;
      case 'email':
        return <Mail className="w-4 h-4 text-amber-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-rose-500" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-cyan-500" />;
      case 'barcode':
        return <Barcode className="w-4 h-4 text-violet-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div id="qr-history-container" className="space-y-6">
      
      {/* Search and Filters Strip */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-3xl shadow-md">
        
        {/* Search input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recent codes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/45 border border-slate-200/40 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-750 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Source Filter Tabs */}
        <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All History' },
            { id: 'generated', label: 'Generated' },
            { id: 'scanned', label: 'Scanned' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-transparent transition-all ml-auto md:ml-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* History Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-850/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                {/* Generated colored glow accents */}
                <span 
                  className="absolute right-0 top-0 w-1.5 h-full" 
                  style={{ backgroundColor: item.scanned ? '#10b981' : '#6366f1' }} 
                />

                <div className="flex items-start gap-3">
                  {/* Thumbnail / QR source icon */}
                  <div className="p-2 bg-slate-55 dark:bg-slate-850 border border-slate-150 dark:border-slate-750/70 rounded-xl shrink-0 group-hover:scale-105 transition-all">
                    {getIconForType(item.type)}
                  </div>

                  <div className="space-y-1 truncate flex-1 pr-4">
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">
                      {item.scanned ? 'Scanned link' : 'Generated Custom'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-505 dark:text-slate-400 truncate max-w-full font-mono mt-0.5">
                      {item.content}
                    </p>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3 mt-3">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Calendar className="w-3 h-3" />
                    {item.createdAt}
                  </span>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.id, item.content);
                      }}
                      className={`p-1.5 rounded-lg border transition-all ${
                        copiedItemId === item.id
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-transparent border-slate-200/50 dark:border-slate-800 text-slate-450 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {copiedItemId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-16 flex flex-col items-center justify-center text-center opacity-70"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-full mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-305 uppercase tracking-wide">
                No entries match filters
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mt-1">
                Your creations and parsed results are securely saved locally on this browser viewport.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Item Detail Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4">
                <span className="inline-flex gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  {getIconForType(selectedItem.type)}
                  {selectedItem.scanned ? 'Scan Result' : 'Generative Code'}
                </span>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {selectedItem.title}
                </h3>

                {selectedItem.qrDataUrl ? (
                  <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl inline-block border border-slate-200 dark:border-slate-800">
                    <img src={selectedItem.qrDataUrl} alt="historical QR content" className="w-[180px] h-[180px] object-contain rounded" />
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-500 max-w-[200px] mx-auto">
                    Image generation data missing (Original scanning vector only).
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-850/65 p-3 rounded-xl text-left border border-slate-150 dark:border-slate-800">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Payload Content</span>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all font-medium leading-relaxed max-h-[100px] overflow-y-auto">
                    {selectedItem.content}
                  </p>
                </div>

                <div className="flex gap-2 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.content);
                      alert('Copied raw details!');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-105 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200/50 dark:border-slate-700/50"
                  >
                    Copy String
                  </button>
                  {selectedItem.content.startsWith('http') && (
                    <a
                      href={selectedItem.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit site
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

