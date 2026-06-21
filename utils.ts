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

  // 5. Social Media & Websites
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

  // 6. Fallback to Plaintext
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
