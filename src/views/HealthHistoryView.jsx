import React, { useState } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  UserCheck, 
  Search, 
  Download
} from 'lucide-react';

export default function HealthHistoryView({ animals, onSelectAnimal }) {
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [historySearch, setHistorySearch] = useState('');

  // Flatten all animal histories with reference to the animal
  const allRecords = animals.flatMap(animal => 
    (animal.history || []).map(h => ({
      ...h,
      animalId: animal.id,
      animalName: animal.name,
      species: animal.species,
      breed: animal.breed,
      animalObj: animal
    }))
  );

  const filteredRecords = allRecords.filter(record => {
    const matchesSpecies = selectedSpecies === 'All' || record.species === selectedSpecies;
    const query = historySearch.toLowerCase();
    const matchesQuery = !query ||
      record.animalName.toLowerCase().includes(query) ||
      record.animalId.toLowerCase().includes(query) ||
      record.event.toLowerCase().includes(query) ||
      record.vet.toLowerCase().includes(query);

    return matchesSpecies && matchesQuery;
  });

  return (
    <div className="view-content health-history-view">
      {/* Top Banner */}
      <div className="history-header-card">
        <div className="h-left">
          <div className="h-icon-box">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="history-main-title">Veterinary Records & Clinical Log</h2>
            <p className="history-main-sub">
              Electronic healthcare records, vaccination compliance, and therapeutic audits (Demo Data)
            </p>
          </div>
        </div>

        <div className="h-right">
          <button 
            className="btn-outline-action"
            onClick={() => alert("Demo Feature: Exporting compliance PDF report (College presentation sample).")}
          >
            <Download size={15} />
            <span>Export Health Audit PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar-container">
        <div className="toolbar-top-row">
          <div className="filter-pills-row">
            <span className="filter-label">Species:</span>
            {['All', 'Cattle', 'Sheep', 'Goat', 'Horse', 'Swine', 'Working Dog'].map(sp => (
              <button
                key={sp}
                className={`filter-pill ${selectedSpecies === sp ? 'active' : ''}`}
                onClick={() => setSelectedSpecies(sp)}
              >
                {sp}
              </button>
            ))}
          </div>

          <div className="history-search-box">
            <Search size={15} className="search-icon" />
            <input 
              type="text" 
              placeholder="Filter by procedure, vet, animal ID..." 
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="history-input"
            />
          </div>
        </div>
      </div>

      {/* Table of Records */}
      <div className="card-box">
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Animal Patient</th>
                <th>Species & Breed</th>
                <th>Clinical Procedure / Event</th>
                <th>Attending Veterinarian</th>
                <th>Status / Outcome</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, index) => (
                  <tr key={index}>
                    <td>
                      <span className="rec-date-text">
                        <Calendar size={13} /> {rec.date}
                      </span>
                    </td>
                    <td>
                      <div className="animal-cell">
                        <span className="cell-name">{rec.animalName}</span>
                        <span className="cell-id">{rec.animalId}</span>
                      </div>
                    </td>
                    <td>
                      <span className="rec-species-text">{rec.species} • {rec.breed}</span>
                    </td>
                    <td>
                      <span className="rec-event-title">{rec.event}</span>
                    </td>
                    <td>
                      <span className="rec-vet-name">
                        <UserCheck size={13} /> {rec.vet}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${rec.status.toLowerCase().includes('urgent') ? 'critical' : 'healthy'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-table-ack"
                        onClick={() => onSelectAnimal(rec.animalObj)}
                      >
                        View Animal
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                    No medical records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
