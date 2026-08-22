/**
 * Compass component vocabulary (DESIGN_SPEC §4): `FunnelSteps`
 *
 * A vertical stepped funnel showing drop-off between stages. Props: an array of steps,
 * each with a name and a count. Render each step as a horizontal bar whose width is
 * proportional to the first step's count, with the absolute count and the percentage
 * of the first step. Between consecutive steps show the drop-off as a number and a
 * percentage. Pure inline SVG or divs with token colours - do not import any charting library.
 * When the array is empty render an empty state sentence.
 */

import type { ReactNode } from 'react';

interface FunnelStep {
  name: string;
  count: number;
}

export function FunnelSteps({ steps }: { steps: FunnelStep[] }) {
  if (steps.length === 0) {
    return (
      <div className="cp-empty">
        <h3>No data</h3>
        <p>There are no funnel steps to display.</p>
      </div>
    );
  }

  const firstStepCount = steps[0].count;
  
  // Calculate percentages for each step
  const stepsWithPercentages = steps.map(step => ({
    ...step,
    percentage: Math.round((step.count / firstStepCount) * 100)
  }));

  return (
    <div>
      {stepsWithPercentages.map((step, index) => {
        const isLastStep = index === stepsWithPercentages.length - 1;
        const dropOff = index > 0 ? stepsWithPercentages[index - 1].count - step.count : 0;
        const dropOffPercentage = index > 0 ? Math.round((dropOff / stepsWithPercentages[index - 1].count) * 100) : 0;
        
        return (
          <div key={index}>
            <div className="cp-statrow">
              <span className="l">{step.name}</span>
              <span className="v">
                <span>{step.count}</span>
                <span> ({step.percentage}%)</span>
              </span>
            </div>
            {/* Using inline styles for bars - this is the only part that may be problematic */}
            <div style={{ height: '8px', backgroundColor: '#f0f0f0', margin: '4px 0' }}>
              <div 
                style={{ 
                  width: `${step.percentage}%`, 
                  height: '100%',
                  backgroundColor: index === 0 ? '#4CAF50' : '#2196F3'
                }}
              />
            </div>
            {!isLastStep && (
              <div className="cp-statrow">
                <span className="l">Drop-off</span>
                <span className="v">
                  <span>{dropOff}</span>
                  <span> ({dropOffPercentage}%)</span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}