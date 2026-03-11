const { onValueCreated } = require("firebase-functions/v2/database");
const { GoogleGenAI } = require("@google/genai");
const admin = require("firebase-admin");

admin.initializeApp();

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Cloud Function: Analyze Gas Data
 * Triggered when new data is pushed to /gas_detector/{pushId}
 */
exports.analyzeGasData = onValueCreated("/gas_detector/{pushId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot.exists()) {
    console.log("No data associated with the event");
    return;
  }
  
  const data = snapshot.val();
  
  // Only analyze if methane is above a certain threshold to save costs
  // or analyze every N minutes. For this demo, we analyze everything.
  
  const prompt = `
    Analyze the following IoT sensor data for potential gas leaks and environmental hazards.
    
    Data:
    - Methane (CH4): ${data.methane} ppm
    - Air Quality (AQI): ${data.air_quality}
    - Temperature: ${data.temperature} °C
    - Humidity: ${data.humidity} %
    
    Provide a risk assessment in JSON format with the following fields:
    - risk_level: "Low", "Moderate", "High", or "Critical"
    - analysis: A short explanation (max 2 sentences).
    - recommendation: Immediate action to take (max 1 sentence).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const analysis = JSON.parse(response.text);
    
    // Write analysis back to the database node
    return snapshot.ref.update({
      ai_analysis: analysis,
      analyzed_at: admin.database.ServerValue.TIMESTAMP
    });
    
  } catch (error) {
    console.error("Error analyzing data:", error);
    return null;
  }
});
