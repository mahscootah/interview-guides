import {describe, it, expect} from 'vitest';
import {mapBrand, resolveBrandKey, BRANDS} from '../frontend/lib/brand.js';

describe('mapBrand', () => {
  it.each([
    ['CSC', 'columbia'],
    ['Columbia ', 'columbia'],
    ['Columbia Sportswear Company', 'columbia'],
    ['MHW ', 'mountainhardwear'],
    ['Mountain Hardwear', 'mountainhardwear'],
    ['prAna ', 'prana'],
    ['SOREL', 'sorel'],
    ['sorel', 'sorel'],
  ])('maps %j to %s', (value, key) => {
    expect(mapBrand(value)).toEqual({key, isDefault: false});
  });

  it.each([[''], ['   '], [null], [undefined]])('defaults blank %j to columbia', (value) => {
    expect(mapBrand(value)).toEqual({key: 'columbia', isDefault: true});
  });

  it('returns null for unknown brands', () => {
    expect(mapBrand('Acme Outdoors')).toEqual({key: null, isDefault: false});
  });
});

describe('resolveBrandKey', () => {
  it('prefers a valid override, else the mapped brand', () => {
    expect(resolveBrandKey('Acme', 'prana')).toBe('prana');
    expect(resolveBrandKey('SOREL', null)).toBe('sorel');
    expect(resolveBrandKey('Acme', null)).toBeNull();
    expect(resolveBrandKey('Acme', 'not-a-brand')).toBeNull();
  });

  it('lists the four templates', () => {
    expect(BRANDS.map((b) => b.key)).toEqual(['columbia', 'sorel', 'mountainhardwear', 'prana']);
  });
});
