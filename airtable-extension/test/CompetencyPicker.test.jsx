// @vitest-environment jsdom
import React from 'react';
import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {CompetencyPicker} from '../frontend/ui/CompetencyPicker.jsx';
import {emptySelections} from '../frontend/lib/selections.js';
import {bank} from './fixtures/bank.js';

afterEach(cleanup);

const columnsOf = (name) => screen.getByLabelText(name).closest('.columns');

describe('CompetencyPicker', () => {
  it('lays out Behavioral Skills in two columns and leaves Leadership Capabilities as one list', () => {
    render(<CompetencyPicker bank={bank} selections={emptySelections()} onToggle={() => {}} />);
    expect(columnsOf(bank.BEHAVIORAL[0])).toBeTruthy();
    expect(columnsOf(bank.BEHAVIORAL[bank.BEHAVIORAL.length - 1])).toBe(columnsOf(bank.BEHAVIORAL[0]));
    expect(columnsOf(bank.LEADERSHIP[0])).toBeNull();
  });
});
