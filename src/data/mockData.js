// VetShield - Smart Animal Health & Livestock Monitoring System
// College Project Competition Prototype - Demo Data Source
// DISCLAIMER: All data presented here are simulated demo telemetry for evaluation purposes.

export const INITIAL_ANIMALS = [
  {
    id: "VS-COW-104",
    name: "Bella",
    species: "Cattle",
    breed: "Holstein Friesian",
    gender: "Female",
    age: "3.5 yrs",
    weight: "620 kg",
    location: "Barn A - Pen 12",
    status: "Healthy",
    temperature: 38.6, // Celsius (normal: 38.0 - 39.3)
    heartRate: 68, // bpm (normal: 48 - 84)
    respirationRate: 26, // bpm (normal: 24 - 36)
    ruminationHours: 8.4, // hrs/day (normal: 7 - 9)
    activityLevel: "Normal",
    sensorBattery: 92,
    sensorType: "Smart Ear Tag + Rumen Bolus",
    lastSynced: "Just now",
    vaccinationStatus: "Up to date",
    notes: "Lactating cow, healthy milk yield and normal feeding patterns.",
    alertsCount: 0,
    history: [
      { date: "2026-10-10", event: "Routine Health Checkup", vet: "Dr. A. Sharma", status: "Cleared" },
      { date: "2026-09-18", event: "FMD Booster Vaccine", vet: "Dr. R. Patel", status: "Administered" },
      { date: "2026-08-04", event: "Deworming Protocol", vet: "Dr. A. Sharma", status: "Completed" }
    ]
  },
  {
    id: "VS-COW-109",
    name: "Daisy",
    species: "Cattle",
    breed: "Jersey Dairy",
    gender: "Female",
    age: "4.0 yrs",
    weight: "480 kg",
    location: "Barn A - Pen 14",
    status: "Monitoring",
    temperature: 39.8, // Mild Fever (> 39.3)
    heartRate: 88,
    respirationRate: 38,
    ruminationHours: 4.8, // Decreased
    activityLevel: "Low",
    sensorBattery: 78,
    sensorType: "Rumen Bolus v2",
    lastSynced: "2 mins ago",
    vaccinationStatus: "Up to date",
    notes: "Elevated core body temperature and reduced chewing activity detected in the last 4 hours.",
    alertsCount: 1,
    history: [
      { date: "2026-10-16", event: "Fever Warning Flagged", vet: "Automated Telemetry", status: "Active" },
      { date: "2026-09-02", event: "Mastitis Screening", vet: "Dr. A. Sharma", status: "Negative" }
    ]
  },
  {
    id: "VS-SHP-202",
    name: "Oliver",
    species: "Sheep",
    breed: "Merino Wool",
    gender: "Male",
    age: "2.1 yrs",
    weight: "74 kg",
    location: "Pasture B - Sector 2",
    status: "Healthy",
    temperature: 39.1, // normal: 38.5 - 39.8
    heartRate: 74, // normal: 70 - 80
    respirationRate: 20,
    ruminationHours: 7.2,
    activityLevel: "High",
    sensorBattery: 85,
    sensorType: "Solar GPS & Vital Collar",
    lastSynced: "1 min ago",
    vaccinationStatus: "Up to date",
    notes: "Active foraging, good fleece condition.",
    alertsCount: 0,
    history: [
      { date: "2026-09-12", event: "Anthrax & Clostridial Vaccine", vet: "Dr. R. Patel", status: "Administered" }
    ]
  },
  {
    id: "VS-GOAT-301",
    name: "Willow",
    species: "Goat",
    breed: "Boer Meat Goat",
    gender: "Female",
    age: "1.8 yrs",
    weight: "58 kg",
    location: "Barn C - Pen 4",
    status: "Critical",
    temperature: 40.4, // High fever (normal: 38.5 - 40.0)
    heartRate: 96, // High
    respirationRate: 42,
    ruminationHours: 3.1,
    activityLevel: "Very Low",
    sensorBattery: 64,
    sensorType: "Subcutaneous Temp Chip",
    lastSynced: "Just now",
    vaccinationStatus: "Pending Booster",
    notes: "Acute lethargy, isolation from herd, critical hyperthermia trigger.",
    alertsCount: 2,
    history: [
      { date: "2026-10-16", event: "Critical Thermal Alarm", vet: "Automated System", status: "Urgent Action Required" },
      { date: "2026-10-15", event: "Appetite Drop Noted", vet: "Farm Attendant", status: "Logged" }
    ]
  },
  {
    id: "VS-HRS-405",
    name: "Thunder",
    species: "Horse",
    breed: "Thoroughbred",
    gender: "Male",
    age: "5.0 yrs",
    weight: "510 kg",
    location: "Paddock 1 - Stable 3",
    status: "Healthy",
    temperature: 37.8, // normal: 37.2 - 38.3
    heartRate: 38, // normal: 32 - 44
    respirationRate: 12,
    ruminationHours: 0, // N/A for horses (grazing)
    activityLevel: "Optimal",
    sensorBattery: 94,
    sensorType: "Equine Cardiac & Girth Sensor",
    lastSynced: "Just now",
    vaccinationStatus: "Up to date",
    notes: "Competition condition, balanced athletic recovery parameters.",
    alertsCount: 0,
    history: [
      { date: "2026-09-25", event: "Equine Influenza Vaccine", vet: "Dr. S. Nair", status: "Administered" },
      { date: "2026-08-10", event: "Lameness & Hoof Inspection", vet: "Dr. S. Nair", status: "Passed Grade A" }
    ]
  },
  {
    id: "VS-SWN-512",
    name: "Barnaby",
    species: "Swine",
    breed: "Large White Pig",
    gender: "Male",
    age: "1.2 yrs",
    weight: "135 kg",
    location: "Barn D - Enclosure 8",
    status: "Monitoring",
    temperature: 39.7, // normal: 38.7 - 39.8
    heartRate: 82,
    respirationRate: 30,
    ruminationHours: 0,
    activityLevel: "Moderate",
    sensorBattery: 89,
    sensorType: "RFID Temperature Ear Clip",
    lastSynced: "4 mins ago",
    vaccinationStatus: "Up to date",
    notes: "Slight ambient heat stress response during afternoon peak.",
    alertsCount: 1,
    history: [
      { date: "2026-10-14", event: "PRRS Surveillance Check", vet: "Dr. A. Sharma", status: "Negative" }
    ]
  },
  {
    id: "VS-COW-112",
    name: "Luna",
    species: "Cattle",
    breed: "Gir Indigenous",
    gender: "Female",
    age: "4.2 yrs",
    weight: "440 kg",
    location: "Barn A - Pen 18",
    status: "Healthy",
    temperature: 38.4,
    heartRate: 64,
    respirationRate: 24,
    ruminationHours: 8.8,
    activityLevel: "Normal",
    sensorBattery: 95,
    sensorType: "Smart Ear Tag + Rumen Bolus",
    lastSynced: "Just now",
    vaccinationStatus: "Up to date",
    notes: "High heat tolerance indigenous breed, pristine physiological markers.",
    alertsCount: 0,
    history: [
      { date: "2026-09-01", event: "Annual Bloodwork Panel", vet: "Dr. R. Patel", status: "Optimal" }
    ]
  },
  {
    id: "VS-DOG-601",
    name: "Rex",
    species: "Working Dog",
    breed: "Border Collie",
    gender: "Male",
    age: "3.0 yrs",
    weight: "22 kg",
    location: "Central Farm Office",
    status: "Healthy",
    temperature: 38.5, // normal: 38.0 - 39.2
    heartRate: 78,
    respirationRate: 22,
    ruminationHours: 0,
    activityLevel: "Very High",
    sensorBattery: 91,
    sensorType: "Smart GPS K9 Collar",
    lastSynced: "Just now",
    vaccinationStatus: "Up to date",
    notes: "Livestock guardian and herding dog, excellent stamina and responsiveness.",
    alertsCount: 0,
    history: [
      { date: "2026-10-01", event: "Rabies & DHPP Booster", vet: "Dr. S. Nair", status: "Administered" }
    ]
  }
];

export const INITIAL_ALERTS = [
  {
    id: "ALT-2026-901",
    animalId: "VS-GOAT-301",
    animalName: "Willow (Goat)",
    species: "Goat",
    type: "Critical Fever Alert",
    metric: "Body Temp: 40.4°C",
    threshold: "Max Threshold: 40.0°C",
    severity: "Critical",
    timestamp: "12 mins ago",
    location: "Barn C - Pen 4",
    status: "Active",
    recommendation: "Immediate isolation and veterinary thermal cooling protocol required."
  },
  {
    id: "ALT-2026-902",
    animalId: "VS-COW-109",
    animalName: "Daisy (Cattle)",
    species: "Cattle",
    type: "Rumination Deficit",
    metric: "Rumination: 4.8 hrs (Expected: 7.5 hrs)",
    threshold: "Below minimum standard by 36%",
    severity: "Warning",
    timestamp: "38 mins ago",
    location: "Barn A - Pen 14",
    status: "Active",
    recommendation: "Inspect feed intake and check for early subacute ruminal acidosis."
  },
  {
    id: "ALT-2026-903",
    animalId: "VS-SWN-512",
    animalName: "Barnaby (Swine)",
    species: "Swine",
    type: "Barn Microclimate Alert",
    metric: "Ambient Temp: 32.8°C / Humidity: 78%",
    threshold: "THI (Temperature Humidity Index): Moderate Heat Stress",
    severity: "Warning",
    timestamp: "1 hr ago",
    location: "Barn D - Enclosure 8",
    status: "Active",
    recommendation: "Activate evaporative cooling misters and ventilation fans in Barn D."
  },
  {
    id: "ALT-2026-898",
    animalId: "VS-HRS-405",
    animalName: "Thunder (Horse)",
    species: "Horse",
    type: "Post-Exercise Heart Rate Recovery",
    metric: "Heart Rate: 84 bpm -> 38 bpm",
    threshold: "Recovery completed within 15 mins",
    severity: "Info",
    timestamp: "3 hrs ago",
    location: "Paddock 1",
    status: "Resolved",
    recommendation: "Normal athletic post-training cool-down verified."
  },
  {
    id: "ALT-2026-895",
    animalId: "VS-COW-104",
    animalName: "Bella (Cattle)",
    species: "Cattle",
    type: "Routine Estrus Detection Notification",
    metric: "Activity step increase: +42%",
    threshold: "Standing heat window flagged",
    severity: "Info",
    timestamp: "14 hrs ago",
    location: "Barn A - Pen 12",
    status: "Resolved",
    recommendation: "Breeding timeline schedule logged for farm management."
  }
];

export const SENSOR_GATEWAYS = [
  {
    id: "GW-BARN-A",
    name: "LoRaWAN Barn Hub A",
    location: "Dairy Cattle Section",
    connectedTags: 24,
    battery: 98,
    signalStrength: "-68 dBm (Strong)",
    status: "Online",
    firmware: "v2.4.1-demo",
    uptime: "14 days, 6 hrs"
  },
  {
    id: "GW-PASTURE-B",
    name: "Solar Mesh Repeater B",
    location: "Open Sheep Pasture",
    connectedTags: 16,
    battery: 89,
    signalStrength: "-76 dBm (Good)",
    status: "Online",
    firmware: "v2.3.9-demo",
    uptime: "28 days, 11 hrs"
  },
  {
    id: "GW-BARN-C",
    name: "Zigbee Gateway C",
    location: "Caprine / Goat Facility",
    connectedTags: 8,
    battery: 94,
    signalStrength: "-62 dBm (Strong)",
    status: "Online",
    firmware: "v2.4.0-demo",
    uptime: "9 days, 2 hrs"
  },
  {
    id: "GW-AMB-ENV",
    name: "Microclimate Ambient Station",
    location: "Central Facility Weather Mast",
    connectedTags: 12,
    battery: 100,
    signalStrength: "-54 dBm (Excellent)",
    status: "Online",
    firmware: "v3.0.1-demo",
    uptime: "45 days"
  }
];

// Historical 24-hour vitals telemetry points for graphs
export const VITALS_TIMELINE = [
  { time: "00:00", avgTemp: 38.4, heartRate: 62, activityScore: 28 },
  { time: "03:00", avgTemp: 38.3, heartRate: 59, activityScore: 19 },
  { time: "06:00", avgTemp: 38.5, heartRate: 68, activityScore: 65 },
  { time: "09:00", avgTemp: 38.8, heartRate: 74, activityScore: 82 },
  { time: "12:00", avgTemp: 39.1, heartRate: 77, activityScore: 78 },
  { time: "15:00", avgTemp: 39.2, heartRate: 79, activityScore: 71 },
  { time: "18:00", avgTemp: 38.9, heartRate: 71, activityScore: 60 },
  { time: "21:00", avgTemp: 38.6, heartRate: 65, activityScore: 42 }
];

export const SPECIES_TEMP_BENCHMARKS = [
  { species: "Cattle", currentAvg: 38.8, minNormal: 38.0, maxNormal: 39.3, unit: "°C" },
  { species: "Sheep", currentAvg: 39.1, minNormal: 38.5, maxNormal: 39.8, unit: "°C" },
  { species: "Goat", currentAvg: 39.7, minNormal: 38.5, maxNormal: 40.0, unit: "°C" },
  { species: "Horse", currentAvg: 37.8, minNormal: 37.2, maxNormal: 38.3, unit: "°C" },
  { species: "Swine", currentAvg: 39.4, minNormal: 38.7, maxNormal: 39.8, unit: "°C" },
  { species: "Working Dog", currentAvg: 38.5, minNormal: 38.0, maxNormal: 39.2, unit: "°C" }
];
