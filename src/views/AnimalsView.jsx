import React, { useState } from 'react';
import { 
  Filter, 
  Thermometer, 
  Plus, 
  ArrowUpDown, 
  ChevronRight,
  Eye,
  QrCode,
  WifiOff,
  MapPin,
  Calendar,
  Edit
} from 'lucide-react';

export default function AnimalsView({ 
  animals = [], 
  onSelectAnimal, 
  onOpenAddModal, 
  onOpenQRModal,
  onOpenEditModal,
  tempUnit = 'C',
  searchQuery = ''
}) {
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All'); // 'All', 'Connected', 'Disconnected', 'No Hardware'
  const [sortBy, setSortBy] = useState('id'); // 'id', 'name', 'temp'

  const speciesList = ['All', 'Cattle', 'Sheep', 'Goat', 'Horse', 'Swine', 'Working Dog'];

  const formatTemp = (celsius) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  // Filter animals
  const filteredAnimals = animals.filter((animal) => {
    const matchesSpecies = selectedSpecies === 'All' || animal.species === selectedSpecies;
    
    // Status filter based on real hardware state
    const hardwareStatus = animal.assignedDevice ? animal.assignedDevice.status : "No Hardware";
    const matchesStatus = selectedStatus === 'All' || 
                          (selectedStatus === 'Connected' && hardwareStatus === 'Connected') ||
                          (selectedStatus === 'Disconnected' && hardwareStatus === 'Disconnected') ||
                          (selectedStatus === 'No Hardware' && !animal.assignedDevice);

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      animal.name.toLowerCase().includes(query) ||
      animal.id.toLowerCase().includes(query) ||
      animal.breed.toLowerCase().includes(query) ||
      (animal.penLocation && animal.penLocation.toLowerCase().includes(query)) ||
      animal.species.toLowerCase().includes(query);

    return matchesSpecies && matchesStatus && matchesQuery;
  });

  // Sort animals
  const sortedAnimals = [...filteredAnimals].sort((a, b) => {
    if (sortBy === 'temp') {
      const aTemp = a.latestSensorReading ? a.latestSensorReading.temperature : -999;
      const bTemp = b.latestSensorReading ? b.latestSensorReading.temperature : -999;
      return bTemp - aTemp;
    }
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="view-content animals-view">
      {/* Top Filter & Toolbar Bar */}
      <div className="toolbar-container">
        <div className="toolbar-top-row">
          {/* Species Filter Pills */}
          <div className="filter-pills-row">
            <span className="filter-label">Species:</span>
            {speciesList.map((sp) => (
              <button
                key={sp}
                className={`filter-pill ${selectedSpecies === sp ? 'active' : ''}`}
                onClick={() => setSelectedSpecies(sp)}
              >
                {sp}
              </button>
            ))}
          </div>

          <div className="toolbar-actions-row">
            <button className="btn-primary-action" onClick={onOpenAddModal}>
              <Plus size={16} />
              <span>Enroll Animal</span>
            </button>
          </div>
        </div>

        <div className="toolbar-bottom-row">
          {/* Status Filter Dropdown */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Hardware States</option>
              <option value="Connected">ESP32 Connected (Live)</option>
              <option value="Disconnected">Disconnected / Stale</option>
              <option value="No Hardware">No Hardware Assigned</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="filter-select-wrapper">
            <ArrowUpDown size={14} className="filter-icon" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="id">Sort by Permanent ID (VSxxxx)</option>
              <option value="name">Sort by Name</option>
              <option value="temp">Sort by Real Temperature</option>
            </select>
          </div>

          <div className="filter-results-counter">
            Showing <strong>{sortedAnimals.length}</strong> of {animals.length} registered livestock
          </div>
        </div>
      </div>

      {/* Animal Cards Grid */}
      <div className="animal-cards-grid">
        {sortedAnimals.length > 0 ? (
          sortedAnimals.map((animal) => {
            const hasRealReading = animal.latestSensorReading && animal.latestSensorReading.temperature !== undefined;
            const sensorState = animal.assignedDevice ? animal.assignedDevice.status : "No Hardware";
            const isConnected = sensorState === 'Connected';

            return (
              <div 
                key={animal.id} 
                className={`animal-profile-card ${isConnected ? 'card-connected' : ''}`}
                onClick={() => onSelectAnimal(animal)}
              >
                <div className="card-top-identity">
                  <div className="animal-avatar-circle">
                    <span className="species-avatar-emoji">
                      {animal.species === 'Cattle' ? '🐄' :
                       animal.species === 'Sheep' ? '🐑' :
                       animal.species === 'Goat' ? '🐐' :
                       animal.species === 'Horse' ? '🐎' :
                       animal.species === 'Swine' ? '🐖' : '🐕'}
                    </span>
                  </div>

                  <div className="identity-details">
                    <div className="name-and-tag">
                      <h3 className="profile-name">{animal.name}</h3>
                      <span className="profile-tag-id">{animal.id}</span>
                    </div>
                    <span className="profile-species-meta">
                      {animal.species} • {animal.breed} • {animal.age}
                    </span>
                  </div>

                  <span className={`status-badge ${isConnected ? 'status-healthy' : 'status-monitoring'}`}>
                    {isConnected ? 'LIVE' : sensorState}
                  </span>
                </div>

                {/* Real Vitals Telemetry Row */}
                <div className="card-vitals-strip real-mode">
                  {hasRealReading ? (
                    <div className="vital-real-box">
                      <div className="vital-real-header">
                        <Thermometer size={14} className="text-green" />
                        <span>Actual ESP32 Temp</span>
                      </div>
                      <div className="vital-real-val">
                        <strong>{formatTemp(animal.latestSensorReading.temperature)}°{tempUnit}</strong>
                        <span className="reading-stamp">
                          {new Date(animal.latestSensorReading.serverTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="vital-waiting-box">
                      <WifiOff size={14} className="text-muted" />
                      <span>Waiting for real sensor data</span>
                    </div>
                  )}

                  <div className="vital-device-meta">
                    <span className="dev-meta-lbl">Paired Device:</span>
                    <span className="dev-meta-val">
                      {animal.assignedDevice ? animal.assignedDevice.deviceId : 'Unpaired'}
                    </span>
                  </div>
                </div>

                {/* Location & DOB details */}
                <div className="card-metadata-row">
                  <span className="meta-location-tag">
                    <MapPin size={12} /> {animal.penLocation || animal.location || 'Barn'}
                  </span>
                  <span className="meta-battery-tag">
                    <Calendar size={12} /> Registered: {new Date(animal.registeredAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Card Actions: Dossier, QR Tag, Edit */}
                <div className="card-footer-action">
                  <button 
                    className="btn-qr-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQRModal(animal);
                    }}
                    title="View & print permanent QR code"
                  >
                    <QrCode size={13} />
                    <span>QR Tag</span>
                  </button>

                  <button 
                    className="btn-edit-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditModal(animal);
                    }}
                    title="Edit animal details"
                  >
                    <Edit size={13} />
                    <span>Edit</span>
                  </button>

                  <button className="btn-view-profile">
                    <Eye size={13} />
                    <span>Dossier</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state-box">
            <p className="empty-state-title">No animals match your search filter</p>
            <p className="empty-state-sub">Try changing the species or hardware state filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
