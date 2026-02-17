/**
 * Children's clothing size conversion tables.
 *
 * DE (German) sizes = body height in cm (86, 92, 98, …, 176).
 * EU sizes are identical to DE for children's clothing.
 * US/UK sizes use age-based labels.
 */

export interface ClothingSizeRow {
	de: string; // German size (= body height, e.g. "86")
	eu: string; // EU size (same as DE for children)
	us: string; // US size (age-based, e.g. "2T")
	uk: string; // UK size (age-based)
	heightMin: number;
	heightMax: number;
}

export const CLOTHING_SIZES: ClothingSizeRow[] = [
	{ de: '86', eu: '86', us: '2T', uk: '1.5-2Y', heightMin: 81, heightMax: 86 },
	{ de: '92', eu: '92', us: '3T', uk: '2-3Y', heightMin: 87, heightMax: 92 },
	{ de: '98', eu: '98', us: '4T', uk: '3-4Y', heightMin: 93, heightMax: 98 },
	{ de: '104', eu: '104', us: '4', uk: '4-5Y', heightMin: 99, heightMax: 104 },
	{ de: '110', eu: '110', us: '5', uk: '5-6Y', heightMin: 105, heightMax: 110 },
	{ de: '116', eu: '116', us: '6', uk: '6-7Y', heightMin: 111, heightMax: 116 },
	{ de: '122', eu: '122', us: '7', uk: '7-8Y', heightMin: 117, heightMax: 122 },
	{ de: '128', eu: '128', us: '8', uk: '8-9Y', heightMin: 123, heightMax: 128 },
	{ de: '134', eu: '134', us: '9', uk: '9-10Y', heightMin: 129, heightMax: 134 },
	{ de: '140', eu: '140', us: '10', uk: '10-11Y', heightMin: 135, heightMax: 140 },
	{ de: '146', eu: '146', us: '12', uk: '11-12Y', heightMin: 141, heightMax: 146 },
	{ de: '152', eu: '152', us: '14', uk: '12-13Y', heightMin: 147, heightMax: 152 },
	{ de: '158', eu: '158', us: '16', uk: '13-14Y', heightMin: 153, heightMax: 158 },
	{ de: '164', eu: '164', us: '18', uk: '14-15Y', heightMin: 159, heightMax: 164 },
	{ de: '170', eu: '170', us: '20', uk: '15-16Y', heightMin: 165, heightMax: 170 },
	{ de: '176', eu: '176', us: '22', uk: '16-17Y', heightMin: 171, heightMax: 176 }
];

/**
 * Children's shoe size conversion tables.
 *
 * EU sizes are the standard numbering (20–40).
 * US sizes differ between child (C) and youth (Y) ranges.
 * UK sizes run roughly 1 below US child sizes.
 */

export interface ShoeSizeRow {
	eu: string;
	us: string;
	uk: string;
	footLengthCm: number; // approximate foot length
}

export const SHOE_SIZES: ShoeSizeRow[] = [
	{ eu: '20', us: '4C', uk: '3.5', footLengthCm: 12.5 },
	{ eu: '21', us: '5C', uk: '4', footLengthCm: 13.0 },
	{ eu: '22', us: '6C', uk: '5', footLengthCm: 13.5 },
	{ eu: '23', us: '6.5C', uk: '5.5', footLengthCm: 14.0 },
	{ eu: '24', us: '7.5C', uk: '6.5', footLengthCm: 14.8 },
	{ eu: '25', us: '8C', uk: '7', footLengthCm: 15.5 },
	{ eu: '26', us: '9C', uk: '8', footLengthCm: 16.0 },
	{ eu: '27', us: '9.5C', uk: '8.5', footLengthCm: 16.5 },
	{ eu: '28', us: '10.5C', uk: '10', footLengthCm: 17.2 },
	{ eu: '29', us: '11C', uk: '10.5', footLengthCm: 17.8 },
	{ eu: '30', us: '12C', uk: '11', footLengthCm: 18.4 },
	{ eu: '31', us: '13C', uk: '12', footLengthCm: 19.1 },
	{ eu: '32', us: '1Y', uk: '13', footLengthCm: 19.7 },
	{ eu: '33', us: '1.5Y', uk: '13.5', footLengthCm: 20.3 },
	{ eu: '34', us: '2.5Y', uk: '1.5', footLengthCm: 21.0 },
	{ eu: '35', us: '3Y', uk: '2', footLengthCm: 21.6 },
	{ eu: '36', us: '4Y', uk: '3', footLengthCm: 22.2 },
	{ eu: '37', us: '4.5Y', uk: '3.5', footLengthCm: 22.8 },
	{ eu: '38', us: '5.5Y', uk: '4.5', footLengthCm: 23.5 },
	{ eu: '39', us: '6.5Y', uk: '5.5', footLengthCm: 24.1 },
	{ eu: '40', us: '7Y', uk: '6', footLengthCm: 24.8 }
];

// ── Clothing size lookups ─────────────────────────────────────────

export function lookupClothingByDe(de: string): ClothingSizeRow | undefined {
	return CLOTHING_SIZES.find((r) => r.de === de);
}

export function lookupClothingByEu(eu: string): ClothingSizeRow | undefined {
	return CLOTHING_SIZES.find((r) => r.eu === eu);
}

export function lookupClothingByUs(us: string): ClothingSizeRow | undefined {
	return CLOTHING_SIZES.find((r) => r.us.toLowerCase() === us.toLowerCase());
}

export function lookupClothingByUk(uk: string): ClothingSizeRow | undefined {
	return CLOTHING_SIZES.find((r) => r.uk.toLowerCase() === uk.toLowerCase());
}

export function lookupClothingByHeight(heightCm: number): ClothingSizeRow | undefined {
	return CLOTHING_SIZES.find((r) => heightCm >= r.heightMin && heightCm <= r.heightMax);
}

/**
 * Given one known clothing size field, return all conventions.
 * Returns null if no match found.
 */
export function resolveClothingSize(
	field: 'de' | 'eu' | 'us' | 'uk',
	value: string
): ClothingSizeRow | undefined {
	switch (field) {
		case 'de':
			return lookupClothingByDe(value);
		case 'eu':
			return lookupClothingByEu(value);
		case 'us':
			return lookupClothingByUs(value);
		case 'uk':
			return lookupClothingByUk(value);
	}
}

// ── Shoe size lookups ─────────────────────────────────────────────

export function lookupShoeByEu(eu: string): ShoeSizeRow | undefined {
	return SHOE_SIZES.find((r) => r.eu === eu);
}

export function lookupShoeByUs(us: string): ShoeSizeRow | undefined {
	return SHOE_SIZES.find((r) => r.us.toLowerCase() === us.toLowerCase());
}

export function lookupShoeByUk(uk: string): ShoeSizeRow | undefined {
	return SHOE_SIZES.find((r) => r.uk === uk);
}

/**
 * Given one known shoe size field, return all conventions.
 * Returns null if no match found.
 */
export function resolveShoeSize(
	field: 'eu' | 'us' | 'uk',
	value: string
): ShoeSizeRow | undefined {
	switch (field) {
		case 'eu':
			return lookupShoeByEu(value);
		case 'us':
			return lookupShoeByUs(value);
		case 'uk':
			return lookupShoeByUk(value);
	}
}

/** True if this clothing type is footwear. */
export function isShoeType(type: string): boolean {
	return type === 'shoes';
}
