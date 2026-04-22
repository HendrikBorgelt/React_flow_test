import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

// Catmull-Rom spline through all points, respecting handle direction at endpoints
function catmullRomPath(sx, sy, tx, ty, sPos, tPos, waypoints) {
  const TANGENT = 60;
  const DIR = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
  const [sdx, sdy] = DIR[sPos] ?? [0, 0];
  const [tdx, tdy] = DIR[tPos] ?? [0, 0];

  const g0 = { x: sx - sdx * TANGENT, y: sy - sdy * TANGENT };
  const gN = { x: tx - tdx * TANGENT, y: ty - tdy * TANGENT };
  const pts = [g0, { x: sx, y: sy }, ...waypoints, { x: tx, y: ty }, gN];

  let d = `M ${sx} ${sy}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function WaypointEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
  style, markerEnd,
  label, labelStyle, labelBgStyle, labelBgPadding, labelBgBorderRadius,
}) {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const waypoints = data?.waypoints ?? [];

  // ── Path computation ─────────────────────────────────────────────────────────
  let edgePath, labelX, labelY;
  if (waypoints.length === 0) {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    });
  } else {
    edgePath = catmullRomPath(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, waypoints);
    const allPts = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
    const mid = allPts[Math.floor(allPts.length / 2)];
    // Float label 14px above the midpoint so it doesn't overlap handles
    labelX = mid.x;
    labelY = mid.y - 14;
  }

  // ── Drag — window listeners survive React re-renders; nodrag/nopan on the
  //    HTML div tells React Flow to ignore these elements for pan/connect. ──────
  const handlePointerDown = useCallback((idx, e) => {
    e.stopPropagation();
    e.preventDefault();

    const onMove = (ev) => {
      ev.stopPropagation();
      const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      setEdges(eds => eds.map(ed => {
        if (ed.id !== id) return ed;
        const wps = (ed.data?.waypoints ?? []).map((wp, i) => i === idx ? pos : wp);
        return { ...ed, data: { ...ed.data, waypoints: wps } };
      }));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [id, setEdges, screenToFlowPosition]);

  // ── Add waypoint at segment midpoint ─────────────────────────────────────────
  const addWaypointAt = useCallback((insertAt, x, y, e) => {
    e.stopPropagation();
    setEdges(eds => eds.map(ed => {
      if (ed.id !== id) return ed;
      const wps = [...(ed.data?.waypoints ?? [])];
      wps.splice(insertAt, 0, { x, y });
      return { ...ed, data: { ...ed.data, waypoints: wps } };
    }));
  }, [id, setEdges]);

  // ── Remove waypoint on double-click ──────────────────────────────────────────
  const removeWaypoint = useCallback((idx, e) => {
    e.stopPropagation();
    setEdges(eds => eds.map(ed => {
      if (ed.id !== id) return ed;
      const wps = [...(ed.data?.waypoints ?? [])];
      wps.splice(idx, 1);
      return { ...ed, data: { ...ed.data, waypoints: wps } };
    }));
  }, [id, setEdges]);

  // Geometric midpoints of each segment (for "add" ghost handles)
  const allPts = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
  const midpoints = allPts.slice(0, -1).map((pt, i) => ({
    x: (pt.x + allPts[i + 1].x) / 2,
    y: (pt.y + allPts[i + 1].y) / 2,
    insertAt: i + 1,
  }));

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        label={label}
        labelX={labelX}
        labelY={labelY}
        labelStyle={labelStyle}
        labelShowBg={!!labelBgStyle}
        labelBgStyle={labelBgStyle}
        labelBgPadding={labelBgPadding}
        labelBgBorderRadius={labelBgBorderRadius}
      />

      {/* Handles rendered as HTML via EdgeLabelRenderer — sits above the SVG
          layer, receives pointer events reliably, and nodrag/nopan prevents
          React Flow from treating interactions as pan or connect gestures. */}
      {selected && (
        <EdgeLabelRenderer>
          {/* Existing waypoints — drag to move, double-click to remove */}
          {waypoints.map((wp, i) => (
            <div
              key={i}
              className="nodrag nopan"
              title="Drag to move · double-click to remove"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${wp.x}px, ${wp.y}px)`,
                width: 12, height: 12,
                background: '#6366f1',
                border: '2px solid #fff',
                borderRadius: '50%',
                cursor: 'move',
                pointerEvents: 'all',
                zIndex: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }}
              onPointerDown={e => handlePointerDown(i, e)}
              onDoubleClick={e => removeWaypoint(i, e)}
            />
          ))}

          {/* Ghost midpoint handles — click to insert a new waypoint */}
          {midpoints.map((mp, i) => (
            <div
              key={`m${i}`}
              className="nodrag nopan"
              title="Click to add waypoint"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${mp.x}px, ${mp.y}px)`,
                width: 8, height: 8,
                background: '#fff',
                border: '1.5px solid #6366f1',
                borderRadius: '50%',
                cursor: 'crosshair',
                pointerEvents: 'all',
                zIndex: 9,
                opacity: 0.75,
              }}
              onClick={e => addWaypointAt(mp.insertAt, mp.x, mp.y, e)}
            />
          ))}
        </EdgeLabelRenderer>
      )}
    </>
  );
}
