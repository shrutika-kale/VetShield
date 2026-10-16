import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, ShieldCheck, ExternalLink } from 'lucide-react';

export default function QRCodeLabel({ animal, onOpenPublicView }) {
  const qrRef = useRef(null);

  if (!animal) return null;

  // The permanent, unique animal profile URL for phone scanning
  // Formats to current origin + route e.g. http://192.168.1.14:5173/?animal=VS0001
  const origin = window.location.origin;
  const qrUrl = `${origin}/?animal=${animal.id}`;

  const handleDownload = () => {
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // High resolution for clean printing
    canvas.width = 400;
    canvas.height = 500;

    img.onload = () => {
      // White badge card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Navy top banner
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, canvas.width, 70);

      // Header text
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VETSHIELD SMART TAG', canvas.width / 2, 42);

      // Draw QR Code
      ctx.drawImage(img, 50, 95, 300, 300);

      // Animal Info Footer
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(animal.id, canvas.width / 2, 430);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText(`${animal.name} • ${animal.species} (${animal.breed})`, canvas.width / 2, 460);

      // Trigger download
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `VetShield_Tag_${animal.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="qr-badge-card" ref={qrRef}>
      <div className="qr-badge-header">
        <div className="qr-brand-row">
          <ShieldCheck size={18} className="qr-shield-icon" />
          <span className="qr-brand-title">VetShield Animal Tag</span>
        </div>
        <span className="qr-secure-tag">Encrypted Permanent ID</span>
      </div>

      <div className="qr-visual-container">
        <QRCodeSVG 
          value={qrUrl}
          size={180}
          level="H"
          includeMargin={true}
          className="qr-svg-code"
        />
        <div className="qr-animal-id-label">{animal.id}</div>
        <div className="qr-animal-name-label">{animal.name} ({animal.species})</div>
      </div>

      <p className="qr-instructions">
        Scan with any mobile camera to view public verification and authorized live temperature telemetry.
      </p>

      <div className="qr-url-display">
        <span className="qr-url-text">{qrUrl}</span>
      </div>

      <div className="qr-actions-row">
        <button 
          className="btn-outline-action small"
          onClick={handleDownload}
          title="Download printable PNG ear-tag badge"
        >
          <Download size={14} />
          <span>Save Label PNG</span>
        </button>

        <button 
          className="btn-outline-action small"
          onClick={handlePrint}
          title="Print physical tag label"
        >
          <Printer size={14} />
          <span>Print Tag</span>
        </button>

        <button 
          className="btn-outline-action small green-highlight"
          onClick={() => onOpenPublicView(animal.id)}
          title="Simulate scanning this QR code in browser"
        >
          <ExternalLink size={14} />
          <span>Open Scanned View</span>
        </button>
      </div>
    </div>
  );
}
