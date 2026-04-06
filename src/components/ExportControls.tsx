import React from 'react';
import { Download, FileText } from 'lucide-react';
import { SensorData, Incident, AIAnalysis } from '../types';

interface ExportControlsProps {
  dataHistory: {
    methane: number[];
    air_quality: number[];
    labels: string[];
  };
  currentData: SensorData;
  analysis: AIAnalysis;
  incidents: Incident[];
}

export function ExportControls({ dataHistory, currentData, analysis, incidents }: ExportControlsProps) {
  
  const downloadCSV = () => {
    const headers = ["Timestamp", "Methane (ppm)", "Air Quality (AQI)"];
    const rows = dataHistory.labels.map((label, i) => [
      label,
      dataHistory.methane[i],
      dataHistory.air_quality[i]
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gas_guard_data_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      history: dataHistory,
      current: currentData,
      analysis: analysis,
      incidents: incidents
    }, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `gas_guard_export_${new Date().toISOString()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    reportWindow.document.write(`
      <html>
        <head>
          <title>IoT Gas Guard Safety Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #000; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .section { margin-bottom: 30px; }
            .metric { font-size: 14px; margin-bottom: 5px; }
            .risk-high { color: red; font-weight: bold; }
            .risk-low { color: green; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>IoT Gas Guard - Safety Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          
          <div class="section">
            <h2>Current Status</h2>
            <p class="metric">Methane: <strong>${currentData.methane.toFixed(1)} ppm</strong></p>
            <p class="metric">Air Quality: <strong>${currentData.air_quality.toFixed(1)} AQI</strong></p>
            <p class="metric">Risk Level: <span class="${analysis.risk_level === 'High' || analysis.risk_level === 'Critical' ? 'risk-high' : 'risk-low'}">${analysis.risk_level}</span></p>
          </div>

          <div class="section">
            <h2>AI Analysis</h2>
            <p><strong>Analysis:</strong> ${analysis.analysis}</p>
            <p><strong>Recommendation:</strong> ${analysis.recommendation}</p>
          </div>

          <div class="section">
            <h2>Recent Incidents</h2>
            <table>
              <thead><tr><th>Time</th><th>Type</th><th>Message</th></tr></thead>
              <tbody>
                ${incidents.map(inc => `<tr><td>${inc.timestamp}</td><td>${inc.type}</td><td>${inc.message}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          
          <script>window.print();</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  return (
    <div className="glass-panel p-4 flex gap-2 justify-end">
      <button onClick={downloadCSV} className="flex items-center gap-2 px-3 py-2 bg-[var(--glass-bg)] hover:bg-black/10 dark:hover:bg-white/10 rounded text-xs text-secondary transition-colors">
        <Download className="w-4 h-4" /> Export CSV
      </button>
      <button onClick={downloadJSON} className="flex items-center gap-2 px-3 py-2 bg-[var(--glass-bg)] hover:bg-black/10 dark:hover:bg-white/10 rounded text-xs text-secondary transition-colors">
        <Download className="w-4 h-4" /> Export JSON
      </button>
      <button onClick={generateReport} className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 rounded text-xs transition-colors">
        <FileText className="w-4 h-4" /> Generate Report
      </button>
    </div>
  );
}
