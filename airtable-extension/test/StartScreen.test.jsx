// @vitest-environment jsdom
import React from 'react';
import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, fireEvent, cleanup, waitFor} from '@testing-library/react';
import {StartScreen} from '../frontend/ui/StartScreen.jsx';

afterEach(cleanup);

const requisitions = [
  {id: 'rec1', positionTitle: 'Senior Product Manager', reqNumber: 'R-1001', brand: '', hiringManager: 'HM', format: '', panelistCount: 3},
  {id: 'rec2', positionTitle: 'Store Manager', reqNumber: 'R-2002', brand: '', hiringManager: 'HM', format: '', panelistCount: 2},
];
const guides = [
  {id: 'g1', name: 'Store Manager – Panel', positionTitle: 'Store Manager', reqNumber: 'R-2002', round: 'Panel', lastGenerated: '', createdTime: 1},
];

function setup(props = {}) {
  const onCreate = vi.fn(async () => {});
  const onOpen = vi.fn();
  render(<StartScreen requisitions={requisitions} guides={guides} notice={null} onCreate={onCreate} onOpen={onOpen} {...props} />);
  return {onCreate, onOpen};
}

describe('StartScreen', () => {
  it('offers the just-attached guide as a download in the success notice', () => {
    const createObjectURL = vi.fn(() => 'blob:guide');
    vi.stubGlobal('URL', {...URL, createObjectURL, revokeObjectURL: vi.fn()});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const bytes = new Uint8Array([7]);
    setup({notice: {text: 'Guide attached to "Sr PM – Panel" ✓', tone: 'ok', download: {filename: 'g.docx', bytes}}});
    fireEvent.click(screen.getByRole('button', {name: 'Download g.docx'}));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it('shows a warning notice in the problem style, still with the download', () => {
    setup({notice: {text: 'Guide attached, but not to the requisition.', tone: 'problem', download: {filename: 'g.docx', bytes: new Uint8Array([7])}}});
    expect(screen.getByRole('status').className).toBe('problems');
    expect(screen.getByRole('button', {name: 'Download g.docx'})).toBeTruthy();
  });

  it('shows no download button on a notice without a file', () => {
    setup({notice: {text: 'That guide no longer exists.', tone: 'problem'}});
    expect(screen.queryByRole('button', {name: /^Download/})).toBeNull();
  });

  it('shows New Guide first with the requisition search focused', () => {
    setup();
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings[0]).toBe('New guide');
    expect(document.activeElement).toBe(screen.getByLabelText('Find requisition'));
  });

  it('creates a guide for the chosen requisition and round with a pre-filled name', async () => {
    const {onCreate} = setup();
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'product'}});
    fireEvent.click(screen.getByRole('button', {name: /Senior Product Manager/}));
    fireEvent.change(screen.getByLabelText('Interview round'), {target: {value: 'Final'}});
    expect(screen.getByLabelText('Guide name').value).toBe('Senior Product Manager – Final');
    fireEvent.click(screen.getByRole('button', {name: 'Create guide'}));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({requisitionId: 'rec1', round: 'Final', name: 'Senior Product Manager – Final'}));
  });

  it('keeps a name the CES typed when the round changes', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'store'}});
    fireEvent.click(screen.getByRole('button', {name: /^Store Manager R-2002$/}));
    fireEvent.change(screen.getByLabelText('Guide name'), {target: {value: 'Custom'}});
    fireEvent.change(screen.getByLabelText('Interview round'), {target: {value: 'Final'}});
    expect(screen.getByLabelText('Guide name').value).toBe('Custom');
  });

  it('closes the match list once a requisition is picked and shows the choice', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'manager'}});
    fireEvent.click(screen.getByRole('button', {name: /^Store Manager R-2002$/}));
    expect(screen.queryByRole('button', {name: /Senior Product Manager/})).toBeNull();
    expect(screen.queryByLabelText('Find requisition')).toBeNull();
    expect(screen.getByText('Store Manager')).toBeTruthy();
    expect(screen.getByLabelText('Interview round')).toBeTruthy();
  });

  it('lets the CES change the picked requisition', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'manager'}});
    fireEvent.click(screen.getByRole('button', {name: /^Store Manager R-2002$/}));
    fireEvent.click(screen.getByRole('button', {name: 'Change'}));
    expect(screen.queryByLabelText('Interview round')).toBeNull();
    expect(screen.getByLabelText('Find requisition').value).toBe('manager');
    expect(screen.getByRole('button', {name: /Senior Product Manager/})).toBeTruthy();
  });

  it('shows the recruiter next to the Req # in the match list and on the picked requisition', () => {
    const reqs = [{...requisitions[1], recruiter: 'Pat Recruiter', status: 'Open', recruiterId: 'usrR', cesId: null}];
    setup({requisitions: reqs});
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'store'}});
    const match = screen.getByRole('button', {name: /^Store Manager R-2002/});
    expect(match.textContent).toContain('Recruiter: Pat Recruiter');
    fireEvent.click(match);
    expect(screen.getByText(/Recruiter: Pat Recruiter/)).toBeTruthy();
  });

  it("lists the current user's open requisitions first and marks them", () => {
    const reqs = [
      {...requisitions[0], status: 'Open', recruiterId: 'usrX', cesId: null, recruiter: 'Someone'},
      {...requisitions[1], status: 'Open', recruiterId: 'usrX', cesId: 'usrMe', recruiter: 'Someone'},
    ];
    setup({requisitions: reqs, currentUserId: 'usrMe'});
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'manager'}});
    const panel = screen.getByRole('heading', {name: 'New guide'}).closest('section');
    const buttons = [...panel.querySelectorAll('.list button')];
    expect(buttons.map((b) => b.textContent.startsWith('Store Manager'))).toEqual([true, false]);
    expect(buttons[0].textContent).toContain('Yours');
    expect(buttons[1].textContent).not.toContain('Yours');
  });

  it('explains how the builder works, open by default and collapsible', () => {
    setup();
    const help = screen.getByText('How the Guide Builder works').closest('details');
    expect(help.open).toBe(true);
    const steps = [...help.querySelectorAll('ol > li')].map((li) => li.textContent);
    expect(steps).toHaveLength(5);
    expect(steps[0]).toMatch(/Find the requisition/);
    expect(steps[4]).toMatch(/Panel Interview Guide/);
    expect(help.textContent).toMatch(/Back to guides/);
    expect(help.textContent).toMatch(/uploaded by hand are never removed/);
  });

  it('says so when no requisition matches', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'zzz'}});
    expect(screen.getByText('No requisitions match "zzz".')).toBeTruthy();
  });

  it('shows a success notice in the ok style', () => {
    setup({notice: {text: 'Guide attached to "Store Manager – Panel" ✓', tone: 'ok'}});
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Guide attached to "Store Manager – Panel" ✓');
    expect(status.className).toBe('ok');
  });

  it('opens a recent guide and shows notices', () => {
    const {onOpen} = setup({notice: {text: 'That guide no longer exists.', tone: 'problem'}});
    expect(screen.getByRole('status').textContent).toBe('That guide no longer exists.');
    fireEvent.click(screen.getByRole('button', {name: /Store Manager – Panel/}));
    expect(onOpen).toHaveBeenCalledWith('g1');
  });

  it('shows the error when creating the guide fails', async () => {
    setup({onCreate: vi.fn(async () => { throw new Error('You do not have permission to create records'); })});
    fireEvent.change(screen.getByLabelText('Find requisition'), {target: {value: 'product'}});
    fireEvent.click(screen.getByRole('button', {name: /Senior Product Manager/}));
    fireEvent.click(screen.getByRole('button', {name: 'Create guide'}));
    await waitFor(() => expect(screen.getByText("Couldn't create the guide: You do not have permission to create records")).toBeTruthy());
    expect(screen.getByRole('button', {name: 'Create guide'}).disabled).toBe(false);
  });
});
