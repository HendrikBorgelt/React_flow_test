import './WelcomeScreen.css';
import './SettingsModal.css';

export function SettingsModal({ onClose }) {
  return (
    <div className="ws-backdrop">
      <div className="ws-card sm-card">

        <div className="ws-logo">⚙</div>
        <h1 className="ws-title">Settings</h1>
        <p className="ws-sub">Editor configuration</p>

        <div className="sm-placeholder">
          <span className="sm-placeholder__icon">🚧</span>
          <p className="sm-placeholder__text">Settings options coming soon.</p>
        </div>

        <button className="ws-btn ws-btn--primary" onClick={onClose}>
          Close
        </button>

      </div>
    </div>
  );
}
