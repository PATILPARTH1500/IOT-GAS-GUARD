import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoryChartProps {
  data: number[];
  labels: string[];
  color: string;
  label: string;
  theme: 'dark' | 'light';
}

export function HistoryChart({ data, labels, color, label, theme }: HistoryChartProps) {
  const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBg = theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
  const tooltipText = theme === 'dark' ? '#fff' : '#000';

  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        fill: true,
        borderColor: color,
        backgroundColor: `${color}20`, // 20 = 12% opacity
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: gridColor,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false, // Hide X axis for cleaner look
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        suggestedMax: 100, // Keeps the chart from looking too flat when values are low
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: {
            family: 'monospace',
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="w-full h-64 glass-panel p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-secondary text-sm uppercase tracking-wider font-mono">{label} History</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-emerald-500 font-mono">LIVE</span>
        </div>
      </div>
      <div className="h-48 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
