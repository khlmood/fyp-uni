import React from 'react';

const MiniChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-sm p-1 border border-border rounded shadow-sm text-foreground text-xs">
        <p>{`Price: $${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

export default MiniChartTooltip;