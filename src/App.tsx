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

    // Listen to the ESP32 path
    const sensorRef = query(ref(db, 'gas_detector'), orderByKey(), limitToLast(1));
    const controlRef = ref(db, 'sensors/control/active');
    
    setConnected(true);
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const val = snapshot.val();
      setFirebaseError(null); // Clear any previous errors
      if (val) {
        // val is an object with pushId keys, get the first (and only) one
        const keys = Object.keys(val);
        if (keys.length > 0) {
          const latestData = val[keys[0]];
          const newData: SensorData = {
            methane: latestData.methane || latestData.mq4_raw || 0,
            air_quality: latestData.air_quality || latestData.mq135_raw || 0,
            temperature: latestData.temperature || 0,
            humidity: latestData.humidity || 0,
            soil_moisture: latestData.soil_moisture || latestData.soil_raw || 0,
            timestamp: new Date().toLocaleTimeString(),
            alert_air: latestData.alert_air || false,
            alert_gas: latestData.alert_gas || false,
            alert_soil: latestData.alert_soil || false
          };
          
          updateData(newData);
          setDeviceStatus(prev => ({ ...prev, lastUpdate: Date.now(), online: true }));

          // If the cloud function added AI analysis, use it
          if (latestData.ai_analysis) {
            setAnalysis(latestData.ai_analysis);
          }
        }
      }
    }, (error) => {
      if (error.message.includes("permission_denied")) {
        console.warn("Firebase permission denied. Please update your database rules.");
        setFirebaseError("PERMISSION_DENIED");
      } else {
        console.error("Firebase read error:", error);
        setFirebaseError(error.message);
      }
      
      setConnected(false);
      setDeviceStatus(prev => ({ ...prev, online: false }));
    });

    const unsubscribeControl = onValue(controlRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) {
        setSensorsActive(val);
      }
    });

    return () => {
      unsubscribe();
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

  // AI Analysis & Forecast Trigger
  useEffect(() => {
    // Only trigger if we have real data (methane > 0 or similar check)
    if (data.methane === 0 && data.air_quality === 0) return;

    const analyzeData = async () => {
      setLoading(true);
      try {
        const result = await analyzeRisk(data);
        setAnalysis(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const runForecast = async () => {
      if (history.methane.length < 10) return;
      setForecastLoading(true);
      try {
        const result = await forecastRisk(history.methane.slice(-20));
        setForecast(result);
      } catch (error) {
        console.error("Forecast failed:", error);
      } finally {
        setForecastLoading(false);
      }
    };

    // Debounce analysis
    const timeout = setTimeout(() => {
      analyzeData();
      runForecast();
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [data.methane, data.air_quality]);

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
          />
          <SensorCard 
            label="Air Quality" 
            value={Math.round(data.air_quality)} 
            unit="raw" 
            icon={Wind} 
            status={data.alert_air ? 'danger' : 'safe'} 
          />
          <SensorCard 
            label="Temperature" 
            value={Math.round(data.temperature)} 
            unit="°C" 
            icon={Thermometer} 
            status="safe" 
          />
          <SensorCard 
            label="Humidity" 
            value={Math.round(data.humidity)} 
            unit="%" 
            icon={Droplets} 
            status="safe" 
          />
          <SensorCard 
            label="Soil Moisture" 
            value={Math.round(data.soil_moisture)} 
            unit="raw" 
            icon={Sprout} 
            status={data.alert_soil ? 'warning' : 'safe'} 
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



