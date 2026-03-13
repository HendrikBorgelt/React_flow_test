import { Panel, useReactFlow } from '@xyflow/react';
import './CanvasControls.css';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IconZoomIn = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="6" cy="6" r="4.5" />
    <line x1="6" y1="3.5" x2="6" y2="8.5" />
    <line x1="3.5" y1="6" x2="8.5" y2="6" />
    <line x1="9.5" y1="9.5" x2="13.5" y2="13.5" />
  </svg>
);

const IconZoomOut = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="6" cy="6" r="4.5" />
    <line x1="3.5" y1="6" x2="8.5" y2="6" />
    <line x1="9.5" y1="9.5" x2="13.5" y2="13.5" />
  </svg>
);

const IconFitView = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4.5V1h3.5M10.5 1H14v3.5M14 10.5V14h-3.5M4.5 14H1v-3.5" />
  </svg>
);

const IconLocked = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="6.5" width="10" height="7.5" rx="1.5" />
    <path d="M4.5 6.5V4.5a3 3 0 0 1 6 0v2" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconUnlocked = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="6.5" width="10" height="7.5" rx="1.5" />
    <path d="M4.5 6.5V4.5a3 3 0 0 1 6 0" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconMap = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 2L1 4v9l4.5-2 4 2 4.5-2V2l-4.5 2-4-2z" />
    <line x1="5.5" y1="2" x2="5.5" y2="11" />
    <line x1="9.5" y1="4" x2="9.5" y2="13" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export function CanvasControls({
  isInteractive,
  onToggleInteractive,
  minimapOpen,
  onToggleMinimap,
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-left">
      <div className="cc-panel">

        <button
          className="cc-btn"
          onClick={() => zoomIn({ duration: 200 })}
          title="Zoom in"
        ><IconZoomIn /></button>

        <button
          className="cc-btn"
          onClick={() => zoomOut({ duration: 200 })}
          title="Zoom out"
        ><IconZoomOut /></button>

        <button
          className="cc-btn"
          onClick={() => fitView({ duration: 400, padding: 0.3 })}
          title="Fit view"
        ><IconFitView /></button>

        <div className="cc-divider" />

        <button
          className={`cc-btn${isInteractive ? '' : ' cc-btn--active'}`}
          onClick={onToggleInteractive}
          title={isInteractive ? 'Lock canvas (disable dragging & editing)' : 'Unlock canvas'}
        >
          {isInteractive ? <IconUnlocked /> : <IconLocked />}
        </button>

        <div className="cc-divider" />

        <button
          className={`cc-btn${minimapOpen ? ' cc-btn--active' : ''}`}
          onClick={onToggleMinimap}
          title={minimapOpen ? 'Hide minimap' : 'Show minimap'}
        ><IconMap /></button>

      </div>
    </Panel>
  );
}
