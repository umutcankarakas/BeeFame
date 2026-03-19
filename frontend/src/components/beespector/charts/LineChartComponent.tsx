import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type LineChartProps = {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  line1Key: string;
  line2Key?: string;
  line1Label?: string;
  line2Label?: string;
};

function LineChartComponent({
  data,
  xKey,
  line1Key,
  line2Key,
  line1Label,
  line2Label,
}: LineChartProps) {
  return (
    <LineChart
      width={300}
      height={200}
      data={data}
      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey={line1Key}
        stroke="#8884d8"
        dot={false}
        name={line1Label || line1Key}
      />
      {line2Key && (
        <Line
          type="monotone"
          dataKey={line2Key}
          stroke="#82ca9d"
          dot={false}
          name={line2Label || line2Key}
        />
      )}
    </LineChart>
  );
}

export default LineChartComponent;
