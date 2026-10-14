import React from 'react';
import {LEADERSHIP, BEHAVIORAL} from '../lib/questionBank.js';

function Group({title, names, chosen, onToggle}) {
  return (
    <div>
      <h3>{title}</h3>
      {names.map((name) => (
        <label key={name} style={{fontWeight: 400}}>
          <input type="checkbox" checked={chosen.has(name)} onChange={() => onToggle(name)} /> {name}
        </label>
      ))}
    </div>
  );
}

export function CompetencyPicker({selections, onToggle}) {
  const chosen = new Set(selections.competencies.map((c) => c.name));
  return (
    <section className="card">
      <h3>Competencies</h3>
      <p className="muted">Check the competencies listed in Workday.</p>
      <Group title="Leadership Capabilities" names={LEADERSHIP} chosen={chosen} onToggle={onToggle} />
      <Group title="Behavioral Skills" names={BEHAVIORAL} chosen={chosen} onToggle={onToggle} />
    </section>
  );
}
