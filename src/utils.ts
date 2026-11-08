import { QRType, ExtractedData } from './types';

/**
 * Parses raw QR content and extracts structured data.
 */
export function parseQRContent(raw: string): ExtractedData {
  const content = raw.trim();

  // 1. WiFi Network
  if (content.toUpperCase().startsWith('WIFI:')) {
    const ssidMatch = content.match(/S:([^;]+)/i);
    const passwordMatch = content.match(/P:([^;]+)/i);
    const typeMatch = content.match(/T:([^;]+)/i);
    const hiddenMatch = content.match(/H:(true|false)/i);

    const ssid = ssidMatch ? ssidMatch[1] : 'Unknown';
    const password = passwordMatch ? passwordMatch[1] : '';
    const encType = typeMatch ? typeMatch[1] : 'WPA/WPA2';
    const isHidden = hiddenMatch ? hiddenMatch[1] === 'true' : false;

    return {
      type: 'wifi',
      raw,
      title: 'WiFi Network Configuration',
      fields: [
        { label: 'SSID / Network Name', value: ssid, copyable: true },
        { label: 'Security Type', value: encType },
        { label: 'Password', value: password, copyable: true },
        { label: 'Hidden Network', value: isHidden ? 'Yes' : 'No' },
      ],
    };
  }

  // 2. Email Address / Mailto
  if (content.toLowerCase().startsWith('mailto:')) {
    try {
      const url = new URL(content);
      const email = url.pathname;
      const subject = url.searchParams.get('subject') || '';
      const body = url.searchParams.get('body') || '';

      const fields: ExtractedData['fields'] = [{ label: 'Email Address', value: email, copyable: true, link: `mailto:${email}` }];
      if (subject) fields.push({ label: 'Subject', value: subject, copyable: true });
      if (body) fields.push({ label: 'Body Text', value: body, copyable: true });

      return {
        type: 'email',
        raw,
        title: 'Email Contact',
        fields,
      };
    } catch {
      // Fallback parser if URL constructor fails
      const emailPart = content.substring(7).split('?')[0];
      const subjectMatch = content.match(/subject=([^&]+)/i);
      const bodyMatch = content.match(/body=([^&]+)/i);

      const email = decodeURIComponent(emailPart);
      const subject = subjectMatch ? decodeURIComponent(subjectMatch[1]) : '';
      const body = bodyMatch ? decodeURIComponent(bodyMatch[1]) : '';

      const fields: ExtractedData['fields'] = [{ label: 'Email Address', value: email, copyable: true, link: `mailto:${email}` }];
      if (subject) fields.push({ label: 'Subject', value: subject, copyable: true });
      if (body) fields.push({ label: 'Body Text', value: body, copyable: true });

      return {
        type: 'email',
        raw,
        title: 'Email Contact',
        fields,
      };
    }
  }

  // 3. SMS Message
  if (content.toLowerCase().startsWith('sms:') || content.toLowerCase().startsWith('smsto:')) {
    const cleanPrefix = content.toLowerCase().startsWith('sms:') ? 'sms:' : 'smsto:';
    const parts = content.substring(cleanPrefix.length).split(':');
    const phone = parts[0] ? parts[0].split('?')[0] : '';
    let body = '';

    if (parts[1]) {
      body = parts[1];
    } else {
      const bodyMatch = content.match(/[?&]body=([^&]+)/i);
      body = bodyMatch ? decodeURIComponent(bodyMatch[1]) : '';
    }

    const fields: ExtractedData['fields'] = [{ label: 'Recipient Phone', value: phone, copyable: true, link: `tel:${phone}` }];
    if (body) fields.push({ label: 'Message Body', value: body, copyable: true });

    return {
      type: 'sms',
      raw,
      title: 'SMS Message Plaintext',
      fields,
    };
  }

  // 4. Phone Line
  if (content.toLowerCase().startsWith('tel:')) {
    const phoneNumber = content.substring(4);
    return {
      type: 'phone',
      raw,
      title: 'Phone Contact',
      fields: [{ label: 'Phone Number', value: phoneNumber, copyable: true, link: `tel:${phoneNumber}` }],
    };
  }

  // 5. WhatsApp Link or Protocol
  if (
    content.toLowerCase().startsWith('whatsapp://') ||
    content.toLowerCase().includes('wa.me/') ||
    content.toLowerCase().includes('api.whatsapp.com/send')
  ) {
    let phone = '';
    let message = '';

    try {
      if (content.toLowerCase().includes('wa.me/')) {
        const afterDomain = content.split('wa.me/')[1] || '';
        const [phonePart, queryPart] = afterDomain.split('?');
        phone = phonePart.replace(/[^0-9+]/g, '');
        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          message = params.get('text') || '';
        }
      } else if (content.toLowerCase().includes('api.whatsapp.com/send')) {
        const url = new URL(content.startsWith('http') ? content : `https://${content}`);
        phone = url.searchParams.get('phone') || '';
        message = url.searchParams.get('text') || '';
      } else if (content.toLowerCase().startsWith('whatsapp://send')) {
        const url = new URL(content);
        phone = url.searchParams.get('phone') || '';
        message = url.searchParams.get('text') || '';
      }
    } catch {
      // fallback
    }

    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const chatLink = cleanNumber ? `https://wa.me/${cleanNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}` : content;

    const fields: ExtractedData['fields'] = [];
    if (phone) {
      fields.push({ label: 'WhatsApp Phone', value: phone.startsWith('+') ? phone : `+${phone}`, copyable: true, link: chatLink });
    }
    if (message) {
      fields.push({ label: 'Pre-filled Message', value: message, copyable: true });
    }
    fields.push({ label: 'Chat Link', value: chatLink, copyable: true, link: chatLink });

    return {
      type: 'whatsapp',
      raw: chatLink,
      title: 'WhatsApp Direct Chat',
      fields,
    };
  }

  // 6. Payment: UPI (Unified Payments Interface)
  if (content.toLowerCase().startsWith('upi://pay')) {
    try {
      const url = new URL(content);
      const pa = url.searchParams.get('pa') || '';
      const pn = url.searchParams.get('pn') || '';
      const am = url.searchParams.get('am') || '';
      const cu = url.searchParams.get('cu') || 'INR';
      const tn = url.searchParams.get('tn') || '';

      const fields: ExtractedData['fields'] = [
        { label: 'UPI ID (VPA)', value: pa, copyable: true },
      ];
      if (pn) fields.push({ label: 'Payee / Merchant Name', value: decodeURIComponent(pn), copyable: true });
      if (am) fields.push({ label: 'Requested Amount', value: `${cu} ${am}`, copyable: true });
      if (tn) fields.push({ label: 'Payment Note / Purpose', value: decodeURIComponent(tn), copyable: true });
      fields.push({ label: 'Payment Intent URI', value: content, copyable: true, link: content });

      return {
        type: 'payment',
        raw: content,
        title: `UPI Payment${pn ? ` (${pn})` : ''}`,
        fields,
      };
    } catch {
      // Fallback UPI regex
      const paMatch = content.match(/pa=([^&]+)/i);
      const pnMatch = content.match(/pn=([^&]+)/i);
      const amMatch = content.match(/am=([^&]+)/i);
      const pa = paMatch ? decodeURIComponent(paMatch[1]) : 'Unknown UPI';
      const pn = pnMatch ? decodeURIComponent(pnMatch[1]) : '';
      const am = amMatch ? decodeURIComponent(amMatch[1]) : '';

      return {
        type: 'payment',
        raw: content,
        title: 'UPI Payment',
        fields: [
          { label: 'UPI ID', value: pa, copyable: true },
          ...(pn ? [{ label: 'Payee Name', value: pn, copyable: true }] : []),
          ...(am ? [{ label: 'Amount', value: am, copyable: true }] : []),
        ],
      };
    }
  }

  // 7. Payment: Crypto (Bitcoin, Ethereum, Solana)
  if (/^(bitcoin|ethereum|solana):/i.test(content)) {
    const protocol = content.split(':')[0].toLowerCase();
    const rest = content.substring(protocol.length + 1);
    const [address, query] = rest.split('?');
    const params = new URLSearchParams(query || '');
    const amount = params.get('amount') || params.get('value') || '';
    const message = params.get('message') || params.get('memo') || '';

    const labelMap: Record<string, string> = {
      bitcoin: 'Bitcoin (BTC)',
      ethereum: 'Ethereum (ETH)',
      solana: 'Solana (SOL)',
    };

    const fields: ExtractedData['fields'] = [
      { label: `${labelMap[protocol] || protocol} Address`, value: address, copyable: true },
    ];
    if (amount) fields.push({ label: 'Amount', value: `${amount} ${protocol.toUpperCase()}`, copyable: true });
    if (message) fields.push({ label: 'Memo / Note', value: message, copyable: true });

    return {
      type: 'payment',
      raw: content,
      title: `${labelMap[protocol] || 'Crypto'} Payment`,
      fields,
    };
  }

  // 8. Payment: PayPal
  if (content.toLowerCase().includes('paypal.me/')) {
    const username = content.split('paypal.me/')[1]?.split('?')[0]?.split('/')[0] || '';
    return {
      type: 'payment',
      raw: content,
      title: 'PayPal Payment Link',
      fields: [
        { label: 'PayPal Handle', value: `@${username}`, copyable: true },
        { label: 'Payment Link', value: content, copyable: true, link: content },
      ],
    };
  }

  // 9. Social Media & Websites
  const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/i.test(content);
  if (isUrl || content.toLowerCase().startsWith('http://') || content.toLowerCase().startsWith('https://')) {
    let cleanUrl = content;
    if (!content.toLowerCase().startsWith('http://') && !content.toLowerCase().startsWith('https://')) {
      cleanUrl = 'https://' + content;
    }

    let platform = 'Website';
    let type: QRType = 'url';

    if (cleanUrl.toLowerCase().includes('twitter.com') || cleanUrl.toLowerCase().includes('x.com')) {
      platform = 'Twitter / X';
      type = 'social';
    } else if (cleanUrl.toLowerCase().includes('instagram.com')) {
      platform = 'Instagram';
      type = 'social';
    } else if (cleanUrl.toLowerCase().includes('linkedin.com')) {
      platform = 'LinkedIn';
      type = 'social';
    } else if (cleanUrl.toLowerCase().includes('github.com')) {
      platform = 'GitHub';
      type = 'social';
    } else if (cleanUrl.toLowerCase().includes('facebook.com')) {
      platform = 'Facebook';
      type = 'social';
    } else if (cleanUrl.toLowerCase().includes('youtube.com') || cleanUrl.toLowerCase().includes('youtu.be')) {
      platform = 'YouTube';
      type = 'social';
    }

    return {
      type,
      raw: cleanUrl,
      title: `${platform} Link`,
      fields: [
        { label: 'URL / Link Address', value: cleanUrl, copyable: true, link: cleanUrl },
      ],
    };
  }

  // 10. Fallback to Plaintext
  return {
    type: 'text',
    raw,
    title: 'Plaintext Content',
    fields: [
      { label: 'Extracted Value', value: content, copyable: true },
    ],
  };
}

export function generateWiFiString(ssid: string, password?: string, type: string = 'WPA', hidden: boolean = false): string {
  return `WIFI:S:${ssid};T:${type};P:${password || ''};H:${hidden ? 'true' : 'false'};;`;
}

export function generateMailtoString(email: string, subject?: string, body?: string): string {
  const parts: string[] = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  const query = parts.length > 0 ? `?${parts.join('&')}` : '';
  return `mailto:${email}${query}`;
}

export function generateSMSString(phone: string, body?: string): string {
  const query = body ? `?body=${encodeURIComponent(body)}` : '';
  return `sms:${phone}${query}`;
}

export function generateWhatsAppString(phone: string, message?: string): string {
  // Strip non-digits
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return '';
  const query = message && message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
  return `https://wa.me/${cleanPhone}${query}`;
}

export interface UPIConfig {
  pa: string; // VPA / UPI ID
  pn?: string; // Payee Name
  am?: string; // Amount
  cu?: string; // Currency (defaults to INR)
  tn?: string; // Note / Transaction description
}

export function generateUPIString(config: UPIConfig): string {
  const params: string[] = [];
  params.push(`pa=${encodeURIComponent(config.pa.trim())}`);
  if (config.pn && config.pn.trim()) params.push(`pn=${encodeURIComponent(config.pn.trim())}`);
  if (config.am && config.am.trim() && parseFloat(config.am) > 0) {
    params.push(`am=${encodeURIComponent(config.am.trim())}`);
  }
  params.push(`cu=${encodeURIComponent((config.cu || 'INR').trim())}`);
  if (config.tn && config.tn.trim()) params.push(`tn=${encodeURIComponent(config.tn.trim())}`);
  return `upi://pay?${params.join('&')}`;
}

export function generatePayPalString(username: string, amount?: string, currency?: string): string {
  const cleanUser = username.replace(/^@/, '').trim();
  if (!cleanUser) return '';
  const amt = amount && parseFloat(amount) > 0 ? `/${amount}${currency ? currency.toUpperCase() : ''}` : '';
  return `https://paypal.me/${cleanUser}${amt}`;
}

export function generateCryptoString(type: 'bitcoin' | 'ethereum' | 'solana' | 'usdt', address: string, amount?: string, memo?: string): string {
  const cleanAddr = address.trim();
  if (!cleanAddr) return '';
  
  if (type === 'bitcoin') {
    const params: string[] = [];
    if (amount && parseFloat(amount) > 0) params.push(`amount=${amount}`);
    if (memo && memo.trim()) params.push(`message=${encodeURIComponent(memo.trim())}`);
    return `bitcoin:${cleanAddr}${params.length ? `?${params.join('&')}` : ''}`;
  }
  
  if (type === 'ethereum') {
    const params: string[] = [];
    if (amount && parseFloat(amount) > 0) params.push(`value=${amount}`);
    return `ethereum:${cleanAddr}${params.length ? `?${params.join('&')}` : ''}`;
  }
  
  if (type === 'solana') {
    const params: string[] = [];
    if (amount && parseFloat(amount) > 0) params.push(`amount=${amount}`);
    if (memo && memo.trim()) params.push(`memo=${encodeURIComponent(memo.trim())}`);
    return `solana:${cleanAddr}${params.length ? `?${params.join('&')}` : ''}`;
  }

  // USDT or standard address
  return cleanAddr;
}

export function generateBankEPCString(name: string, iban: string, bic?: string, amount?: string, reference?: string): string {
  // EPC QR code format (standard European payment code)
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    bic?.trim() || '',
    name.trim(),
    iban.replace(/\s+/g, '').toUpperCase(),
    amount && parseFloat(amount) > 0 ? `EUR${parseFloat(amount).toFixed(2)}` : '',
    '',
    reference?.trim() || '',
    '',
    ''
  ];
  return lines.join('\n');
}

