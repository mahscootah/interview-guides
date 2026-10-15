// @vitest-environment jsdom
import React from 'react';
import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, fireEvent, cleanup, waitFor} from '@testing-library/react';
import {BuilderScreen} from '../frontend/ui/BuilderScreen.jsx';
import {emptySelections} from '../frontend/lib/selections.js';
import {questionsFor} from '../frontend/lib/questionBank.js';

afterEach(cleanup);

const requisition = {id: 'rec1', positionTitle: 'Sr PM', reqNumber: 'R-1', brand: '', hiringManager: 'Jamie Lee', format: 'In-Person', panelistCount: 2};
const guide = {id: 'g1', name: 'Sr PM – Panel', round: 'Panel'};

function setup(props = {}) {
  const onGenerate = vi.fn(async () => ({status: 'attached', filename: 'Sr PM - Panel Interview Guide.docx'}));
  const onBack = vi.fn();
  const onSave = vi.fn(async () => {});
  const onAttached = vi.fn();
  render(<BuilderScreen requisition={requisition} guide={guide} initialPanelists={['', '']}
    initialSelections={emptySelections()} warning={null} onBack={onBack} onSave={onSave} onGenerate={onGenerate}
    onAttached={onAttached} {...props} />);
  return {onGenerate, onBack, onSave, onAttached};
}

function fillMinimalGuide() {
  fireEvent.change(screen.getByLabelText('Panelist 1'), {target: {value: 'Ana'}});
  fireEvent.click(screen.getByLabelText('Accountability'));
  fireEvent.click(screen.getByLabelText(questionsFor('Accountability')[0]));
  fireEvent.change(screen.getByLabelText('Panelist for Accountability'), {target: {value: 'Ana'}});
}

describe('BuilderScreen', () => {
  it('shows the requisition header; blank Brand uses Columbia', () => {
    setup();
    expect(screen.getByText('Sr PM')).toBeTruthy();
    expect(screen.getByText(/Columbia Sportswear \(default\)/)).toBeTruthy();
    expect(screen.getAllByRole('textbox', {name: /^Panelist \d$/})).toHaveLength(2);
  });

  it('asks for a template when the Brand is unrecognized', () => {
    setup({requisition: {...requisition, brand: 'Acme'}});
    expect(screen.getByLabelText('Brand template')).toBeTruthy();
  });

  it('disables Generate and lists problems until the guide is complete', async () => {
    const {onGenerate} = setup();
    expect(screen.getByRole('button', {name: 'Generate guide'}).disabled).toBe(true);
    expect(screen.getByText('Add at least one panelist.')).toBeTruthy();
    fillMinimalGuide();
    expect(screen.getByRole('button', {name: 'Generate guide'}).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', {name: 'Generate guide'}));
    await waitFor(() => expect(screen.getByText('Guide attached ✓')).toBeTruthy());
    expect(onGenerate).toHaveBeenCalledWith(expect.objectContaining({panelists: ['Ana', ''], brandKey: 'columbia'}));
  });

  it('ignores a second click while generating', async () => {
    let finish;
    const onGenerate = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    setup({onGenerate});
    fillMinimalGuide();
    const button = screen.getByRole('button', {name: 'Generate guide'});
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onGenerate).toHaveBeenCalledTimes(1);
    finish({status: 'attached', filename: 'f.docx'});
    await waitFor(() => expect(screen.getByText('Guide attached ✓')).toBeTruthy());
  });

  it('offers a download when attaching fails and stays on the guide', async () => {
    const onGenerate = vi.fn(async () => ({status: 'download', filename: 'f.docx', bytes: new Uint8Array([1]), error: 'unreachable'}));
    const {onAttached} = setup({onGenerate});
    fillMinimalGuide();
    fireEvent.click(screen.getByRole('button', {name: 'Generate guide'}));
    await waitFor(() => expect(screen.getByRole('button', {name: 'Download .docx'})).toBeTruthy());
    expect(screen.getByText(/Couldn't attach the guide: unreachable/)).toBeTruthy();
    expect(onAttached).not.toHaveBeenCalled();
  });

  it('reports a successful attach so the app can return to the guide list', async () => {
    const {onAttached} = setup();
    fillMinimalGuide();
    fireEvent.click(screen.getByRole('button', {name: 'Generate guide'}));
    await waitFor(() => expect(onAttached).toHaveBeenCalledWith('Sr PM - Panel Interview Guide.docx'));
  });

  it('flags a competency whose panelist was removed', () => {
    setup();
    fillMinimalGuide();
    fireEvent.change(screen.getByLabelText('Panelist 1'), {target: {value: 'Zoe'}});
    expect(screen.getByText('Accountability: assign a panelist.')).toBeTruthy();
  });

  it('adds a hiring-manager question and shows the saved-picks warning', () => {
    setup({warning: 'Saved picks could not be read and were reset.'});
    expect(screen.getByRole('status').textContent).toMatch(/reset/);
    fireEvent.click(screen.getByLabelText('Teamwork'));
    fireEvent.change(screen.getByLabelText('Add a hiring-manager question for Teamwork'), {target: {value: 'HM q'}});
    fireEvent.click(screen.getByRole('button', {name: 'Add question to Teamwork'}));
    expect(screen.getByText('HM q')).toBeTruthy();
  });

  it('goes back to the start screen', () => {
    const {onBack} = setup();
    fireEvent.click(screen.getByRole('button', {name: '← Back to guides'}));
    expect(onBack).toHaveBeenCalled();
  });

  it('saves unsaved picks before going back', async () => {
    const {onBack, onSave} = setup();
    fireEvent.change(screen.getByLabelText('Panelist 1'), {target: {value: 'Ana'}});
    fireEvent.click(screen.getByLabelText('Teamwork'));
    fireEvent.click(screen.getByRole('button', {name: '← Back to guides'}));
    await waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({panelists: ['Ana', '']}));
    expect(onSave.mock.calls[0][0].selections.competencies.map((c) => c.name)).toEqual(['Teamwork']);
  });

  it('stays on the guide and says so when saving on the way back fails', async () => {
    const {onBack} = setup({onSave: vi.fn(async () => { throw new Error('No permission'); })});
    fireEvent.click(screen.getByLabelText('Teamwork'));
    fireEvent.click(screen.getByRole('button', {name: '← Back to guides'}));
    await waitFor(() => expect(screen.getByText("Couldn't save your picks: No permission")).toBeTruthy());
    expect(onBack).not.toHaveBeenCalled();
  });
});
