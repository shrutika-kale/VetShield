/*
 * ==============================================================================
 *  VetShield - Physical ESP32 Livestock Telemetry Firmware
 *  Sensor: DS18B20 Waterproof 1-Wire Digital Temperature Probe
 *  Target Microcontroller: ESP32 Dev Module / NodeMCU-32S
 * ==============================================================================
 * 
 * WIRING DIAGRAM (DS18B20 to ESP32):
 * ------------------------------------------------------------------------------
 *  DS18B20 Wire Color   Function     ESP32 Pin
 *  ------------------------------------------------------------------------------
 *  RED                  VCC          3.3V (or 5V)
 *  BLACK / BLUE         GND          GND
 *  YELLOW / WHITE       DATA         GPIO 4 (D4)
 *  
 *  CRITICAL REQUIREMENT:
 *  Connect a 4.7k Ohm resistor between VCC (3.3V) and DATA (GPIO 4) as a pull-up!
 *  Without this resistor, the sensor cannot communicate on the 1-Wire bus.
 * ------------------------------------------------------------------------------
 * 
 * REQUIRED ARDUINO IDE LIBRARIES (Install via Tools > Manage Libraries):
 *  1. "OneWire" by Jim Studt, Tom Pollard, Robin Bliss, Paul Stoffregen
 *  2. "DallasTemperature" by Miles Burton
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ==============================================================================
// 1. NETWORK & INGESTION CONFIGURATION
// Replace with your local Wi-Fi credentials and computer's LAN IP address.
// To find your IP on Windows: Open PowerShell and type 'ipconfig' (e.g. 192.168.1.14)
// ==============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_NAME";        // <-- Put your Wi-Fi name here
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";    // <-- Put your Wi-Fi password here

// Ingestion Endpoint: Use your computer's local IP address on port 5000
const char* SERVER_URL    = "http://192.168.1.14:5000/api/telemetry";

// Device Identification & Security Key (from VetShield Device Management tab)
const char* DEVICE_ID     = "ESP32-VET-01";
const char* DEVICE_API_KEY= "vetshield_sec_esp32_k8912x";

// Hardware Pin Configuration
const int ONE_WIRE_BUS    = 4;     // DS18B20 Data pin connected to GPIO 4
const int LED_STATUS_PIN  = 2;     // Built-in blue LED on most ESP32 boards

// Telemetry Transmission Frequency
const unsigned long SEND_INTERVAL_MS = 10000; // Transmit reading every 10 seconds

// ==============================================================================
// 2. HARDWARE INSTANCES
// ==============================================================================
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

unsigned long lastSendTime = 0;
int transmissionCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_STATUS_PIN, OUTPUT);
  digitalWrite(LED_STATUS_PIN, LOW);

  Serial.println("\n=======================================================");
  Serial.println("  VetShield ESP32 Hardware Firmware (DS18B20 1-Wire)  ");
  Serial.println("  Device ID: " + String(DEVICE_ID));
  Serial.println("=======================================================");

  // Initialize DS18B20 Probe
  Serial.println("[SENSOR] Initializing DS18B20 probe on GPIO " + String(ONE_WIRE_BUS) + "...");
  sensors.begin();
  int deviceCount = sensors.getDeviceCount();
  Serial.printf("[SENSOR] Detected %d physical 1-Wire temperature sensor(s).\n", deviceCount);

  if (deviceCount == 0) {
    Serial.println("[WARNING] No DS18B20 detected! Please verify:");
    Serial.println("  1. 4.7k Ohm pull-up resistor between 3.3V and GPIO 4.");
    Serial.println("  2. Red to 3.3V, Black to GND, Yellow/White to GPIO 4.");
  }

  // Connect to Wi-Fi
  connectToWiFi();
}

void loop() {
  // Ensure Wi-Fi remains connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[NETWORK] Wi-Fi lost. Attempting reconnection...");
    connectToWiFi();
  }

  // Periodic Telemetry Acquisition
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = currentMillis;
    readAndTransmitVitals();
  }
}

// ------------------------------------------------------------------------------
// Helper: Connect to Local Wi-Fi
// ------------------------------------------------------------------------------
void connectToWiFi() {
  Serial.printf("[WIFI] Connecting to SSID: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.print("[WIFI] ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
    Serial.printf("[WIFI] Signal Strength (RSSI): %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n[WIFI] Connection failed. Will retry next cycle.");
  }
}

// ------------------------------------------------------------------------------
// Helper: Acquire Sensor Temperature & Transmit Authenticated Payload
// ------------------------------------------------------------------------------
void readAndTransmitVitals() {
  digitalWrite(LED_STATUS_PIN, HIGH); // Blink LED during transmission

  Serial.println("\n-------------------------------------------------------");
  Serial.printf("[SAMPLE #%d] Requesting DS18B20 core temperature...\n", ++transmissionCounter);

  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  // Sensor Fault Checks
  if (tempC == DEVICE_DISCONNECTED_C || tempC <= -100.0) {
    Serial.println("[ERROR] Sensor Disconnected (-127°C). Wire fault or missing pull-up.");
    Serial.println("[ACTION] Packet dropped. Not sending invalid reading to backend.");
    digitalWrite(LED_STATUS_PIN, LOW);
    return;
  }

  if (tempC == 85.0) {
    Serial.println("[ERROR] Power-on reset glitch detected (85.0°C). Reading skipped.");
    digitalWrite(LED_STATUS_PIN, LOW);
    return;
  }

  Serial.printf("[SENSOR OK] Actual Measured Body Temp: %.2f °C\n", tempC);

  // Construct JSON Payload
  int rssiVal = WiFi.RSSI();
  String jsonPayload = "{";
  jsonPayload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"temperature\":" + String(tempC, 2) + ",";
  jsonPayload += "\"unit\":\"C\",";
  jsonPayload += "\"battery\":98,";
  jsonPayload += "\"rssi\":" + String(rssiVal) + ",";
  jsonPayload += "\"firmwareVersion\":\"2.0.0-ds18b20\"";
  jsonPayload += "}";

  // Transmit over HTTP/HTTPS
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-KEY", DEVICE_API_KEY); // Secure device key

    Serial.printf("[INGESTION] Transmitting to: %s\n", SERVER_URL);
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("[SUCCESS] HTTP %d: %s\n", httpResponseCode, response.c_str());
    } else {
      Serial.printf("[FAILED] HTTP Error code: %d (%s)\n", httpResponseCode, http.errorToString(httpResponseCode).c_str());
      Serial.println("[HINT] Verify that the backend server is running on port 5000 and firewall allows port 5000.");
    }
    http.end();
  } else {
    Serial.println("[ABORT] Cannot transmit: No Wi-Fi connection.");
  }

  digitalWrite(LED_STATUS_PIN, LOW);
}
