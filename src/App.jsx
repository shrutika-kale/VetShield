import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { apiService } from './services/apiService';
import { SPECIES_TEMP_BENCHMARKS } from './data/mockData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AnimalDetailModal from './components/AnimalDetailModal';
import AddAnimalModal from './components/AddAnimalModal';
import EditAnimalModal from './components/EditAnimalModal';
import AddMilkRecordModal from './components/AddMilkRecordModal';
import AddTransactionModal from './components/AddTransactionModal';
import QRScannerModal from './components/QRScannerModal';
import ProjectInfoModal from './components/ProjectInfoModal';
import QRCodeLabel from './components/QRCodeLabel';

import DashboardView from './views/DashboardView';
import AnimalsView from './views/AnimalsView';
import DairyManagementView from './views/DairyManagementView';
import MilkProductionView from './views/MilkProductionView';
import FinancialManagementView from './views/FinancialManagementView';
import ProfitLossReportView from './views/ProfitLossReportView';
import QRCodeManagementView from './views/QRCodeManagementView';
import DeviceManagementView from './views/DeviceManagementView';
import LiveMonitoringView from './views/LiveMonitoringView';
import AlertsView from './views/AlertsView';
import HealthHistoryView from './views/HealthHistoryView';
import SettingsView from './views/SettingsView';
import PublicAnimalProfile from './views/PublicAnimalProfile';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempUnit, setTempUnit] = useState('C'); // 'C' or 'F'

  // Public QR Scanning View State
  const [publicViewAnimalId, setPublicViewAnimalId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('animal') || null;
  });

  // Modals state
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedAnimalForQR, setSelectedAnimalForQR] = useState(null);
  const [selectedAnimalForEdit, setSelectedAnimalForEdit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMilkModalOpen, setIsAddMilkModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [transactionAddType, setTransactionAddType] = useState('expense');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Backend Synchronized States
  const [systemStatus, setSystemStatus] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [realRecords, setRealRecords] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [milkStats, setMilkStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [benchmarks] = useState(SPECIES_TEMP_BENCHMARKS);

  // Primary data loader from Ingestion Gateway & Dairy Service
  const refreshData = useCallback(async () => {
    try {
      const [
        statusData, 
        animalsData, 
        historyData, 
        milkList, 
        milkStatistics, 
        txnList, 
        finSummary
      ] = await Promise.all([
        apiService.getStatus(),
        apiService.getAnimals(),
        apiService.getTelemetryHistory(null, null, 30),
        apiService.getMilkRecords(),
        apiService.getMilkStats(),
        apiService.getTransactions(),
        apiService.getFinancialSummary()
      ]);

      if (statusData) {
        setSystemStatus(statusData);
        setDevices(statusData.devices || []);
        setAlerts(statusData.alerts || []);
      }

      if (animalsData) setAnimals(animalsData);
      if (historyData && historyData.records) setRealRecords(historyData.records);
      if (milkList) setMilkRecords(milkList);
      if (milkStatistics) setMilkStats(milkStatistics);
      if (txnList) setTransactions(txnList);
      if (finSummary) setFinancialSummary(finSummary);

    } catch (err) {
      console.warn('[VetShield] Error polling backend gateway:', err);
    }
  }, []);

  // Real-time Gateway Polling (every 3.5s to pick up live ESP32 biometrics & telemetry)
  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      if (active) await refreshData();
    };
    fetchInitial();
    const pollInterval = setInterval(() => {
      if (active) refreshData();
    }, 3500);
    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [refreshData]);

  // Handle URL change for mobile QR scans
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setPublicViewAnimalId(params.get('animal') || null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handlers
  const handleOpenPublicView = (animalId) => {
    const newUrl = `${window.location.pathname}?animal=${animalId}`;
    window.history.pushState({ animal: animalId }, '', newUrl);
    setPublicViewAnimalId(animalId);
    setSelectedAnimal(null);
    setSelectedAnimalForQR(null);
  };

  const handleBackFromPublicView = () => {
    window.history.pushState({}, '', window.location.pathname);
    setPublicViewAnimalId(null);
  };

  const handleAssignDevice = async (deviceId, animalId) => {
    try {
      await apiService.assignDeviceToAnimal(deviceId, animalId);
      await refreshData();
    } catch (err) {
      alert(`Assignment error: ${err.message}`);
    }
  };

  const handleRegisterDevice = async (deviceData) => {
    try {
      await apiService.registerDevice(deviceData);
      await refreshData();
    } catch (err) {
      alert(`Device registration error: ${err.message}`);
    }
  };

  const handleRegisterAnimal = async (animalData) => {
    try {
      const result = await apiService.registerAnimal(animalData);
      await refreshData();
      if (result && result.animal) {
        setSelectedAnimalForQR(result.animal);
      }
    } catch (err) {
      alert(`Animal registration error: ${err.message}`);
    }
  };

  const handleUpdateAnimal = async (animalId, updateData) => {
    try {
      await apiService.updateAnimal(animalId, updateData);
      await refreshData();
    } catch (err) {
      alert(`Animal update error: ${err.message}`);
    }
  };

  const handleDeleteAnimal = async (animalId) => {
    try {
      await apiService.deleteAnimal(animalId);
      await refreshData();
    } catch (err) {
      alert(`Failed to delete animal: ${err.message}`);
    }
  };

  // Milk Handlers
  const handleAddMilkRecord = async (data) => {
    try {
      await apiService.addMilkRecord(data);
      await refreshData();
    } catch (err) {
      alert(`Error logging milk production: ${err.message}`);
    }
  };

  const handleUpdateMilkRecord = async (id, data) => {
    try {
      await apiService.updateMilkRecord(id, data);
      await refreshData();
    } catch (err) {
      alert(`Error updating milk record: ${err.message}`);
    }
  };

  const handleDeleteMilkRecord = async (id) => {
    try {
      await apiService.deleteMilkRecord(id);
      await refreshData();
    } catch (err) {
      alert(`Error deleting milk record: ${err.message}`);
    }
  };

  // Financial Handlers
  const handleAddTransaction = async (data) => {
    try {
      await apiService.addTransaction(data);
      await refreshData();
    } catch (err) {
      alert(`Error adding transaction: ${err.message}`);
    }
  };

  const handleUpdateTransaction = async (id, data) => {
    try {
      await apiService.updateTransaction(id, data);
      await refreshData();
    } catch (err) {
      alert(`Error updating transaction: ${err.message}`);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await apiService.deleteTransaction(id);
      await refreshData();
    } catch (err) {
      alert(`Error deleting transaction: ${err.message}`);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiService.resolveAlert(alertId, 'Acknowledged');
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await apiService.resolveAlert(alertId, 'Resolved');
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDemoData = async () => {
    if (window.confirm("Reset local database to factory defaults?")) {
      refreshData();
    }
  };

  // If a phone has scanned the animal QR code, display the public verification view
  if (publicViewAnimalId) {
    return (
      <PublicAnimalProfile 
        animalId={publicViewAnimalId}
        onBackToDashboard={handleBackFromPublicView}
      />
    );
  }

  const connectedSensorsCount = systemStatus?.counts?.connectedSensors || 0;
  const noRecentSensorsCount = systemStatus?.counts?.noRecentDataSensors || 0;
  const activeAlertCount = alerts.filter(a => a.status === 'Active').length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        alertCount={activeAlertCount}
        connectedSensorsCount={connectedSensorsCount}
        totalDevicesCount={devices.length}
      />

      {/* Main Layout Area */}
      <div className="app-main-layout">
        {/* Top Header with Real Hardware Badge */}
        <Header 
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
          connectedSensorsCount={connectedSensorsCount}
          noRecentSensorsCount={noRecentSensorsCount}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenInfoModal={() => setIsInfoModalOpen(true)}
          tempUnit={tempUnit}
          setTempUnit={setTempUnit}
          activeAlertCount={activeAlertCount}
        />

        {/* Scrollable Main Content */}
        <main className="main-content-scrollable">
          {activeTab === 'dashboard' && (
            <DashboardView 
              animals={animals}
              devices={devices}
              alerts={alerts}
              systemStatus={systemStatus}
              realRecords={realRecords}
              benchmarks={benchmarks}
              tempUnit={tempUnit}
              milkStats={milkStats}
              financialSummary={financialSummary}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onOpenAddAnimalModal={() => setIsAddModalOpen(true)}
              onOpenAddMilkModal={() => setIsAddMilkModalOpen(true)}
              onOpenAddIncomeModal={() => {
                setTransactionAddType('income');
                setIsAddTransactionModalOpen(true);
              }}
              onOpenAddExpenseModal={() => {
                setTransactionAddType('expense');
                setIsAddTransactionModalOpen(true);
              }}
              onOpenQRScannerModal={() => setIsQRScannerOpen(true)}
            />
          )}

          {activeTab === 'animals' && (
            <AnimalsView 
              animals={animals}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenQRModal={(animal) => setSelectedAnimalForQR(animal)}
              onOpenEditModal={(animal) => setSelectedAnimalForEdit(animal)}
              onDeleteAnimal={handleDeleteAnimal}
              tempUnit={tempUnit}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'dairy' && (
            <DairyManagementView 
              animals={animals}
              milkRecords={milkRecords}
              onRegisterAnimal={handleRegisterAnimal}
              onUpdateAnimal={handleUpdateAnimal}
              onDeleteAnimal={handleDeleteAnimal}
              onAddMilkRecord={handleAddMilkRecord}
              onOpenQRModal={(animal) => setSelectedAnimalForQR(animal)}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
            />
          )}

          {activeTab === 'milk' && (
            <MilkProductionView 
              animals={animals}
              milkRecords={milkRecords}
              milkStats={milkStats}
              onAddMilkRecord={handleAddMilkRecord}
              onUpdateMilkRecord={handleUpdateMilkRecord}
              onDeleteMilkRecord={handleDeleteMilkRecord}
            />
          )}

          {activeTab === 'finances' && (
            <FinancialManagementView 
              animals={animals}
              transactions={transactions}
              financialSummary={financialSummary}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'reports' && (
            <ProfitLossReportView 
              animals={animals}
              financialSummary={financialSummary}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
            />
          )}

          {activeTab === 'qr' && (
            <QRCodeManagementView 
              animals={animals}
              onOpenPublicView={handleOpenPublicView}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
            />
          )}

          {activeTab === 'devices' && (
            <DeviceManagementView 
              devices={devices}
              animals={animals}
              onAssignDevice={handleAssignDevice}
              onRegisterDevice={handleRegisterDevice}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'monitoring' && (
            <LiveMonitoringView 
              devices={devices}
              animals={animals}
              realRecords={realRecords}
              tempUnit={tempUnit}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView 
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
              animals={animals}
            />
          )}

          {activeTab === 'history' && (
            <HealthHistoryView 
              animals={animals}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              tempUnit={tempUnit}
              setTempUnit={setTempUnit}
              onResetDemoData={handleResetDemoData}
              onRefresh={refreshData}
              animals={animals}
              devices={devices}
            />
          )}
        </main>
      </div>

      {/* Animal Dossier Detail Modal */}
      {selectedAnimal && (
        <AnimalDetailModal 
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
          tempUnit={tempUnit}
          onOpenPublicView={handleOpenPublicView}
          onOpenEditModal={(animal) => {
            setSelectedAnimal(null);
            setSelectedAnimalForEdit(animal);
          }}
        />
      )}

      {/* Standalone Permanent QR Badge Modal */}
      {selectedAnimalForQR && (
        <div className="modal-backdrop" onClick={() => setSelectedAnimalForQR(null)}>
          <div className="modal-card" style={{ maxWidth: '440px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <QRCodeLabel 
              animal={selectedAnimalForQR} 
              onOpenPublicView={handleOpenPublicView}
            />
            <button 
              type="button"
              className="btn-close-modal" 
              style={{ marginTop: '16px', width: '100%' }}
              onClick={() => setSelectedAnimalForQR(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Edit Animal Modal */}
      {selectedAnimalForEdit && (
        <EditAnimalModal 
          animal={selectedAnimalForEdit}
          onClose={() => setSelectedAnimalForEdit(null)}
          onSave={handleUpdateAnimal}
        />
      )}

      {/* Register New Animal Modal */}
      {isAddModalOpen && (
        <AddAnimalModal 
          onClose={() => setIsAddModalOpen(false)}
          onAddAnimal={handleRegisterAnimal}
        />
      )}

      {/* Add Milk Record Modal */}
      {isAddMilkModalOpen && (
        <AddMilkRecordModal 
          animals={animals}
          existingRecords={milkRecords}
          onClose={() => setIsAddMilkModalOpen(false)}
          onSave={handleAddMilkRecord}
        />
      )}

      {/* Add Transaction Modal */}
      {isAddTransactionModalOpen && (
        <AddTransactionModal 
          animals={animals}
          defaultType={transactionAddType}
          onClose={() => setIsAddTransactionModalOpen(false)}
          onSave={handleAddTransaction}
        />
      )}

      {/* Camera QR Scanner Modal */}
      {isQRScannerOpen && (
        <QRScannerModal 
          animals={animals}
          onClose={() => setIsQRScannerOpen(false)}
          onSelectAnimal={(animalId) => {
            setIsQRScannerOpen(false);
            handleOpenPublicView(animalId);
          }}
        />
      )}

      {/* College Project Presentation Guide Modal */}
      {isInfoModalOpen && (
        <ProjectInfoModal 
          onClose={() => setIsInfoModalOpen(false)}
        />
      )}
    </div>
  );
}