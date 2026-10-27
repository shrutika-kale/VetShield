# VetShield - Real ESP32 Hardware-Connected Animal Health Monitoring System
**College Project Competition - Hardware IoT Edition**

VetShield has been upgraded into a genuine, hardware-connected veterinary telemetry system powered by an **ESP32 microcontroller** and **DS18B20 waterproof digital temperature probe**. 

The application completely eliminates simulated Brownian random jitter and fake graphs. It guarantees that live temperature values and charts are rendered exclusively from validated physical sensor transmissions.

---

## 🏗️ System Architecture & Dual-Mode Ingestion

```text
       [ DS18B20 Probe ] (GPIO 4 with 4.7kΩ pull-up)
              │
              ▼
       [ ESP32 Microcontroller ] (Wi-Fi 2.4GHz)
              │  (HTTP POST JSON with X-API-KEY header)
              ▼
   ┌────────────────────────────────────────────────────────┐
   │        VetShield Ingestion Gateway (Port 5000)          │
   │  - Device Authentication (API Key matching registry)   │
   │  - Fault Filter (-127°C wire fault / 85°C boot glitch) │
   │  - Dynamic Heartbeat Tracking (Connected / Stale / Off)│
   │  - Optional Cloud Firestore Real-time Sync             │
   └────────────────────────────────────────────────────────┘
              │  (REST API & Polling every 3.5s)
              ▼
   ┌────────────────────────────────────────────────────────┐
   │       VetShield React + Vite Web Dashboard             │
   │  - Dashboard: Real sensor state & veterinary advisory  │
   │  - Animal Registry: Permanent IDs (VS0001) + QR tags   │
   │  - ESP32 Hardware: Pair boards to enrolled animals     │
   │  - Public QR View: Mobile-friendly phone scanning page │
   └────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Features Implemented

### 1. Genuine Hardware Telemetry & Connection States
- **No Simulated Data:** All mock intervals and fake fluctuation loops have been removed.
- **Connection States:**
  - `Connected` (Green): ESP32 reading arrived within the active heartbeat window (< 45s).
  - `No recent data` (Amber): Last transmission is older than 45s but within 90s.
  - `Disconnected` (Gray/Red): Device has stopped transmitting (> 90s) or is unpowered.
  - `Waiting for real sensor data`: Clear empty state rendered whenever no real reading has arrived yet.
- **Sensor Fault Rejection:** Automatically filters and drops `-127.00°C` (disconnected probe wire) and `85.00°C` (power-on reset error).
- **Veterinary Review Warning:** Observational alerts notify clinicians of hyperthermia without making unverified medical disease diagnoses.

### 2. Unique Animal QR-Code System
- Every animal receives a **permanent, unique ID** (e.g. `VS0001`, `VS0002`).
- Dynamically generates high-resolution **QR codes** encoding `http://<your-ip>:5173/?animal=VS0001`.
- **Print & Download Labels:** One-click download as printable PNG tag badge or direct printing.
- **Mobile-Friendly Public Page:** Scanning the physical tag with any smartphone camera opens a clean, mobile-optimized public verification page.
- **Privacy Protection:** Private clinician phone numbers and medical prescription records are protected from the public scanned page.
- **Staff Editability:** Clinicians can update animal notes, weight, or barn pens without altering the permanent QR code URL.

### 3. ESP32 Device Management & Pairing
- Map physical ESP32 boards (e.g., `ESP32-VET-01`) to specific animals (e.g. `VS0001`).
- Generates secure, per-device API keys (`X-API-KEY`) to prevent unauthorized telemetry injection.
- Live inspection of hardware RSSI signal strength and server-side timestamps.

### 4. Isolated Test Utility (Disabled by Default)
- Located in **Settings & Config**.
- Strictly disabled by default with an interactive safety switch.
- When enabled, allows submitting simulated diagnostic packets explicitly tagged as `isTestUtilityData: true` into an isolated test table without corrupting real sensor biometrics.

---

## 🚀 Quick Start Guide (For Testing & Competition)

### 1. Start the Ingestion Gateway (Backend)
Open a terminal in the project directory:
```powershell
cd "C:\Users\shrut\.gemini\antigravity\scratch\vetshield"
npm run server
```
*The server starts on port `5000`.*

### 2. Start the Frontend Dashboard
In a second terminal:
```powershell
cd "C:\Users\shrut\.gemini\antigravity\scratch\vetshield"
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Wire & Flash Your ESP32
Refer to [`firmware/WIRING_AND_SETUP_GUIDE.md`](file:///C:/Users/shrut/.gemini/antigravity/scratch/vetshield/firmware/WIRING_AND_SETUP_GUIDE.md) and open the Arduino sketch:
[`firmware/vetshield_esp32_ds18b20/vetshield_esp32_ds18b20.ino`](file:///C:/Users/shrut/.gemini/antigravity/scratch/vetshield/firmware/vetshield_esp32_ds18b20/vetshield_esp32_ds18b20.ino).

1. Connect DS18B20 to **GPIO 4** with a **4.7kΩ pull-up resistor** to 3.3V.
2. Enter your Wi-Fi credentials and your computer's IP address.
3. Upload to your ESP32.
4. As soon as the board connects to Wi-Fi, actual measured temperature will appear live on your dashboard and on the scanned QR mobile page!
