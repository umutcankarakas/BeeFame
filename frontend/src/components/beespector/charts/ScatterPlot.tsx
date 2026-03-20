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
  positiveColor?: string;
  negativeColor?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  onPointClick,
  customShape,
  xAxisLabel = 'X1',
  yAxisLabel = 'X2',
  positiveColor = '#ff4d4f',
  negativeColor = '#1890ff',
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
        <ScatterChart margin={{ top: 10, right: 20, bottom: 60, left: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -38 }}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => Number(v).toFixed(1)}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10, dy: 50 }}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => Number(v).toFixed(1)}
            width={60}
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
          <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 8 }} />

          <Scatter
            name="Negative (0)"
            data={negativeData}
            fill={negativeColor}
            shape={customShape || defaultDot}
            onClick={onPointClick}
          />
          <Scatter
            name="Positive (1)"
            data={positiveData}
            fill={positiveColor}
            shape={customShape || defaultDot}
            onClick={onPointClick}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterPlot;
