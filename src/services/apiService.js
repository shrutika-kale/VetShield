// VetShield Frontend API Service
// Connects to local or remote Ingestion Gateway & real-time telemetry feed

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiService = {
  // Get system overview and live hardware connection status
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[VetShield API] Could not connect to gateway backend:', err.message);
      return null;
    }
  },

  // Get all registered animals with current sensor states
  async getAnimals() {
    try {
      const res = await fetch(`${API_BASE_URL}/animals`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[VetShield API] Error fetching animals:', err.message);
      return [];
    }
  },

  // Get public animal profile (for QR code scanning on mobile)
  async getPublicAnimalProfile(animalId) {
    const res = await fetch(`${API_BASE_URL}/animals/${animalId}/public`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Animal ${animalId} not found`);
    }
    return await res.json();
  },

  // Register a new animal (assigns permanent VSxxxx ID)
  async registerAnimal(animalData) {
    const res = await fetch(`${API_BASE_URL}/animals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(animalData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register animal');
    }
    return await res.json();
  },

  // Update existing animal profile
  async updateAnimal(animalId, updateData) {
    const res = await fetch(`${API_BASE_URL}/animals/${animalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update animal');
    }
    return await res.json();
  },

  // Delete an animal (Destructive action with confirmation)
  async deleteAnimal(animalId) {
    const res = await fetch(`${API_BASE_URL}/animals/${animalId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete animal');
    }
    return await res.json();
  },

  // ---------------------------------------------------------------------------
  // MILK PRODUCTION ENDPOINTS
  // ---------------------------------------------------------------------------

  async getMilkRecords(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.animalId) params.append('animalId', filters.animalId);
      if (filters.species) params.append('species', filters.species);
      if (filters.date) params.append('date', filters.date);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${API_BASE_URL}/milk${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[VetShield API] Error fetching milk records:', err.message);
      return [];
    }
  },

  async getMilkStats(targetDate = null) {
    try {
      const url = targetDate 
        ? `${API_BASE_URL}/milk/stats?targetDate=${encodeURIComponent(targetDate)}`
        : `${API_BASE_URL}/milk/stats`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[VetShield API] Error fetching milk stats:', err.message);
      return null;
    }
  },

  async addMilkRecord(milkData) {
    const res = await fetch(`${API_BASE_URL}/milk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milkData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record milk production');
    }
    return await res.json();
  },

  async updateMilkRecord(recordId, milkData) {
    const res = await fetch(`${API_BASE_URL}/milk/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milkData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update milk record');
    }
    return await res.json();
  },

  async deleteMilkRecord(recordId) {
    const res = await fetch(`${API_BASE_URL}/milk/${recordId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete milk record');
    }
    return await res.json();
  },

  // ---------------------------------------------------------------------------
  // FINANCIAL MANAGEMENT ENDPOINTS
  // ---------------------------------------------------------------------------

  async getTransactions(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.animalId) params.append('animalId', filters.animalId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${API_BASE_URL}/finances/transactions${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[VetShield API] Error fetching transactions:', err.message);
      return [];
    }
  },

  async getFinancialSummary(targetDate = null) {
    try {
      const url = targetDate 
        ? `${API_BASE_URL}/finances/summary?targetDate=${encodeURIComponent(targetDate)}`
        : `${API_BASE_URL}/finances/summary`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[VetShield API] Error fetching financial summary:', err.message);
      return null;
    }
  },

  async addTransaction(transactionData) {
    const res = await fetch(`${API_BASE_URL}/finances/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add transaction');
    }
    return await res.json();
  },

  async updateTransaction(transactionId, updateData) {
    const res = await fetch(`${API_BASE_URL}/finances/transactions/${transactionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update transaction');
    }
    return await res.json();
  },

  async deleteTransaction(transactionId) {
    const res = await fetch(`${API_BASE_URL}/finances/transactions/${transactionId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete transaction');
    }
    return await res.json();
  },

  // ---------------------------------------------------------------------------
  // HARDWARE TELEMETRY & DEVICE MANAGEMENT
  // ---------------------------------------------------------------------------

  // Assign or unassign an ESP32 hardware device to an animal
  async assignDeviceToAnimal(deviceId, animalId) {
    const res = await fetch(`${API_BASE_URL}/devices/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, animalId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to assign device');
    }
    return await res.json();
  },

  // Register a new ESP32 device
  async registerDevice(deviceData) {
    const res = await fetch(`${API_BASE_URL}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register device');
    }
    return await res.json();
  },

  // Fetch verified real sensor telemetry history for charts
  async getTelemetryHistory(animalId = null, deviceId = null, limit = 50) {
    try {
      let url = `${API_BASE_URL}/telemetry/history?limit=${limit}`;
      if (animalId) url += `&animalId=${animalId}`;
      if (deviceId) url += `&deviceId=${deviceId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[VetShield API] Error fetching history:', err.message);
      return { totalCount: 0, records: [] };
    }
  },

  // Resolve alert
  async resolveAlert(alertId, status = 'Resolved') {
    const res = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await res.json();
  },

  // Isolated Test Utility: Submit synthetic test payload (Clearly marked as TEST)
  async submitTestTelemetry(testPayload) {
    const res = await fetch(`${API_BASE_URL}/test-telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    return await res.json();
  }
};