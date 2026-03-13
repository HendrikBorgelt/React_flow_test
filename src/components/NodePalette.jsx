import { useState, useMemo } from 'react';
import { listNodeClasses, getClassInfo } from '../schema/schemaUtils';
import schema from '../schema/dcat_4c_ap.schema.json';
import './NodePalette.css';

export function NodePalette({ onAddNode }) {
  const [search, setSearch] = useState('');

  const classes = useMemo(() => listNodeClasses(schema), []);

  const filtered = useMemo(
    () => classes.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [classes, search]
  );

  return (
    <aside className="np-sidebar">
      <div className="np-header">Classes</div>
      <div className="np-search-wrap">
        <input
          className="np-search"
          type="search"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <ul className="np-list">
        {filtered.map(cls => (
          <li
            key={cls}
            className="np-item"
            title={getClassInfo(schema, cls)?.description ?? cls}
            onClick={() => onAddNode(cls)}
          >
            {cls}
          </li>
        ))}
      </ul>
    </aside>
  );
}
