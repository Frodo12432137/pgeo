import { processRawSQLData, getAggregatedMetrics, getHistoryComparison } from './src/utils/dataProcessing.js';

const mockRaw = [
    {
        dataGodzinaUTC: '2026-01-01 12:00:00.000',
        lokalizacja: 'TestLoc',
        Val_Historia: 100,
        Val_HRES: 150,
        Val_Korekta: 80,
        Blad_Abs_HRES: -50, // NEGATIVE INPUT from DB
        Blad_Abs_Korekta: -20, // NEGATIVE INPUT from DB
        cps: 500,
        temp: 10,
        zachmurzenie: 50
    }
];

console.log("--- TEST: Raw SQL Processing ---");
const processed = processRawSQLData(mockRaw);
console.log("Blad_Abs_HRES (should be 50):", processed[0].Blad_Abs_HRES);
console.log("Blad_Abs_Korekta (should be 20):", processed[0].Blad_Abs_Korekta);

console.log("\n--- TEST: Aggregated Metrics ---");
const metrics = getAggregatedMetrics(processed);
console.log("MAE_HRES (should be 50):", metrics.MAE_HRES);
console.log("MAE_Korekta (should be 20):", metrics.MAE_Korekta);

console.log("\n--- TEST: History Comparison ---");
const history = getHistoryComparison(processed, processed);
console.log("History Result:", JSON.stringify(history, null, 2));
