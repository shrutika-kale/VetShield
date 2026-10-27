import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Droplets, 
  ShieldCheck, 
  Info, 
  Filter, 
  ArrowUpDown,
  Download,
  Award
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function ProfitLossReportView({ 
  animals = [], 
  financialSummary = null,
  onSelectAnimal 
}) {
  const [allocationMode, setAllocationMode] = useState('direct'); // 'direct' | 'allocated'
  const [selectedSpecies, setSelectedSpecies] = useState('All'); // 'All', 'Cow', 'Buffalo'
  const [sortBy, setSortBy] = useState('netContribution'); // 'netContribution', 'yield', 'income', 'feed', 'vet'

  const animalProfitability = financialSummary?.animalProfitability || [];
  const dairyAnimals = animals.filter(
    a => a.species === 'Cow' || a.species === 'Buffalo' || a.species === 'Cattle'
  );

  // Filter animals
  const filteredList = animalProfitability.filter(item => {
    if (selectedSpecies === 'Cow') return item.species === 'Cow' || item.species === 'Cattle';
    if (selectedSpecies === 'Buffalo') return item.species === 'Buffalo';
    return true;
  });

  // Calculate shared overhead to distribute if allocated mode is active
  const monthOverhead = (financialSummary?.expensesByCategory || [])
    .filter(c => c.category === 'Labour costs' || c.category === 'Electricity' || c.category === 'Water' || c.category === 'Equipment and maintenance')
    .reduce((s, c) => s + c.amount, 0);

  const overheadPerAnimal = dairyAnimals.length > 0 ? monthOverhead / dairyAnimals.length : 0;

  // Enriched items with allocation
  const displayItems = filteredList.map(item => {
    const allocatedCost = allocationMode === 'allocated' ? overheadPerAnimal : 0;
    const effectiveTotalExpenses = item.totalDirectExpenses + allocatedCost;
    const effectiveNetContribution = item.totalRecordedIncome - effectiveTotalExpenses;

    return {
      ...item,
      allocatedCost: parseFloat(allocatedCost.toFixed(2)),
      effectiveTotalExpenses: parseFloat(effectiveTotalExpenses.toFixed(2)),
      effectiveNetContribution: parseFloat(effectiveNetContribution.toFixed(2))
    };
  });

  // Sort
  const sortedItems = [...displayItems].sort((a, b) => {
    if (sortBy === 'yield') return b.totalMilkProduced - a.totalMilkProduced;
    if (sortBy === 'income') return b.totalRecordedIncome - a.totalRecordedIncome;
    if (sortBy === 'feed') return b.feedExpenses - a.feedExpenses;
    if (sortBy === 'vet') return b.vetExpenses - a.vetExpenses;
    return b.effectiveNetContribution - a.effectiveNetContribution;
  });

  // Best performers
  const topYieldAnimal = [...sortedItems].sort((a, b) => b.totalMilkProduced - a.totalMilkProduced)[0];
  const topIncomeAnimal = [...sortedItems].sort((a, b) => b.totalRecordedIncome - a.totalRecordedIncome)[0];
  const topProfitAnimal = [...sortedItems].sort((a, b) => b.effectiveNetContribution - a.effectiveNetContribution)[0];

  const handleExportCSV = () => {
    if (sortedItems.length === 0) {
      alert("No profitability records to export.");
      return;
    }

    const headers = [
      "Animal ID",
      "Animal Name",
      "Species",
      "Breed",
      "30-Day Milk Yield (L)",
      "Recorded Milk Sales (INR)",
      "Feed Expenses (INR)",
      "Veterinary Expenses (INR)",
      "Other Direct Expenses (INR)",
      "Total Direct Expenses (INR)",
      "Allocated Overhead (INR)",
      "Net Contribution (INR)"
    ];

    const rows = sortedItems.map(item => [
      item.animalId,
      `"${item.animalName}"`,
      item.species,
      `"${item.breed}"`,
      item.totalMilkProduced,
      item.totalRecordedIncome,
      item.feedExpenses,
      item.vetExpenses,
      item.otherDirectExpenses,
      item.totalDirectExpenses,
      item.allocatedCost,
      item.effectiveNetContribution
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VetShield_Animal_Profitability_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-content profit-loss-report-view">
      {/* Top 3 Performance Highlight Cards */}
      <div className="dashboard-stats-grid">
        <StatCard 
          title="Top Net Contributor"
          value={topProfitAnimal ? `${topProfitAnimal.animalName} (${topProfitAnimal.animalId})` : '—'}
          subtext={topProfitAnimal ? `Net: +₹${topProfitAnimal.effectiveNetContribution.toLocaleString('en-IN')}` : 'No data logged'}
          icon={Award}
          variant="success"
          trend="Highest Net Contribution"
          badgeText={topProfitAnimal ? `+₹${topProfitAnimal.effectiveNetContribution}` : 'P&L Leader'}
        />

        <StatCard 
          title="Top Milk Yield Producer"
          value={topYieldAnimal ? `${topYieldAnimal.totalMilkProduced} L` : '—'}
          subtext={topYieldAnimal ? `${topYieldAnimal.animalName} (${topYieldAnimal.species})` : 'No milk logged'}
          icon={Droplets}
          variant="navy"
          trend="30-Day Milk Leader"
          badgeText={topYieldAnimal ? `${topYieldAnimal.totalMilkProduced} L` : 'Lactation Leader'}
        />

        <StatCard 
          title="Top Revenue Generator"
          value={topIncomeAnimal ? `₹ ${topIncomeAnimal.totalRecordedIncome.toLocaleString('en-IN')}` : '—'}
          subtext={topIncomeAnimal ? `${topIncomeAnimal.animalName} (${topIncomeAnimal.species})` : 'No revenue'}
          icon={DollarSign}
          variant="default"
          trend="Gross Commercial Sales"
          badgeText="Highest Sales"
        />

        <StatCard 
          title="Enterprise Operating Margin"
          value={financialSummary?.month ? `₹ ${financialSummary.month.netOperatingProfit.toLocaleString('en-IN')}` : '₹ 0'}
          subtext="30-Day Farm-wide Operating P&L"
          icon={TrendingUp}
          variant={financialSummary?.month?.netOperatingProfit >= 0 ? "success" : "danger"}
          trend="Enterprise Level"
          badgeText="Net Operating"
        />
      </div>

      {/* Accounting Methodology Banner (Feature 4 Requirement) */}
      <div className="accounting-disclaimer-banner">
        <div className="disc-icon-box">
          <Info size={20} className="text-blue" />
        </div>
        <div className="disc-content">
          <h4 className="disc-title">Accounting Methodology: Direct Animal Contribution Analysis</h4>
          <p className="disc-body">
            Animal-level profitability is an estimate based strictly on recorded direct revenue and direct costs (specific feed rations, medications, and treatments). Shared farm-wide overheads (electricity, stall maintenance, labour) are managed at the facility level and are <strong>not allocated to individual livestock unless chosen below</strong>.
          </p>
        </div>
      </div>

      {/* Allocation Mode Selector & Toolbar */}
      <div className="toolbar-container" style={{ marginTop: '16px' }}>
        <div className="toolbar-top-row">
          <div className="filter-pills-row">
            <span className="filter-label">Cost Attribution Method:</span>
            <button
              type="button"
              className={`filter-pill ${allocationMode === 'direct' ? 'active' : ''}`}
              onClick={() => setAllocationMode('direct')}
            >
              Direct Costs Only (Standard Contribution)
            </button>
            <button
              type="button"
              className={`filter-pill ${allocationMode === 'allocated' ? 'active' : ''}`}
              onClick={() => setAllocationMode('allocated')}
            >
              With Shared Overhead Allocation (+₹{Math.round(overheadPerAnimal)}/head)
            </button>
          </div>

          <div className="toolbar-actions-row">
            <button 
              type="button" 
              className="btn-outline-action small"
              onClick={handleExportCSV}
            >
              <Download size={14} />
              <span>Export Report CSV</span>
            </button>
          </div>
        </div>

        <div className="toolbar-bottom-row">
          {/* Species Filter */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Dairy Stock (Cows & Buffaloes)</option>
              <option value="Cow">Cows Only</option>
              <option value="Buffalo">Buffaloes Only</option>
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
              <option value="netContribution">Sort by Net Contribution (Most Profitable)</option>
              <option value="yield">Sort by 30-Day Milk Yield</option>
              <option value="income">Sort by Recorded Milk Income</option>
              <option value="feed">Sort by Feed Expenses (Highest)</option>
              <option value="vet">Sort by Veterinary Expenses (Highest)</option>
            </select>
          </div>

          <div className="filter-results-counter">
            Showing <strong>{sortedItems.length}</strong> livestock profitability audits
          </div>
        </div>
      </div>

      {/* Animal Profitability Custom Data Table */}
      <div className="card-box">
        <div className="card-box-header">
          <div>
            <h3 className="card-box-title">Animal-Wise Cost & Revenue Contribution Table</h3>
            <p className="card-box-sub">
              Milk revenue vs feed, veterinary, and attributed operating expenses (Last 30 Days)
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Animal ID & Name</th>
                <th>Category</th>
                <th>Milk Yield (30d)</th>
                <th>Milk Revenue (₹)</th>
                <th>Feed Expenses (₹)</th>
                <th>Veterinary (₹)</th>
                <th>Other Direct (₹)</th>
                <th>Total Expenses (₹)</th>
                <th>Net Contribution (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length > 0 ? (
                sortedItems.map(item => {
                  const isCow = item.species === 'Cow' || item.species === 'Cattle';
                  const isPositive = item.effectiveNetContribution > 0;
                  const isNegative = item.effectiveNetContribution < 0;

                  return (
                    <tr 
                      key={item.animalId}
                      onClick={() => onSelectAnimal && onSelectAnimal(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="animal-cell">
                          <span className="species-emoji-mini">{isCow ? '🐄' : '🐃'}</span>
                          <div>
                            <span className="cell-name">{item.animalName}</span>
                            <span className="cell-id">{item.animalId}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`species-pill ${isCow ? 'cow' : 'buffalo'}`}>
                          {isCow ? 'Cow' : 'Buffalo'}
                        </span>
                      </td>

                      <td>
                        <span className="milk-qty-bold">{item.totalMilkProduced} L</span>
                      </td>

                      <td>
                        <span className="income-amount-tag">
                          ₹ {item.totalRecordedIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        <span className="cost-tag feed">
                          ₹ {item.feedExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        <span className="cost-tag vet">
                          ₹ {item.vetExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                          ₹ {item.otherDirectExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          {allocationMode === 'allocated' && ` (+₹${item.allocatedCost} ovh)`}
                        </span>
                      </td>

                      <td>
                        <span className="cost-tag total">
                          ₹ {item.effectiveTotalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        <span className={`net-contribution-tag ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                          {isPositive ? '+' : ''} ₹ {item.effectiveNetContribution.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        <span className={`status-badge-inline ${isPositive ? 'in-milk' : 'dry'}`}>
                          {isPositive ? 'Net Positive' : 'Deficit'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No dairy animals or transactions logged for profitability comparison yet.
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