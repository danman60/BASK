/**
 * Compass component vocabulary (DESIGN_SPEC §4): `ReviewProgressBar`
 *
 * A slim horizontal progress bar showing how much of the corpus a human has decided on.
 * Props: decided and total counts. Show the bar, then a plain sentence beneath giving
 * both absolute numbers and the percentage - never a bare percentage, because a
 * percentage without its denominator misleads. When total is zero, show an empty
 * state sentence instead of a zero-width bar and do not divide.
 */

type ReviewProgressBarProps = {
  decided: number;
  total: number;
};

export function ReviewProgressBar({ decided, total }: ReviewProgressBarProps) {
  if (total === 0) {
    return (
      <div className="cp-empty">
        <p className="cp-note">No claims to review</p>
      </div>
    );
  }

  const percentage = Math.round((decided / total) * 100);
  
  return (
    <div className="cp-statrow">
      <span className="l">Review progress</span>
      <span className="v">
        <div className="cp-ev">
          <div className="cp-ev-item">
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb' }}>
              <div 
                style={{ 
                  width: `${percentage}%`, 
                  height: '100%',
                  backgroundColor: '#3b82f6'
                }}
              />
            </div>
            <div className="k">claims decided</div>
          </div>
        </div>
        <p className="cp-note">
          {decided} of {total} claims decided ({percentage}%)
        </p>
      </span>
    </div>
  );
}