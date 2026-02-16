// Standard children's clothing sizes (German/EU sizing)
const SIZE_RANGES: Array<{ size: string; minCm: number; maxCm: number }> = [
	{ size: '86', minCm: 81, maxCm: 86 },
	{ size: '92', minCm: 87, maxCm: 92 },
	{ size: '98', minCm: 93, maxCm: 98 },
	{ size: '104', minCm: 99, maxCm: 104 },
	{ size: '110', minCm: 105, maxCm: 110 },
	{ size: '116', minCm: 111, maxCm: 116 },
	{ size: '122', minCm: 117, maxCm: 122 },
	{ size: '128', minCm: 123, maxCm: 128 },
	{ size: '134', minCm: 129, maxCm: 134 },
	{ size: '140', minCm: 135, maxCm: 140 },
	{ size: '146', minCm: 141, maxCm: 146 },
	{ size: '152', minCm: 147, maxCm: 152 },
	{ size: '158', minCm: 153, maxCm: 158 },
	{ size: '164', minCm: 159, maxCm: 164 },
	{ size: '170', minCm: 165, maxCm: 170 },
	{ size: '176', minCm: 171, maxCm: 176 }
];

export function getSizeForHeight(heightCm: number): string | null {
	for (const range of SIZE_RANGES) {
		if (heightCm >= range.minCm && heightCm <= range.maxCm) {
			return range.size;
		}
	}
	if (heightCm > 176) return '176+';
	if (heightCm < 81) return '<86';
	return null;
}

export function getSizeRange(size: string): { minCm: number; maxCm: number } | null {
	return SIZE_RANGES.find((r) => r.size === size) || null;
}

export function getNextSize(currentSize: string): string | null {
	const idx = SIZE_RANGES.findIndex((r) => r.size === currentSize);
	if (idx < 0 || idx >= SIZE_RANGES.length - 1) return null;
	return SIZE_RANGES[idx + 1].size;
}

export interface GrowthPrediction {
	childId: string;
	childName: string;
	currentHeight: number;
	currentSize: string;
	growthRateCmPerMonth: number;
	predictedOutgrowDate: Date | null;
	nextSize: string | null;
	urgency: 'low' | 'medium' | 'high';
}

export function predictGrowth(
	childId: string,
	childName: string,
	measurements: Array<{ measuredAt: Date; heightCm: number | null; clothingSize: string | null }>,
	monthsAhead: number = 3
): GrowthPrediction | null {
	// Need at least 2 measurements with height
	const withHeight = measurements
		.filter((m) => m.heightCm != null)
		.sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());

	if (withHeight.length < 2) return null;

	const latest = withHeight[withHeight.length - 1];
	const previous = withHeight[withHeight.length - 2];

	const daysBetween =
		(latest.measuredAt.getTime() - previous.measuredAt.getTime()) / (1000 * 60 * 60 * 24);
	if (daysBetween < 14) return null; // measurements too close together

	const growthCm = latest.heightCm! - previous.heightCm!;
	const growthRateCmPerMonth = (growthCm / daysBetween) * 30.44; // avg days per month

	if (growthRateCmPerMonth <= 0) return null; // not growing

	const currentSize = latest.clothingSize || getSizeForHeight(latest.heightCm!) || '';
	const sizeRange = getSizeRange(currentSize);

	if (!sizeRange) return null;

	const cmUntilOutgrown = sizeRange.maxCm - latest.heightCm!;
	if (cmUntilOutgrown <= 0) {
		// Already outgrown
		return {
			childId,
			childName,
			currentHeight: latest.heightCm!,
			currentSize,
			growthRateCmPerMonth,
			predictedOutgrowDate: new Date(),
			nextSize: getNextSize(currentSize),
			urgency: 'high'
		};
	}

	const monthsUntilOutgrown = cmUntilOutgrown / growthRateCmPerMonth;
	const predictedDate = new Date();
	predictedDate.setDate(predictedDate.getDate() + monthsUntilOutgrown * 30.44);

	let urgency: 'low' | 'medium' | 'high' = 'low';
	if (monthsUntilOutgrown <= 1) urgency = 'high';
	else if (monthsUntilOutgrown <= monthsAhead) urgency = 'medium';

	if (monthsUntilOutgrown > monthsAhead * 2) return null; // too far out

	return {
		childId,
		childName,
		currentHeight: latest.heightCm!,
		currentSize,
		growthRateCmPerMonth,
		predictedOutgrowDate: predictedDate,
		nextSize: getNextSize(currentSize),
		urgency
	};
}
