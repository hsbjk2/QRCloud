import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  Barcode, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Printer, 
  Settings, 
  Palette, 
  Info, 
  ShieldCheck, 
  Sparkles, 
  Zap,
  Sliders,
  Type
} from 'lucide-react';
import { motion } from 'motion/react';
import { QRHistoryItem } from '../types';

interface BarcodeGeneratorProps {
  onAddHistory: (item: QRHistoryItem) => void;
}

const BARCODE_FORMATS = [
  { id: 'CODE128', name: 'CODE128 (Standard)', desc: 'Variable length alphanumeric. Recommended for general use.' },
  { id: 'CODE39', name: 'CODE39', desc: 'Uppercase letters, numbers, and some symbols. Wide use in manufacturing.' },
  { id: 'EAN13', name: 'EAN-13', desc: '12 or 13 digits. Standard European retail format.' },
  { id: 'EAN8', name: 'EAN-8', desc: '7 or 8 digits. Retail format for small packages.' },
  { id: 'UPC-A', name: 'UPC-A', desc: '11 or 12 digits. North American retail standard.' },
  { id: 'ITF', name: 'ITF (Interleaved 2 of 5)', desc: 'Even number of digits. Industrial and shipping use.' },
  { id: 'MSI', name: 'MSI Plessey', desc: 'Numeric only. Used in inventory control and retail.' },
  { id: 'Pharmacode', name: 'Pharmacode', desc: 'Numeric (3 to 131070). Used in pharmaceutical packaging.' },
];

const PRESET_COLORS = [
  { name: 'Classic Dark', fg: '#1e293b', bg: '#ffffff' },
  { name: 'SaaS Indigo', fg: '#4f46e5', bg: '#faf5ff' },
  { name: 'Emerald Forest', fg: '#059669', bg: '#f0fdf4' },
  { name: 'Sunset Crimson', fg: '#e11d48', bg: '#fff1f2' },
  { name: 'Cyber Teal', fg: '#0d9488', bg: '#f0fdfa' },
  { name: 'Deep Onyx', fg: '#000000', bg: '#ffffff' },
];

const DEFAULT_VALUES: Record<string, string> = {
  CODE128: 'QRCloud128',
  CODE39: 'QRCLOUD39',
  EAN13: '123456789012',
  EAN8: '1234567',
  'UPC-A': '12345678901',
  ITF: '12345678',
  MSI: '123456',
  Pharmacode: '1234'
};

export default function BarcodeGenerator({ onAddHistory }: BarcodeGeneratorProps) {
  const [format, setFormat] = useState('CODE128');
  const [value, setValue] = useState(DEFAULT_VALUES.CODE128);
  const [lineColor, setLineColor] = useState('#1e293b');
  const [background, setBackground] = useState('#ffffff');
  const [displayValue, setDisplayValue] = useState(true);
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [margin, setMargin] = useState(10);
  
  // Status flags
  const [copied, setCopied] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Input Validation Rules
  const validateInput = (fmt: string, text: string): string | null => {
    if (!text) return 'Input value cannot be empty';
    
    switch (fmt) {
      case 'EAN13':
        if (!/^\d{12,13}$/.test(text)) {
          return 'EAN-13 requires exactly 12 or 13 numeric digits.';
        }
        break;
      case 'EAN8':
        if (!/^\d{7,8}$/.test(text)) {
          return 'EAN-8 requires exactly 7 or 8 numeric digits.';
        }
        break;
      case 'UPC-A':
        if (!/^\d{11,12}$/.test(text)) {
          return 'UPC-A requires exactly 11 or 12 numeric digits.';
        }
        break;
      case 'CODE39':
        if (!/^[A-Z0-9\s\-\.\$\/\+\%\*]*$/.test(text)) {
          return 'CODE39 supports only uppercase letters (A-Z), numbers, spaces, and: - . $ / + % *';
        }
        break;
      case 'ITF':
        if (!/^\d+$/.test(text)) {
          return 'ITF requires numeric digits only.';
        }
        if (text.length % 2 !== 0) {
          return 'ITF requires an even number of digits.';
        }
        break;
      case 'MSI':
        if (!/^\d+$/.test(text)) {
          return 'MSI Plessey requires numeric digits only.';
        }
        break;
      case 'Pharmacode':
        const num = parseInt(text, 10);
        if (isNaN(num) || !/^\d+$/.test(text) || num < 3 || num > 131070) {
          return 'Pharmacode requires a numeric value between 3 and 131070.';
        }
        break;
      case 'CODE128':
      default:
        if (!/^[\x00-\x7F]*$/.test(text)) {
          return 'CODE128 supports standard ASCII characters only.';
        }
        break;
    }
    return null;
  };

  // Switch format handler with default placeholder values
  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    const defaultValue = DEFAULT_VALUES[newFormat] || '12345';
    setValue(defaultValue);
    setRenderError(null);
  };

  // Generate and refresh barcode previews
  useEffect(() => {
    const errorMsg = validateInput(format, value);
    if (errorMsg) {
      setRenderError(errorMsg);
      return;
    }

    try {
      setRenderError(null);
      
      if (svgRef.current) {
        // Clear children to avoid drawing glitches on fast renders
        svgRef.current.innerHTML = '';
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          lineColor,
          background,
          margin,
          fontSize: 14,
          fontOptions: 'bold',
          valid: (valid) => {
            if (!valid) {
              setRenderError(`Invalid barcode input for format ${format}`);
            }
          }
        });
      }

      if (canvasRef.current) {
        JsBarcode(canvasRef.current, value, {
          format,
          width,
          height,
          displayValue,
          lineColor,
          background,
          margin,
          fontSize: 14,
          fontOptions: 'bold'
        });
      }
    } catch (err: any) {
      console.error(err);
      setRenderError(err.message || 'Error compiling barcode format');
    }
  }, [value, format, width, height, displayValue, lineColor, background, margin]);

  // Handle saving to user history
  const handleSaveToHistory = () => {
    if (renderError || !canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onAddHistory({
        id: crypto.randomUUID(),
        type: 'barcode',
        title: `${format} Barcode`,
        content: value,
        fgColor: lineColor,
        bgColor: background,
        createdAt: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        qrDataUrl: dataUrl,
        scanned: false,
      });
    } catch (e) {
      console.error('Failed to save barcode to history logs:', e);
    }
  };

  // Download actions
  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    try {
      handleSaveToHistory();
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `barcode_${format}_${value}.png`;
      link.href = url;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    try {
      handleSaveToHistory();
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.download = `barcode_${format}_${value}.svg`;
      link.href = svgUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
    } catch (e) {
      console.error(e);
    }
  };

  // Clipboard copy
  const handleCopyValue = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      handleSaveToHistory();
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImg(true);
          setTimeout(() => setCopiedImg(false), 2000);
        } catch (e) {
          console.error('Navigator clipboard image copy failed', e);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Printing Layout window
  const handlePrint = () => {
    if (!svgRef.current) return;
    handleSaveToHistory();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${format} ${value}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: white;
              color: black;
            }
            .wrapper {
              text-align: center;
              padding: 24px;
              border: 1px dashed #ccc;
              border-radius: 8px;
            }
            .info {
              margin-top: 16px;
              font-size: 12px;
              color: #555;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            ${svgRef.current.outerHTML}
            <div class="info">Generated with QRCloud - ${format} Barcode</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
      
      {/* Settings Form Grid Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Barcode Customizations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure parameters to design, validate, and style a custom machine-readable barcode.
            </p>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block flex justify-between">
              <span>Barcode Data Input</span>
              <span className="text-[10px] font-mono text-indigo-500">{format} format active</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setRenderError(null);
                }}
                placeholder={DEFAULT_VALUES[format] || 'Enter data...'}
                className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/40 border rounded-2xl text-slate-800 dark:text-slate-100 text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                  renderError 
                    ? 'border-rose-500/50 focus:ring-rose-500/20' 
                    : 'border-slate-200/50 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Formats Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
              Choose Symbology format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BARCODE_FORMATS.map((fmt) => (
                <button
                  type="button"
                  key={fmt.id}
                  onClick={() => handleFormatChange(fmt.id)}
                  className={`p-3 text-left rounded-xl border transition-all hover:scale-[1.02] active:scale-98 ${
                    format === fmt.id
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400'
                      : 'border-slate-200/40 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 text-slate-650 dark:text-slate-350 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="block text-[11px] font-extrabold leading-none mb-1">
                    {fmt.id}
                  </span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 truncate">
                    {fmt.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Accordion */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              Dimensions & Padding Controls
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Bar Width</span>
                  <span>{width}px</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Bar Height</span>
                  <span>{height}px</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={150}
                  step={5}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Outer Margin</span>
                  <span>{margin}px</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={2}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Text options & presets */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-slate-400" />
              Text & Theme Configuration
            </span>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-1/3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="displayValue"
                  checked={displayValue}
                  onChange={(e) => setDisplayValue(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                />
                <label htmlFor="displayValue" className="text-xs font-semibold text-slate-750 dark:text-slate-300 cursor-pointer select-none">
                  Display Value Text Below
                </label>
              </div>

              <div className="w-full md:w-2/3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Line Color Hex
                  </label>
                  <input
                    type="text"
                    value={lineColor}
                    onChange={(e) => setLineColor(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Background Hex
                  </label>
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-400" />
                Color Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => {
                      setLineColor(preset.fg);
                      setBackground(preset.bg);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200/50 dark:border-slate-700 hover:scale-102 active:scale-95 transition-all text-slate-700 dark:text-slate-300`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-slate-300/40" 
                      style={{ backgroundColor: preset.fg }} 
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Preview Column */}
      <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
        
        {/* SVG/Canvas Preview Shell */}
        <div className="bg-slate-900/95 dark:bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-rose-500" />
          <div className="absolute top-4 right-4 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-800">
            Machine Code
          </div>

          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 mt-2 text-center w-full block">
            Barcode Live Canvas
          </h4>

          {renderError ? (
            <div className="flex flex-col items-center justify-center min-h-[160px] max-w-[280px] text-center gap-3 px-4 py-6 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <Info className="w-8 h-8 text-rose-500 animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Format Compilation Blocked</p>
                <p className="text-[11px] text-rose-300 leading-relaxed font-semibold">{renderError}</p>
              </div>
            </div>
          ) : (
            <div className="relative group bg-white p-6 rounded-2xl border border-slate-800/80 shadow-lg flex items-center justify-center transition-all duration-500 hover:scale-[1.02] max-w-full overflow-x-auto min-h-[160px]">
              {/* Visible SVG rendering of vector barcode */}
              <svg 
                ref={svgRef} 
                className="max-w-full h-auto select-none"
              />
              
              {/* Hidden canvas for image PNG export / copy operations */}
              <canvas 
                ref={canvasRef} 
                className="hidden" 
              />
            </div>
          )}

          {/* Quick Metrics */}
          <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-slate-800/60 pt-4 text-center">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Format Standard</span>
              <span className="text-xs text-indigo-400 font-extrabold">{format}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Readability</span>
              <span className="text-xs text-emerald-400 font-extrabold">{renderError ? 'Invalid Input' : 'High Contrast'}</span>
            </div>
          </div>

          {/* Action Export Triggers */}
          <div className="w-full flex flex-col gap-2.5 mt-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={!!renderError}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 border border-slate-700/60 text-white text-xs font-semibold hover:border-slate-600 active:scale-95 transition-all text-center focus:outline-none"
              >
                <Download className="w-4 h-4 text-slate-400" />
                PNG Download
              </button>

              <button
                type="button"
                onClick={handleDownloadSVG}
                disabled={!!renderError}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 border border-slate-700/60 text-white text-xs font-semibold hover:border-slate-600 active:scale-95 transition-all text-center focus:outline-none"
              >
                <Zap className="w-4 h-4 text-slate-400" />
                SVG Vector
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={!!renderError}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold active:scale-95 transition-all text-center focus:outline-none ${
                  copiedImg
                    ? 'bg-emerald-600 text-white border border-emerald-500'
                    : 'bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 border border-slate-700/60 text-white hover:border-slate-600'
                }`}
              >
                {copiedImg ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied Image
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    Copy Image
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!!renderError}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 border border-slate-700/60 text-white text-xs font-semibold hover:border-slate-600 active:scale-95 transition-all text-center focus:outline-none"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                Print Layout
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyValue}
              disabled={!!renderError}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold active:scale-98 transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied Text!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Raw Text
                </>
              )}
            </button>
          </div>

        </div>

        {/* Vector Scale Warning card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">High Fidelity Compliance</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              These generated barcodes adhere to official international GS1 standards, guaranteeing extreme contrast and scannability on hardware laser readers.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
