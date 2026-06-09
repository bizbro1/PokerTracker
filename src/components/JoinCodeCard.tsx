import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Card } from './Card';

interface JoinCodeCardProps {
  joinCode: string;
}

export function JoinCodeCard({ joinCode }: JoinCodeCardProps) {
  const [copied, setCopied] = useState(false);

  if (!joinCode) return null;

  const joinUrl = `${window.location.origin}/join/${joinCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context); the URL is shown as text anyway
    }
  };

  return (
    <Card title="Invite Players" className="join-code-card">
      <div className="join-code-content">
        <div className="join-code-qr">
          <QRCodeSVG value={joinUrl} size={140} bgColor="#ffffff" fgColor="#0a0f0d" />
        </div>
        <div className="join-code-info">
          <span className="join-code-label">Join code</span>
          <span className="join-code-value">{joinCode}</span>
          <span className="join-code-url">{joinUrl}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
      <p className="join-code-hint">
        Friends scan the QR code or open the link on their phone to join and track their own
        stack.
      </p>
    </Card>
  );
}
