export interface SensorData {
  methane: number; // mapped from mq4_raw
  air_quality: number; // mapped from mq135_raw
  temperature: number; // mapped from temperature
  humidity: number; // mapped from humidity
  soil_moisture: number; // mapped from soil_raw
  timestamp: string;
  alert_air?: boolean;
  alert_gas?: boolean;
  alert_soil?: boolean;
}

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export interface AIAnalysis {
  risk_level: RiskLevel;
  analysis: string;
  recommendation: string;
  timestamp?: string;
}

export interface RiskForecast {
  predicted_risk: RiskLevel;
  reason: string;
  preventive_action: string;
}

export interface Incident {
  id: string;
  type: 'spike' | 'warning' | 'critical' | 'offline' | 'reconnect';
  message: string;
  timestamp: string;
}

export interface DeviceStatus {
  id: string;
  online: boolean;
  lastUpdate: number;
  sensors: {
    mq4: boolean;
    mq135: boolean;
    dht22: boolean;
    soil: boolean;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastUpdate: string;
}
