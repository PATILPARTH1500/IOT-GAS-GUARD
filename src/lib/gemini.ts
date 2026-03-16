import { GoogleGenAI, Type } from "@google/genai";
import { SensorData, AIAnalysis, RiskForecast } from "../types";

// Initialize Gemini API
// Use import.meta.env for Vite, fallback to the provided key
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "AIzaSyDESYkOot38jjuoMuvZHbua7peujEEJ0PU";
const ai = new GoogleGenAI({ apiKey });

export async function analyzeRisk(sensorData: SensorData): Promise<AIAnalysis> {
  const prompt = `
    Analyze the following IoT sensor data for potential gas leaks and environmental hazards.
    
    Data:
    - Methane (MQ4 Raw): ${sensorData.methane}
    - Air Quality (MQ135 Raw): ${sensorData.air_quality}
    - Temperature: ${sensorData.temperature} °C
    - Humidity: ${sensorData.humidity} %
    - Soil Moisture (Raw): ${sensorData.soil_moisture}
    
    Provide a risk assessment in JSON format with the following fields:
    - risk_level: "Low", "Moderate", "High", or "Critical"
    - analysis: A short explanation (max 2 sentences).
    - recommendation: Immediate action to take (max 1 sentence).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk_level: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
          analysis: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function forecastRisk(history: number[]): Promise<RiskForecast> {
  const prompt = `
    Analyze the following sequence of sensor readings (last 20 points) to predict the risk level for the next 10 minutes.
    
    Data History (Newest last):
    ${JSON.stringify(history)}
    
    Provide a forecast in JSON:
    - predicted_risk: "Low", "Moderate", "High", "Critical"
    - reason: Why do you predict this? (Trend analysis)
    - preventive_action: What should be done now to prevent this?
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predicted_risk: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
          reason: { type: Type.STRING },
          preventive_action: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithAssistant(message: string, context: SensorData): Promise<string> {
  const prompt = `
    You are an AI assistant for an IoT Gas Detection System.
    Current Sensor Data:
    ${JSON.stringify(context)}
    
    User Question: "${message}"
    
    Answer concisely and professionally based on the sensor data.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "I'm sorry, I couldn't process that request.";
}
