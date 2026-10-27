# VetShield - Physical Hardware Wiring & Setup Guide
**ESP32 Microcontroller + DS18B20 Waterproof Temperature Probe**

---

## 1. 🔌 Hardware Wiring Diagram

The **DS18B20** is a digital 1-Wire temperature sensor. It requires a **4.7kΩ pull-up resistor** between its **DATA** line and **3.3V (VCC)** to maintain stable communication.

### Pinout Connections:

```text
       DS18B20 Probe                   ESP32 Dev Module
   +--------------------+             +------------------+
   |                    |             |                  |
   |   RED (VCC)  ------+-------------+ 3.3V (or 5V)     |
   |                    |   [ 4.7kΩ ] |                  |
   |                    |   Resistor  |                  |
   |   YELLOW (DATA) ---+------/\/\---+ GPIO 4 (D4)      |
   |                    |             |                  |
   |   BLACK (GND) -----+-------------+ GND              |
   |                    |             |                  |
   +--------------------+             +------------------+
```

> ⚠️ **CRITICAL NOTE:** If you do not connect the 4.7kΩ resistor between Data (Yellow) and 3.3V (Red), the sensor will report `-127.00°C`. VetShield's firmware and backend will detect and reject this reading as a hardware fault.

---

## 2. 💻 Arduino IDE Setup Steps

### Step 1: Install the ESP32 Board Package
1. Open **Arduino IDE**.
2. Go to **File > Preferences**.
3. In **Additional Board Manager URLs**, paste:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**.
5. Go to **Tools > Board > Boards Manager...**, search for `esp32` by Espressif Systems, and click **Install**.

### Step 2: Install Required Sensor Libraries
1. Go to **Tools > Manage Libraries...** (or press `Ctrl + Shift + I`).
2. Search for and install:
   - **OneWire** (by Paul Stoffregen / Jim Studt)
   - **DallasTemperature** (by Miles Burton)

### Step 3: Open the VetShield Sketch
Open the sketch file located at:
```text
vetshield\firmware\vetshield_esp32_ds18b20\vetshield_esp32_ds18b20.ino
```

### Step 4: Configure Wi-Fi & Server IP
At the top of `vetshield_esp32_ds18b20.ino`, update:
```cpp
const char* WIFI_SSID     = "Your_WiFi_Name";        // Your 2.4GHz Wi-Fi name
const char* WIFI_PASSWORD = "Your_WiFi_Password";    // Your Wi-Fi password

// Your computer's local network IP on port 5000:
const char* SERVER_URL    = "http://192.168.1.14:5000/api/telemetry";

const char* DEVICE_ID     = "ESP32-VET-01";
const char* DEVICE_API_KEY= "vetshield_sec_esp32_k8912x";
```

> 💡 **How to find your computer's IP address on Windows:**
> Open PowerShell and run `ipconfig`. Look for **IPv4 Address** under your active Wi-Fi adapter (e.g. `192.168.1.14`).

### Step 5: Upload the Firmware
1. Connect your ESP32 to your computer using a USB data cable.
2. Under **Tools > Board**, select **ESP32 Dev Module** (or your specific ESP32 board).
3. Under **Tools > Port**, select the COM port of your ESP32 (e.g., `COM3`, `COM4`).
4. Click the **Upload** button (Arrow icon).
   *(If the IDE gets stuck on `Connecting......._____`, press and hold the **BOOT** button on your ESP32 until the upload progress percentage starts).*
5. Open **Tools > Serial Monitor** and set baud rate to **115200**.

---

## 3. 🖥️ Running the VetShield Ingestion Gateway & Frontend

### Terminal 1: Start the Ingestion Gateway (Backend)
```powershell
cd "C:\Users\shrut\.gemini\antigravity\scratch\vetshield"
npm run server
```
*You will see:*
```text
=======================================================
 VetShield IoT Ingestion Gateway Running on Port 5000
 Ingestion URL: http://<YOUR_LOCAL_IP>:5000/api/telemetry
 Device Key Authentication: X-API-KEY header required
 Sensor Supported: DS18B20 (OneWire digital probe)
=======================================================
```

### Terminal 2: Start the Web Dashboard (Frontend)
```powershell
cd "C:\Users\shrut\.gemini\antigravity\scratch\vetshield"
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 4. 📱 How to Test the Animal QR Code System

1. In the VetShield web dashboard, go to the **Animals Registry** tab.
2. Click **"QR Tag"** on any animal (e.g. **Bella - VS0001**).
3. Click **"Save Label PNG"** or **"Print Tag"** to get a physical sticker label.
4. Open the camera on your phone (make sure your phone is connected to the same Wi-Fi network).
5. Point your camera at the QR code on your computer screen.
6. A notification link will appear. Tap it to open the **mobile-friendly public verification page**.
7. You will see the animal's name, species, registration date, and **actual live temperature reading** streamed from your ESP32 hardware!
