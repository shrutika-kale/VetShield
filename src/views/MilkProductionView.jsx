import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  Plus, 
  Download, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Edit, 
  Trash2, 
  Search,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import StatCard from '../components/StatCard';
import AddMilkRecordModal from '../components/AddMilkRecordModal';
import EditMilkRecordModal from '../components/EditMilkRecordModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import MilkProductionCharts from '../components/MilkProductionCharts';

export default function MilkProductionView({ 
  animals = [], 
  milkRecords = [], 
  milkStats = null,
  onAddMilkRecord, 
  onUpdateMilkRecord, 
  onDeleteMilkRecord 
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters state
  const [selectedAnimalId, setSelectedAnimalId] = useState('All');
  const [selectedSpecies, setSelectedSpecies] = useState('All'); // 'All', 'Cow', 'Buffalo'
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'yield', 'income'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const dairyAnimals = animals.filter(
    a => a.species === 'Cow' || a.species === 'Buffalo' || a.species === 'Cattle'
  );

  // Filter milk records
  const filteredRecords = useMemo(() => {
    return milkRecords.filter(record => {
      if (selectedAnimalId !== 'All' && record.animalId !== selectedAnimalId) return false;

      const isCow = record.species === 'Cow' || record.species === 'Cattle';
      const isBuff = record.species === 'Buffalo';

      if (selectedSpecies === 'Cow' && !isCow) return false;
      if (selectedSpecies === 'Buffalo' && !isBuff) return false;

      if (dateFilter && record.date !== dateFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (record.animalName || '').toLowerCase().includes(q);
        const matchesId = (record.animalId || '').toLowerCase().includes(q);
        const matchesNotes = (record.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNotes) return false;
      }

      return true;
    });
  }, [milkRecords, selectedAnimalId, selectedSpecies, dateFilter, searchQuery]);

  // Sort milk records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      if (sortBy === 'yield') return (b.totalLiters || 0) - (a.totalLiters || 0);
      if (sortBy === 'income') return (b.totalIncome || 0) - (a.totalIncome || 0);
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });
  }, [filteredRecords, sortBy]);

  // CSV Export Functionality
  const handleExportCSV = () => {
    if (sortedRecords.length === 0) {
      alert("No milk records to export.");
      return;
    }

    const headers = [
      "Record ID",
      "Date",
      "Animal ID",
      "Animal Name",
      "Species",
      "Morning (L)",
      "Afternoon (L)",
      "Evening (L)",
      "Total Yield (L)",
      "Sold (L)",
      "Unsold (L)",
      "Price Per Litre (INR)",
      "Total Income (INR)",
      "Notes"
    ];

    const rows = sortedRecords.map(r => [
      r.id,
      r.date,
      r.animalId,
      `"${r.animalName || ''}"`,
      r.species,
      r.morningLiters,
      r.afternoonLiters,
      r.eveningLiters,
      r.totalLiters,
      r.soldLiters,
      r.unsoldLiters,
      r.pricePerLiter,
      r.totalIncome,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VetShield_Milk_Records_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats values
  const todayTotal = milkStats?.todayTotalMilk || 0;
  const todayCow = milkStats?.todayCowMilk || 0;
  const todayBuffalo = milkStats?.todayBuffaloMilk || 0;
  const todayIncome = milkStats?.todayMilkSalesIncome || 0;
  const todayAvgPerAnimal = milkStats?.todayAveragePerAnimal || 0;
  const weekTotal = milkStats?.weekTotalMilk || 0;
  const monthTotal = milkStats?.monthTotalMilk || 0;
  const decreaseAlerts = milkStats?.decreaseAlerts || [];

  return (
    <div className="view-content milk-production-view">
      {/* Top Metric Cards */}
      <div className="dashboard-stats-grid">
        <StatCard 
          title="Today's Total Milk"
          value={`${todayTotal} L`}
          subtext={`Cow: ${todayCow} L • Buff: ${todayBuffalo} L`}
          icon={Droplets}
          variant="navy"
          trend="Daily Yield"
          badgeText="Verified Today"
        />

        <StatCard 
          title="Today's Milk Sales"
          value={`₹ ${todayIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext="Direct commercial revenue"
          icon={CheckCircle2}
          variant="success"
          trend="Commercial Income"
          badgeText="Sales Total"
        />

        <StatCard 
          title="Weekly Production"
          value={`${weekTotal} L`}
          subtext="Total yield over last 7 days"
          icon={Droplets}
          variant="default"
          trend="7-Day Rolling"
          badgeText={`${weekTotal} L`}
        />

        <StatCard 
          title="Monthly Production"
          value={`${monthTotal} L`}
          subtext={`Avg ${todayAvgPerAnimal} L / milking animal`}
          icon={Droplets}
          variant="default"
          trend="30-Day Total"
          badgeText={`${monthTotal} L`}
        />
      </div>

      {/* Production Decrease Alert Banner (Feature 2 Requirement) */}
      {decreaseAlerts.length > 0 && (
        <div className="yield-drop-alert-banner">
          <div className="alert-banner-header">
            <TrendingDown size={20} className="text-red" />
            <div>
              <h4 className="alert-banner-title">
                Milk Production Drop Flagged ({decreaseAlerts.length} Animal{decreaseAlerts.length > 1 ? 's' : ''})
              </h4>
              <p className="alert-banner-desc">
                Significant yield reduction detected compared with prior milking sessions. Early indicator of subclinical mastitis, ruminal acidosis, or nutritional stress.
              </p>
            </div>
          </div>

          <div className="drop-cards-list">
            {decreaseAlerts.map((drop, idx) => (
              <div key={idx} className="drop-item-card">
                <div className="drop-animal-meta">
                  <span className="drop-name">{drop.animalName} ({drop.animalId})</span>
                  <span className="drop-species-pill">{drop.species}</span>
                </div>
                <div className="drop-numbers-row">
                  <span className="yield-prev">{drop.previousYield} L ({drop.previousDate})</span>
                  <span className="yield-arrow">→</span>
                  <span className="yield-now">{drop.latestYield} L ({drop.latestDate})</span>
                  <span className="yield-drop-badge">-{drop.dropAmount} L ({drop.dropPercentage}%)</span>
                </div>
                <p className="drop-advisory">{drop.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milk Production Charts Component (Cow vs Buffalo & 14-day trend) */}
      <MilkProductionCharts 
        dailyTrend={milkStats?.dailyTrend || []}
        todayCowMilk={todayCow}
        todayBuffaloMilk={todayBuffalo}
      />

      {/* Toolbar & Filter Bar */}
      <div className="toolbar-container" style={{ marginTop: '20px' }}>
        <div className="toolbar-top-row">
          <div className="filter-pills-row">
            <span className="filter-label">Species Filter:</span>
            {['All', 'Cow', 'Buffalo'].map(sp => (
              <button
                key={sp}
                className={`filter-pill ${selectedSpecies === sp ? 'active' : ''}`}
                onClick={() => setSelectedSpecies(sp)}
              >
                {sp === 'Cow' ? '🐄 Cow Milk' : sp === 'Buffalo' ? '🐃 Buffalo Milk' : 'All Production'}
              </button>
            ))}
          </div>

          <div className="toolbar-actions-row">
            <button 
              type="button" 
              className="btn-outline-action small"
              onClick={handleExportCSV}
              title="Download milk production records in CSV format"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button 
              type="button"
              className="btn-primary-action"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} />
              <span>Record Milk Production</span>
            </button>
          </div>
        </div>

        <div className="toolbar-bottom-row">
          {/* Specific Animal Filter */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Registered Animals</option>
              {dairyAnimals.map(a => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.name} ({a.species})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="filter-select-wrapper">
            <Calendar size={14} className="filter-icon" />
            <input 
              type="date"
              className="filter-select date-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by specific date"
            />
            {dateFilter && (
              <button 
                type="button" 
                className="clear-filter-btn"
                onClick={() => setDateFilter('')}
                title="Clear date filter"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="filter-select-wrapper">
            <ArrowUpDown size={14} className="filter-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date">Sort by Date (Latest First)</option>
              <option value="yield">Sort by Daily Yield (Highest)</option>
              <option value="income">Sort by Milk Income</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="search-bar-inline">
            <Search size={14} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by animal name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inline-search-input"
            />
          </div>

          <div className="filter-results-counter">
            Showing <strong>{sortedRecords.length}</strong> of {milkRecords.length} records
          </div>
        </div>
      </div>

      {/* Milk Records Custom Data Table */}
      <div className="card-box">
        <div className="card-box-header">
          <div>
            <h3 className="card-box-title">Daily Milking & Commercial Sales Ledger</h3>
            <p className="card-box-sub">Daily sessions, auto-calculated yields, retained milk, and revenue</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Animal ID & Name</th>
                <th>Species</th>
                <th>Morning</th>
                <th>Afternoon</th>
                <th>Evening</th>
                <th>Daily Total</th>
                <th>Sold / Unsold</th>
                <th>Rate (₹/L)</th>
                <th>Total Income</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length > 0 ? (
                sortedRecords.map(record => {
                  const isCow = record.species === 'Cow' || record.species === 'Cattle';
                  return (
                    <tr key={record.id}>
                      <td>
                        <span className="table-date-badge">{record.date}</span>
                      </td>

                      <td>
                        <div className="animal-cell">
                          <span className="species-emoji-mini">{isCow ? '🐄' : '🐃'}</span>
                          <div>
                            <span className="cell-name">{record.animalName}</span>
                            <span className="cell-id">{record.animalId}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`species-pill ${isCow ? 'cow' : 'buffalo'}`}>
                          {isCow ? 'Cow' : 'Buffalo'}
                        </span>
                      </td>

                      <td><span className="session-qty">{record.morningLiters || 0} L</span></td>
                      <td><span className="session-qty">{record.afternoonLiters || 0} L</span></td>
                      <td><span className="session-qty">{record.eveningLiters || 0} L</span></td>

                      <td>
                        <span className="total-yield-pill">{record.totalLiters} L</span>
                      </td>

                      <td>
                        <div className="sold-unsold-cell">
                          <span className="sold-text">{record.soldLiters ?? record.totalLiters} L sold</span>
                          {record.unsoldLiters > 0 && (
                            <span className="unsold-text">{record.unsoldLiters} L retained</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="price-tag">₹{record.pricePerLiter || 0}</span>
                      </td>

                      <td>
                        <span className="income-amount-tag">
                          ₹ {(record.totalIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        <span className="record-notes-text" title={record.notes}>
                          {record.notes || '—'}
                        </span>
                      </td>

                      <td>
                        <div className="row-action-btns">
                          <button
                            type="button"
                            className="btn-table-icon"
                            title="Edit Milk Record"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-table-icon red"
                            title="Delete Milk Record"
                            onClick={() => setDeletingRecord(record)}
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
                  <td colSpan="12" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <Droplets size={36} className="text-muted" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600 }}>No milk production records match your filter.</p>
                    <p style={{ fontSize: '0.85rem' }}>Click "Record Milk Production" above to log a new milking session.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Milk Record Modal */}
      {isAddModalOpen && (
        <AddMilkRecordModal 
          animals={dairyAnimals}
          existingRecords={milkRecords}
          onClose={() => setIsAddModalOpen(false)}
          onSave={onAddMilkRecord}
        />
      )}

      {/* Edit Milk Record Modal */}
      {editingRecord && (
        <EditMilkRecordModal 
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={onUpdateMilkRecord}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Milk Record"
          message={`Are you sure you want to delete the milk record of ${deletingRecord.totalLiters} L for ${deletingRecord.animalName} on ${deletingRecord.date}? The linked sales transaction of ₹${deletingRecord.totalIncome} will also be safely removed to prevent duplicate financial counts.`}
          itemName={`${deletingRecord.animalName} (${deletingRecord.date})`}
          itemId={deletingRecord.id}
          onClose={() => setDeletingRecord(null)}
          onConfirm={() => {
            onDeleteMilkRecord(deletingRecord.id);
            setDeletingRecord(null);
          }}
        />
      )}
    </div>
  );
}