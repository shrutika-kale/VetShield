// VetShield Ingestion Gateway & Dairy Farm Financial Management Controller
// Backend for receiving ESP32 telemetry, animal records, milk production tracking, and financial analytics.

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
      status: "Disconnected",
      lastReading: null,
      lastSeen: null,
      createdAt: new Date().toISOString()
    }
  ],
  animals: [
    {
      id: "VS0001",
      name: "Bella",
      species: "Cow",
      breed: "Holstein Friesian",
      gender: "Female",
      dob: "2023-04-12",
      age: "3.5 yrs",
      weight: "620 kg",
      penLocation: "Barn A - Stall 04",
      assignedDeviceId: "ESP32-VET-01",
      healthStatus: "Healthy",
      milkProductionStatus: "In Milk",
      purchaseDate: "2023-11-20",
      purchaseCost: 60000,
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
    }
  ],
  milkRecords: [],
  transactions: [],
  telemetryRecords: [], // ONLY real sensor readings from ESP32
  testTelemetryRecords: [], // Clearly isolated test submissions
  alerts: []
};

// Load or initialize DB with schema guards
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (!parsed.animals) parsed.animals = [];
      if (!parsed.devices) parsed.devices = [];
      if (!parsed.milkRecords) parsed.milkRecords = [];
      if (!parsed.transactions) parsed.transactions = [];
      if (!parsed.telemetryRecords) parsed.telemetryRecords = [];
      if (!parsed.testTelemetryRecords) parsed.testTelemetryRecords = [];
      if (!parsed.alerts) parsed.alerts = [];
      if (!parsed.settings) parsed.settings = defaultState.settings;
      return parsed;
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
    const maxThreshold = assignedAnimal.species === 'Goat' ? 40.0 :
                         (assignedAnimal.species === 'Cattle' || assignedAnimal.species === 'Cow' || assignedAnimal.species === 'Buffalo') ? 39.3 :
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
  if (db.telemetryRecords.length > 1000) {
    db.telemetryRecords.pop();
  }

  saveDb(db);

  console.log(`[REAL SENSOR RECEIVED] Device: ${deviceId} | Animal: ${device.assignedAnimalId} | Temp: ${tempVal}°${unit}`);

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
    species: "Cow",
    temperature: parseFloat(parseFloat(temperature || 38.6).toFixed(2)),
    unit: unit.toUpperCase(),
    battery: 100,
    rssi: -55,
    isRealHardware: false,
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

  const devices = db.devices.map(dev => ({
    ...dev,
    status: calculateConnectionStatus(dev.lastSeen, hb, stale)
  }));

  const connectedCount = devices.filter(d => d.status === 'Connected').length;
  const noRecentCount = devices.filter(d => d.status === 'No recent data').length;
  const disconnectedCount = devices.filter(d => d.status === 'Disconnected').length;

  // Dairy stats for quick overview
  const cowsCount = db.animals.filter(a => a.species === 'Cow' || a.species === 'Cattle').length;
  const buffaloCount = db.animals.filter(a => a.species === 'Buffalo').length;

  res.json({
    system: "VetShield IoT Gateway & Dairy Management System",
    version: "2.5.0-dairy-enabled",
    serverTime: new Date().toISOString(),
    settings: db.settings,
    counts: {
      totalAnimals: db.animals.length,
      totalCows: cowsCount,
      totalBuffaloes: buffaloCount,
      totalDevices: devices.length,
      connectedSensors: connectedCount,
      noRecentDataSensors: noRecentCount,
      disconnectedSensors: disconnectedCount,
      activeAlerts: db.alerts.filter(a => a.status === 'Active').length,
      realReadingsRecorded: db.telemetryRecords.length,
      totalMilkRecords: db.milkRecords.length,
      totalTransactions: db.transactions.length
    },
    devices,
    latestReadings: db.telemetryRecords.slice(0, 20),
    alerts: db.alerts
  });
});

// Animals list (enriched with sensor state and dairy details)
app.get('/api/animals', (req, res) => {
  const db = loadDb();
  const hb = db.settings.heartbeatTimeoutSeconds;
  const stale = db.settings.staleTimeoutSeconds;
  const todayStr = new Date().toISOString().split('T')[0];

  const enrichedAnimals = db.animals.map(animal => {
    const assignedDev = db.devices.find(d => d.deviceId === animal.assignedDeviceId);
    let sensorState = "No Hardware Assigned";
    let latestRealReading = null;

    if (assignedDev) {
      sensorState = calculateConnectionStatus(assignedDev.lastSeen, hb, stale);
      latestRealReading = assignedDev.lastReading;
    }

    // Find today's milk record if any
    const todayMilk = db.milkRecords.find(m => m.animalId === animal.id && m.date === todayStr);

    return {
      ...animal,
      healthStatus: animal.healthStatus || 'Healthy',
      milkProductionStatus: animal.milkProductionStatus || (animal.species === 'Cow' || animal.species === 'Buffalo' || animal.species === 'Cattle' ? 'In Milk' : 'Not Applicable'),
      purchaseDate: animal.purchaseDate || null,
      purchaseCost: animal.purchaseCost !== undefined ? animal.purchaseCost : null,
      assignedDevice: assignedDev ? {
        deviceId: assignedDev.deviceId,
        sensorModel: assignedDev.sensorModel,
        status: sensorState,
        lastSeen: assignedDev.lastSeen
      } : null,
      latestSensorReading: latestRealReading,
      todayMilkProduction: todayMilk ? {
        totalLiters: todayMilk.totalLiters,
        morningLiters: todayMilk.morningLiters,
        afternoonLiters: todayMilk.afternoonLiters,
        eveningLiters: todayMilk.eveningLiters,
        soldLiters: todayMilk.soldLiters,
        unsoldLiters: todayMilk.unsoldLiters,
        pricePerLiter: todayMilk.pricePerLiter,
        totalIncome: todayMilk.totalIncome
      } : null
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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMilk = db.milkRecords.find(m => m.animalId === animal.id && m.date === todayStr);

  // Recent 7-day milk history (only public quantities, no private financials)
  const recentMilk = db.milkRecords
    .filter(m => m.animalId === animal.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .map(m => ({
      date: m.date,
      morningLiters: m.morningLiters,
      afternoonLiters: m.afternoonLiters,
      eveningLiters: m.eveningLiters,
      totalLiters: m.totalLiters
    }));

  // PUBLIC VIEW: Omit sensitive financials, purchase prices, private phone/email
  const sanitizedPublicProfile = {
    id: animal.id,
    name: animal.name,
    species: animal.species,
    breed: animal.breed,
    gender: animal.gender,
    age: animal.age,
    dob: animal.dob,
    weight: animal.weight,
    penLocation: animal.penLocation,
    registeredAt: animal.registeredAt,
    publicNotes: animal.publicNotes,
    healthStatus: animal.healthStatus || 'Healthy',
    milkProductionStatus: animal.milkProductionStatus || 'N/A',
    organization: animal.owner ? animal.owner.name : "College Research Farm",
    // Public milk yield verification
    todayMilkYield: todayMilk ? {
      totalLiters: todayMilk.totalLiters,
      morningLiters: todayMilk.morningLiters,
      eveningLiters: todayMilk.eveningLiters,
      recordedAt: todayMilk.createdAt
    } : null,
    recentMilkHistory: recentMilk,
    // Real sensor telemetry only if verified reading exists
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
      max: (animal.species === 'Goat') ? 40.0 : 39.3,
      unit: '°C'
    },
    // Sanitized medical interventions (only procedures, no commercial invoices)
    clinicalProcedures: (animal.privateMedicalHistory || []).map(p => ({
      date: p.date,
      event: p.event,
      clinician: p.clinician || 'Campus Vet',
      status: p.status
    }))
  };

  res.json(sanitizedPublicProfile);
});

// Register a new animal (Assigns permanent VSxxxx ID)
app.post('/api/animals', (req, res) => {
  const db = loadDb();
  const { 
    name, 
    species, 
    breed, 
    gender, 
    age, 
    dob, 
    weight, 
    penLocation, 
    publicNotes, 
    owner, 
    purchaseDate, 
    purchaseCost,
    healthStatus,
    milkProductionStatus 
  } = req.body;

  if (!name || !species) {
    return res.status(400).json({ error: 'Animal name and species are required.' });
  }

  // Calculate highest existing ID number to prevent gaps or duplicates
  let maxIdNum = 0;
  db.animals.forEach(a => {
    const match = a.id && a.id.match(/^VS(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIdNum) maxIdNum = num;
    }
  });
  const newNum = maxIdNum + 1;
  const newId = `VS${newNum.toString().padStart(4, '0')}`;

  const newAnimal = {
    id: newId,
    name: name.trim(),
    species: species.trim(),
    breed: breed ? breed.trim() : "Standard",
    gender: gender || "Female",
    age: age || "1.0 yr",
    dob: dob || new Date().toISOString().split('T')[0],
    weight: weight || "N/A",
    penLocation: penLocation || "Barn A - Stall 01",
    assignedDeviceId: null,
    healthStatus: healthStatus || "Healthy",
    milkProductionStatus: milkProductionStatus || (species === 'Cow' || species === 'Buffalo' || species === 'Cattle' ? 'In Milk' : 'Not Applicable'),
    purchaseDate: purchaseDate || null,
    purchaseCost: purchaseCost !== undefined && purchaseCost !== '' ? parseFloat(purchaseCost) : null,
    owner: owner || {
      name: "College Farm Unit",
      contactPerson: "Farm Attendant",
      phone: "+91 90000 00000",
      email: "vet.unit@college.edu"
    },
    registeredAt: new Date().toISOString(),
    publicNotes: publicNotes || "Enrolled in VetShield surveillance registry.",
    privateMedicalHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        event: "Electronic Registration & QR Code Generation",
        clinician: "Intake Registry",
        status: "Active"
      }
    ]
  };

  // If purchase cost was specified, record capital asset expense
  if (newAnimal.purchaseCost && newAnimal.purchaseCost > 0) {
    const capitalTxn = {
      id: `TXN-CAP-${Date.now()}`,
      date: newAnimal.purchaseDate || new Date().toISOString().split('T')[0],
      type: "expense",
      category: "Animal purchase costs",
      description: `Purchase of ${newAnimal.species} ${newAnimal.name} (${newAnimal.id})`,
      amount: newAnimal.purchaseCost,
      animalId: newAnimal.id,
      paymentMethod: "Bank Transfer",
      isCapitalExpense: true,
      milkRecordId: null,
      notes: "Capital asset acquisition. Documented separately from recurring operating costs.",
      createdAt: new Date().toISOString()
    };
    db.transactions.push(capitalTxn);
  }

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

// Delete an animal (Safety validation required)
app.delete('/api/animals/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const idx = db.animals.findIndex(a => a.id.toUpperCase() === id.toUpperCase());

  if (idx === -1) {
    return res.status(404).json({ error: 'Animal not found.' });
  }

  const deletedAnimal = db.animals[idx];

  // Unassign from any paired device
  db.devices.forEach(d => {
    if (d.assignedAnimalId === deletedAnimal.id) {
      d.assignedAnimalId = null;
    }
  });

  // Remove animal
  db.animals.splice(idx, 1);

  // Retain financial transactions with a marker for audit compliance
  db.transactions.forEach(t => {
    if (t.animalId === deletedAnimal.id) {
      t.animalId = null;
      t.notes = (t.notes ? t.notes + ' ' : '') + `[Historical: belonged to deleted ${deletedAnimal.id} (${deletedAnimal.name})]`;
    }
  });

  saveDb(db);
  res.json({ success: true, message: `Animal ${deletedAnimal.id} (${deletedAnimal.name}) deleted successfully.` });
});

// ---------------------------------------------------------------------------
// 4. DAILY MILK PRODUCTION TRACKER ENDPOINTS
// ---------------------------------------------------------------------------

// List milk records with optional filters
app.get('/api/milk', (req, res) => {
  const { animalId, species, date, startDate, endDate } = req.query;
  const db = loadDb();

  let records = db.milkRecords;

  if (animalId) {
    records = records.filter(r => r.animalId.toUpperCase() === animalId.toUpperCase());
  }
  if (species && species !== 'All') {
    records = records.filter(r => r.species.toLowerCase() === species.toLowerCase());
  }
  if (date) {
    records = records.filter(r => r.date === date);
  }
  if (startDate) {
    records = records.filter(r => r.date >= startDate);
  }
  if (endDate) {
    records = records.filter(r => r.date <= endDate);
  }

  // Sort descending by date
  records = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  res.json(records);
});

// Milk Production Statistics & Analysis
app.get('/api/milk/stats', (req, res) => {
  const { targetDate } = req.query;
  const db = loadDb();
  const todayStr = targetDate || new Date().toISOString().split('T')[0];

  const todayRecords = db.milkRecords.filter(r => r.date === todayStr);

  const todayTotalMilk = todayRecords.reduce((sum, r) => sum + (r.totalLiters || 0), 0);
  const todayCowMilk = todayRecords.filter(r => r.species === 'Cow' || r.species === 'Cattle').reduce((sum, r) => sum + (r.totalLiters || 0), 0);
  const todayBuffaloMilk = todayRecords.filter(r => r.species === 'Buffalo').reduce((sum, r) => sum + (r.totalLiters || 0), 0);
  const todayMilkSalesIncome = todayRecords.reduce((sum, r) => sum + (r.totalIncome || 0), 0);
  const todayUnsoldMilk = todayRecords.reduce((sum, r) => sum + (r.unsoldLiters || 0), 0);

  const milkingAnimalsCount = todayRecords.length;
  const todayAveragePerAnimal = milkingAnimalsCount > 0 ? (todayTotalMilk / milkingAnimalsCount).toFixed(2) : "0.00";

  // Last 7 days & Last 30 days sums
  const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const weekRecords = db.milkRecords.filter(r => r.date >= d7);
  const monthRecords = db.milkRecords.filter(r => r.date >= d30);

  const weekTotalMilk = weekRecords.reduce((sum, r) => sum + (r.totalLiters || 0), 0);
  const monthTotalMilk = monthRecords.reduce((sum, r) => sum + (r.totalLiters || 0), 0);

  // Identify animals whose recorded milk has decreased compared with previous records
  const dairyAnimals = db.animals.filter(a => a.species === 'Cow' || a.species === 'Buffalo' || a.species === 'Cattle');
  const decreaseAlerts = [];

  dairyAnimals.forEach(animal => {
    const animalRecords = db.milkRecords
      .filter(r => r.animalId === animal.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (animalRecords.length >= 2) {
      const latest = animalRecords[0];
      const previous = animalRecords[1];

      if (latest.totalLiters < previous.totalLiters) {
        const dropAmount = (previous.totalLiters - latest.totalLiters).toFixed(1);
        const dropPct = (((previous.totalLiters - latest.totalLiters) / previous.totalLiters) * 100).toFixed(1);

        decreaseAlerts.push({
          animalId: animal.id,
          animalName: animal.name,
          species: animal.species,
          latestDate: latest.date,
          latestYield: latest.totalLiters,
          previousDate: previous.date,
          previousYield: previous.totalLiters,
          dropAmount: parseFloat(dropAmount),
          dropPercentage: parseFloat(dropPct),
          severity: parseFloat(dropPct) >= 15 ? 'Critical' : 'Warning',
          note: `Production dropped by ${dropAmount} L (${dropPct}%) on ${latest.date}. Check feed intake, hydration, and body temperature.`
        });
      }
    }
  });

  // Daily trend points for chart (last 14 days)
  const dailyTrend = [];
  for (let i = 13; i >= 0; i--) {
    const dStr = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const dayRecs = db.milkRecords.filter(r => r.date === dStr);
    const cowLiters = dayRecs.filter(r => r.species === 'Cow' || r.species === 'Cattle').reduce((s, r) => s + (r.totalLiters || 0), 0);
    const buffaloLiters = dayRecs.filter(r => r.species === 'Buffalo').reduce((s, r) => s + (r.totalLiters || 0), 0);
    const totalLiters = cowLiters + buffaloLiters;
    const income = dayRecs.reduce((s, r) => s + (r.totalIncome || 0), 0);

    dailyTrend.push({
      date: dStr,
      displayDate: dStr.substring(5),
      cowLiters: parseFloat(cowLiters.toFixed(1)),
      buffaloLiters: parseFloat(buffaloLiters.toFixed(1)),
      totalLiters: parseFloat(totalLiters.toFixed(1)),
      income: parseFloat(income.toFixed(2))
    });
  }

  res.json({
    todayStr,
    todayTotalMilk: parseFloat(todayTotalMilk.toFixed(1)),
    todayCowMilk: parseFloat(todayCowMilk.toFixed(1)),
    todayBuffaloMilk: parseFloat(todayBuffaloMilk.toFixed(1)),
    todayMilkSalesIncome: parseFloat(todayMilkSalesIncome.toFixed(2)),
    todayUnsoldMilk: parseFloat(todayUnsoldMilk.toFixed(1)),
    milkingAnimalsCount,
    todayAveragePerAnimal: parseFloat(todayAveragePerAnimal),
    weekTotalMilk: parseFloat(weekTotalMilk.toFixed(1)),
    monthTotalMilk: parseFloat(monthTotalMilk.toFixed(1)),
    decreaseAlerts,
    dailyTrend
  });
});

// Add a daily milk record (With duplicate prevention & auto financial linking)
app.post('/api/milk', (req, res) => {
  const db = loadDb();
  const { 
    animalId, 
    date, 
    morningLiters = 0, 
    afternoonLiters = 0, 
    eveningLiters = 0, 
    soldLiters,
    pricePerLiter = 0,
    notes = '' 
  } = req.body;

  if (!animalId || !date) {
    return res.status(400).json({ error: 'Animal ID and Date are required.' });
  }

  const animal = db.animals.find(a => a.id.toUpperCase() === animalId.toUpperCase());
  if (!animal) {
    return res.status(404).json({ error: `Animal ${animalId} was not found in registry.` });
  }

  // Prevent accidental duplicate entry for the SAME animal and SAME date
  const existingRecord = db.milkRecords.find(
    r => r.animalId.toUpperCase() === animalId.toUpperCase() && r.date === date
  );
  if (existingRecord) {
    return res.status(409).json({ 
      error: `A milk record already exists for ${animal.name} (${animal.id}) on ${date}. Please edit the existing entry rather than creating a duplicate.` 
    });
  }

  const mQty = Math.max(0, parseFloat(morningLiters) || 0);
  const aQty = Math.max(0, parseFloat(afternoonLiters) || 0);
  const eQty = Math.max(0, parseFloat(eveningLiters) || 0);
  const totalQty = parseFloat((mQty + aQty + eQty).toFixed(2));

  if (totalQty <= 0) {
    return res.status(422).json({ error: 'Total milk quantity must be greater than zero.' });
  }

  const price = Math.max(0, parseFloat(pricePerLiter) || 0);
  let soldQty = soldLiters !== undefined && soldLiters !== '' ? parseFloat(soldLiters) : totalQty;
  if (soldQty < 0) soldQty = 0;
  if (soldQty > totalQty) soldQty = totalQty;
  soldQty = parseFloat(soldQty.toFixed(2));

  const unsoldQty = parseFloat((totalQty - soldQty).toFixed(2));
  const totalIncome = parseFloat((soldQty * price).toFixed(2));

  const recordId = `MILK-${date.replace(/-/g, '')}-${animal.id}-${Date.now().toString().slice(-4)}`;

  let linkedTransactionId = null;

  // Auto-generate linked financial income transaction to guarantee consistency and prevent double-counting
  if (soldQty > 0 && price > 0 && totalIncome > 0) {
    linkedTransactionId = `TXN-${recordId}`;
    const category = (animal.species === 'Buffalo') ? 'Buffalo milk sales' : 'Cow milk sales';
    const txn = {
      id: linkedTransactionId,
      date,
      type: "income",
      category,
      description: `Daily milk sales for ${animal.name} (${soldQty} L @ ₹${price}/L)`,
      amount: totalIncome,
      animalId: animal.id,
      paymentMethod: "UPI / QR",
      isCapitalExpense: false,
      milkRecordId: recordId,
      notes: notes ? `Milk sale note: ${notes}` : 'Automatic entry generated from verified daily milk log',
      createdAt: new Date().toISOString()
    };
    db.transactions.push(txn);
  }

  const newMilkRecord = {
    id: recordId,
    animalId: animal.id,
    animalName: animal.name,
    species: animal.species,
    date,
    morningLiters: mQty,
    afternoonLiters: aQty,
    eveningLiters: eQty,
    totalLiters: totalQty,
    soldLiters: soldQty,
    unsoldLiters: unsoldQty,
    pricePerLiter: price,
    totalIncome,
    notes,
    transactionId: linkedTransactionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.milkRecords.unshift(newMilkRecord);
  saveDb(db);

  res.status(201).json({ success: true, milkRecord: newMilkRecord });
});

// Edit an existing milk record
app.put('/api/milk/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const idx = db.milkRecords.findIndex(r => r.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Milk record not found.' });
  }

  const current = db.milkRecords[idx];
  const { morningLiters, afternoonLiters, eveningLiters, soldLiters, pricePerLiter, notes, date } = req.body;

  const mQty = morningLiters !== undefined ? Math.max(0, parseFloat(morningLiters) || 0) : current.morningLiters;
  const aQty = afternoonLiters !== undefined ? Math.max(0, parseFloat(afternoonLiters) || 0) : current.afternoonLiters;
  const eQty = eveningLiters !== undefined ? Math.max(0, parseFloat(eveningLiters) || 0) : current.eveningLiters;
  const totalQty = parseFloat((mQty + aQty + eQty).toFixed(2));

  const price = pricePerLiter !== undefined ? Math.max(0, parseFloat(pricePerLiter) || 0) : current.pricePerLiter;
  let soldQty = soldLiters !== undefined ? parseFloat(soldLiters) : current.soldLiters;
  if (soldQty < 0) soldQty = 0;
  if (soldQty > totalQty) soldQty = totalQty;
  soldQty = parseFloat(soldQty.toFixed(2));

  const unsoldQty = parseFloat((totalQty - soldQty).toFixed(2));
  const totalIncome = parseFloat((soldQty * price).toFixed(2));
  const recordDate = date || current.date;

  // Check duplicate date if date was modified
  if (recordDate !== current.date) {
    const dup = db.milkRecords.find(r => r.id !== id && r.animalId === current.animalId && r.date === recordDate);
    if (dup) {
      return res.status(409).json({ error: `A milk record already exists for ${current.animalName} on ${recordDate}.` });
    }
  }

  current.morningLiters = mQty;
  current.afternoonLiters = aQty;
  current.eveningLiters = eQty;
  current.totalLiters = totalQty;
  current.soldLiters = soldQty;
  current.unsoldLiters = unsoldQty;
  current.pricePerLiter = price;
  current.totalIncome = totalIncome;
  current.notes = notes !== undefined ? notes : current.notes;
  current.date = recordDate;
  current.updatedAt = new Date().toISOString();

  // Synchronize linked financial transaction
  if (current.transactionId) {
    const txn = db.transactions.find(t => t.id === current.transactionId || t.milkRecordId === current.id);
    if (txn) {
      if (totalIncome > 0) {
        txn.amount = totalIncome;
        txn.date = recordDate;
        txn.description = `Daily milk sales for ${current.animalName} (${soldQty} L @ ₹${price}/L)`;
      } else {
        // If income dropped to 0, remove transaction
        const txnIdx = db.transactions.findIndex(t => t.id === txn.id);
        if (txnIdx !== -1) db.transactions.splice(txnIdx, 1);
        current.transactionId = null;
      }
    }
  } else if (soldQty > 0 && price > 0 && totalIncome > 0) {
    // Create new transaction if none existed previously
    const newTxnId = `TXN-${current.id}`;
    const category = (current.species === 'Buffalo') ? 'Buffalo milk sales' : 'Cow milk sales';
    db.transactions.push({
      id: newTxnId,
      date: recordDate,
      type: "income",
      category,
      description: `Daily milk sales for ${current.animalName} (${soldQty} L @ ₹${price}/L)`,
      amount: totalIncome,
      animalId: current.animalId,
      paymentMethod: "UPI / QR",
      isCapitalExpense: false,
      milkRecordId: current.id,
      notes: 'Entry generated from updated milk log',
      createdAt: new Date().toISOString()
    });
    current.transactionId = newTxnId;
  }

  saveDb(db);
  res.json({ success: true, milkRecord: current });
});

// Delete milk record and unlink financial transaction
app.delete('/api/milk/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const idx = db.milkRecords.findIndex(r => r.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Milk record not found.' });
  }

  const record = db.milkRecords[idx];

  // Remove linked financial transaction so milk income is not left orphan
  if (record.transactionId) {
    const txnIdx = db.transactions.findIndex(t => t.id === record.transactionId || t.milkRecordId === record.id);
    if (txnIdx !== -1) {
      db.transactions.splice(txnIdx, 1);
    }
  }

  db.milkRecords.splice(idx, 1);
  saveDb(db);

  res.json({ success: true, message: 'Milk record and linked sales transaction deleted.' });
});

// ---------------------------------------------------------------------------
// 5. FINANCIAL MANAGEMENT & ANALYTICS ENDPOINTS
// ---------------------------------------------------------------------------

// List transactions
app.get('/api/finances/transactions', (req, res) => {
  const { type, category, animalId, startDate, endDate } = req.query;
  const db = loadDb();

  let txns = db.transactions;

  if (type) {
    txns = txns.filter(t => t.type === type.toLowerCase());
  }
  if (category && category !== 'All') {
    txns = txns.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }
  if (animalId) {
    txns = txns.filter(t => t.animalId && t.animalId.toUpperCase() === animalId.toUpperCase());
  }
  if (startDate) {
    txns = txns.filter(t => t.date >= startDate);
  }
  if (endDate) {
    txns = txns.filter(t => t.date <= endDate);
  }

  // Sort descending by date
  txns = [...txns].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  res.json(txns);
});

// Add a transaction
app.post('/api/finances/transactions', (req, res) => {
  const db = loadDb();
  const { 
    date, 
    type, 
    category, 
    description, 
    amount, 
    animalId, 
    paymentMethod, 
    isCapitalExpense, 
    notes 
  } = req.body;

  if (!date || !type || !category || amount === undefined) {
    return res.status(400).json({ error: 'Date, type (income/expense), category, and amount are required.' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(422).json({ error: 'Transaction amount must be a positive number.' });
  }

  // Auto-flag animal purchase and major equipment as capital expenses
  const isCapital = isCapitalExpense === true || category === 'Animal purchase costs';

  const newTxn = {
    id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date,
    type: type.toLowerCase(),
    category,
    description: description || `${category} on ${date}`,
    amount: parseFloat(numAmount.toFixed(2)),
    animalId: animalId || null,
    paymentMethod: paymentMethod || "Cash",
    isCapitalExpense: isCapital,
    milkRecordId: null,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(newTxn);
  saveDb(db);

  res.status(201).json({ success: true, transaction: newTxn });
});

// Update a transaction
app.put('/api/finances/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const idx = db.transactions.findIndex(t => t.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  const current = db.transactions[idx];
  const { date, type, category, description, amount, animalId, paymentMethod, isCapitalExpense, notes } = req.body;

  if (amount !== undefined) {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      return res.status(422).json({ error: 'Amount must be greater than zero.' });
    }
    current.amount = parseFloat(num.toFixed(2));
  }

  if (date) current.date = date;
  if (type) current.type = type.toLowerCase();
  if (category) {
    current.category = category;
    if (category === 'Animal purchase costs') current.isCapitalExpense = true;
  }
  if (description !== undefined) current.description = description;
  if (animalId !== undefined) current.animalId = animalId;
  if (paymentMethod !== undefined) current.paymentMethod = paymentMethod;
  if (isCapitalExpense !== undefined) current.isCapitalExpense = isCapitalExpense;
  if (notes !== undefined) current.notes = notes;

  saveDb(db);
  res.json({ success: true, transaction: current });
});

// Delete a transaction
app.delete('/api/finances/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const idx = db.transactions.findIndex(t => t.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  const txn = db.transactions[idx];

  // If this was linked to a milk record, unlink it so the milk record knows it has no linked sale
  if (txn.milkRecordId) {
    const milk = db.milkRecords.find(m => m.id === txn.milkRecordId);
    if (milk) milk.transactionId = null;
  }

  db.transactions.splice(idx, 1);
  saveDb(db);

  res.json({ success: true, message: 'Transaction deleted.' });
});

// Comprehensive Financial Summary & Animal-Wise Profitability Report
app.get('/api/finances/summary', (req, res) => {
  const { targetDate } = req.query;
  const db = loadDb();
  const todayStr = targetDate || new Date().toISOString().split('T')[0];

  const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  // Transactions partitioned by time
  const todayTxns = db.transactions.filter(t => t.date === todayStr);
  const weekTxns = db.transactions.filter(t => t.date >= d7);
  const monthTxns = db.transactions.filter(t => t.date >= d30);

  // Helper: calculate operating income and operating expenses
  const calcFin = (txnList) => {
    const income = txnList
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + (t.amount || 0), 0);

    // Operating expenses strictly exclude capital asset purchases
    const operatingExpenses = txnList
      .filter(t => t.type === 'expense' && !t.isCapitalExpense)
      .reduce((s, t) => s + (t.amount || 0), 0);

    const capitalExpenses = txnList
      .filter(t => t.type === 'expense' && t.isCapitalExpense)
      .reduce((s, t) => s + (t.amount || 0), 0);

    const netOperatingProfit = income - operatingExpenses;
    const netCashFlow = income - (operatingExpenses + capitalExpenses);

    return {
      income: parseFloat(income.toFixed(2)),
      operatingExpenses: parseFloat(operatingExpenses.toFixed(2)),
      capitalExpenses: parseFloat(capitalExpenses.toFixed(2)),
      netOperatingProfit: parseFloat(netOperatingProfit.toFixed(2)),
      netCashFlow: parseFloat(netCashFlow.toFixed(2))
    };
  };

  const todaySummary = calcFin(todayTxns);
  const weekSummary = calcFin(weekTxns);
  const monthSummary = calcFin(monthTxns);

  // Income sources breakdown (Total All-time or last 30 days)
  const cowMilkIncome = monthTxns
    .filter(t => t.type === 'income' && (t.category === 'Cow milk sales' || t.description.toLowerCase().includes('cow')))
    .reduce((s, t) => s + t.amount, 0);

  const buffaloMilkIncome = monthTxns
    .filter(t => t.type === 'income' && (t.category === 'Buffalo milk sales' || t.description.toLowerCase().includes('buffalo')))
    .reduce((s, t) => s + t.amount, 0);

  const otherIncome = monthTxns
    .filter(t => t.type === 'income' && t.category !== 'Cow milk sales' && t.category !== 'Buffalo milk sales')
    .reduce((s, t) => s + t.amount, 0);

  // Expenses by Category breakdown
  const categoryExpensesMap = {};
  monthTxns.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Other expenses';
    categoryExpensesMap[cat] = (categoryExpensesMap[cat] || 0) + t.amount;
  });

  const expensesByCategory = Object.keys(categoryExpensesMap).map(cat => ({
    category: cat,
    amount: parseFloat(categoryExpensesMap[cat].toFixed(2)),
    isCapital: cat === 'Animal purchase costs'
  })).sort((a, b) => b.amount - a.amount);

  // Daily Trend (Last 14 days)
  const dailyTrend = [];
  for (let i = 13; i >= 0; i--) {
    const dStr = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const dayList = db.transactions.filter(t => t.date === dStr);
    const dayFin = calcFin(dayList);

    dailyTrend.push({
      date: dStr,
      displayDate: dStr.substring(5),
      income: dayFin.income,
      expenses: dayFin.operatingExpenses,
      netProfit: dayFin.netOperatingProfit
    });
  }

  // -------------------------------------------------------------------------
  // FEATURE 4: ANIMAL-WISE PROFITABILITY REPORT
  // -------------------------------------------------------------------------
  const dairyAnimals = db.animals.filter(a => a.species === 'Cow' || a.species === 'Buffalo' || a.species === 'Cattle');

  const animalProfitability = dairyAnimals.map(animal => {
    // Milk produced in last 30 days
    const animalMilk = db.milkRecords.filter(m => m.animalId === animal.id && m.date >= d30);
    const totalMilkProduced = animalMilk.reduce((s, m) => s + (m.totalLiters || 0), 0);
    const recordedMilkIncome = animalMilk.reduce((s, m) => s + (m.totalIncome || 0), 0);

    // Direct animal-related expenses from transactions
    const animalTxns = db.transactions.filter(t => t.animalId === animal.id && t.date >= d30);

    const directIncome = animalTxns
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    const feedExpenses = animalTxns
      .filter(t => t.type === 'expense' && t.category === 'Animal feed')
      .reduce((s, t) => s + t.amount, 0);

    const vetExpenses = animalTxns
      .filter(t => t.type === 'expense' && (t.category === 'Veterinary treatment' || t.category === 'Medicines'))
      .reduce((s, t) => s + t.amount, 0);

    const otherDirectExpenses = animalTxns
      .filter(t => t.type === 'expense' && t.category !== 'Animal feed' && t.category !== 'Veterinary treatment' && t.category !== 'Medicines' && !t.isCapitalExpense)
      .reduce((s, t) => s + t.amount, 0);

    const totalDirectExpenses = feedExpenses + vetExpenses + otherDirectExpenses;
    // Total income attributed to this animal (milk sales + any other direct income)
    const totalAttributedIncome = Math.max(directIncome, recordedMilkIncome);
    const netContribution = totalAttributedIncome - totalDirectExpenses;

    return {
      animalId: animal.id,
      animalName: animal.name,
      species: animal.species,
      breed: animal.breed,
      totalMilkProduced: parseFloat(totalMilkProduced.toFixed(1)),
      recordedMilkIncome: parseFloat(recordedMilkIncome.toFixed(2)),
      feedExpenses: parseFloat(feedExpenses.toFixed(2)),
      vetExpenses: parseFloat(vetExpenses.toFixed(2)),
      otherDirectExpenses: parseFloat(otherDirectExpenses.toFixed(2)),
      totalRecordedIncome: parseFloat(totalAttributedIncome.toFixed(2)),
      totalDirectExpenses: parseFloat(totalDirectExpenses.toFixed(2)),
      netContribution: parseFloat(netContribution.toFixed(2))
    };
  });

  // Check if financial records appear incomplete
  const incompleteRecords = {
    hasMilkWithoutSales: db.milkRecords.some(m => m.totalLiters > 0 && (!m.totalIncome || m.totalIncome === 0)),
    hasDaysWithoutExpenses: dailyTrend.some(d => d.income > 0 && d.expenses === 0),
    notice: "Recorded financial figures reflect documented ledger entries. Shared farm overheads (electricity, labour) are retained at the enterprise level."
  };

  res.json({
    todayStr,
    today: todaySummary,
    week: weekSummary,
    month: monthSummary,
    incomeBreakdown: {
      totalMilkIncome: parseFloat((cowMilkIncome + buffaloMilkIncome).toFixed(2)),
      cowMilkIncome: parseFloat(cowMilkIncome.toFixed(2)),
      buffaloMilkIncome: parseFloat(buffaloMilkIncome.toFixed(2)),
      otherIncome: parseFloat(otherIncome.toFixed(2))
    },
    expensesByCategory,
    dailyTrend,
    animalProfitability,
    incompleteRecords
  });
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

    db.animals.forEach(a => {
      if (a.assignedDeviceId === deviceId) a.assignedDeviceId = null;
    });

    animal.assignedDeviceId = deviceId;
    device.assignedAnimalId = animalId;
  } else {
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
  console.log(` VetShield IoT Gateway & Dairy Management System Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Ingestion URL: http://0.0.0.0:${PORT}/api/telemetry`);
  console.log(` API Endpoints: /api/animals, /api/milk, /api/finances`);
  console.log(` Sensor Supported: DS18B20 (OneWire digital probe)`);
  console.log(`=======================================================`);
});