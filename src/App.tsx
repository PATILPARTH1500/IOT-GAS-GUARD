/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SensorCard } from './components/SensorCard';
import { HistoryChart } from './components/HistoryChart';
import { AIInsight } from './components/AIInsight';
import { RiskForecastCard } from './components/RiskForecastCard';
import { IncidentTimeline } from './components/IncidentTimeline';
import { SensorHealth } from './components/SensorHealth';
import { AIChat } from './components/AIChat';
import { ExportControls } from './components/ExportControls';
import { TrendAnalytics } from './components/TrendAnalytics';
import { SensorData, AIAnalysis, RiskForecast, Incident, DeviceStatus } from './types';
import { Activity, Wind, Thermometer, Droplets, Zap, Wifi, WifiOff, Volume2, VolumeX, Sun, Moon, Sprout, Power } from 'lucide-react';
import { clsx } from 'clsx';
import { ref, onValue, off, set, query, orderByKey, limitToLast } from 'firebase/database';
import { db } from './lib/firebase';
import { analyzeRisk, forecastRisk } from './lib/gemini';

// Initial state
const initialData: SensorData = {
  methane: 0,
  air_quality: 0,
  temperature: 0,
  humidity: 0,
  soil_moisture: 0,
  timestamp: new Date().toISOString()
};

const initialAnalysis: AIAnalysis = {
  risk_level: "Low",
  analysis: "System initialized. Waiting for sensor data...",
  recommendation: "Monitor system status."
};

const initialDeviceStatus: DeviceStatus = {
  id: 'ESP32_01',
  online: true,
  lastUpdate: Date.now(),
  sensors: { mq4: true, mq135: true, dht22: true, soil: true }
};

export default function App() {
  const [data, setData] = useState<SensorData>(initialData);
  const [history, setHistory] = useState<{
    methane: number[];
    air_quality: number[];
    labels: string[];
  }>({ methane: [], air_quality: [], labels: [] });
  
  const [analysis, setAnalysis] = useState<AIAnalysis>(initialAnalysis);
  const [forecast, setForecast] = useState<RiskForecast | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(initialDeviceStatus);
  
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sensorsActive, setSensorsActive] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Theme Effect
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Firebase Listener
  useEffect(() => {
    if (!db) return;

    // Listen to multiple possible ESP32 paths to ensure we catch the data
    const gasDetectorRef = query(ref(db, 'gas_detector'), limitToLast(10));
    const sensorsLatestRef = ref(db, 'sensors/latest');
    const controlRef = ref(db, 'sensors/control/active');
    
    setConnected(true);
    
    const handleSensorData = (val: any) => {
      if (!val) return;
      
      let latestData = null;
      
      // Check if it's a direct object (keys are methane, temperature, etc.)
      if (val.methane !== undefined || val.mq4_raw !== undefined || val.temperature !== undefined || val.gas !== undefined) {
        latestData = val;
      } else {
        // It's likely a list of pushes. Get the last one.
        const keys = Object.keys(val);
        if (keys.length > 0) {
          const lastKey = keys[keys.length - 1];
          latestData = val[lastKey];
        }
      }

      if (latestData) {
        // Handle case where ESP32 pushes a JSON string instead of an object
        if (typeof latestData === 'string') {
          try {
            latestData = JSON.parse(latestData);
          } catch (e) {
            console.error("Failed to parse sensor data string:", e);
            return;
          }
        }

        const newData: SensorData = {
          methane: Number(latestData.methane || latestData.mq4_raw || latestData.gas || 0),
          air_quality: Number(latestData.air_quality || latestData.mq135_raw || latestData.aqi || 0),
          temperature: Number(latestData.temperature || latestData.temp || 0),
          humidity: Number(latestData.humidity || latestData.hum || 0),
          soil_moisture: Number(latestData.soil_moisture || latestData.soil_raw || latestData.soil || 0),
          timestamp: new Date().toLocaleTimeString(),
          alert_air: Boolean(latestData.alert_air || false),
          alert_gas: Boolean(latestData.alert_gas || false),
          alert_soil: Boolean(latestData.alert_soil || false)
        };
        
        updateData(newData);
        setDeviceStatus(prev => ({ ...prev, lastUpdate: Date.now(), online: true }));

        // If the cloud function added AI analysis, use it
        if (latestData.ai_analysis) {
          setAnalysis(latestData.ai_analysis);
        }
      }
    };

    const unsubGas = onValue(gasDetectorRef, (snapshot) => {
      setFirebaseError(null);
      handleSensorData(snapshot.val());
    }, (error) => {
      if (error.message.includes("permission_denied")) {
        console.warn("Firebase permission denied on gas_detector.");
        setFirebaseError("PERMISSION_DENIED");
      } else {
        console.error("Firebase read error:", error);
        setFirebaseError(error.message);
      }
      setConnected(false);
      setDeviceStatus(prev => ({ ...prev, online: false }));
    });

    const unsubSensors = onValue(sensorsLatestRef, (snapshot) => {
      setFirebaseError(null);
      handleSensorData(snapshot.val());
    }, (error) => {
      // Ignore permission denied on sensors/latest if gas_detector works
      console.warn("Firebase read error on sensors/latest:", error);
    });

    const unsubscribeControl = onValue(controlRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) {
        setSensorsActive(val);
      }
    });

    return () => {
      unsubGas();
      unsubSensors();
      unsubscribeControl();
    };
  }, []);

  const toggleSensors = () => {
    if (!db) return;
    const newState = !sensorsActive;
    setSensorsActive(newState);
    set(ref(db, 'sensors/control/active'), newState).catch(err => {
      console.error("Failed to update sensor state:", err);
      // Revert state if failed
      setSensorsActive(!newState);
    });
  };

  // Alarm Logic & Voice Alert
  useEffect(() => {
    if (analysis.risk_level === 'Critical' || analysis.risk_level === 'High') {
      if (soundEnabled) startAlarm();
      
      // Voice Alert
      if (soundEnabled && 'speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance(`Warning. ${analysis.risk_level} risk detected. ${analysis.recommendation}`);
        window.speechSynthesis.speak(msg);
      }
      
      // Add Incident
      addIncident('critical', `${analysis.risk_level} Risk Detected: ${analysis.analysis}`);
    } else {
      stopAlarm();
    }
  }, [analysis.risk_level]);

  const addIncident = (type: Incident['type'], message: string) => {
    setIncidents(prev => {
      // Prevent duplicate recent messages
      if (prev.length > 0 && prev[prev.length - 1].message === message && 
          Date.now() - parseInt(prev[prev.length - 1].id) < 60000) {
        return prev;
      }
      return [...prev, {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toLocaleTimeString()
      }].slice(-50);
    });
  };

  const startAlarm = () => {
    if (!audioContextRef.current) return;
    if (oscillatorRef.current) return; // Already playing

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, audioContextRef.current.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, audioContextRef.current.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start();
    
    // Pulse effect
    const interval = setInterval(() => {
      if (audioContextRef.current && osc) {
        osc.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioContextRef.current.currentTime + 0.5);
      }
    }, 1000);

    oscillatorRef.current = osc;
    (osc as any).interval = interval;
  };

  const stopAlarm = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      clearInterval((oscillatorRef.current as any).interval);
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
  };

  const handleGetAIAnalysis = async () => {
    if (data.methane === 0 && data.air_quality === 0) return;

    setLoading(true);
    setForecastLoading(true);

    try {
      // Run both analysis and forecast in parallel
      const [analysisResult, forecastResult] = await Promise.all([
        analyzeRisk(data),
        history.methane.length >= 10 ? forecastRisk(history.methane.slice(-20)) : Promise.resolve(null)
      ]);

      setAnalysis(analysisResult);
      if (forecastResult) {
        setForecast(forecastResult);
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setLoading(false);
      setForecastLoading(false);
    }
  };

  // Sensor Health Monitor
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // ESP32 might send data every 30-60 seconds, so we wait 90 seconds before marking offline
      if (now - deviceStatus.lastUpdate > 90000) {
        if (deviceStatus.online) {
          setDeviceStatus(prev => ({ ...prev, online: false }));
          addIncident('offline', 'Device connection lost');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [deviceStatus.lastUpdate, deviceStatus.online]);

  const updateData = (newData: SensorData) => {
    setData(newData);
    setHistory(prev => {
      const newLabels = [...prev.labels, newData.timestamp].slice(-50); // Keep last 50 points
      const newMethane = [...prev.methane, newData.methane].slice(-50);
      const newAQI = [...prev.air_quality, newData.air_quality].slice(-50);
      return { labels: newLabels, methane: newMethane, air_quality: newAQI };
    });
  };

  if (!db) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-yellow-950/30 border border-yellow-500/50 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4 text-yellow-500">
            <Zap className="w-12 h-12" />
            <h1 className="text-3xl font-bold">Firebase Not Configured</h1>
          </div>
          <p className="text-gray-300 text-lg">
            The application cannot connect to Firebase because the configuration is missing.
          </p>
          <div className="bg-black/50 dark:bg-black/50 p-6 rounded-xl border border-black/10 dark:border-white/10 space-y-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">How to fix this:</h2>
            <ol className="list-decimal list-inside space-y-3 text-[var(--text-secondary)]">
              <li>Open the <strong>Settings</strong> menu in AI Studio (gear icon).</li>
              <li>Add your Firebase configuration variables (e.g., <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_DATABASE_URL</code>, etc.).</li>
              <li>Restart the dev server or refresh the page.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (firebaseError === "PERMISSION_DENIED") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-red-950/30 border border-red-500/50 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4 text-red-500">
            <Zap className="w-12 h-12" />
            <h1 className="text-3xl font-bold">Firebase Permission Denied</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Your Firebase Realtime Database is currently locked. The web application cannot read the sensor data from your ESP32.
          </p>
          <div className="bg-black/50 dark:bg-black/50 p-6 rounded-xl border border-black/10 dark:border-white/10 space-y-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">How to fix this in 30 seconds:</h2>
            <ol className="list-decimal list-inside space-y-3 text-[var(--text-secondary)]">
              <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Firebase Console</a></li>
              <li>Open your project (<strong>gas-sensor-webapp</strong>)</li>
              <li>Click on <strong>Realtime Database</strong> in the left menu</li>
              <li>Click on the <strong>Rules</strong> tab at the top</li>
              <li>Copy and paste this exact code into the editor:</li>
            </ol>
            <pre className="bg-gray-900 p-4 rounded-lg text-green-400 font-mono text-sm overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
            </pre>
            <ol className="list-decimal list-inside space-y-3 text-[var(--text-secondary)]" start={6}>
              <li>Click the blue <strong>Publish</strong> button</li>
            </ol>
          </div>
          <p className="text-sm text-[var(--text-secondary)] text-center">
            Once you publish the new rules, this page will automatically disappear and show your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 relative overflow-hidden transition-colors duration-300 pb-24">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-red-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col xl:flex-row justify-between items-center glass-panel p-4 md:p-6 gap-4">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">IoT Gas Guard</h1>
              <p className="text-xs text-secondary font-mono uppercase tracking-widest">Real-time Environmental Monitoring</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
            <button 
              onClick={toggleSensors}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 shadow-sm",
                sensorsActive 
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/20" 
                  : "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20"
              )}
            >
              <Power className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wider">{sensorsActive ? "SENSORS ON" : "SENSORS OFF"}</span>
            </button>

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-500" /> : <VolumeX className="w-5 h-5 text-secondary" />}
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card-inner border border-black/10 dark:border-white/10">
              {connected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
              <span className="text-xs font-mono text-secondary">{connected ? "CONNECTED" : "OFFLINE"}</span>
            </div>
          </div>
        </header>

        {/* Top Row: Sensor Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <SensorCard 
            label="Methane (CH4)" 
            value={Math.round(data.methane)} 
            unit="raw" 
            icon={Zap} 
            status={data.alert_gas ? 'danger' : 'safe'} 
            max={4095}
          />
          <SensorCard 
            label="Air Quality" 
            value={Math.round(data.air_quality)} 
            unit="raw" 
            icon={Wind} 
            status={data.alert_air ? 'danger' : 'safe'} 
            max={4095}
          />
          <SensorCard 
            label="Temperature" 
            value={Math.round(data.temperature)} 
            unit="°C" 
            icon={Thermometer} 
            status="safe" 
            max={60}
          />
          <SensorCard 
            label="Humidity" 
            value={Math.round(data.humidity)} 
            unit="%" 
            icon={Droplets} 
            status="safe" 
            max={100}
          />
          <SensorCard 
            label="Soil Moisture" 
            value={data.soil_moisture > 2000 ? "DRY" : "WET"} 
            unit="" 
            icon={Sprout} 
            status={data.alert_soil ? 'warning' : 'safe'} 
            max={4095}
            gaugeValue={data.soil_moisture}
          />
        </div>

        {/* Middle Row: Charts & AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Charts */}
          <div className="lg:col-span-2 space-y-6">
            <HistoryChart 
              data={history.methane} 
              labels={history.labels} 
              color="#00ff9d" 
              label="Methane Levels" 
              theme={theme}
            />
            <TrendAnalytics history={history} theme={theme} />
          </div>

          {/* Right Column: AI Analysis */}
          <div className="lg:col-span-1 space-y-6">
            <AIInsight 
              riskLevel={analysis.risk_level} 
              analysis={analysis.analysis} 
              recommendation={analysis.recommendation} 
              loading={loading}
              onAnalyze={handleGetAIAnalysis}
            />
            <RiskForecastCard forecast={forecast} loading={forecastLoading} />
          </div>
        </div>

        {/* Bottom Row: Timeline, Map, Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          <div className="lg:col-span-2">
            <IncidentTimeline incidents={incidents} />
          </div>
          <div className="flex flex-col gap-6">
            <SensorHealth status={deviceStatus} />
            <ExportControls 
              dataHistory={history} 
              currentData={data} 
              analysis={analysis} 
              incidents={incidents} 
            />
          </div>
        </div>
      </div>

      {/* Floating Chat */}
      <AIChat sensorData={data} />
    </div>
  );
}



