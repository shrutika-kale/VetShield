import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { apiService } from './services/apiService';
import { SPECIES_TEMP_BENCHMARKS } from './data/mockData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AnimalDetailModal from './components/AnimalDetailModal';
import AddAnimalModal from './components/AddAnimalModal';
import EditAnimalModal from './components/EditAnimalModal';
import ProjectInfoModal from './components/ProjectInfoModal';
import QRCodeLabel from './components/QRCodeLabel';

import DashboardView from './views/DashboardView';
import AnimalsView from './views/AnimalsView';
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

  // Modals
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedAnimalForQR, setSelectedAnimalForQR] = useState(null);
  const [selectedAnimalForEdit, setSelectedAnimalForEdit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Backend Synchronized States
  const [systemStatus, setSystemStatus] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [realRecords, setRealRecords] = useState([]);
  const [benchmarks] = useState(SPECIES_TEMP_BENCHMARKS);

  // Primary data loader from Ingestion Gateway
  const refreshData = useCallback(async () => {
    try {
      const [statusData, animalsData, historyData] = await Promise.all([
        apiService.getStatus(),
        apiService.getAnimals(),
        apiService.getTelemetryHistory(null, null, 30)
      ]);

      if (statusData) {
        setSystemStatus(statusData);
        setDevices(statusData.devices || []);
        setAlerts(statusData.alerts || []);
      }

      if (animalsData) {
        setAnimals(animalsData);
      }

      if (historyData && historyData.records) {
        setRealRecords(historyData.records);
      }
    } catch (err) {
      console.warn('[VetShield] Error polling backend gateway:', err);
    }
  }, []);

  // Real-time Gateway Polling (every 3.5s to pick up live ESP32 transmissions instantly)
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

  // Handle URL change for phone QR scans
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
        // Automatically prompt QR badge for newly registered animal
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
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}

          {activeTab === 'animals' && (
            <AnimalsView 
              animals={animals}
              onSelectAnimal={(animal) => setSelectedAnimal(animal)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenQRModal={(animal) => setSelectedAnimalForQR(animal)}
              onOpenEditModal={(animal) => setSelectedAnimalForEdit(animal)}
              tempUnit={tempUnit}
              searchQuery={searchQuery}
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

      {/* College Project Presentation Guide Modal */}
      {isInfoModalOpen && (
        <ProjectInfoModal 
          onClose={() => setIsInfoModalOpen(false)}
        />
      )}
    </div>
  );
}
