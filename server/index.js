// VetShield Ingestion Gateway & Real-Time Device Controller
// Backend for receiving, authenticating, and storing real ESP32 telemetry.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Persistent local storage file for demo/competition reliability
const DB_FILE = path.join(__dirname, 'telemetry_db.json');

// Default initial state
const defaultState = {
  settings: {
    heartbeatTimeoutSeconds: 45, // Consider stale if no reading within 45s
    staleTimeoutSeconds: 90,     // Consider disconnected if > 90s
    temperatureUnit: 'C'
  },
  devices: [
    {
      deviceId: "ESP32-VET-01",
      name: "Primary Livestock Collar #1",
      assignedAnimalId: "VS0001",
      apiKey: "vetshield_sec_esp32_k8912x",
      sensorModel: "DS18B20 1-Wire Digital Probe",
      status: "Disconnected", // 'Connected' | 'No recent data' | 'Disconnected'
      lastReading: null,
      lastSeen: null,
      createdAt: new Date().toISOString()
    }
  ],
  animals: [
    {
      id: "VS0001",
      name: "Bella",
      species: "Cattle",
      breed: "Holstein Friesian",
      gender: "Female",
      dob: "2023-04-12",
      age: "3.5 yrs",
      weight: "620 kg",
      penLocation: "Barn A - Stall 04",
      assignedDeviceId: "ESP32-VET-01",
      owner: {
        name: "Campus Research Dairy Farm",
        contactPerson: "Dr. A. Sharma (Lead Vet)",
        phone: "+91 98765 43210",
        email: "vet.dairy@college.edu"
      },
      registeredAt: "2026-09-01T10:00:00.000Z",
      publicNotes: "High-yield dairy cow. Active surveillance protocol.",
      privateMedicalHistory: [
        { date: "2026-09-18", event: "FMD Booster Vaccine", clinician: "Dr. R. Patel", status: "Administered" },
        { date: "2026-10-10", event: "Routine Health Checkup", clinician: "Dr. A. Sharma", status: "Optimal" }
      ]
    },
    {
      id: "VS0002",
      name: "Oliver",
      species: "Sheep",
      breed: "Merino Wool",
      gender: "Male",
      dob: "2024-06-20",
      age: "2.3 yrs",
      weight: "74 kg",
      penLocation: "Pasture B - Pen 02",
      assignedDeviceId: null,
      owner: {
        name: "Agronomy Department",
        contactPerson: "Prof. S. Nair",
        phone: "+91 98123 45678",
        email: "agri.flock@college.edu"
      },
      registeredAt: "2026-09-15T14:30:00.000Z",
      publicNotes: "Registered flock breeder. Fleece shearing scheduled.",
      privateMedicalHistory: [
        { date: "2026-09-12", event: "Clostridial 8-in-1 Vaccine", clinician: "Dr. R. Patel", status: "Completed" }
      ]
    },
    {
      id: "VS0003",
      name: "Willow",
      species: "Goat",
      breed: "Boer Meat Goat",
      gender: "Female",
      dob: "2024-11-05",
      age: "1.9 yrs",
      weight: "58 kg",
      penLocation: "Barn C - Pen 08",
      assignedDeviceId: null,
      owner: {
        name: "Animal Husbandry Unit",
        contactPerson: "Dr. A. Sharma",
        phone: "+91 98765 43210",
        email: "vet.dairy@college.edu"
      },
      registeredAt: "2026-10-01T09:15:00.000Z",
      publicNotes: "Nutritional trial herd. Monitored for heat tolerance.",
      privateMedicalHistory: [
        { date: "2026-10-05", event: "Internal Parasite Screening", clinician: "Dr. A. Sharma", status: "Clear" }
      ]
    }
  ],
  telemetryRecords: [], // ONLY real sensor readings from ESP32
  testTelemetryRecords: [], // Clearly isolated test submissions
  alerts: []
};

// Load or initialize DB
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[VetShield DB] Error reading database file:', err);
  }
  saveDb(defaultState);
  return defaultState;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[VetShield DB] Error writing to database file:', err);
  }
}

// Helper: Calculate connection status based on timestamps
function calculateConnectionStatus(lastSeenIso, heartbeatSec = 45, staleSec = 90) {
  if (!lastSeenIso) return 'Disconnected';
  const lastSeenMs = new Date(lastSeenIso).getTime();
  const elapsedSec = (Date.now() - lastSeenMs) / 1000;

  if (elapsedSec <= heartbeatSec) {
    return 'Connected';
  } else if (elapsedSec <= staleSec) {
    return 'No recent data';
  } else {
    return 'Disconnected';
  }
}

// ---------------------------------------------------------------------------
// 1. INGESTION ENDPOINT FOR ESP32 (AUTHENTICATED)
// ---------------------------------------------------------------------------
app.post('/api/telemetry', (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const { deviceId, temperature, unit = 'C', battery, rssi, firmwareVersion } = req.body;

  if (!deviceId || temperature === undefined) {
    return res.status(400).json({ 
      error: 'Invalid payload: deviceId and numeric temperature are required.' 
    });
  }

  const db = loadDb();
  const device = db.devices.find(d => d.deviceId === deviceId);

  // Authenticate device
  if (!device) {
    console.warn(`[INGESTION REJECTED] Unknown device ID: ${deviceId}`);
    return res.status(401).json({ error: 'Unauthorized: Device is not registered in VetShield.' });
  }

  if (device.apiKey && device.apiKey !== apiKey) {
    console.warn(`[INGESTION REJECTED] Invalid API key for device: ${deviceId}`);
    return res.status(403).json({ error: 'Forbidden: Invalid device API key.' });
  }

  // Sensor Validation: Filter out DS18B20 error readings (-127°C disconnected, 85°C boot error)
  const tempVal = parseFloat(temperature);
  if (isNaN(tempVal)) {
    return res.status(422).json({ error: 'Temperature must be a valid float value.' });
  }

  if (tempVal <= -100 || tempVal === 85.0) {
    console.warn(`[SENSOR ERROR REPORTED] Device ${deviceId} reported invalid DS18B20 probe reading: ${tempVal}°C`);
    return res.status(422).json({ 
      error: 'Hardware sensor fault: -127°C indicates disconnected probe wire, 85°C indicates power-on glitch. Reading rejected.' 
    });
  }

  if (tempVal < 15.0 || tempVal > 55.0) {
    return res.status(422).json({ 
      error: `Physiological sanity check failed: ${tempVal}°C is outside biological bounds.` 
    });
  }

  const serverTimestamp = new Date().toISOString();
  const assignedAnimal = db.animals.find(a => a.id === device.assignedAnimalId);

  const newRecord = {
    id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    deviceId,
    animalId: device.assignedAnimalId || null,
    animalName: assignedAnimal ? assignedAnimal.name : "Unassigned",
    species: assignedAnimal ? assignedAnimal.species : "Unknown",
    temperature: parseFloat(tempVal.toFixed(2)),
    unit: unit.toUpperCase(),
    battery: battery !== undefined ? parseInt(battery) : null,
    rssi: rssi !== undefined ? parseInt(rssi) : null,
    firmwareVersion: firmwareVersion || "1.0.0",
    isRealHardware: true,
    serverTimestamp,
    clientReportedAt: req.body.timestamp || serverTimestamp
  };

  // Check for physiological temperature anomalies (Veterinary Alert)
  let triggeredAlert = null;
  if (assignedAnimal) {
    // Normal veterinary thresholds
    const maxThreshold = assignedAnimal.species === 'Goat' ? 40.0 :
                         assignedAnimal.species === 'Cattle' ? 39.3 :
                         assignedAnimal.species === 'Sheep' ? 39.8 : 39.2;

    if (tempVal > maxThreshold) {
      triggeredAlert = {
        id: `ALT-${Date.now()}`,
        animalId: assignedAnimal.id,
        animalName: assignedAnimal.name,
        species: assignedAnimal.species,
        deviceId,
        type: "Hyperthermia Threshold Alert",
        reading: `${tempVal.toFixed(1)}°${unit}`,
        threshold: `Safe Max: ${maxThreshold}°C`,
        severity: tempVal > maxThreshold + 1.0 ? "Critical" : "Warning",
        timestamp: serverTimestamp,
        status: "Active",
        advisory: "VETERINARY REVIEW WARNING: Elevated temperature recorded by physical sensor. Does not constitute a clinical disease diagnosis. Prompt physical triage and veterinary examination recommended."
      };
      db.alerts.unshift(triggeredAlert);
    }
  }

  // Update device status and store reading
  device.lastReading = newRecord;
  device.lastSeen = serverTimestamp;
  device.status = 'Connected';

  db.telemetryRecords.unshift(newRecord);
  // Keep last 1,000 real sensor records
  if (db.telemetryRecords.length > 1000) {
    db.telemetryRecords.pop();
  }

  saveDb(db);

  console.log(`[REAL SENSOR RECEIVED] Device: ${deviceId} | Animal: ${device.assignedAnimalId} | Temp: ${tempVal}°${unit} | RSSI: ${rssi || 'N/A'}`);

  return res.status(200).json({
    success: true,
    message: 'Telemetry reading validated and recorded.',
    recordId: newRecord.id,
    serverTimestamp,
    alertTriggered: triggeredAlert !== null
  });
});

// ---------------------------------------------------------------------------
// 2. ISOLATED TEST UTILITY ENDPOINT (Disabled by default, clearly tagged)
// ---------------------------------------------------------------------------
app.post('/api/test-telemetry', (req, res) => {
  const { deviceId, temperature, unit = 'C', simulateError } = req.body;
  const db = loadDb();

  if (simulateError) {
    return res.status(400).json({ error: 'Simulated hardware fault: No sensor wire detected.' });
  }

  const serverTimestamp = new Date().toISOString();
  const testRecord = {
    id: `TEST-${Date.now()}`,
    deviceId: deviceId || "TEST-BENCH-01",
    animalId: req.body.animalId || "VS0001",
    animalName: "Bella (TEST SUBMISSION)",
    species: "Cattle",
    temperature: parseFloat(parseFloat(temperature || 38.6).toFixed(2)),
    unit: unit.toUpperCase(),
    battery: 100,
    rssi: -55,
    isRealHardware: false, // EXPLICITLY LABELED AS TEST DATA
    isTestUtilityData: true,
    serverTimestamp
  };

  db.testTelemetryRecords.unshift(testRecord);
  saveDb(db);

  return res.status(200).json({
    success: true,
    warning: "THIS IS TEST DATA ONLY. It has been placed in an isolated test table.",
    testRecord
  });
});

// ---------------------------------------------------------------------------
// 3. FRONTEND REST API & REAL-TIME STATUS
// ---------------------------------------------------------------------------

// Get current system overview with calculated real-time connection status
app.get('/api/status', (req, res) => {
  const db = loadDb();
  const hb = db.settings.heartbeatTimeoutSeconds;
  const stale = db.settings.staleTimeoutSeconds;

  // Compute dynamic connection status for all devices
  const devices = db.devices.map(dev => ({
    ...dev,
    status: calculateConnectionStatus(dev.lastSeen, hb, stale)
  }));

  const connectedCount = devices.filter(d => d.status === 'Connected').length;
  const noRecentCount = devices.filter(d => d.status === 'No recent data').length;
  const disconnectedCount = devices.filter(d => d.status === 'Disconnected').length;

  res.json({
    system: "VetShield IoT Gateway",
    version: "2.0.0-hardware-enabled",
    serverTime: new Date().toISOString(),
    settings: db.settings,
    counts: {
      totalAnimals: db.animals.length,
      totalDevices: devices.length,
      connectedSensors: connectedCount,
      noRecentDataSensors: noRecentCount,
      disconnectedSensors: disconnectedCount,
      activeAlerts: db.alerts.filter(a => a.status === 'Active').length,
      realReadingsRecorded: db.telemetryRecords.length
    },
    devices,
    latestReadings: db.telemetryRecords.slice(0, 20),
    alerts: db.alerts
  });
});

// Animals list
app.get('/api/animals', (req, res) => {
  const db = loadDb();
  const hb = db.settings.heartbeatTimeoutSeconds;
  const stale = db.settings.staleTimeoutSeconds;

  // Enrich animal records with current physical sensor state
  const enrichedAnimals = db.animals.map(animal => {
    const assignedDev = db.devices.find(d => d.deviceId === animal.assignedDeviceId);
    let sensorState = "No Hardware Assigned";
    let latestRealReading = null;

    if (assignedDev) {
      sensorState = calculateConnectionStatus(assignedDev.lastSeen, hb, stale);
      latestRealReading = assignedDev.lastReading;
    }

    return {
      ...animal,
      assignedDevice: assignedDev ? {
        deviceId: assignedDev.deviceId,
        sensorModel: assignedDev.sensorModel,
        status: sensorState,
        lastSeen: assignedDev.lastSeen
      } : null,
      latestSensorReading: latestRealReading
    };
  });

  res.json(enrichedAnimals);
});

// Single Animal Public Profile for QR Code Scanning (Mobile-Friendly & Sanitized)
app.get('/api/animals/:id/public', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const animal = db.animals.find(a => a.id.toUpperCase() === id.toUpperCase());

  if (!animal) {
    return res.status(404).json({ 
      error: `Animal profile ${id} was not found. Please contact campus veterinary administration.` 
    });
  }

  const assignedDev = db.devices.find(d => d.deviceId === animal.assignedDeviceId);
  let sensorState = "No Hardware Assigned";
  let latestRealReading = null;

  if (assignedDev) {
    sensorState = calculateConnectionStatus(
      assignedDev.lastSeen, 
      db.settings.heartbeatTimeoutSeconds, 
      db.settings.staleTimeoutSeconds
    );
    latestRealReading = assignedDev.lastReading;
  }

  // PUBLIC VIEW: Deliberately omit sensitive owner phone/address and private medical invoices
  const sanitizedPublicProfile = {
    id: animal.id,
    name: animal.name,
    species: animal.species,
    breed: animal.breed,
    gender: animal.gender,
    age: animal.age,
    dob: animal.dob,
    penLocation: animal.penLocation,
    registeredAt: animal.registeredAt,
    publicNotes: animal.publicNotes,
    organization: animal.owner ? animal.owner.name : "College Research Farm",
    // Current sensor data ONLY if real reading exists
    sensorData: latestRealReading ? {
      temperature: latestRealReading.temperature,
      unit: latestRealReading.unit,
      recordedAt: latestRealReading.serverTimestamp,
      sensorStatus: sensorState,
      deviceId: latestRealReading.deviceId
    } : {
      statusMessage: "Waiting for real sensor data",
      sensorStatus: sensorState
    },
    // Safe veterinary normal range for reference
    normalReferenceRange: {
      min: 38.0,
      max: animal.species === 'Goat' ? 40.0 : animal.species === 'Cattle' ? 39.3 : 39.5,
      unit: '°C'
    }
  };

  res.json(sanitizedPublicProfile);
});

// Register a new animal
app.post('/api/animals', (req, res) => {
  const db = loadDb();
  const { name, species, breed, gender, age, dob, weight, penLocation, publicNotes, owner } = req.body;

  if (!name || !species) {
    return res.status(400).json({ error: 'Name and species are required.' });
  }

  // Generate permanent format: VS0001, VS0002, etc.
  const count = db.animals.length + 1;
  const newId = `VS${count.toString().padStart(4, '0')}`;

  const newAnimal = {
    id: newId,
    name,
    species,
    breed: breed || "Unspecified",
    gender: gender || "Female",
    age: age || "1.0 yr",
    dob: dob || new Date().toISOString().split('T')[0],
    weight: weight || "N/A",
    penLocation: penLocation || "Unassigned Pen",
    assignedDeviceId: null,
    owner: owner || {
      name: "College Farm Unit",
      contactPerson: "Farm Attendant",
      phone: "+91 90000 00000",
      email: "vet.unit@college.edu"
    },
    registeredAt: new Date().toISOString(),
    publicNotes: publicNotes || "Routine veterinary surveillance record.",
    privateMedicalHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        event: "Permanent Electronic Registration & QR Code Generation",
        clinician: "Intake Registry",
        status: "Active"
      }
    ]
  };

  db.animals.push(newAnimal);
  saveDb(db);

  res.status(201).json({ success: true, animal: newAnimal });
});

// Update animal
app.put('/api/animals/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const idx = db.animals.findIndex(a => a.id.toUpperCase() === id.toUpperCase());

  if (idx === -1) {
    return res.status(404).json({ error: 'Animal not found.' });
  }

  // Permanent ID must never be changed
  const updatedAnimal = {
    ...db.animals[idx],
    ...req.body,
    id: db.animals[idx].id
  };

  db.animals[idx] = updatedAnimal;
  saveDb(db);

  res.json({ success: true, animal: updatedAnimal });
});

// Device management: Link ESP32 to an Animal
app.post('/api/devices/assign', (req, res) => {
  const { deviceId, animalId } = req.body;
  const db = loadDb();

  const device = db.devices.find(d => d.deviceId === deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device ID not found.' });
  }

  if (animalId) {
    const animal = db.animals.find(a => a.id === animalId);
    if (!animal) {
      return res.status(404).json({ error: 'Target Animal ID not found.' });
    }

    // Unassign this device from other animals
    db.animals.forEach(a => {
      if (a.assignedDeviceId === deviceId) a.assignedDeviceId = null;
    });

    animal.assignedDeviceId = deviceId;
    device.assignedAnimalId = animalId;
  } else {
    // Unassign
    db.animals.forEach(a => {
      if (a.assignedDeviceId === deviceId) a.assignedDeviceId = null;
    });
    device.assignedAnimalId = null;
  }

  saveDb(db);
  res.json({ success: true, device, assignedAnimalId: device.assignedAnimalId });
});

// Add a new device
app.post('/api/devices', (req, res) => {
  const { deviceId, name, sensorModel, assignedAnimalId } = req.body;
  const db = loadDb();

  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID is required (e.g. ESP32-VET-02).' });
  }

  if (db.devices.find(d => d.deviceId.toUpperCase() === deviceId.toUpperCase())) {
    return res.status(409).json({ error: 'Device ID already exists.' });
  }

  const newDevice = {
    deviceId: deviceId.trim().toUpperCase(),
    name: name || `ESP32 Sensor (${deviceId})`,
    assignedAnimalId: assignedAnimalId || null,
    apiKey: `vetshield_sec_${Math.random().toString(36).substring(2, 10)}`,
    sensorModel: sensorModel || "DS18B20 1-Wire Digital Probe",
    status: "Disconnected",
    lastReading: null,
    lastSeen: null,
    createdAt: new Date().toISOString()
  };

  db.devices.push(newDevice);

  if (assignedAnimalId) {
    const animal = db.animals.find(a => a.id === assignedAnimalId);
    if (animal) animal.assignedDeviceId = newDevice.deviceId;
  }

  saveDb(db);
  res.status(201).json({ success: true, device: newDevice });
});

// Telemetry history for charts (Exclusively REAL sensor readings)
app.get('/api/telemetry/history', (req, res) => {
  const { animalId, deviceId, limit = 50 } = req.query;
  const db = loadDb();

  let records = db.telemetryRecords;

  if (animalId) {
    records = records.filter(r => r.animalId === animalId);
  }
  if (deviceId) {
    records = records.filter(r => r.deviceId === deviceId);
  }

  // Sort chronological ascending for chart display
  const sorted = [...records].slice(0, parseInt(limit)).reverse();

  res.json({
    totalCount: records.length,
    records: sorted
  });
});

// Acknowledge or Resolve Alert
app.patch('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = loadDb();

  const alert = db.alerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found.' });
  }

  alert.status = status || 'Resolved';
  alert.resolvedAt = new Date().toISOString();
  saveDb(db);

  res.json({ success: true, alert });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` VetShield IoT Ingestion Gateway Running on Port ${PORT}`);
  console.log(` Ingestion URL: http://<YOUR_LOCAL_IP>:${PORT}/api/telemetry`);
  console.log(` Device Key Authentication: X-API-KEY header required`);
  console.log(` Sensor Supported: DS18B20 (OneWire digital probe)`);
  console.log(`=======================================================`);
});
