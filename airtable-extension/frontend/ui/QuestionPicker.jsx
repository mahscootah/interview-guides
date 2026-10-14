import React, {useState} from 'react';
import {questionsFor} from '../lib/questionBank.js';

function CompetencyQuestions({competency, panelists, onToggleQuestion, onSetPanelist, onAddCustom, onRemoveCustom}) {
  const [draft, setDraft] = useState('');
  const named = panelists.map((p) => p.trim()).filter(Boolean);
  const add = () => { onAddCustom(competency.name, draft); setDraft(''); };
  return (
    <div className="card">
      <h3>{competency.name}</h3>
      <label htmlFor={`gb-p-${competency.name}`}>Panelist for {competency.name}</label>
      <select id={`gb-p-${competency.name}`} value={competency.panelist}
        onChange={(e) => onSetPanelist(competency.name, e.target.value)}>
        <option value="">Choose…</option>
        {named.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {questionsFor(competency.name).map((q) => (
        <label key={q} style={{fontWeight: 400}}>
          <input type="checkbox" aria-label={q} checked={competency.questions.includes(q)}
            onChange={() => onToggleQuestion(competency.name, q)} /> {q}
        </label>
      ))}
      {competency.customQuestions.map((q, i) => (
        <div className="row" key={`${i}-${q}`}>
          <span>{q}</span>
          <button type="button" aria-label={`Remove question ${i + 1} from ${competency.name}`} onClick={() => onRemoveCustom(competency.name, i)}>×</button>
        </div>
      ))}
      <label htmlFor={`gb-c-${competency.name}`}>Add a hiring-manager question for {competency.name}</label>
      <div className="row">
        <input id={`gb-c-${competency.name}`} type="text" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="button" aria-label={`Add question to ${competency.name}`} disabled={!draft.trim()} onClick={add}>Add</button>
      </div>
    </div>
  );
}

export function QuestionPicker({selections, panelists, ...handlers}) {
  if (!selections.competencies.length) return null;
  return (
    <section>
      <h3>Questions and panelists</h3>
      {selections.competencies.map((c) => (
        <CompetencyQuestions key={c.name} competency={c} panelists={panelists} {...handlers} />
      ))}
    </section>
  );
}
