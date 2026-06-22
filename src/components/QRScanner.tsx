import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  Upload, 
  FileImage, 
  Check, 
  Copy, 
  Share2, 
  Wifi, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  Loader2, 
  AlertTriangle,
  Play,
  Square,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRHistoryItem, ExtractedData } from '../types';
import { parseQRContent } from '../utils';

interface QRScannerProps {
  onAddHistory: (item: QRHistoryItem) => void;
}

export default function QRScanner({ onAddHistory }: QRScannerProps) {
  // Mode selection
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('upload');
  
  // Camera scanning states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('Idle');
  
  // File upload states
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Extracted Result
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedResultRaw, setCopiedResultRaw] = useState(false);

  // Refs for camera processing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanStatus('Idle');
  };

  // Start camera stream helper
  const startCamera = async () => {
    try {
      setCameraPermissionError(false);
      setExtractedData(null);
      setScanStatus('Initializing camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      setCameraActive(true);
      setScanStatus('Scanning live frames...');
    } catch (e) {
      console.error('Camera permissions denied or unavailable', e);
      setCameraPermissionError(true);
      setCameraActive(false);
      setScanStatus('Failed');
    }
  };

  // Bind and play camera stream once element is mounted on state change
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error('Failed to play video stream:', err);
      });
    }
  }, [cameraActive]);

  // Continuously analyze video frames
  useEffect(() => {
    if (!cameraActive) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw current frame onto canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Grab current frame details
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleSuccessfulScan(code.data);
            return; // stop further frame animation draws
          }
        }
      }

      // Continue to next animation frame
      if (cameraActive) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive]);

  // Clean-up media on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSuccessfulScan = (rawText: string) => {
    stopCamera();
    
    // Parse the data
    const parsed = parseQRContent(rawText);
    setExtractedData(parsed);

    // Save to history automatically
    const historyItem: QRHistoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      type: parsed.type === 'vcard' || parsed.type === 'location' || parsed.type === 'unknown' ? 'text' : parsed.type,
      title: `${parsed.title} (Scanned)`,
      content: rawText,
      fgColor: '#000000',
      bgColor: '#ffffff',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      qrDataUrl: '', // Will be processed on display if needed
      scanned: true,
    };
    onAddHistory(historyItem);
  };

  // Drag-and-drop actions
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    setIsProcessingFile(true);
    setExtractedData(null);
    setSelectedImage(null);

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);

      // Render image element to decode
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          setIsProcessingFile(false);
          if (code && code.data) {
            handleSuccessfulScan(code.data);
          } else {
            alert('No clear QR Code detected in this image. Please ensure the QR Code is highly visible and has a high contrast.');
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Actions
  const copyFieldValue = async (fieldLabel: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedField(fieldLabel);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyRawResultText = async () => {
    if (!extractedData) return;
    try {
      await navigator.clipboard.writeText(extractedData.raw);
      setCopiedResultRaw(true);
      setTimeout(() => setCopiedResultRaw(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Maps types to nice Lucide icons
  const getIconForType = (type: string) => {
    switch (type) {
      case 'url':
      case 'social':
        return <Globe className="w-5 h-5 text-indigo-500" />;
      case 'wifi':
        return <Wifi className="w-5 h-5 text-emerald-500" />;
      case 'email':
        return <Mail className="w-5 h-5 text-amber-500" />;
      case 'phone':
        return <Phone className="w-5 h-5 text-rose-500" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-cyan-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div id="qr-scanner-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Interactive Scan Stage */}
      <div id="scanner-stage" className="lg:col-span-6 bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl overflow-hidden relative min-h-[440px] flex flex-col">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 bg-slate-100/60 dark:bg-slate-800/60 p-1.5 rounded-full border border-slate-200/35 dark:border-slate-700/35 w-full max-w-sm self-center">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScanMode('upload');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
              scanMode === 'upload'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/40 dark:border-slate-650'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            File Upload
          </button>
          <button
            type="button"
            onClick={() => {
              setScanMode('camera');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
              scanMode === 'camera'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/40 dark:border-slate-650'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Webcam
          </button>
        </div>

        {/* Inner Panel Stage */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[280px]">
          {scanMode === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`w-full h-full flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative overflow-hidden ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-slate-250 dark:border-slate-850 hover:border-indigo-400/80 bg-slate-50/50 dark:bg-slate-850/20'
              }`}
            >
              <input
                type="file"
                id="qr-file-upload-input"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700 rounded-2xl shadow-sm mb-4">
                <FileImage className="w-8 h-8 text-indigo-500 shrink-0" />
              </div>

              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                Drag and drop your QR code image
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-4">
                Supports standard formats: JPEG, PNG, WEBP. Makes immediate frame assessments.
              </p>

              <span className="text-xs font-bold px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">
                Browse System Files
              </span>

              {isProcessingFile && (
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Rastering scanlines...</span>
                </div>
              )}
            </div>
          ) : (
            // Webcam live scanner view
            <div className="w-full flex-1 flex flex-col items-center justify-center relative rounded-2xl overflow-hidden bg-slate-950 min-h-[300px]">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover absolute inset-0 bg-black"
                  />
                  {/* Overlay scanning lasers & finder frame */}
                  <div className="absolute inset-x-8 inset-y-12 border-2 border-indigo-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="w-5 h-5 border-t-4 border-l-4 border-indigo-500 rounded-tl-md" />
                      <span className="w-5 h-5 border-t-4 border-r-4 border-indigo-500 rounded-tr-md" />
                    </div>
                    {/* Laser animation line */}
                    <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_12px_#6366f1] animate-bounce" />
                    <div className="flex justify-between">
                      <span className="w-5 h-5 border-b-4 border-l-4 border-indigo-500 rounded-bl-md" />
                      <span className="w-5 h-5 border-b-4 border-r-4 border-indigo-500 rounded-br-md" />
                    </div>
                  </div>

                  {/* Status Indicator popup (bottom) */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800/80 px-4 py-2 rounded-xl flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      {scanStatus}
                    </span>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600/25 hover:bg-rose-600 border border-rose-500 text-[10px] font-bold uppercase transition"
                    >
                      <Square className="w-2.5 h-2.5" />
                      Stop
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  {cameraPermissionError ? (
                    <div className="max-w-xs space-y-3">
                      <div className="p-3 bg-rose-500/10 border border-rose-500 rounded-2xl mx-auto w-fit">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                      </div>
                      <h4 className="text-xs font-bold uppercase text-slate-100 tracking-wider">Camera Permissions Blocked</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Webcam access is restricted by your browser. Please permit camera authorization or use the standard File Uploader tab instead.
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-xs space-y-4">
                      <div className="p-4 bg-slate-800/40 border border-slate-850 rounded-full mx-auto w-fit">
                        <Camera className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wide">Live Stream Ready</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Activate your built-in device lens to instantly decode physical codes using your camera.
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="py-3 px-6 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-95 transition-all text-center focus:outline-none"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Initialize Camera lens
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden backstage rendering canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Extracted Data Visual Sheet Panel (Side pane) */}
      <div id="scanner-result" className="lg:col-span-6 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {extractedData ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-850/80 rounded-3xl p-6 shadow-xl relative overflow-hidden"
            >
              {/* Highlight background mesh */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-750">
                    {getIconForType(extractedData.type)}
                  </div>
                  <div>
                    <span className="block text-[10px] text-indigo-500 font-bold uppercase tracking-widest leading-none mb-1">
                      Extraction Completed
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {extractedData.title}
                    </h3>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={copyRawResultText}
                    className={`p-2 rounded-xl border transition-all ${
                      copiedResultRaw
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm'
                    }`}
                    title="Copy full RAW textual payload"
                  >
                    {copiedResultRaw ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Individual Fields List */}
              <div className="space-y-4 mb-6">
                {extractedData.fields.map((field) => (
                  <div 
                    key={field.label} 
                    className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
                  >
                    <div className="space-y-0.5 truncate max-w-[80%]">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</span>
                      {field.link ? (
                        <a 
                          href={field.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                        >
                          {field.value}
                        </a>
                      ) : (
                        <span className="block font-medium text-slate-700 dark:text-slate-350 select-text truncate">
                          {field.value || '(Field empty)'}
                        </span>
                      )}
                    </div>

                    {field.copyable && field.value && (
                      <button
                        type="button"
                        onClick={() => copyFieldValue(field.label, field.value)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all w-fit md:w-auto ${
                          copiedField === field.label
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 text-slate-700 dark:text-slate-350 shadow-sm'
                        }`}
                      >
                        {copiedField === field.label ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Global Extracted Raw Payload block */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">RAW Decoded Payload</span>
                <pre className="p-3 bg-slate-950 dark:bg-black border border-slate-800 rounded-xl text-[11px] text-slate-400 font-mono whitespace-pre-wrap select-all">
                  {extractedData.raw}
                </pre>
              </div>

            </motion.div>
          ) : (
            <div key="no-result" className="h-full flex-1 min-h-[400px] border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-full mb-4">
                <Globe className="w-8 h-8 text-indigo-400/80 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Waiting on QR Decode Scan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Provide raw system assets, scan frames with webcam or drop visual barcodes to display the extracted fields instantly.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
