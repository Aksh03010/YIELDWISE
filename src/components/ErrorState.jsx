import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ title, message, onRetry }) {
  return (
    <div className="error-state">
      <AlertTriangle className="error-state-icon" />
      <h2 className="error-state-title">{title}</h2>
      <p className="error-state-msg">{message}</p>
      {onRetry && (
        <button className="error-state-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
