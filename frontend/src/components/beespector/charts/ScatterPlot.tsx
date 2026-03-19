import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ScatterPlotProps {
  data: Array<{
    id: number;
    x: number;
    y: number;
    pred_label: number;
  }>;
  onPointClick: (data: any) => void;
  customShape?: (props: any) => React.ReactElement;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  onPointClick,
  customShape,
  xAxisLabel = 'X1',
  yAxisLabel = 'X2',
}) => {
  // Separate data by prediction label
  const positiveData = data.filter((d) => d.pred_label === 1);
  const negativeData = data.filter((d) => d.pred_label === 0);

  const defaultDot = (props: any) => {
    const { cx, cy, fill } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={fill}
        stroke="#fff"
        strokeWidth={1}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  return (
    <div
      className="chart-container"
      style={{ width: '100%', height: '400px' }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload;
                return (
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>ID: {data.id}</p>
                    <p style={{ margin: '0 0 2px 0' }}>
                      {xAxisLabel}: {data.x.toFixed(2)}
                    </p>
                    <p style={{ margin: '0 0 2px 0' }}>
                      {yAxisLabel}: {data.y.toFixed(2)}
                    </p>
                    <p style={{ margin: '0' }}>Prediction: {data.pred_label}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />

          <Scatter
            name="Negative (0)"
            data={negativeData}
            fill="#1890ff"
            shape={customShape || defaultDot}
            onClick={onPointClick}
          />
          <Scatter
            name="Positive (1)"
            data={positiveData}
            fill="#ff4d4f"
            shape={customShape || defaultDot}
            onClick={onPointClick}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterPlot;
