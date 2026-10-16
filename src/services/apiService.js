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
