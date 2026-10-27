import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Search,
  ArrowUpDown,
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';
import StatCard from '../components/StatCard';
import AddTransactionModal, { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../components/AddTransactionModal';
import EditTransactionModal from '../components/EditTransactionModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import FinancialCharts from '../components/FinancialCharts';

export default function FinancialManagementView({ 
  animals = [], 
  transactions = [], 
  financialSummary = null,
  onAddTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction,
  onNavigateToTab 
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters state
  const [typeFilter, setTypeFilter] = useState('All'); // 'All', 'income', 'expense'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedAnimalId, setSelectedAnimalId] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [defaultAddType, setDefaultAddType] = useState('expense');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      if (typeFilter !== 'All' && txn.type !== typeFilter) return false;
      if (categoryFilter !== 'All' && txn.category !== categoryFilter) return false;
      if (selectedAnimalId !== 'All' && txn.animalId !== selectedAnimalId) return false;
      if (dateFilter && txn.date !== dateFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = (txn.description || '').toLowerCase().includes(q);
        const matchCat = (txn.category || '').toLowerCase().includes(q);
        const matchId = (txn.id || '').toLowerCase().includes(q);
        const matchNotes = (txn.notes || '').toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchId && !matchNotes) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, selectedAnimalId, dateFilter, searchQuery]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortBy === 'amount') return (b.amount || 0) - (a.amount || 0);
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });
  }, [filteredTransactions, sortBy]);

  // CSV Export for Financial Ledger
  const handleExportCSV = () => {
    if (sortedTransactions.length === 0) {
      alert("No financial transactions to export.");
      return;
    }

    const headers = [
      "Transaction ID",
      "Date",
      "Type",
      "Category",
      "Description",
      "Amount (INR)",
      "Attributed Animal ID",
      "Payment Method",
      "Is Capital Asset",
      "Milk Record Ref",
      "Notes"
    ];

    const rows = sortedTransactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      t.animalId || 'General',
      t.paymentMethod || 'Cash',
      t.isCapitalExpense ? 'Yes' : 'No',
      t.milkRecordId || 'N/A',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VetShield_Financial_Ledger_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Values from financial summary
  const today = financialSummary?.today || { income: 0, operatingExpenses: 0, netOperatingProfit: 0, capitalExpenses: 0 };
  const week = financialSummary?.week || { income: 0, operatingExpenses: 0, netOperatingProfit: 0 };
  const month = financialSummary?.month || { income: 0, operatingExpenses: 0, netOperatingProfit: 0 };
  const incomeBreakdown = financialSummary?.incomeBreakdown || { totalMilkIncome: 0, cowMilkIncome: 0, buffaloMilkIncome: 0, otherIncome: 0 };
  const expensesByCategory = financialSummary?.expensesByCategory || [];
  const dailyTrend = financialSummary?.dailyTrend || [];
  const incompleteNotice = financialSummary?.incompleteRecords;

  const todayNet = today.netOperatingProfit;
  const isNetPositive = todayNet > 0;
  const isNetNegative = todayNet < 0;

  return (
    <div className="view-content financial-management-view">
      {/* Financial Overview Stat Cards */}
      <div className="dashboard-stats-grid">
        <StatCard 
          title="Today's Recorded Income"
          value={`₹ ${today.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext={`Milk: ₹${(incomeBreakdown.totalMilkIncome).toLocaleString('en-IN')}`}
          icon={CheckCircle2}
          variant="success"
          trend="Total Daily Income"
          badgeText="Verified Revenue"
        />

        <StatCard 
          title="Today's Operating Expenses"
          value={`₹ ${today.operatingExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext="Excludes capital livestock assets"
          icon={TrendingDown}
          variant="warning"
          trend="Operating Costs"
          badgeText="Daily Opex"
        />

        <StatCard 
          title="Recorded Net Operating Profit"
          value={`${isNetPositive ? '+' : ''}₹ ${todayNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext={isNetPositive ? "Operating profit logged" : isNetNegative ? "Operating deficit recorded" : "Break-even"}
          icon={TrendingUp}
          variant={isNetPositive ? "success" : isNetNegative ? "danger" : "default"}
          trend="Today's Operating Margin"
          badgeText={isNetPositive ? "Profitable" : isNetNegative ? "Operating Loss" : "Zero"}
        />

        <StatCard 
          title="Weekly Operating Profit"
          value={`${week.netOperatingProfit >= 0 ? '+' : ''}₹ ${week.netOperatingProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext={`Monthly: ₹${month.netOperatingProfit.toLocaleString('en-IN')}`}
          icon={DollarSign}
          variant={week.netOperatingProfit >= 0 ? "success" : "danger"}
          trend="7-Day Rolling"
          badgeText="Weekly P&L"
        />
      </div>

      {/* Accounting Standards & Incomplete Data Banner */}
      <div className="accounting-disclaimer-banner">
        <div className="disc-icon-box">
          <ShieldCheck size={20} className="text-green" />
        </div>
        <div className="disc-content">
          <h4 className="disc-title">Verified Accounting Standards & Audit Policy</h4>
          <p className="disc-body">
            Financial analytics are calculated exclusively from saved transaction ledger entries. 
            Displayed margins represent <strong>"Recorded Net Operating Profit/Loss"</strong>. Capital livestock purchases (e.g. initial animal acquisition cost) are segregated from daily operating expenses to ensure accurate day-to-day margin reporting.
          </p>
          {incompleteNotice && incompleteNotice.hasMilkWithoutSales && (
            <span className="incomplete-flag-pill">
              <AlertCircle size={13} /> Notice: Some milk production logs currently have zero recorded commercial sale price.
            </span>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts (Income vs Expense & Category Distribution) */}
      <FinancialCharts 
        dailyTrend={dailyTrend}
        expensesByCategory={expensesByCategory}
      />

      {/* Commercial Revenue Sources Strip */}
      <div className="income-sources-strip">
        <div className="source-item">
          <span className="source-lbl">🐄 Cow Milk Sales</span>
          <span className="source-amt">₹ {incomeBreakdown.cowMilkIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="source-divider"></div>
        <div className="source-item">
          <span className="source-lbl">🐃 Buffalo Milk Sales</span>
          <span className="source-amt">₹ {incomeBreakdown.buffaloMilkIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="source-divider"></div>
        <div className="source-item">
          <span className="source-lbl">📦 Other Farm Products / Sales</span>
          <span className="source-amt">₹ {incomeBreakdown.otherIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="source-divider"></div>
        <div className="source-item highlight">
          <span className="source-lbl">📊 Animal Profitability Report</span>
          <button 
            type="button" 
            className="btn-link-action"
            onClick={() => onNavigateToTab && onNavigateToTab('reports')}
          >
            Open Animal-Wise P&L →
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="toolbar-container" style={{ marginTop: '20px' }}>
        <div className="toolbar-top-row">
          <div className="filter-pills-row">
            <span className="filter-label">Transaction Type:</span>
            {[
              { id: 'All', label: 'All Transactions' },
              { id: 'income', label: '+ Income Only' },
              { id: 'expense', label: '− Expenses Only' }
            ].map(pill => (
              <button
                key={pill.id}
                className={`filter-pill ${typeFilter === pill.id ? 'active' : ''}`}
                onClick={() => {
                  setTypeFilter(pill.id);
                  setCategoryFilter('All');
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="toolbar-actions-row">
            <button 
              type="button" 
              className="btn-outline-action small"
              onClick={handleExportCSV}
              title="Export transaction ledger in CSV format"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button 
              type="button"
              className="btn-outline-action small"
              onClick={() => {
                setDefaultAddType('income');
                setIsAddModalOpen(true);
              }}
            >
              <Plus size={14} />
              <span>+ Add Income</span>
            </button>

            <button 
              type="button"
              className="btn-primary-action"
              onClick={() => {
                setDefaultAddType('expense');
                setIsAddModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>− Add Expense</span>
            </button>
          </div>
        </div>

        <div className="toolbar-bottom-row">
          {/* Category Dropdown */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              {(typeFilter === 'income' ? INCOME_CATEGORIES : 
                typeFilter === 'expense' ? EXPENSE_CATEGORIES : 
                [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]
              ).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Attributed Animal Dropdown */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Cost Centers / Animals</option>
              {animals.map(a => (
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
              title="Filter by transaction date"
            />
            {dateFilter && (
              <button 
                type="button" 
                className="clear-filter-btn"
                onClick={() => setDateFilter('')}
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
              <option value="amount">Sort by Amount (Highest)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="search-bar-inline">
            <Search size={14} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search description, category, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inline-search-input"
            />
          </div>

          <div className="filter-results-counter">
            Showing <strong>{sortedTransactions.length}</strong> of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="card-box">
        <div className="card-box-header">
          <div>
            <h3 className="card-box-title">Documented Farm Financial Ledger</h3>
            <p className="card-box-sub">Income, operational expenses, and capital acquisitions</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount (₹)</th>
                <th>Attributed Animal</th>
                <th>Payment Mode</th>
                <th>Notes / Ref</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map(txn => {
                  const isInc = txn.type === 'income';
                  const isCapital = txn.isCapitalExpense;

                  return (
                    <tr key={txn.id}>
                      <td>
                        <span className="table-date-badge">{txn.date}</span>
                      </td>

                      <td>
                        <span className={`txn-type-badge ${isInc ? 'income' : 'expense'}`}>
                          {isInc ? '+ Income' : '− Expense'}
                        </span>
                      </td>

                      <td>
                        <div className="txn-category-cell">
                          <span className="txn-cat-name">{txn.category}</span>
                          {isCapital && <span className="capital-badge-tiny">Capital Asset</span>}
                        </div>
                      </td>

                      <td>
                        <span className="txn-desc-text" title={txn.description}>
                          {txn.description}
                        </span>
                      </td>

                      <td>
                        <span className={`txn-amount-val ${isInc ? 'income' : 'expense'}`}>
                          {isInc ? '+' : '−'} ₹ {txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        {txn.animalId ? (
                          <span className="cell-id">{txn.animalId}</span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Shared Overhead</span>
                        )}
                      </td>

                      <td>
                        <span className="payment-mode-tag">{txn.paymentMethod || 'Cash'}</span>
                      </td>

                      <td>
                        <span className="record-notes-text" title={txn.notes}>
                          {txn.notes || '—'}
                        </span>
                      </td>

                      <td>
                        <div className="row-action-btns">
                          <button
                            type="button"
                            className="btn-table-icon"
                            title="Edit Transaction"
                            onClick={() => setEditingTransaction(txn)}
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-table-icon red"
                            title="Delete Transaction"
                            onClick={() => setDeletingTransaction(txn)}
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
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <DollarSign size={36} className="text-muted" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600 }}>No transactions match your filter.</p>
                    <p style={{ fontSize: '0.85rem' }}>Click "+ Add Income" or "− Add Expense" above to record a new transaction.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <AddTransactionModal 
          animals={animals}
          defaultType={defaultAddType}
          onClose={() => setIsAddModalOpen(false)}
          onSave={onAddTransaction}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal 
          transaction={editingTransaction}
          animals={animals}
          onClose={() => setEditingTransaction(null)}
          onSave={onUpdateTransaction}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Financial Transaction"
          message={`Are you sure you want to delete this ${deletingTransaction.type} entry of ₹${deletingTransaction.amount} (${deletingTransaction.description}) on ${deletingTransaction.date}? This will update the verified ledger balance.`}
          itemName={deletingTransaction.description}
          itemId={deletingTransaction.id}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={() => {
            onDeleteTransaction(deletingTransaction.id);
            setDeletingTransaction(null);
          }}
        />
      )}
    </div>
  );
}