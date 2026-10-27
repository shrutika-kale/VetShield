import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  QrCode, 
  Droplets, 
  ArrowUpDown, 
  AlertCircle, 
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import StatCard from '../components/StatCard';
import AddAnimalModal from '../components/AddAnimalModal';
import EditAnimalModal from '../components/EditAnimalModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AddMilkRecordModal from '../components/AddMilkRecordModal';

export default function DairyManagementView({ 
  animals = [], 
  milkRecords = [],
  onRegisterAnimal, 
  onUpdateAnimal, 
  onDeleteAnimal, 
  onAddMilkRecord,
  onOpenQRModal,
  onSelectAnimal
}) {
  const [speciesFilter, setSpeciesFilter] = useState('All'); // 'All', 'Cow', 'Buffalo'
  const [milkStatusFilter, setMilkStatusFilter] = useState('All'); // 'All', 'In Milk', 'Dry', 'Pregnant', 'Heifer'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id'); // 'id', 'name', 'yield'

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [deletingAnimal, setDeletingAnimal] = useState(null);
  const [quickMilkingAnimalId, setQuickMilkingAnimalId] = useState(null);

  // Filter only Dairy Animals (Cow, Buffalo, and existing Cattle)
  const dairyAnimals = animals.filter(
    a => a.species === 'Cow' || a.species === 'Buffalo' || a.species === 'Cattle'
  );

  const totalCows = dairyAnimals.filter(a => a.species === 'Cow' || a.species === 'Cattle').length;
  const totalBuffaloes = dairyAnimals.filter(a => a.species === 'Buffalo').length;
  const inMilkCount = dairyAnimals.filter(a => (a.milkProductionStatus || 'In Milk') === 'In Milk').length;
  const dryPregnantCount = dairyAnimals.filter(a => a.milkProductionStatus === 'Dry' || a.milkProductionStatus === 'Pregnant').length;

  // Filter animals based on user controls
  const filteredAnimals = dairyAnimals.filter(animal => {
    const isCow = animal.species === 'Cow' || animal.species === 'Cattle';
    const isBuff = animal.species === 'Buffalo';

    if (speciesFilter === 'Cow' && !isCow) return false;
    if (speciesFilter === 'Buffalo' && !isBuff) return false;

    const status = animal.milkProductionStatus || 'In Milk';
    if (milkStatusFilter !== 'All' && status !== milkStatusFilter) return false;

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = animal.name.toLowerCase().includes(q);
      const matchId = animal.id.toLowerCase().includes(q);
      const matchBreed = (animal.breed || '').toLowerCase().includes(q);
      const matchLocation = (animal.penLocation || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchBreed && !matchLocation) return false;
    }

    return true;
  });

  // Sort animals
  const sortedAnimals = [...filteredAnimals].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'yield') {
      const aYield = a.todayMilkProduction ? a.todayMilkProduction.totalLiters : 0;
      const bYield = b.todayMilkProduction ? b.todayMilkProduction.totalLiters : 0;
      return bYield - aYield;
    }
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="view-content dairy-management-view">
      {/* 4 Summary Stat Cards */}
      <div className="dashboard-stats-grid">
        <StatCard 
          title="Total Dairy Cows"
          value={totalCows}
          subtext="Indigenous & Crossbred Bovines"
          icon={Users}
          variant="navy"
          trend="Cow Herd"
          badgeText={`${totalCows} Cows`}
        />

        <StatCard 
          title="Total Dairy Buffaloes"
          value={totalBuffaloes}
          subtext="Murrah & Jaffarabadi Dairy Stock"
          icon={Users}
          variant="default"
          trend="Buffalo Herd"
          badgeText={`${totalBuffaloes} Buffaloes`}
        />

        <StatCard 
          title="Active Lactating Herd"
          value={inMilkCount}
          subtext="Currently producing commercial milk"
          icon={Droplets}
          variant="success"
          trend="In Milk"
          badgeText={`${inMilkCount} In Milk`}
        />

        <StatCard 
          title="Dry / Pregnant Stock"
          value={dryPregnantCount}
          subtext="Gestating & non-lactating cycle"
          icon={AlertCircle}
          variant="warning"
          trend="Reproductive Cycle"
          badgeText={`${dryPregnantCount} Dry/Pregnant`}
        />
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="toolbar-container">
        <div className="toolbar-top-row">
          <div className="filter-pills-row">
            <span className="filter-label">Species Category:</span>
            {['All', 'Cow', 'Buffalo'].map(sp => (
              <button
                key={sp}
                className={`filter-pill ${speciesFilter === sp ? 'active' : ''}`}
                onClick={() => setSpeciesFilter(sp)}
              >
                {sp === 'Cow' ? '🐄 Cows' : sp === 'Buffalo' ? '🐃 Buffaloes' : 'All Dairy Herd'}
              </button>
            ))}
          </div>

          <div className="toolbar-actions-row">
            <button 
              className="btn-primary-action"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} />
              <span>Add Cow / Buffalo</span>
            </button>
          </div>
        </div>

        <div className="toolbar-bottom-row">
          {/* Milk Status Dropdown */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={milkStatusFilter}
              onChange={(e) => setMilkStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Production Statuses</option>
              <option value="In Milk">In Milk (Lactating)</option>
              <option value="Dry">Dry Period</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Heifer">Heifer (Pre-calving)</option>
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
              <option value="id">Sort by Permanent ID</option>
              <option value="name">Sort by Name</option>
              <option value="yield">Sort by Today's Milk Yield</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="search-bar-inline">
            <Search size={14} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by name, ID, breed, stall..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inline-search-input"
            />
          </div>

          <div className="filter-results-counter">
            Showing <strong>{sortedAnimals.length}</strong> of {dairyAnimals.length} dairy animals
          </div>
        </div>
      </div>

      {/* Dairy Animals Table / Roster */}
      <div className="card-box">
        <div className="card-box-header">
          <div>
            <h3 className="card-box-title">Registered Dairy Herd Roster</h3>
            <p className="card-box-sub">Permanent identification, lactation status, and commercial yield</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Animal ID & Name</th>
                <th>Category & Breed</th>
                <th>Production Status</th>
                <th>Health Status</th>
                <th>Housing Stall</th>
                <th>Purchase Details</th>
                <th>Today's Milk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAnimals.length > 0 ? (
                sortedAnimals.map(animal => {
                  const isCow = animal.species === 'Cow' || animal.species === 'Cattle';
                  const prodStatus = animal.milkProductionStatus || 'In Milk';
                  const healthStatus = animal.healthStatus || 'Healthy';
                  const todayMilk = animal.todayMilkProduction;

                  return (
                    <tr key={animal.id} onClick={() => onSelectAnimal && onSelectAnimal(animal)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="animal-cell">
                          <span className="species-emoji-mini">{isCow ? '🐄' : '🐃'}</span>
                          <div>
                            <span className="cell-name">{animal.name}</span>
                            <span className="cell-id">{animal.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="category-breed-cell">
                          <span className="species-pill">{isCow ? 'Cow' : 'Buffalo'}</span>
                          <span className="breed-subtext">{animal.breed} • {animal.age}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`status-badge-inline ${prodStatus === 'In Milk' ? 'in-milk' : 'dry'}`}>
                          {prodStatus}
                        </span>
                      </td>

                      <td>
                        <span className={`health-pill ${healthStatus.toLowerCase()}`}>
                          {healthStatus}
                        </span>
                      </td>

                      <td>
                        <span className="table-loc-text">{animal.penLocation || 'Barn A'}</span>
                      </td>

                      <td>
                        {animal.purchaseCost ? (
                          <div className="purchase-info-cell">
                            <span className="cost-val">₹ {animal.purchaseCost.toLocaleString('en-IN')}</span>
                            <span className="date-sub">{animal.purchaseDate || 'Acquired'}</span>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Farm Bred</span>
                        )}
                      </td>

                      <td>
                        {todayMilk ? (
                          <div className="today-milk-cell">
                            <span className="milk-qty-bold">{todayMilk.totalLiters} L</span>
                            <span className="milk-rev-sub">₹ {todayMilk.totalIncome.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <span className="no-record-badge">No Record Today</span>
                        )}
                      </td>

                      <td>
                        <div className="row-action-btns" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn-table-icon green"
                            title="Log Milk Production"
                            onClick={() => setQuickMilkingAnimalId(animal.id)}
                          >
                            <Droplets size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-table-icon"
                            title="View QR Code"
                            onClick={() => onOpenQRModal(animal)}
                          >
                            <QrCode size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-table-icon"
                            title="Edit Animal"
                            onClick={() => setEditingAnimal(animal)}
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-table-icon red"
                            title="Delete Animal (Safety Check)"
                            onClick={() => setDeletingAnimal(animal)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No dairy animals match your filter. Click "Add Cow / Buffalo" to enroll a new animal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cow / Buffalo Modal */}
      {isAddModalOpen && (
        <AddAnimalModal
          onClose={() => setIsAddModalOpen(false)}
          onAddAnimal={(data) => {
            onRegisterAnimal(data);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Animal Modal */}
      {editingAnimal && (
        <EditAnimalModal
          animal={editingAnimal}
          onClose={() => setEditingAnimal(null)}
          onSave={(id, data) => {
            onUpdateAnimal(id, data);
            setEditingAnimal(null);
          }}
        />
      )}

      {/* Quick Record Milk Modal */}
      {quickMilkingAnimalId && (
        <AddMilkRecordModal
          animals={dairyAnimals}
          existingRecords={milkRecords}
          initialAnimalId={quickMilkingAnimalId}
          onClose={() => setQuickMilkingAnimalId(null)}
          onSave={(data) => {
            onAddMilkRecord(data);
            setQuickMilkingAnimalId(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAnimal && (
        <DeleteConfirmModal
          isOpen={true}
          title="Confirm Animal Deregistration"
          message={`Are you sure you want to remove ${deletingAnimal.name} (${deletingAnimal.id}) from the active dairy herd registry? Associated historical financial ledger entries will be archived.`}
          itemName={deletingAnimal.name}
          itemId={deletingAnimal.id}
          onClose={() => setDeletingAnimal(null)}
          onConfirm={() => {
            onDeleteAnimal(deletingAnimal.id);
            setDeletingAnimal(null);
          }}
        />
      )}
    </div>
  );
}