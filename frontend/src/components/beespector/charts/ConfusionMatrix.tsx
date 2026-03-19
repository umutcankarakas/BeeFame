import React from 'react';

type ConfusionMatrixProps = {
  matrix: { tn: number; fp: number; fn: number; tp: number };
};

function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  const { tn, fp, fn, tp } = matrix;

  return (
    <table style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th></th>
          <th>Predicted 0</th>
          <th>Predicted 1</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Actual 0</td>
          <td style={{ border: '1px solid #ccc', padding: '6px' }}>{tn}</td>
          <td style={{ border: '1px solid #ccc', padding: '6px' }}>{fp}</td>
        </tr>
        <tr>
          <td>Actual 1</td>
          <td style={{ border: '1px solid #ccc', padding: '6px' }}>{fn}</td>
          <td style={{ border: '1px solid #ccc', padding: '6px' }}>{tp}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default ConfusionMatrix;
