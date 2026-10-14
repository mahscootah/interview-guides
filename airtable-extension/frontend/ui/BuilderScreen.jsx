import React, {useRef, useState} from 'react';
import {BRANDS, mapBrand, resolveBrandKey} from '../lib/brand.js';
import {findProblems} from '../lib/validation.js';
import {copyQuestionsText} from '../lib/copyText.js';
import {
  toggleCompetency, toggleQuestion, setPanelist, addCustomQuestion, removeCustomQuestion, setBrandOverride,
} from '../lib/selections.js';
import {PanelistsEditor} from './PanelistsEditor.jsx';
import {CompetencyPicker} from './CompetencyPicker.jsx';
import {QuestionPicker} from './QuestionPicker.jsx';
import {GenerateBar} from './GenerateBar.jsx';

function BrandLine({requisition, selections, onOverride}) {
  const mapped = mapBrand(requisition.brand);
  if (mapped.key) {
    const label = BRANDS.find((b) => b.key === mapped.key).label;
    return <span>{label}{mapped.isDefault ? ' (default)' : ''}</span>;
  }
  return (
    <span>
      <label htmlFor="gb-brand">Brand template</label>
      <select id="gb-brand" value={selections.brandOverride ?? ''} onChange={(e) => onOverride(e.target.value || null)}>
        <option value="">Choose… (Brand is "{requisition.brand}")</option>
        {BRANDS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
      </select>
    </span>
  );
}

export function BuilderScreen({requisition, guide, initialPanelists, initialSelections, warning, onBack, onSave, onGenerate}) {
  const [panelists, setPanelists] = useState(initialPanelists);
  const [selections, setSelections] = useState(initialSelections);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [changed, setChanged] = useState(false);
  const [backError, setBackError] = useState(null);
  const running = useRef(false);
  const brandKey = resolveBrandKey(requisition.brand, selections.brandOverride);
  const problems = findProblems({panelists, selections, brandKey});
  const edit = (fn) => (...args) => { setResult(null); setChanged(true); setSelections((s) => fn(s, ...args)); };

  // Picks are otherwise saved only by Generate, so save them on the way out.
  const back = async () => {
    if (!changed) return onBack();
    try {
      await onSave({panelists, selections});
      onBack();
    } catch (err) {
      setBackError(`Couldn't save your picks: ${err.message}`);
    }
  };

  const generate = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const outcome = await onGenerate({panelists, selections, brandKey});
      if (outcome.status === 'attached') setChanged(false);
      setResult(outcome);
    } catch (err) {
      setResult({status: 'download', filename: '', bytes: null, error: err.message});
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={back}>← Back to guides</button>
      {backError && <p className="problems">{backError}</p>}
      {warning && <p role="status" className="problems">{warning}</p>}
      <section className="card">
        <h2>{guide.name}</h2>
        <div><strong>{requisition.positionTitle}</strong></div>
        <div className="muted">Req # {requisition.reqNumber} · {guide.round} · {requisition.format} · Hiring manager: {requisition.hiringManager}</div>
        <div>Brand: <BrandLine requisition={requisition} selections={selections} onOverride={edit(setBrandOverride)} /></div>
      </section>
      <PanelistsEditor panelists={panelists} onChange={(next) => { setResult(null); setChanged(true); setPanelists(next); }} />
      <CompetencyPicker selections={selections} onToggle={edit(toggleCompetency)} />
      <QuestionPicker selections={selections} panelists={panelists}
        onToggleQuestion={edit(toggleQuestion)} onSetPanelist={edit(setPanelist)}
        onAddCustom={edit(addCustomQuestion)} onRemoveCustom={edit(removeCustomQuestion)} />
      <GenerateBar problems={problems} busy={busy} result={result} onGenerate={generate}
        onCopy={() => navigator.clipboard?.writeText(copyQuestionsText(selections))} />
    </div>
  );
}
