import { createContext, useContext } from 'react';

/**
 * Provides the current "active handle" state to all nodes on the canvas.
 *
 * Value shape:
 * {
 *   activeHandle:     { nodeId, handleId, x, y } | null,
 *   compatibleNodeIds: Set<string>,   // node ids that are valid connection targets
 *   onHandleClick:    (nodeId, handleId, x, y) => void,
 * }
 *
 * Shared between the editor and (future) explorer tool.
 */
export const ActiveHandleContext = createContext(null);

export function useActiveHandle() {
  return useContext(ActiveHandleContext);
}
