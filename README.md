# ⚡ IoT Gas Guard

<div align="center">

![IoT Gas Guard Banner](https://img.shields.io/badge/ESP32-IoT%20Gas%20Guard-00d4ff?style=for-the-badge&logo=espressif&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.5%20Pro-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-00ff88?style=for-the-badge)

**Real-time environmental monitoring powered by ESP32, Firebase & Gemini AI**

*Monitors air quality, methane gas, temperature, humidity and soil moisture — live, from anywhere.*

</div>

---

## 📸 Dashboard Preview

```
╔══════════════════════════════════════════════════════════════╗
║  ⚡ IoT Gas Guard          REAL-TIME ENVIRONMENTAL MONITORING ║
╠══════════╦══════════╦═══════════╦═══════════╦═══════════════╣
║ METHANE  ║   AIR    ║   TEMP    ║ HUMIDITY  ║     SOIL      ║
║  CH4     ║ QUALITY  ║           ║           ║   MOISTURE    ║
║  876 ppm ║ 1245 AQI ║  28.5 °C  ║  65.2 %   ║   2100 %      ║
║  ✅ SAFE  ║ ✅ CLEAN  ║ ✅ NORMAL  ║ ✅ NORMAL  ║   ✅ OK        ║
╠══════════╩══════════╩═══════════╩═══════════╩═══════════════╣
║  📈 LIVE CHART          🤖 AI RISK ASSESSMENT                 ║
║  Methane history        Risk Level: LOW ✅                    ║
║  [live graph here]      "All readings within safe range..."   ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🌟 Features

| Feature | Description |
|---|---|
| 🌫️ **Air Quality** | MQ-135 sensor monitors CO2, smoke, ammonia in real time |
| 💨 **Methane / Gas** | MQ-4 sensor detects CH4 and combustible gas leaks |
| 🌡️ **Temperature** | DHT22 reads ambient temperature with ±0.5°C accuracy |
| 💧 **Humidity** | DHT22 reads relative humidity with ±2% accuracy |
| 🌱 **Soil Moisture** | Capacitive sensor monitors plant/soil water levels |
| 📶 **WiFi Connected** | ESP32 sends data to Firebase every 3 seconds |
| 📈 **Live Charts** | Real-time graphs update automatically in browser |
| 🤖 **Gemini AI** | AI analyzes all sensor readings and gives risk assessment |
| ⚠️ **Smart Alerts** | Automatic danger alerts when thresholds are exceeded |
| 📥 **Export CSV** | Download full sensor history as spreadsheet |
| 🌙 **Dark / Light Mode** | Toggle between dark and light themes |

---

## 🧰 Hardware Required

| Component | Purpose | Power | Data Pin |
|---|---|---|---|
| ESP32 Dev Module | Main microcontroller + WiFi | USB | — |
| SSD1306 OLED 0.96" | Local display | 3.3V | SDA=21, SCL=22 |
| MQ-135 | Air quality (CO2, smoke) | 5V (VIN) | GPIO 35 |
| MQ-4 | Methane / natural gas | 5V (VIN) | GPIO 34 |
| DHT22 | Temperature + Humidity | 3.3V | GPIO 4 |
| Soil Moisture Sensor | Soil / water level | 5V or 3.3V | GPIO 32 |

---

## 🔌 Wiring Guide

### Power Rails (Breadboard)
```
ESP32 3V3  ──→  Green rail  (for OLED, DHT22)
ESP32 VIN  ──→  Red rail    (for MQ-4, MQ-135, Soil)
ESP32 GND  ──→  Blue rail   (all sensors share GND)
```

### OLED SSD1306
```
OLED GND  ──→  GND  (blue rail)
OLED VCC  ──→  3V3  ⚠️ NOT 5V!
OLED SCL  ──→  ESP32 GPIO 22
OLED SDA  ──→  ESP32 GPIO 21
```

### DHT22
```
DHT22 VCC   ──→  3V3  (green rail)
DHT22 DATA  ──→  ESP32 GPIO 4
DHT22 GND   ──→  GND  (blue rail)
```

### MQ-135 (Air Quality)
```
MQ-135 VCC   ──→  VIN (5V)  ⚠️ Must be 5V!
MQ-135 GND   ──→  GND
MQ-135 AOUT  ──→  ESP32 GPIO 35
MQ-135 DOUT  ──→  ❌ not connected
```

### MQ-4 (Methane)
```
MQ-4 VCC   ──→  VIN (5V)  ⚠️ Must be 5V!
MQ-4 GND   ──→  GND
MQ-4 AOUT  ──→  ESP32 GPIO 34
MQ-4 DOUT  ──→  ❌ not connected
```

### Soil Moisture
```
SOIL VCC   ──→  VIN or 3V3
SOIL GND   ──→  GND
SOIL AOUT  ──→  ESP32 GPIO 32
```

> ⚠️ **Important:** Add bridge wires connecting bottom breadboard rails to top rails so all sensors share the same power and GND.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ESP32 Device                          │
│  DHT22 ──┐                                                   │
│  MQ-135 ─┤──→ Reads sensors every 3s ──→ OLED display       │
│  MQ-4 ───┤                          ──→ Serial Monitor       │
│  Soil ───┘                          ──→ Firebase (WiFi)      │
└──────────────────────────┬──────────────────────────────────┘
                           │ WiFi (HTTPS PUT)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              Firebase Realtime Database                       │
│  /sensors/latest  ──→  current readings (updated every 3s)   │
│  /sensors/history ──→  full log of all readings              │
└──────────────────────────┬───────────────────────────────────┘
                           │ onValue() listener
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              IoT Gas Guard Web Dashboard                      │
│  Live cards + charts + Gemini AI analysis + alerts + CSV     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Instructions

### Step 1 — Install Arduino Libraries

Open Arduino IDE → `Sketch → Include Library → Manage Libraries`

| Library | Author |
|---|---|
| `Adafruit SSD1306` | Adafruit |
| `Adafruit GFX Library` | Adafruit |
| `DHT sensor library` | Adafruit |
| `ArduinoJson` | Benoit Blanchon |

### Step 2 — Configure WiFi

In `esp32_complete.ino`, update your credentials:

```cpp
#define WIFI_SSID      "YOUR_WIFI_NAME"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"
```

### Step 3 — Upload Code

1. Connect ESP32 via USB (data cable — not charge-only!)
2. Select board: `Tools → Board → ESP32 Dev Module`
3. Select port: `Tools → Port → COM9` (or your port)
4. Click Upload
5. Hold **BOOT button** when you see `Connecting.....`

### Step 4 — Verify Connection

Open `Tools → Serial Monitor → 115200 baud`. You should see:

```
=== IoT Gas Guard Starting ===
WiFi Connected!
IP: 192.168.1.105
Warming up MQ sensors (30s)...
─────────────────────────────
Temp:     28.5°C
Humidity: 65.2%
MQ-135:   1245 → CLEAN
MQ-4:     876  → SAFE
Soil:     2100 → OK
RSSI:     -58 dBm
Firebase latest: 200   ✅
```

`Firebase latest: 200` means data is flowing! 🎉

### Step 5 — Open Dashboard

Simply open `esp32_dashboard.html` in any browser. Data appears automatically within 5–10 seconds.

---

## 🔥 Firebase Setup

### Database Structure

```json
{
  "sensors": {
    "latest": {
      "temperature": 28.5,
      "humidity": 65.2,
      "mq4_raw": 876,
      "mq135_raw": 1245,
      "soil_raw": 2100,
      "air_label": "CLEAN",
      "gas_label": "SAFE",
      "soil_label": "OK",
      "alert_air": false,
      "alert_gas": false,
      "alert_soil": false,
      "rssi": -58,
      "uptime_seconds": 3600,
      "send_count": 1200
    },
    "history": {
      "-NxABC123": { "temperature": 28.5, "mq4_raw": 876, "..." : "..." },
      "-NxABC124": { "temperature": 28.6, "mq4_raw": 890, "..." : "..." }
    }
  }
}
```

### Firebase Config

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app-default-rtdb.firebaseio.com",
  projectId: "your-app",
  storageBucket: "your-app.firebasestorage.app",
  messagingSenderId: "your-id",
  appId: "your-app-id"
};
```

---

## ⚠️ Alert Thresholds

| Sensor | Safe | Moderate | Danger |
|---|---|---|---|
| MQ-135 (Air) | < 1000 | 1000–2000 | > 2000 |
| MQ-4 (Gas) | < 1000 | 1000–2000 | > 2000 |
| Soil Moisture | < 1500 (WET) | 1500–3000 (OK) | > 3000 (DRY) |
| Temperature | 15–30°C | 30–40°C | > 40°C |
| Humidity | 30–60% | 60–80% | > 80% |

---

## 📁 Project Files

```
IoT-Gas-Guard/
├── esp32_complete.ino        ← Upload this to ESP32
├── esp32_dashboard.html      ← Open this in browser
├── exact_breadboard_wiring.html  ← Wiring guide
└── README.md                 ← This file
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| OLED blank | Check VCC → 3V3 (not VIN). Run I2C scanner |
| Upload fails | Hold BOOT button during `Connecting.....` |
| Serial Monitor blank | Press EN/RST button after upload |
| WiFi not connecting | Check SSID and password in code |
| Firebase: 401 error | Check database rules set to public read/write |
| MQ sensors show 0 | Check VCC → VIN (must be 5V, not 3V3) |
| DHT22 reads NaN | Check DATA pin, try adding 10kΩ pull-up resistor |
| COM port not found | Install CP210x USB driver. Use data USB cable |

---

## 🤖 Gemini AI Integration

The dashboard uses **Gemini 2.5 Pro** to analyze all sensor readings every 60 seconds and provide:

- Overall environment risk level (Low / Medium / High)
- Natural language analysis of current conditions  
- Specific recommendations based on sensor values
- Automatic re-analysis when dangerous values are detected

---

## 👨‍💻 Tech Stack

| Layer | Technology |
|---|---|
| Microcontroller | ESP32 (Xtensa LX6, 240MHz, 4MB flash) |
| Sensors | DHT22, MQ-4, MQ-135, Soil Moisture, SSD1306 |
| Firmware | Arduino C++ (ESP32 Arduino Core) |
| Cloud DB | Firebase Realtime Database |
| Frontend | HTML5 + CSS3 + Chart.js + Firebase SDK |
| AI | Google Gemini 2.5 Pro API |
| Protocol | HTTPS REST (PUT for latest, POST for history) |

---

## 📜 License

MIT License — free to use, modify and distribute.

---

<div align="center">

Built with ❤️ using ESP32 + Firebase + Gemini AI

**⚡ IoT Gas Guard — Keeping your environment safe, in real time**

</div>
