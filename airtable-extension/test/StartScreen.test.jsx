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
