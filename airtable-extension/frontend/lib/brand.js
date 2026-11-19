export const BRANDS = [
  {key: 'columbia', label: 'Columbia Sportswear'},
  {key: 'sorel', label: 'SOREL'},
  {key: 'mountainhardwear', label: 'Mountain Hardwear'},
  {key: 'prana', label: 'prAna'},
];

const ALIASES = {
  csc: 'columbia',
  columbia: 'columbia',
  'columbia sportswear company': 'columbia',
  mhw: 'mountainhardwear',
  'mountain hardwear': 'mountainhardwear',
  prana: 'prana',
  sorel: 'sorel',
};

/** Blank → Columbia (default); unknown → null. */
export function mapBrand(value) {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return {key: 'columbia', isDefault: true};
  return {key: ALIASES[normalized] ?? null, isDefault: false};
}

export function resolveBrandKey(brandValue, brandOverride) {
  if (BRANDS.some((b) => b.key === brandOverride)) return brandOverride;
  return mapBrand(brandValue).key;
}
