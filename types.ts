export type QRType = 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'sms' | 'social';

export interface QRConfig {
  type: QRType;
  content: string;
  fgColor: string;
  bgColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  size: number;
  logoUrl?: string; // Optional custom logo image URL/DataURI to overlay in center
  logoSize?: number; // percentage width of the logo (e.g. 15-25%)
  dotStyle: 'square' | 'dots' | 'rounded' | 'fluid';
  frameStyle: 'none' | 'minimal' | 'phone' | 'badge';
  frameText?: string;
}

export interface QRHistoryItem {
  id: string;
  type: QRType;
  title: string;
  content: string;
  fgColor: string;
  bgColor: string;
  createdAt: string;
  qrDataUrl: string; // the data URI of the generated QR
  scanned: boolean; // true if it was scanned, false if it was generated
}

export interface ExtractedData {
  type: QRType | 'location' | 'vcard' | 'unknown';
  raw: string;
  title: string;
  fields: {
    label: string;
    value: string;
    copyable?: boolean;
    link?: string;
  }[];
}
