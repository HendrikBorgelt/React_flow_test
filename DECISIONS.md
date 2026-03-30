# Architecture & Design Decisions

This file documents significant decisions made during development so they can be understood, revisited, or continued across sessions.

---

## Guided Connection UX decisions

### GC-001 — Trigger mechanism and active state

**Decision:** Option C — click on handle AND drag to existing node both work, complementing each other.

- **Click a source handle** → activates connection mode, opens the class creation menu near the handle, and simultaneously highlights valid target nodes already on the canvas
- **Drag from a source handle to an existing node** → connects directly as today (no menu); the drag gesture supersedes the click

**Active state** is tracked in App-level state as `activeHandle: { nodeId, handleId } | null`. It is a separate concept from React Flow's built-in node selection.

**Visual effects while a handle is active:**
- Source node: coloured border/glow (distinct from the selection border)
- Source handle: pulsing highlight
- Compatible target nodes: green border/glow
- Incompatible nodes: slight dimming

Scaling (making nodes larger) is deliberately avoided — it causes layout shifts. Scale-on-hover may be used as a subtle affordance when hovering over a highlighted compatible target, but is not the persistent active state.

**Deactivation triggers:**
- Click on empty canvas (`onPaneClick`)
- Successful drag-connect (`onConnectEnd`)
- Node created and connected from menu
- Click same handle again (toggle off)
- Click a different handle (switches active handle)
- Press Escape (`keydown` listener via `useEffect`)

**Consequences:**
- `activeHandle` state lives in `App.jsx` and is passed down to nodes and the menu component
- Compatible node highlighting requires filtering all nodes by `isSubtypeOf` on every active-handle change — acceptable cost given typical canvas size

### GC-002 — Connection menu design

**Decision:** Linear popover panel. Radial wheel is rejected — class names in these schemas are too long and verbose to fit legibly in radial arc segments.

**Popover structure (top to bottom):**
1. Search / filter input — filters both sections below
2. **"On canvas"** section — lists compatible nodes already placed, showing a display label per node (see GC-002a). Clicking one closes the popover and creates the edge.
3. **"Create & connect"** section — lists all valid target classes. Clicking one creates a new node of that class, places it on the canvas, and connects it automatically.
4. A subtle note at the bottom: *"Or drag the handle dot to connect to an existing node"*

**Design principle:** Function before form. Minimalistic styling. No animations on the popover itself (canvas highlights provide enough visual dynamism).

**GC-002a — Node display labels in the "On canvas" section**
Fallback chain: `data.values.title` → last path segment of `data.values.id` → `className`. Implemented in `schemaUtils.getNodeDisplayLabel()`.

---

### GC-002 revision — Ghost node as connection endpoint

**Supersedes:** The floating-panel-at-cursor approach from the original GC-002.

**Decision:** When a connection row is clicked, instead of showing the popover at the cursor position, a **ghost node** is placed on the canvas at a fixed offset from the source node. The ghost node IS the connection endpoint — it looks and behaves like the edge label pill that already appears on real edges, making it feel like a natural extension of the graph rather than an external UI panel. The popover (GC-002 design above) is shown when the user clicks the ghost node.

**Full interaction flow:**
1. User clicks a connection row label (e.g. `derived_from`) on a node
2. A dashed edge extends from the source node's handle
3. The edge terminates at a **ghost node** — a draggable pill styled identically to an edge label, positioned ~440px to the right of the source node
4. The ghost node shows the slot name (`derived_from`) and a small `×` dismiss button
5. The ghost node has a right-side handle for drag-to-connect to existing nodes (same React Flow gesture as today)
6. **Clicking the ghost node** opens the popover (GC-002 design) anchored to the ghost node's canvas position
7. Selecting a class or existing node from the popover:
   - Removes the ghost node and ghost edge
   - Creates the real edge with the correct label
8. Dismissing: Escape key, pane click, or the `×` on the ghost node — removes ghost + edge, clears active state

**Ghost node visual design:**
- Pill shape (`border-radius: 20px`), white background, dashed border in muted grey
- Font and sizing match the existing edge label style so it reads as "part of the edge"
- On hover: border turns accent blue, cursor is pointer
- The dashed border distinguishes it from permanent nodes

**Ghost edge styling:**
- `strokeDasharray: '6 3'`, muted grey stroke, animated
- No label (the ghost node itself IS the label)
- Distinct from real edges — user can see at a glance that this connection is unresolved

**Implementation components:**
- `src/nodes/GhostNode.jsx` + `GhostNode.css` — new node type registered as `ghostNode`
- `ActiveHandleContext` gains `onGhostNodeClick(x, y)` and `onDismissGhost()` callbacks
- `App.jsx` gains `ghostNodeId: string | null` state; `handleHandleClick` now creates ghost node + ghost edge instead of showing the menu directly; menu is shown when `onGhostNodeClick` fires

**Consequences:**
- The ghost node is draggable, so users can reposition it before connecting — useful when the auto-placed position overlaps other nodes
- Drag-to-connect from the ghost node's handle works via React Flow's existing mechanism; `isValidConnection` already filters by compatible classes
- The `ConnectionMenu` component is unchanged — it is now anchored to the ghost node's position instead of the cursor position

**GC-002a — Node display labels (confirmed)**
Fallback chain implemented: `getNodeDisplayLabel()` in `schemaUtils.js`.

---

### GC-006 — Edge reconnection (sketch)

**Context:** Once ghost nodes are implemented for creating new connections, the same pattern should extend to *changing* existing ones. Today, reconnecting requires deleting the edge and starting over. This section sketches two implementation phases.

---

#### Phase 1 — React Flow built-in reconnect (quick win)

React Flow v12 ships a `reconnectable` edge prop and three callbacks: `onReconnect`, `onReconnectStart`, `onReconnectEnd`. When enabled, hovering the target endpoint of an edge reveals a draggable handle. The user grabs it and drags it to a new target node.

**What it gives for free:**
- Target endpoint becomes draggable on hover
- `isValidConnection` is respected — invalid targets are rejected
- Compatible nodes highlight (green) during the drag via the existing GC-001 mechanism

**What it does NOT give:**
- No "create a new class" option during reconnect — the user can only reconnect to nodes already on the canvas
- No ghost node visual consistency with the new connection flow

**Implementation cost:** ~10 lines. Add to `ReactFlow`:
```jsx
reconnectRadius={12}
onReconnect={(oldEdge, newConnection) => {
  setEdges(eds => reconnectEdge(oldEdge, newConnection, eds));
}}
```
Add `reconnectable` to each edge object in `onConnect` / `handleCreateAndConnect`.

**Recommendation:** Ship Phase 1 immediately alongside the ghost node feature as a low-cost complement.

---

#### Phase 2 — "Detach to ghost" for full consistency (future)

To make reconnection visually consistent with the ghost node creation flow:

**Interaction:**
1. User hovers an edge → a small **⟲ detach** button appears near the target arrowhead
2. Clicking **detach**:
   - The existing edge is removed
   - A ghost node appears at the position of the former target node
   - A ghost edge runs from the source node → ghost node (same visual as a new connection)
3. From this point the flow is identical to a fresh ghost node: the user can drag-to-connect, click the ghost node for the popover, or dismiss

**What this requires:**
- A custom edge type (`src/edges/SchemaEdge.jsx`) that renders the detach button on hover
- The detach button calls a new App-level callback `onDetachEdge(edgeId)`:
  - Reads `edge.source` and `edge.sourceHandle`
  - Removes the edge
  - Calls `handleHandleClick(source, sourceHandle, ...)` — reusing the exact same ghost node creation path
- No new state is needed beyond what Phase 1 + ghost nodes already introduce

**Shared code reuse:** `handleHandleClick` is called with the source node's position to compute the ghost node placement. The ghost node creation logic is identical — detaching an edge is just another way to enter the same ghost-node state machine.

**Consequence:** Phase 2 should be implemented after the ghost node feature is stable and tested, not at the same time. The clean separation of concerns (detach → reuse ghost flow) means there is no tight coupling to introduce now.

---

### GC-003 — Schema to implement and test first

**Decision:** chemdcat (chem-dcat-ap) is the reference schema for all guided connection development and testing. It is the default dev build, has the most constrained connection rules, and the existing demo data covers its key classes.

coremeta4cat and dcat-ap-plus are tested after chemdcat is stable.

### GC-004 — Implementation order

**Decision:** Guided connections are implemented before the Schema Explorer.

**Rationale:**
1. Immediate user benefit — the editor improves without waiting for the explorer
2. Self-contained change — no new app structure, no new entry points
3. The `activeHandle` state pattern and compatible-node filtering logic built here will directly inform how the explorer handles its own node interactions

### GC-005 — Shared vs tool-specific code boundaries

As both tools are developed, new code must be placed with the future shared/individual split in mind. Rules:

**Goes into `src/schema/schemaUtils.js` (already shared):**
- `getCompatibleClasses(schema, className, slotName)` — returns valid target class names for a given slot; needed by both the editor's connection menu and the explorer's "what connects here" interaction
- `getNodeDisplayLabel(node)` — display label utility (title → id tail → className fallback); needed by the editor's "On canvas" section and the explorer's node headers

**Goes into `src/shared/` (new directory, for components used by both tools):**
- `ConnectionMenu.jsx` — the popover itself; the editor uses it for creating/connecting instances, the explorer may reuse it to show "what could connect here" in a read-only form
- Any hover popover / tooltip component

**Stays in `src/` (editor-specific, current location unchanged):**
- `App.jsx`, `nodes/SchemaNode.jsx`, `components/`, `loaders/` — editor only

**Stays in `src/explorer/` (explorer-specific, new):**
- Explorer `App.jsx`, explorer node type, view loader

**Consequence:** `src/shared/` is introduced as a new directory during guided connections work, not deferred to the explorer phase. This keeps the boundary explicit from the start.

---

## Schema Explorer decisions

### SE-001 — Target audience and UI complexity model

**Decision:** The Schema Explorer targets both (a) schema/backend developers and (b) domain scientists who want to understand the data editor before using it.

**UI approach:** Start minimal. Expert detail is opt-in via:
- **Hover info boxes** — e.g. class URIs, slot descriptions, cardinality shown on hover only
- **"Expert" toggle** — surfaces additional detail persistently (e.g. class URIs rendered below each relation label, abstract class visibility)

The app is desktop-only. Space is not a constraint; clarity for non-experts is the design goal of the default view.

**Consequences:**
- Default view must be readable without schema knowledge
- Abstract classes hidden by default; shown in expert mode (see SE-003)
- Class URIs hidden by default; shown on hover or in expert mode (see SE-004)
- Two display layers to design and maintain

### SE-002 — Graph scope and loadable views

**Decision:** The explorer does not show the full class graph at once. Instead it uses **predefined, loadable views** — analogous to the example instance files in the editor.

Each view is a JSON file that declares:
- Which classes to place on the canvas and their initial positions
- The perspective name and description (shown on a welcome/picker screen)
- Optionally: which classes to render collapsed by default

**Predefined view types planned:**
- **Inheritance view** — DCAT-AP+ base classes as a block, with arrows showing which chemdcat / coremeta4cat classes inherit from them. Organised in a hierarchy.
- **Domain views** — one per domain grouping (e.g. Materials, Chemical Entities, Chemical Reactions for chemdcat; Synthesis, Characterization, Catalysis Dataset for coremeta4cat). Classes within a domain shown with their mutual relations.

**Collapsed-by-default classes:** Inline attribute classes (all `QuantitativeAttribute` and `QualitativeAttribute` descendants — detected by the existing fingerprint logic) are rendered as compact collapsed nodes. They have little structural information (value + unit + kind) and would clutter the graph if fully expanded.

**Consequences:**
- View files live alongside example instance files (e.g. `src/explorer-views/chemdcat/inheritance.json`)
- Views are predefined in the codebase; user-saved views are out of scope for now
- The welcome screen of the explorer becomes a view picker, one card per view

### SE-003 — Inheritance data: generated from compiled schema

**Decision:** Inheritance maps are **generated by a build script** (`scripts/gen-inheritance.mjs`), not maintained manually and not parsed from the YAML source.

**Algorithm:** For each class in the compiled JSON Schema, find the direct parent by identifying the class whose property set is the largest strict subset of the child's properties. This is an extension of the existing `isSubtypeOf` structural approach already used in `schemaUtils.js`.

**Output format** (one generated file per schema, e.g. `src/schema/chemdcat.inheritance.json`):
```json
{
  "MaterialSample": {
    "parent": "MaterialEntity",
    "ownSlots": ["has_physical_state", "has_mass", "has_volume"],
    "inheritedSlots": ["id", "title", "description"]
  }
}
```
The config file imports this generated file and exposes it as `config.inheritance`.

**Mixin caveat:** LinkML supports multiple inheritance via `mixins:` alongside `is_a:`. The structural algorithm may occasionally pick a mixin class as the parent instead of the true `is_a` parent. Corrected via an optional `inheritanceOverrides` map in each config file (same pattern as `abstractClasses`).

**When to run:** The script runs in CI alongside the schema compilation step. Generated files are committed to the repo so the app builds without requiring the script locally.

**Consequences:**
- No YAML source files needed in this repo
- Schema updates require re-running `node scripts/gen-inheritance.mjs` — CI handles this automatically
- Manual overrides kept minimal; the generated map is the primary source

### SE-004 — Explorer node content

**Decision:** Explorer nodes show three layers of information.

**Default view (always visible):**
- Class name in the header
- Primitive slots listed by name and type: `title: string`, `id: URI`
- Widget slots listed as compact rows: `has_mass → Mass (value, unit)` — the target inline class is not given its own node but is described inline
- Ref slots rendered as outgoing edge handles (same as editor), labelled with the slot name
- Inline attribute classes (QuantitativeAttribute / QualitativeAttribute descendants) rendered as a small pill/badge on the edge rather than as full nodes

**On hover (info popover):**
- Slot description text
- Cardinality: optional / required / multivalued
- Data type for primitive slots (string, integer, URI)

**Expert mode (persistent extra detail):**
- Class URI shown below the class name
- Relation URI shown below each edge label
- Own vs inherited visual distinction for slots

**Consequences:**
- The pill/badge for inline classes needs a new small visual component (not present in the editor)
- Hover popovers need to be implemented (not present in the editor)
- Expert mode toggle is global (one switch for the whole canvas), not per-node

### SE-005 — Repo and app structure

**Decision:** Option A — two Vite entry points in one repo, sharing `src/schema/` and `src/configs/`. No files are moved from their current locations.

```
src/
  schema/             ← shared (compiled JSON schemas + generated inheritance maps)
  configs/            ← shared (chemdcat, coremeta4cat, dcat-ap-plus config files)
  editor/             ← current app (App.jsx, nodes/, components/, loaders/)
  explorer/           ← new app (App.jsx, nodes/, components/, views/)
index.html            ← editor entry point
index-explorer.html   ← explorer entry point
```

Controlled by `VITE_TOOL=editor|explorer` alongside the existing `VITE_SCHEMA` variable. Build outputs follow the pattern `dist/{schema}/` and `dist/{schema}-explorer/`.

**Welcome screens:** The editor and explorer have separate welcome screens for now. The editor welcome screen is a file loader / example picker; the explorer welcome screen is a view picker (one card per predefined view).

**Future: unified landing page.** A top-level landing page (e.g. `index-home.html`) that presents both tools and links into each tool's welcome screen is a planned future addition. This would be the entry point for a shared deployment. Not in scope for the current implementation phase.

**Documentation:** A clear `README.md` must document the full directory structure, the two env vars (`VITE_SCHEMA`, `VITE_TOOL`), all build commands, and the CI pipeline. This is a hard requirement before the explorer is merged.

**Consequences:**
- Minimal disruption to the existing editor codebase during the refactor
- Import paths for shared modules (`~config`, `../schema/`) remain unchanged
- If a third tool is added later, a refactor to an explicit `src/shared/` layer becomes worthwhile

---

## ADR-001 — React Flow as the canvas engine

**Decision:** Use `@xyflow/react` (React Flow) for the node-graph canvas.

**Rationale:** React Flow provides drag-and-drop nodes, edge routing, zoom/pan, minimap, and handles out of the box. Building these from scratch would be substantial work and not related to the core domain problem (metadata editing).

**Consequences:** Node positioning, edge creation, and interactivity are delegated to React Flow. Custom behaviour (validation, schema-driven slots, handles aligned to slot rows) is layered on top via custom node types (`SchemaNode`).

---

## ADR-002 — LinkML JSON Schema as the single source of truth

**Decision:** Use a compiled JSON Schema (from LinkML via `gen-json-schema --mergeimports`) as the runtime schema, not the LinkML YAML directly.

**Rationale:** JSON Schema is self-contained and can be bundled into the Vite app as a static import. LinkML YAML requires the Python toolchain at runtime. The compiled output is committed to `src/schema/`.

**Consequences:**
- The JSON Schema must be regenerated when the LinkML source changes.
- `gen-json-schema` with `mergeimports:true` **fully flattens inheritance** — every class has all ancestor properties inlined. This is exploited throughout `schemaUtils.js` for subtype detection and inline-class fingerprinting (see ADR-004).
- `abstract: true` is **not preserved** in the compiled JSON Schema output. Abstract classes must be listed explicitly in each schema's config file under `abstractClasses`.

---

## ADR-003 — Config-driven multi-schema architecture

**Decision:** Each supported schema (chemdcat, coremeta4cat, dcat-ap-plus) has its own config file in `src/configs/`. A Vite alias `~config` resolves to the active config at build time, selected by the `VITE_SCHEMA` environment variable.

**Rationale:** Keeps the application code schema-agnostic. Switching schemas is a build-time concern, not a runtime switch, so each deployment only bundles one schema's assets.

**Consequences:**
- Three separate build outputs: `dist/chemdcat/`, `dist/coremeta4cat/`, `dist/dcat-ap-plus/`.
- `npm run build:all` must be run to update all three deployments.
- Each config supplies: the schema JSON, example instance files, app title/subtitle, GitHub URL, and the `abstractClasses` list.

---

## ADR-004 — Structural fingerprinting for inline class detection

**Decision:** "Inline" classes (rendered as compact widgets inside a node rather than as separate graph nodes) are detected by comparing their property-set fingerprint to that of `QuantitativeAttribute` or `QualitativeAttribute`.

**Rationale:** LinkML's `gen-json-schema` flattens inheritance, so descendants of these base classes have exactly the same property set. A fingerprint (sorted property names + required set) is sufficient for membership detection without needing the original class hierarchy.

**Consequences:**
- No hardcoded list of inline class names is needed — they are auto-derived at load time in `schemaUtils.buildInlineClassSet`.
- The detection breaks if `QuantitativeAttribute` or `QualitativeAttribute` are not present in the compiled schema (e.g. in a future schema that renames them).
- Detected inline families: `quantitative` (has `has_quantity_type` property) and `qualitative` (does not).

---

## ADR-005 — Slot classification into five kinds

**Decision:** Each property of a schema class is classified into one of five slot kinds: `primitive`, `enum`, `widget`, `lookup`, `ref`.

| Kind | Rendered as |
|------|-------------|
| `primitive` | Text / number input |
| `enum` | Dropdown (`<select>`) |
| `widget` | Inline measurement widget (value + unit + quantity_type) |
| `lookup` | Shared reference row list (URI / CURIE + slot-name dropdown) |
| `ref` | Graph edge to a separate node |

**Rationale:** These five kinds map directly onto the UI primitives needed. Separating them at classification time (`schemaUtils.classifyProperty`) keeps rendering components simple and schema-agnostic.

---

## ADR-006 — Subtype detection via property-set inclusion

**Decision:** `isSubtypeOf(child, parent, schema)` checks whether all of the parent's properties are present in the child — no runtime class hierarchy is maintained.

**Rationale:** Follows directly from the flattened JSON Schema output (see ADR-002). Used to validate edge connections: an edge from slot `s` (targeting class `T`) is only accepted if the target node's class has all properties of `T`.

**Consequences:** False positives are theoretically possible (unrelated classes could happen to share all properties of a small parent), but have not been observed in practice with the current schemas.

---

## ADR-007 — `fromJson` tree layout algorithm

**Decision:** When importing a JSON instance, child nodes are laid out as a left-to-right tree using a two-pass pixel-based algorithm:
1. **Bottom-up pass:** compute `slotHeight` = space a node needs (its own height + gap, or sum of children's slot heights, whichever is larger).
2. **Top-down pass:** assign positions, centring each parent vertically within its allocated slot.

**Rationale:** A naïve y-offset approach causes overlap when nodes have different heights. The pixel-based slot system ensures siblings never overlap regardless of content.

**Constants** (must match CSS): `X_STEP=580`, `LAYOUT_GAP=20`, plus per-section height estimates in `fromJson.js`.

---

## ADR-008 — Class inference for embedded objects without `@type`

**Decision:** When importing JSON and an embedded object has no `@type`, the class is inferred by scoring all candidate node classes by how many of the object's property keys match known slots. The best-scoring concrete class wins.

**Rationale:** LinkML YAML/JSON serialisations do not always include `@type`. The scoring approach is robust to partial objects and does not require a maintained type registry.

**Two-pass expansion for abstract target classes:**
1. If the slot's `targetClasses` are in `$defs`, use structural subtype check.
2. If `targetClasses` are absent from `$defs` (LinkML omits abstract classes from compiled output), fall back to scoring all node classes against the object's keys.

---

## ADR-009 — Export format: JSON-LD with `@type`

**Decision:** Exported JSON uses `@type` for the class name (`toJson.js`). Import (`fromJson.js`) accepts `@type`, `type` (LinkML native), or infers the class (see ADR-008).

**Rationale:** `@type` is the JSON-LD convention and is unambiguous. Supporting `type` on import allows loading files produced by LinkML's own toolchain directly.

---

## ADR-010 — Unit handling: display labels ↔ QUDT URIs

**Decision:** Units are stored internally as short display labels (e.g. `mg`, `°C`, `mol/L`). On export they are expanded to QUDT URIs; on import QUDT URIs are collapsed back to display labels. The mapping lives in `UNIT_MAP` (fromJson) and `REVERSE_UNIT` (toJson).

**Rationale:** Display labels are user-friendly for editing. QUDT URIs are required for semantic interoperability in the exported data.

**Consequence:** Any unit not in the map is passed through as-is (URI or raw string).

---

## ADR-011 — Abstract classes must be listed explicitly per config

**Decision:** Each config file contains an `abstractClasses` array listing class names that should be hidden from the node palette even though `gen-json-schema` emits them as concrete classes.

**Rationale:** `gen-json-schema` does not preserve `abstract: true` from LinkML. There is no reliable way to detect abstractness from the compiled JSON Schema alone.

**Consequence:** When the upstream LinkML schema adds or removes abstract classes, the corresponding config file must be updated manually.
