import React, { useState } from 'react';
import { 
  QrCode, 
  Camera, 
  Search, 
  Printer, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Filter, 
  Globe,
  CheckCircle2
} from 'lucide-react';
import QRCodeLabel from '../components/QRCodeLabel';
import QRScannerModal from '../components/QRScannerModal';

export default function QRCodeManagementView({ 
  animals = [], 
  onOpenPublicView,
  onSelectAnimal 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedForModal, setSelectedForModal] = useState(null);

  // Host origin configuration for mobile scanning on local Wi-Fi
  const [customHost, setCustomHost] = useState(() => {
    return localStorage.getItem('vetshield_qr_host') || window.location.origin;
  });
  const [isEditingHost, setIsEditingHost] = useState(false);

  const handleSaveHost = (newHost) => {
    let clean = newHost.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    setCustomHost(clean);
    localStorage.setItem('vetshield_qr_host', clean);
    setIsEditingHost(false);
  };

  const handleResetHost = () => {
    const origin = window.location.origin;
    setCustomHost(origin);
    localStorage.removeItem('vetshield_qr_host');
    setIsEditingHost(false);
  };

  // Filter animals
  const filteredAnimals = animals.filter(animal => {
    if (selectedSpecies !== 'All' && animal.species !== selectedSpecies) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = animal.name.toLowerCase().includes(q);
      const matchId = animal.id.toLowerCase().includes(q);
      const matchBreed = (animal.breed || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchBreed) return false;
    }
    return true;
  });

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="view-content qrcode-management-view">
      {/* Top Header Card */}
      <div className="card-box" style={{ marginBottom: '20px' }}>
        <div className="card-box-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="card-box-title">Permanent Electronic Animal ID & QR System</h3>
                <p className="card-box-sub">
                  Generates tamper-evident scannable ear-tags with mobile camera verification
                </p>
              </div>
            </div>
          </div>

          <div className="toolbar-actions-row">
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => setIsScannerOpen(true)}
            >
              <Camera size={16} />
              <span>Scan QR Code (Camera)</span>
            </button>

            <button
              type="button"
              className="btn-outline-action small"
              onClick={handlePrintAll}
              title="Print all visible ear-tag labels"
            >
              <Printer size={14} />
              <span>Print All Tags</span>
            </button>
          </div>
        </div>

        {/* Mobile Scanning Host Configuration Banner */}
        <div className="qr-host-config-strip">
          <Globe size={16} className="text-blue" />
          <div className="host-text-wrap">
            <span className="host-label">QR Base Scanning Host:</span>
            {isEditingHost ? (
              <div className="host-input-group">
                <input 
                  type="text" 
                  defaultValue={customHost} 
                  id="qr-host-input"
                  placeholder="e.g. http://192.168.1.15:5173 or https://vetshield.app"
                  className="host-edit-input"
                />
                <button 
                  type="button" 
                  className="btn-primary-action small"
                  onClick={() => {
                    const input = document.getElementById('qr-host-input');
                    if (input) handleSaveHost(input.value);
                  }}
                >
                  Save Host
                </button>
                <button 
                  type="button" 
                  className="btn-close-modal small"
                  onClick={handleResetHost}
                >
                  Reset Origin
                </button>
              </div>
            ) : (
              <div className="host-display-group">
                <code className="host-code">{customHost}</code>
                <button 
                  type="button" 
                  className="btn-link-action"
                  onClick={() => setIsEditingHost(true)}
                >
                  Change Host (for Wi-Fi Mobile Scans)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="toolbar-container">
        <div className="toolbar-top-row">
          <div className="filter-pills-row">
            <span className="filter-label">Filter Animals:</span>
            {['All', 'Cow', 'Buffalo', 'Cattle', 'Sheep', 'Goat'].map(sp => (
              <button
                key={sp}
                className={`filter-pill ${selectedSpecies === sp ? 'active' : ''}`}
                onClick={() => setSelectedSpecies(sp)}
              >
                {sp === 'Cow' ? '🐄 Cow' : sp === 'Buffalo' ? '🐃 Buffalo' : sp}
              </button>
            ))}
          </div>

          <div className="search-bar-inline">
            <Search size={14} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search tag ID or animal name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inline-search-input"
            />
          </div>
        </div>
      </div>

      {/* Grid of Printable QR Code Labels */}
      <div className="qr-labels-grid">
        {filteredAnimals.length > 0 ? (
          filteredAnimals.map(animal => (
            <div key={animal.id} className="qr-grid-item">
              <QRCodeLabel 
                animal={animal} 
                onOpenPublicView={onOpenPublicView} 
              />
            </div>
          ))
        ) : (
          <div className="empty-state-box" style={{ gridColumn: '1 / -1' }}>
            <AlertCircle size={36} className="text-muted" />
            <p className="empty-state-title">No animals found</p>
            <p className="empty-state-sub">Try adjusting your search query or species filter.</p>
          </div>
        )}
      </div>

      {/* Camera Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal 
          animals={animals}
          onClose={() => setIsScannerOpen(false)}
          onSelectAnimal={(animalId) => {
            setIsScannerOpen(false);
            onOpenPublicView(animalId);
          }}
        />
      )}
    </div>
  );
}