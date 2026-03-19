import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type HistogramPoint = {
  bin: string;
  value: number;
};

type HistogramProps = {
  data: HistogramPoint[];
  featureName: string;
};

function Histogram({ data, featureName }: HistogramProps) {
  if (!data || data.length === 0) {
    return <div>No histogram data available for {featureName}.</div>;
  }

  return (
    <div>
      {}
      {}
      <BarChart
        width={400}
        height={200}
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bin" />
        <YAxis allowDecimals={false} /> {}
        <Tooltip />
        <Bar
          dataKey="value"
          fill="#82ca9d"
        />
      </BarChart>
    </div>
  );
}

export default Histogram;
