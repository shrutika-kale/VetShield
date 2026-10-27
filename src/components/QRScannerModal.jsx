import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Search, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export default function QRScannerModal({ 
  animals = [], 
  onClose, 
  onSelectAnimal 
}) {
  const [manualId, setManualId] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Initialize camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or insecure origin.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }

      // Check if native BarcodeDetector API exists (Supported on modern Android, Chrome, Edge)
      if ('BarcodeDetector' in window) {
        // eslint-disable-next-line no-undef
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                handleCodeFound(rawVal);
              }
            } catch {
              // Ignore single-frame detection hiccups
            }
          }
        }, 500);
      }
    } catch (err) {
      console.warn("Camera start error:", err);
      setCameraError(err.message || "Unable to access device camera. Please grant camera permission or use manual ID lookup.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Parse raw text or URL to extract animal ID
  const extractAnimalId = (raw) => {
    if (!raw) return null;
    const clean = raw.trim();

    // Check if it's a URL like http://.../?animal=VS0001
    try {
      if (clean.includes('?animal=')) {
        const url = new URL(clean, window.location.origin);
        return url.searchParams.get('animal');
      }
    } catch {
      // Fall through to regex
    }

    const match = clean.match(/(VS\d{4})/i);
    if (match) return match[1].toUpperCase();

    return clean.toUpperCase();
  };

  const handleCodeFound = (codeText) => {
    const id = extractAnimalId(codeText);
    if (!id) {
      setValidationError("Unrecognized QR code format. Expected VetShield permanent ID (VSxxxx).");
      return;
    }

    const matchedAnimal = animals.find(a => a.id.toUpperCase() === id.toUpperCase());
    if (matchedAnimal) {
      stopCamera();
      onSelectAnimal(matchedAnimal.id);
      onClose();
    } else {
      setValidationError(`Animal with ID ${id} was not found in the verified registry.`);
    }
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    setValidationError(null);
    if (!manualId.trim()) return;

    handleCodeFound(manualId.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card scanner-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="form-icon-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}>
              <Camera size={22} color="#ffffff" />
            </div>
            <div>
              <h2 className="modal-animal-name">Scan VetShield Animal Tag</h2>
              <p className="modal-animal-sub">Point mobile camera or enter permanent Animal ID</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-scrollable">
          {validationError && (
            <div className="warning-callout-box error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} className="text-red" />
              <div>
                <strong>Verification Error:</strong> {validationError}
              </div>
            </div>
          )}

          {/* Video Preview Viewport */}
          <div className="scanner-viewport-box">
            {cameraActive ? (
              <div className="camera-video-wrapper">
                <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="camera-video-element" 
                />
                <div className="scanner-target-reticle">
                  <div className="reticle-corner top-left"></div>
                  <div className="reticle-corner top-right"></div>
                  <div className="reticle-corner bottom-left"></div>
                  <div className="reticle-corner bottom-right"></div>
                  <div className="scanner-laser-line"></div>
                </div>
                <div className="viewport-overlay-hint">
                  <ShieldCheck size={16} />
                  <span>Align animal tag QR code within frame</span>
                </div>
              </div>
            ) : (
              <div className="camera-fallback-card">
                <Camera size={44} className="text-muted" />
                <h4>Camera Access Notice</h4>
                <p className="fallback-explanation">
                  {cameraError || "Camera scanner is paused or permission not granted. You can retry camera or use the instant ID lookup below."}
                </p>
                <button 
                  type="button" 
                  className="btn-outline-action small"
                  onClick={startCamera}
                  style={{ marginTop: '12px' }}
                >
                  <RefreshCw size={14} />
                  <span>Retry Camera Stream</span>
                </button>
              </div>
            )}
          </div>

          {/* Manual Animal ID Lookup */}
          <div className="manual-lookup-container">
            <div className="section-label">MANUAL ANIMAL ID LOOKUP / SIMULATOR</div>
            <form onSubmit={handleManualLookup} className="manual-lookup-form">
              <div className="lookup-input-wrap">
                <Search size={16} className="lookup-icon" />
                <input 
                  type="text"
                  placeholder="e.g. VS0001, VS0006, or paste QR URL"
                  value={manualId}
                  onChange={(e) => {
                    setManualId(e.target.value);
                    setValidationError(null);
                  }}
                  className="manual-lookup-input"
                />
              </div>
              <button type="submit" className="btn-primary-action small">
                Verify ID
              </button>
            </form>
            <span className="lookup-hint">
              Accepts permanent tags (e.g. <code>VS0001</code> for Bella, <code>VS0006</code> for Lakshmi)
            </span>
          </div>

          {/* Quick Animal Badges for easy desktop testing */}
          <div className="quick-test-animals-row">
            <span className="quick-test-lbl">Quick Demo Animals:</span>
            {animals.slice(0, 4).map(a => (
              <button
                key={a.id}
                type="button"
                className="btn-quick-id-pill"
                onClick={() => handleCodeFound(a.id)}
              >
                <span>{a.id}</span>
                <span className="pill-name">({a.name})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}