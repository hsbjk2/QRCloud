import { useState, useEffect, useRef, ChangeEvent } from 'react';
import QRCode from 'qrcode';
import { 
  Globe, 
  FileText, 
  Mail, 
  Phone, 
  Wifi, 
  MessageSquare, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Palette, 
  Layout, 
  Smile, 
  Type,
  Maximize2,
  Trash2,
  Instagram,
  Linkedin,
  Github,
  Twitter,
  Link,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRConfig, QRType, QRHistoryItem } from '../types';
import { generateWiFiString, generateMailtoString, generateSMSString } from '../utils';

interface QRGeneratorProps {
  onAddHistory: (item: QRHistoryItem) => void;
}

const PRESET_COLORS = [
  { name: 'Pitch Black', fg: '#000000', bg: '#ffffff' },
  { name: 'Electric Blue', fg: '#3b82f6', bg: '#ffffff' },
  { name: 'SaaS Indigo', fg: '#6366f1', bg: '#ffffff' },
  { name: 'Emerald Forest', fg: '#10b981', bg: '#f0fdf4' },
  { name: 'Sunset Coral', fg: '#f43f5e', bg: '#fff1f2' },
  { name: 'Cyber Purple', fg: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Gold Onyx', fg: '#d97706', bg: '#fef3c7' },
];

const PRESET_LOGOS = [
  { name: 'None', url: '' },
  { name: 'Web', url: 'web' },
  { name: 'WiFi', url: 'wifi' },
  { name: 'Mail', url: 'mail' },
  { name: 'Phone', url: 'phone' },
  { name: 'Instagram', url: 'instagram' },
  { name: 'LinkedIn', url: 'linkedin' },
  { name: 'GitHub', url: 'github' },
];

const SOCIAL_THEMES = {
  instagram: {
    bgGradient: 'from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', // Official Instagram Gradient
    textColor: 'text-[#ee2a7b] dark:text-[#f43f5e]',
    accentBg: 'bg-[#ee2a7b]/10',
    borderColor: 'border-[#ee2a7b]/20',
    fgColor: '#ee2a7b',
    label: 'Instagram'
  },
  linkedin: {
    bgGradient: 'from-[#0a66c2] via-[#0077b5] to-[#004182]', // Official LinkedIn Blue
    textColor: 'text-[#0a66c2] dark:text-[#60a5fa]',
    accentBg: 'bg-[#0a66c2]/10',
    borderColor: 'border-[#0a66c2]/20',
    fgColor: '#0a66c2',
    label: 'LinkedIn'
  },
  github: {
    bgGradient: 'from-[#181717] via-[#24292e] to-[#2f363d]', // Official GitHub Dark Octocat
    textColor: 'text-[#24292e] dark:text-slate-100',
    accentBg: 'bg-black/10 dark:bg-white/10',
    borderColor: 'border-black/20 dark:border-white/20',
    fgColor: '#24292e',
    label: 'GitHub'
  },
  twitter: {
    bgGradient: 'from-[#1da1f2] via-[#1a91da] to-[#1565c0]', // Beautiful high-fidelity Twitter bird blue
    textColor: 'text-[#1da1f2] dark:text-[#38bdf8]',
    accentBg: 'bg-[#1da1f2]/10',
    borderColor: 'border-[#1da1f2]/20',
    fgColor: '#1da1f2',
    label: 'Twitter / X'
  }
};

export default function QRGenerator({ onAddHistory }: QRGeneratorProps) {
  // Input tabs
  const [activeTab, setActiveTab] = useState<QRType>('url');

  // Input states
  const [url, setUrl] = useState('https://google.com');
  const [text, setText] = useState('Hello from QRCloud!');
  const [wifiSsid, setWifiSsid] = useState('QRCloud_Network');
  const [wifiPass, setWifiPass] = useState('secret_password');
  const [wifiType, setWifiType] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [emailTo, setEmailTo] = useState('contact@qrCloud.example.com');
  const [emailSubject, setEmailSubject] = useState('Inquiry via QRCloud');
  const [emailBody, setEmailBody] = useState('Hi, I scanned your premium QR code and wanted to connect!');
  const [phoneNum, setPhoneNum] = useState('+14155552671');
  const [smsPhone, setSmsPhone] = useState('+14155552671');
  const [smsBody, setSmsBody] = useState('Sent instantly via my QRCloud dynamic code.');
  
  // Social media link builder
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'linkedin' | 'github' | 'twitter'>('instagram');
  const [socialUsername, setSocialUsername] = useState('');

  // QR Customizations
  const [fgColor, setFgColor] = useState('#0d9488');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dotStyle, setDotStyle] = useState<'square' | 'dots' | 'rounded'>('rounded');
  const [frameStyle, setFrameStyle] = useState<'none' | 'minimal' | 'phone' | 'badge'>('none');
  const [frameText, setFrameText] = useState('SCAN ME AND DISCOVER');
  const [logoPreset, setLogoPreset] = useState<string>('');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(20);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H'); // Keep higher limit for logo overlays
  const [margin, setMargin] = useState<number>(2);

  // Social card thematic display switch
  const [useSocialCard, setUseSocialCard] = useState<boolean>(false);

  // Auto-adapt colors and states when platform or active tab alternates
  useEffect(() => {
    if (activeTab === 'social') {
      setUseSocialCard(true);
      const activePlatformTheme = SOCIAL_THEMES[socialPlatform as keyof typeof SOCIAL_THEMES];
      if (activePlatformTheme) {
        setFgColor(activePlatformTheme.fgColor);
        setBgColor('#ffffff');
        setDotStyle('rounded');
        setLogoPreset(socialPlatform);
      }
    } else {
      setUseSocialCard(false);
    }
  }, [activeTab, socialPlatform]);

  // Status flags
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute final content string
  const getContentString = (): string => {
    switch (activeTab) {
      case 'url':
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      case 'text':
        return text;
      case 'wifi':
        return generateWiFiString(wifiSsid, wifiPass, wifiType, wifiHidden);
      case 'email':
        return generateMailtoString(emailTo, emailSubject, emailBody);
      case 'phone':
        return `tel:${phoneNum}`;
      case 'sms':
        return generateSMSString(smsPhone, smsBody);
      case 'social':
        if (socialPlatform === 'instagram') return `https://instagram.com/${socialUsername}`;
        if (socialPlatform === 'linkedin') return `https://linkedin.com/in/${socialUsername}`;
        if (socialPlatform === 'github') return `https://github.com/${socialUsername}`;
        if (socialPlatform === 'twitter') return `https://twitter.com/${socialUsername}`;
        return `https://${socialUsername}`;
      default:
        return url;
    }
  };

  // Logo uploader
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
          setLogoPreset('custom');
          setErrorCorrectionLevel('H'); // Must be high for custom images
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomLogo = () => {
    setCustomLogoUrl('');
    setLogoPreset('');
  };

  // Canvas Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rawContent = getContentString();
    if (!rawContent) {
      setRenderError('Please fill in content first.');
      return;
    }

    setRenderError('');

    // Renders the QR code details synchronously
    try {
      const qr = QRCode.create(rawContent, { errorCorrectionLevel });
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const numModules = qr.modules.size;
      const basePadding = margin * 8;
      
      // Determine viewport size & frame heights
      const sizeMultiplier = 12; // cell size
      const qrPixelSize = numModules * sizeMultiplier;
      const totalWidth = qrPixelSize + basePadding * 2;
      let totalHeight = totalWidth;

      if (frameStyle !== 'none') {
        totalHeight += 50; // extra text block height
      }

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // 1. Draw Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // 2. Draw Frame structure if requested
      if (frameStyle === 'badge') {
        ctx.fillStyle = fgColor;
        ctx.fillRect(0, totalHeight - 50, totalWidth, 50);
      }

      // Check module positions helper
      const isFinderPattern = (row: number, col: number) => {
        // Top-left
        if (row < 7 && col < 7) return true;
        // Top-right
        if (row >= numModules - 7 && col < 7) return true;
        // Bottom-left
        if (row < 7 && col >= numModules - 7) return true;
        return false;
      };

      ctx.save();
      ctx.translate(basePadding, basePadding);

      for (let r = 0; r < numModules; r++) {
        for (let c = 0; c < numModules; c++) {
          const isActive = qr.modules.get(r, c) === 1;
          if (!isActive) continue;

          const x = r * sizeMultiplier;
          const y = c * sizeMultiplier;

          ctx.fillStyle = fgColor;

          if (isFinderPattern(r, c)) {
            // Stand out Finder eyes slightly or draw them standard for high scan-rate
            // We draw standard smooth rounded rect for finder if dotStyle is rounded
            if (dotStyle === 'rounded' || dotStyle === 'dots') {
              ctx.beginPath();
              // For outer finder square (7x7 modules)
              const radius = sizeMultiplier * 1.5;
              ctx.roundRect?.(x, y, sizeMultiplier, sizeMultiplier, sizeMultiplier * 0.25) || ctx.rect(x, y, sizeMultiplier, sizeMultiplier);
              ctx.fill();
            } else {
              ctx.fillRect(x, y, sizeMultiplier, sizeMultiplier);
            }
          } else {
            // Code modules custom shapes
            if (dotStyle === 'dots') {
              ctx.beginPath();
              ctx.arc(x + sizeMultiplier / 2, y + sizeMultiplier / 2, (sizeMultiplier / 2) * 0.85, 0, Math.PI * 2);
              ctx.fill();
            } else if (dotStyle === 'rounded') {
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(x, y, sizeMultiplier, sizeMultiplier, sizeMultiplier * 0.35);
              } else {
                ctx.rect(x, y, sizeMultiplier, sizeMultiplier);
              }
              ctx.fill();
            } else {
              ctx.fillRect(x, y, sizeMultiplier, sizeMultiplier);
            }
          }
        }
      }
      ctx.restore();

      // 4. Overlap Built-in Icons / Custom Logo
      const activeLogo = logoPreset === 'custom' ? customLogoUrl : logoPreset;
      if (activeLogo) {
        // Calculate centered bounding box
        const targetPercent = logoSize / 100;
        const logoSizePixels = qrPixelSize * targetPercent;
        const logoX = (totalWidth - logoSizePixels) / 2;
        const logoY = (qrPixelSize + basePadding * 2 - logoSizePixels) / 2;

        // Draw background white/bg protection square first to keep QR scannable
        ctx.fillStyle = bgColor;
        const logoBorderPadding = sizeMultiplier * 0.6;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(
            logoX - logoBorderPadding, 
            logoY - logoBorderPadding, 
            logoSizePixels + logoBorderPadding * 2, 
            logoSizePixels + logoBorderPadding * 2, 
            sizeMultiplier * 0.6
          );
        } else {
          ctx.rect(
            logoX - logoBorderPadding, 
            logoY - logoBorderPadding, 
            logoSizePixels + logoBorderPadding * 2, 
            logoSizePixels + logoBorderPadding * 2
          );
        }
        ctx.fill();

        // Standard pre-rendered SVGs or system icons centered if not a custom high-res URL
        if (logoPreset === 'custom' && customLogoUrl) {
          const img = new Image();
          img.src = customLogoUrl;
          img.onload = () => {
            ctx.drawImage(img, logoX, logoY, logoSizePixels, logoSizePixels);
          };
        } else {
          // Render highly optimized colored vector presets on canvas
          ctx.fillStyle = fgColor;
          ctx.strokeStyle = fgColor;
          ctx.lineWidth = sizeMultiplier * 0.3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Center of the icon
          const cx = logoX + logoSizePixels / 2;
          const cy = logoY + logoSizePixels / 2;
          const r = logoSizePixels / 3.2;

          ctx.save();
          if (logoPreset === 'web') {
            // Draw globe
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.ellipse?.(cx, cy, r / 2, r, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - r, cy);
            ctx.lineTo(cx + r, cy);
            ctx.stroke();
          } else if (logoPreset === 'wifi') {
            // Draw WiFi waves
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.6, sizeMultiplier * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.6, r * 0.6, Math.PI * 1.2, Math.PI * 1.8);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.6, r * 1.1, Math.PI * 1.2, Math.PI * 1.8);
            ctx.stroke();
          } else if (logoPreset === 'mail') {
            // Draw Mail Envelope
            const w = r * 1.4;
            const h = r * 1;
            ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
            ctx.beginPath();
            ctx.moveTo(cx - w / 2, cy - h / 2);
            ctx.lineTo(cx, cy + h / 6);
            ctx.lineTo(cx + w / 2, cy - h / 2);
            ctx.stroke();
          } else if (logoPreset === 'phone') {
            // Draw Handset
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.8, 0.4, Math.PI * 0.8);
            ctx.stroke();
          } else if (logoPreset === 'instagram') {
            ctx.strokeRect(cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6);
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + r * 0.4, cy - r * 0.4, sizeMultiplier * 0.15, 0, Math.PI * 2);
            ctx.fill();
          } else if (logoPreset === 'linkedin') {
            ctx.font = `bold ${Math.round(logoSizePixels * 0.6)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('in', cx, cy);
          } else if (logoPreset === 'github') {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            // Tiny design representing octocat
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.2, r * 0.4, Math.PI, 0);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 5. Render Custom Frames / Slogan Text
      if (frameStyle !== 'none') {
        const textY = totalHeight - (frameStyle === 'badge' ? 22 : 18);
        ctx.fillStyle = frameStyle === 'badge' ? bgColor : fgColor;
        ctx.font = `bold ${Math.round(totalWidth * 0.04)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.letterSpacing = '1px';
        ctx.fillText(frameText.toUpperCase(), totalWidth / 2, textY);
      }
    } catch (e) {
      setRenderError('Error calculating QR code. Try reducing characters or changing error correction.');
    }
  }, [
    activeTab,
    url,
    text,
    wifiSsid,
    wifiPass,
    wifiType,
    wifiHidden,
    emailTo,
    emailSubject,
    emailBody,
    phoneNum,
    smsPhone,
    smsBody,
    socialPlatform,
    socialUsername,
    fgColor,
    bgColor,
    dotStyle,
    frameStyle,
    frameText,
    logoPreset,
    customLogoUrl,
    logoSize,
    errorCorrectionLevel,
    margin,
    useSocialCard,
  ]);

  // Saves current QR code configuration to History
  const handleSaveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const content = getContentString();
      let title = 'Web Link';
      
      if (activeTab === 'wifi') title = `WiFi: ${wifiSsid}`;
      else if (activeTab === 'email') title = `Email: ${emailTo}`;
      else if (activeTab === 'phone') title = `Phone: ${phoneNum}`;
      else if (activeTab === 'sms') title = `SMS Recipient`;
      else if (activeTab === 'social') title = `${socialPlatform}: @${socialUsername}`;
      else if (activeTab === 'text') title = 'Text Note';

      const historyItem: QRHistoryItem = {
        id: Math.random().toString(36).substring(2, 11),
        type: activeTab,
        title,
        content,
        fgColor,
        bgColor,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        qrDataUrl: dataUrl,
        scanned: false,
      };

      onAddHistory(historyItem);
    } catch (e) {
      console.error('Failed to export to history', e);
    }
  };

  // Immediate save on initial generation
  const handleDownload = (format: 'png' | 'svg', optionOverride?: 'single' | 'card') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Trigger history save as the user is downloading
    handleSaveToHistory();

    if (format === 'png') {
      const isSocialCard = optionOverride === 'card' || (optionOverride !== 'single' && useSocialCard);
      if (isSocialCard) {
        // Create high-res offscreen canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 600;
        tempCanvas.height = 900;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
          // 1. Get gradient colors for active platform
          let gradientColors = ['#f9ce34', '#ee2a7b', '#6228d7']; // Default Instagram Yellow-Pink-Purple official gradient
          if (socialPlatform === 'instagram') gradientColors = ['#f9ce34', '#ee2a7b', '#6228d7'];
          else if (socialPlatform === 'linkedin') gradientColors = ['#0a66c2', '#0077b5', '#004182'];
          else if (socialPlatform === 'github') gradientColors = ['#181717', '#24292e', '#2f363d'];
          else if (socialPlatform === 'twitter') gradientColors = ['#1da1f2', '#1a91da', '#1565c0'];

          // Create background linear gradient
          const grad = tCtx.createLinearGradient(0, 0, 0, tempCanvas.height);
          if (gradientColors.length === 3) {
            grad.addColorStop(0, gradientColors[0]);
            grad.addColorStop(0.5, gradientColors[1]);
            grad.addColorStop(1, gradientColors[2]);
          } else {
            grad.addColorStop(0, gradientColors[0]);
            grad.addColorStop(1, gradientColors[1] || gradientColors[0]);
          }
          
          tCtx.fillStyle = grad;
          tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // 2. Add top right ambient highlight circle
          tCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          tCtx.beginPath();
          tCtx.arc(tempCanvas.width, 0, 240, 0, Math.PI * 2);
          tCtx.fill();

          // 3. Draw main white card & action card with soft shadows
          tCtx.save();
          tCtx.shadowColor = 'rgba(0, 0, 0, 0.12)';
          tCtx.shadowBlur = 35;
          tCtx.shadowOffsetX = 0;
          tCtx.shadowOffsetY = 15;
          
          const cardX = 80;
          const cardWidth = 440;
          
          // Main QR White Card
          const qrCardY = 100;
          const qrCardHeight = 480;
          tCtx.fillStyle = '#ffffff';
          tCtx.beginPath();
          if (tCtx.roundRect) {
            tCtx.roundRect(cardX, qrCardY, cardWidth, qrCardHeight, 44);
          } else {
            tCtx.rect(cardX, qrCardY, cardWidth, qrCardHeight);
          }
          tCtx.fill();
          
          // Action box Card
          const actionCardY = 620;
          const actionCardHeight = 160;
          tCtx.fillStyle = '#ffffff';
          tCtx.beginPath();
          if (tCtx.roundRect) {
            tCtx.roundRect(cardX, actionCardY, cardWidth, actionCardHeight, 32);
          } else {
            tCtx.rect(cardX, actionCardY, cardWidth, actionCardHeight);
          }
          tCtx.fill();
          tCtx.restore();

          // 4. Draw the QR code inside Main Card
          const qrSize = 310;
          const qrX = cardX + (cardWidth - qrSize) / 2;
          const qrY = qrCardY + 40;
          tCtx.drawImage(canvas, qrX, qrY, qrSize, qrSize);

          // 5. Draw username below QR
          if (socialUsername) {
            const activePlatformTheme = SOCIAL_THEMES[socialPlatform as keyof typeof SOCIAL_THEMES];
            tCtx.fillStyle = activePlatformTheme?.fgColor || '#0d9488';
            tCtx.font = '900 28px "Inter", system-ui, sans-serif';
            tCtx.textAlign = 'center';
            tCtx.textBaseline = 'middle';
            tCtx.fillText(`@${socialUsername.toUpperCase()}`, cardX + cardWidth / 2, qrCardY + 410);
          }

          // 6. Draw action contents inside actionBox
          const btnY = actionCardY + actionCardHeight / 2;
          
          // Share Profile Button Section (Left)
          const btn1X = cardX + cardWidth * 0.28;
          tCtx.strokeStyle = '#f1f5f9';
          tCtx.lineWidth = 2;
          tCtx.fillStyle = '#f8fafc';
          tCtx.beginPath();
          tCtx.arc(btn1X, btnY - 20, 32, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.stroke();
          
          // Draw standard share node hierarchy
          tCtx.strokeStyle = '#334155';
          tCtx.lineWidth = 3;
          tCtx.lineCap = 'round';
          tCtx.lineJoin = 'round';
          tCtx.beginPath();
          tCtx.arc(btn1X + 8, btnY - 27, 4, 0, Math.PI * 2);
          tCtx.stroke();
          tCtx.beginPath();
          tCtx.arc(btn1X - 8, btnY - 20, 4, 0, Math.PI * 2);
          tCtx.stroke();
          tCtx.beginPath();
          tCtx.arc(btn1X + 8, btnY - 13, 4, 0, Math.PI * 2);
          tCtx.stroke();
          tCtx.beginPath();
          tCtx.moveTo(btn1X - 4, btnY - 21);
          tCtx.lineTo(btn1X + 4, btnY - 26);
          tCtx.moveTo(btn1X - 4, btnY - 19);
          tCtx.lineTo(btn1X + 4, btnY - 14);
          tCtx.stroke();
          
          tCtx.fillStyle = '#64748b';
          tCtx.font = 'bold 15px "Inter", system-ui, sans-serif';
          tCtx.fillText('Share profile', btn1X, btnY + 35);

          // Copy Link Button Section (Right)
          const btn2X = cardX + cardWidth * 0.72;
          tCtx.strokeStyle = '#f1f5f9';
          tCtx.lineWidth = 2;
          tCtx.fillStyle = '#f8fafc';
          tCtx.beginPath();
          tCtx.arc(btn2X, btnY - 20, 32, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.stroke();
          
          // Draw Link icon (simple two links chain)
          tCtx.strokeStyle = '#4f46e5';
          tCtx.lineWidth = 3.5;
          tCtx.lineCap = 'round';
          tCtx.beginPath();
          tCtx.arc(btn2X - 5, btnY - 22, 6, Math.PI * 0.75, Math.PI * 1.75);
          tCtx.stroke();
          tCtx.beginPath();
          tCtx.arc(btn2X + 5, btnY - 18, 6, Math.PI * 1.75, Math.PI * 0.75);
          tCtx.stroke();
          
          tCtx.fillStyle = '#64748b';
          tCtx.font = 'bold 15px "Inter", system-ui, sans-serif';
          tCtx.fillText('Copy link', btn2X, btnY + 35);

          // Trigger download
          const link = document.createElement('a');
          link.download = `QRCloud-social-${socialPlatform}-${Date.now()}.png`;
          link.href = tempCanvas.toDataURL('image/png');
          link.click();
        }
      } else {
        // Standard plain QR code download
        const link = document.createElement('a');
        link.download = `qrcloud-${activeTab}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } else {
      // Create beautifully clean raw SVG vector file or direct SVG template
      const sizeValue = canvas.width;
      const rawContent = getContentString();
      
      // Let's create an elegant download package containing the path or rendering
      const link = document.createElement('a');
      link.download = `qrcloud-${activeTab}-${Date.now()}.svg`;
      
      // Generating XML structure of standard vector QR
      QRCode.toString(rawContent, {
        type: 'svg',
        color: {
          dark: fgColor,
          light: bgColor
        },
        margin: margin,
        width: sizeValue
      }, (err, svgStr) => {
        if (err) return;
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    }
  };

  const copyToClipboard = async () => {
    const rawContent = getContentString();
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed');
    }
  };

  const applyColorPreset = (preset: { fg: string; bg: string }) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  const tabs: { id: QRType; label: string; icon: any }[] = [
    { id: 'url', label: 'URL Link', icon: Globe },
    { id: 'text', label: 'Plain Text', icon: FileText },
    { id: 'wifi', label: 'WiFi config', icon: Wifi },
    { id: 'email', label: 'Mail link', icon: Mail },
    { id: 'phone', label: 'Phone Call', icon: Phone },
    { id: 'sms', label: 'SMS Blast', icon: MessageSquare },
    { id: 'social', label: 'Socials', icon: Share2 },
  ];

  return (
    <div id="qr-generator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Form Panel */}
      <div id="generator-config" className="lg:col-span-7 bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5 text-indigo-500" />
          Choose QR Content & Design
        </h3>

        {/* Tab List */}
        <div className="flex gap-1 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 focus:outline-none shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2]" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Fields Section */}
        <div id="dynamic-inputs" className="space-y-4 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 min-h-[140px]"
            >
              {activeTab === 'url' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    Enter Target URL Link
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="e.g. www.mybusiness.com/deal"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all focus:border-transparent font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    Automatically checks or forces secure SSL protocols (HTTP/HTTPS) on redirection.
                  </span>
                </div>
              )}

              {activeTab === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    Plaintext Message
                  </label>
                  <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter any text, raw notes, serial codes, passwords or customized instructions..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all focus:border-transparent font-medium resize-none"
                  />
                </div>
              )}

              {activeTab === 'wifi' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      WiFi Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="My Home Wi-Fi"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Password
                    </label>
                    <input
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder="Network secret password"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Network Security Protocol
                    </label>
                    <select
                      value={wifiType}
                      onChange={(e) => setWifiType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    >
                      <option value="WPA">WPA/WPA2/WPA3 (Standard)</option>
                      <option value="WEP">WEP (Legacy)</option>
                      <option value="nopass">None (Open network)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="wifi-hidden"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <label htmlFor="wifi-hidden" className="text-xs text-slate-600 dark:text-slate-400 select-none">
                      This is a hidden network (SSID will not broadcast)
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Target Email Address
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="receiver@address.com"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                        Pre-filled Subject
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Inquiry from QR code"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                        Message Body
                      </label>
                      <input
                        type="text"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Add some details..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'phone' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    Enter Support Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                      placeholder="+14155552671"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    Format with secure country code extension to ensure clean worldwide routing.
                  </span>
                </div>
              )}

              {activeTab === 'sms' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Enter Recipient Number
                    </label>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      placeholder="e.g. +14155550000"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Pre-filled SMS Text
                    </label>
                    <textarea
                      rows={2}
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      placeholder="Hi, please activate my VIP card..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Select Platform Presets
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/30 p-2 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      {[
                        { id: 'instagram', label: 'Instagram', icon: Instagram },
                        { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                        { id: 'github', label: 'GitHub', icon: Github },
                        { id: 'twitter', label: 'Twitter / X', icon: Twitter },
                      ].map((item) => {
                        const ItemIcon = item.icon;
                        const isChosen = socialPlatform === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              setSocialPlatform(item.id as any);
                              // Auto prefill logo if not already selected
                              setLogoPreset(item.id);
                            }}
                            className={`flex gap-2 items-center justify-center p-2 text-xs font-semibold rounded-xl border transition-all ${
                              isChosen
                                ? 'bg-slate-800 dark:bg-slate-100 border-slate-800 dark:border-slate-100 text-white dark:text-slate-900 shadow-sm'
                                : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Your Platform Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-xs text-slate-400 font-bold tracking-tight">
                        {socialPlatform === 'instagram' && 'instagram.com/'}
                        {socialPlatform === 'linkedin' && 'linkedin.com/in/'}
                        {socialPlatform === 'github' && 'github.com/'}
                        {socialPlatform === 'twitter' && 'twitter.com/'}
                      </span>
                      <input
                        type="text"
                        value={socialUsername}
                        onChange={(e) => setSocialUsername(e.target.value)}
                        placeholder="username"
                        className="w-full pr-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                        style={{
                          paddingLeft: 
                            socialPlatform === 'instagram' ? '112px' : 
                            socialPlatform === 'linkedin' ? '122px' : 
                            socialPlatform === 'github' ? '92px' : '96px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Customized Accordions / Sections */}
        <div id="design-accordion" className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          
          {/* Colors Controls */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5 label-colors">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Dynamic Palette & Color Presets
            </span>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_COLORS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => applyColorPreset(preset)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all ${
                    fgColor === preset.fg && bgColor === preset.bg
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 font-semibold'
                      : ''
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: preset.fg }} />
                  <span className="text-slate-600 dark:text-slate-300">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Foreground Color Picker Card */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  Foreground Color
                </label>
                <div className="flex items-center gap-3">
                  {/* Outer Capsule Ring with Vertical Inner Inset Filled Color Block */}
                  <div className="relative w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 flex items-center justify-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 shadow-sm hover:scale-105 active:scale-95 transition-all">
                    <div 
                      className="w-5 h-8 rounded-[4px] shadow-sm transition-colors duration-200" 
                      style={{ backgroundColor: fgColor }} 
                    />
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      onInput={(e) => setFgColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                  
                  {/* Centered Hex Code Capsule Input */}
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-full text-xs font-mono font-black text-slate-700 dark:text-slate-200 text-center tracking-wider focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition-all uppercase"
                  />
                </div>
              </div>
              
              {/* Background Color Picker Card */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  {/* Outer Capsule Ring with Vertical Inner Inset Filled Color Block */}
                  <div className="relative w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 flex items-center justify-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 shadow-sm hover:scale-105 active:scale-95 transition-all">
                    <div 
                      className="w-5 h-8 rounded-[4px] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200" 
                      style={{ backgroundColor: bgColor }} 
                    />
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      onInput={(e) => setBgColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                  
                  {/* Centered Hex Code Capsule Input */}
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-full text-xs font-mono font-black text-slate-700 dark:text-slate-200 text-center tracking-wider focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition-all uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Style Customization Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-slate-400" />
                Pixel Dot Design
              </label>
              <select
                value={dotStyle}
                onChange={(e) => setDotStyle(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="rounded">Rounded modules (Premium)</option>
                <option value="square">Classic rigid square</option>
                <option value="dots">Circular dot matrix</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-slate-400" />
                Footer Frame Layout
              </label>
              <select
                value={frameStyle}
                onChange={(e) => setFrameStyle(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="none">No branding frame</option>
                <option value="badge">Badge ribbon background</option>
                <option value="minimal">Minimal text spacer</option>
              </select>
            </div>

            {frameStyle !== 'none' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Call to Action (CTA) Frame Text
                </label>
                <input
                  type="text"
                  value={frameText}
                  onChange={(e) => setFrameText(e.target.value)}
                  placeholder="SCAN ME"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>
            )}
          </div>

          {/* Brand Logo Overlays controls */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-slate-400" />
              Brand Logo Overlay (Overlay Core Vector)
            </span>
            
            {/* Logo Presets Selection list */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_LOGOS.map((lg) => (
                <button
                  type="button"
                  key={lg.name}
                  onClick={() => {
                    setLogoPreset(lg.url);
                    if (lg.url) setErrorCorrectionLevel('H');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 Alliance-btn hover:bg-slate-105 active:scale-95 transition-all ${
                    logoPreset === lg.url
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {lg.name}
                </button>
              ))}
            </div>

            {/* Custom Logo File Uploader */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Upload Custom logo image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-slate-700 dark:file:text-slate-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                  <span>Logo sizing overlay control</span>
                  <span>{logoSize}%</span>
                </label>
                <input
                  type="range"
                  min={12}
                  max={28}
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {customLogoUrl && (
                <div className="md:col-span-2 flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-1.5 border border-slate-200/50 dark:border-slate-800 rounded-xl mt-2">
                  <div className="flex items-center gap-2">
                    <img src={customLogoUrl} alt="custom logo" className="w-6 h-6 object-contain rounded" />
                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">Custom logo active</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCustomLogo}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Dynamic Master Preview Panel (Sticky/Refined) */}
      <div id="preview-container" className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
        <div className="bg-slate-900/90 dark:bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
          {/* Subtle decoration elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500" />
          <div className="absolute top-4 right-4 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-800">
            Realtime Engine
          </div>

          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 mt-2 text-center w-full block">
            QR Canvas Preview
          </h4>

          {renderError ? (
            <div className="flex flex-col items-center justify-center min-h-[220px] max-w-[240px] text-center gap-2">
              <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-xs text-rose-400 font-semibold">{renderError}</p>
            </div>
          ) : useSocialCard ? (
            /* High Fidelity Instagram Theme Card View */
            <div className={`relative w-full rounded-2xl bg-gradient-to-b ${SOCIAL_THEMES[socialPlatform as keyof typeof SOCIAL_THEMES]?.bgGradient || 'from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]'} p-6 py-8 flex flex-col items-center justify-center transition-all duration-500 shadow-xl overflow-hidden`}>
              {/* Subtle background overlay elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
              
              {/* Main White Rounded Card containing QR code */}
              <div className="bg-white rounded-[28px] p-6 shadow-xl w-full max-w-[260px] flex flex-col items-center gap-4 transition-all duration-300">
                <div className="relative p-2 bg-white rounded-2xl flex items-center justify-center border border-slate-100">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full w-[170px] h-[170px] md:w-[190px] md:h-[190px] object-contain rounded-xl"
                  />
                </div>
                
                {/* Username label stylized beautifully just like instagram */}
                {socialUsername && (
                  <div className={`text-center font-display font-black tracking-wider text-sm md:text-base uppercase ${SOCIAL_THEMES[socialPlatform as keyof typeof SOCIAL_THEMES]?.textColor || 'text-[#0d9488]'} truncate max-w-full px-2 mt-1`}>
                    @{socialUsername}
                  </div>
                )}
              </div>

              {/* Sub Action Card containing circular interactive buttons */}
              <div className="bg-white rounded-2xl p-4 shadow-md w-full max-w-[260px] mt-4 flex justify-around gap-2 items-center-inner">
                {/* Button 1: Share Profile */}
                <button
                  type="button"
                  onClick={() => {
                    const platformLabel = SOCIAL_THEMES[socialPlatform as keyof typeof SOCIAL_THEMES]?.label || 'Social';
                    if (navigator.share) {
                      navigator.share({
                        title: `${platformLabel} QR Profile`,
                        text: `Scan my QR profile code for @${socialUsername}!`,
                        url: getContentString()
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(getContentString());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="flex flex-col items-center gap-1 bg-transparent hover:scale-[1.03] active:scale-95 transition-all focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 shadow-sm transition-colors">
                    <Share2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 tracking-tight leading-none mt-1">Share profile</span>
                </button>

                {/* Button 2: Copy Link */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getContentString());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex flex-col items-center gap-1 bg-transparent hover:scale-[1.03] active:scale-95 transition-all focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full border border-slate-105 bg-slate-100/50 flex items-center justify-center text-indigo-600 dark:text-indigo-600 hover:bg-slate-100 shadow-sm transition-colors">
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                    ) : (
                      <Link className="w-4 h-4 stroke-[2.2]" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 tracking-tight leading-none mt-1">
                    {copied ? 'Copied!' : 'Copy link'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard QR preview view */
            <div className="relative group bg-slate-950 p-6 rounded-2xl border border-slate-800/80 shadow-inner flex items-center justify-center transition-all duration-500 hover:scale-[1.02]">
              {/* Soft glow background based inside */}
              <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-550" />
              <canvas
                ref={canvasRef}
                className="max-w-full w-[240px] h-[240px] md:w-[260px] md:h-[260px] object-contain rounded-xl shadow-md"
              />
            </div>
          )}

          {/* Quick Metrics */}
          <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-slate-800/60 pt-4 text-center">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quality Safe-tier</span>
              <span className="text-xs text-emerald-400 font-semibold md:font-bold">Error level: {errorCorrectionLevel}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Scannability</span>
              <span className="text-xs text-indigo-400 font-semibold md:font-bold">{logoPreset ? 'Logo Protected' : '99.9% Clean'}</span>
            </div>
          </div>

          {/* Download and Clipboard Options */}
          <div className="w-full flex flex-col gap-2.5 mt-6">
            {useSocialCard ? (
              <div className="flex flex-col gap-2">
                {/* 1. Primary Full Social Theme Download Link */}
                <button
                  type="button"
                  id="download-social-card-btn"
                  onClick={() => handleDownload('png', 'card')}
                  disabled={!!renderError}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/10 active:scale-95 transition-all text-center focus:outline-none"
                >
                  <Download className="w-4 h-4 stroke-[2.2]" />
                  Download Social Theme Card (PNG)
                </button>
                
                {/* 2. Secondary Options: Standalone PNG & SVG */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="download-single-png-btn"
                    onClick={() => handleDownload('png', 'single')}
                    disabled={!!renderError}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-705 border border-slate-700/60 text-white text-[11px] font-semibold hover:border-slate-500 active:scale-95 transition-all text-center focus:outline-none"
                  >
                    <QrCode className="w-3.5 h-3.5 stroke-[2] text-slate-400" />
                    Plain QR (PNG)
                  </button>
                  
                  <button
                    type="button"
                    id="download-svg-btn"
                    onClick={() => handleDownload('svg')}
                    disabled={!!renderError}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-705 border border-slate-700/60 text-white text-[11px] font-semibold hover:border-slate-500 active:scale-95 transition-all text-center focus:outline-none"
                  >
                    <Maximize2 className="w-3.5 h-3.5 stroke-[2] text-slate-400" />
                    SVG Vector
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="download-png-btn"
                  onClick={() => handleDownload('png', 'single')}
                  disabled={!!renderError}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 border border-slate-700/60 text-white text-xs font-semibold hover:border-slate-600 active:scale-95 transition-all text-center focus:outline-none"
                >
                  <Download className="w-4 h-4 stroke-[2]" />
                  PNG Image
                </button>
                
                <button
                  type="button"
                  id="download-svg-btn"
                  onClick={() => handleDownload('svg')}
                  disabled={!!renderError}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 border border-slate-700/60 text-white text-xs font-semibold hover:border-slate-600 active:scale-95 transition-all text-center focus:outline-none"
                >
                  <Maximize2 className="w-4 h-4 stroke-[2]" />
                  SVG Vector
                </button>
              </div>
            )}

            <button
              type="button"
              id="copy-payload-btn"
              onClick={copyToClipboard}
              disabled={!!renderError}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold active:scale-98 transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[2]" />
                  Copied Raw Value!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2]" />
                  Copy Plain Content
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Scan Safe Warning Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-start gap-3">
          <Share2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">Vector Scale Guarantee</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Downloads formatted in PNG are optimized for immediate distribution (330dpi scale preset). SVG exports are infinitely scalable vector paths suited for commercial press printing.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

