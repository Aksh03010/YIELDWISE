import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Circle } from 'lucide-react';

const steps = [
  { label: 'Validating farm inputs', delay: 400 },
  { label: 'Retrieving environmental data', delay: 1000 },
  { label: 'Analyzing soil characteristics', delay: 1600 },
  { label: 'Running yield prediction model', delay: 2200 },
  { label: 'Preparing your results', delay: null },
];

export default function LoadingState() {
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    const timers = steps
      .filter((step) => step.delay !== null)
      .map((step, index) =>
        setTimeout(() => {
          setCompletedSteps(index + 1);
        }, step.delay)
      );

    return () => timers.forEach(clearTimeout);
  }, []);

  const getStepStatus = (index) => {
    if (index < completedSteps) return 'done';
    if (index === completedSteps) return 'active';
    return 'pending';
  };

  const renderStepIcon = (status) => {
    if (status === 'done') return <CheckCircle className="loading-step-icon done" />;
    if (status === 'active') return <Loader2 className="loading-step-icon active" />;
    return <Circle className="loading-step-icon pending" />;
  };

  return (
    <div className="loading-page">
      <div className="loading-container">
        <Loader2 className="loading-spinner" />
        <h2 className="loading-title">Analyzing Your Farm Data</h2>
        <p className="loading-subtitle">
          Our system is processing your inputs...
        </p>

        <ul className="loading-steps">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <li key={step.label} className={`loading-step ${status}`}>
                {renderStepIcon(status)}
                <span className="loading-step-label">{step.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
