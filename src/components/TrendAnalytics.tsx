import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface TrendAnalyticsProps {
  history: {
    methane: number[];
    air_quality: number[];
    labels: string[];
  };
  theme: 'dark' | 'light';
}

export function TrendAnalytics({ history, theme }: TrendAnalyticsProps) {
  const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { grid: { color: gridColor }, ticks: { color: textColor } }
    }
  };

  const barData = {
    labels: history.labels,
    datasets: [{
      label: 'Air Quality Trend',
      data: history.air_quality,
      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.8)',
      borderRadius: 4
    }]
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="text-secondary text-xs uppercase tracking-widest font-mono mb-6">Environment Trend Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48">
          <h4 className="text-xs text-secondary mb-2 font-mono">AIR QUALITY (WEEKLY AVG)</h4>
          <Bar data={barData} options={options} />
        </div>
        <div className="h-48 flex items-center justify-center border border-[var(--glass-border)] rounded bg-card-inner">
          <p className="text-xs text-secondary">More analytics data gathering...</p>
        </div>
      </div>
    </div>
  );
}
