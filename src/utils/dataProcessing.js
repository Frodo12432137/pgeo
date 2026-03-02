export const filterData = (data, location, startDate, endDate) => {
    return data.filter(row => {
        // SQL database ma format np. "2026-01-01 00:00:00.000" i "2026-01-01 00:15:00.000"
        // Użytkownik prosił o branie tylko pełnych godzin, odrzucamy 15, 30, 45 min
        if (!row.dataGodzinaUTC.includes(':00:00.000') && !row.dataGodzinaUTC.endsWith(':00:00Z') && !row.dataGodzinaUTC.includes(':00:00')) {
            // W mockach może być format ISO 'Z'
            if (!row.dataGodzinaUTC.includes('00:00.000Z') && !row.dataGodzinaUTC.match(/:00:\d{2}/)) {
                return false;
            }
        }

        // string ma postać "2026-01-01 00:00:00.000", odcinamy pierwsze 10 znaków
        const rowDateStr = row.dataGodzinaUTC.substring(0, 10);
        const dateMatch = (!startDate || rowDateStr >= startDate) && (!endDate || rowDateStr <= endDate);

        const locMatch = location === 'Wszystkie' || row.lokalizacja === location;
        return locMatch && dateMatch;
    });
};

export const getAvailableLocations = (data) => {
    return [...new Set(data.map(d => d.lokalizacja))];
};

export const getAggregatedMetrics = (filteredData) => {
    if (!filteredData || filteredData.length === 0) return null;

    let sumMaeKorekta = 0;
    let sumMaeHres = 0;
    let sumMapeKorekta = 0;
    let sumMapeHres = 0;

    filteredData.forEach(row => {
        sumMaeKorekta += row.Blad_Abs_Korekta;
        sumMaeHres += row.Blad_Abs_HRES;
    });

    const avgMaeKorekta = sumMaeKorekta / filteredData.length;
    const avgMaeHres = sumMaeHres / filteredData.length;

    return {
        maeKorekta: avgMaeKorekta.toFixed(2),
        maeHres: avgMaeHres.toFixed(2),
        betterModel: avgMaeKorekta < avgMaeHres ? 'Korekta' : 'HRES'
    };
};

// --- Zaawansowana Analityka Pogodowa (HRES) ---

export const getTemperatureBuckets = (data) => {
    const buckets = {
        'Poniżej 0°C': { sumError: 0, sumBias: 0, count: 0 },
        '0°C - 5°C': { sumError: 0, sumBias: 0, count: 0 },
        '5°C - 15°C': { sumError: 0, sumBias: 0, count: 0 },
        'Powyżej 15°C': { sumError: 0, sumBias: 0, count: 0 },
    };

    data.forEach(row => {
        // Interesuje nas błąd HRES, tylko w dzień (historia > 0.1) oraz GDY TEMPERATURA JEST ZNANA
        if (row.Val_Historia > 0.1 && row.temp != null) {
            const hresBias = row.Val_HRES - row.Val_Historia; // + przeszacowanie, - niedoszacowanie
            const hresAbs = Math.abs(hresBias);
            const temp = row.temp;

            let bName = '';
            if (temp < 0) bName = 'Poniżej 0°C';
            else if (temp < 5) bName = '0°C - 5°C';
            else if (temp < 15) bName = '5°C - 15°C';
            else bName = 'Powyżej 15°C';

            buckets[bName].sumError += hresAbs;
            buckets[bName].sumBias += hresBias;
            buckets[bName].count += 1;
        }
    });

    return Object.entries(buckets).map(([name, stats]) => ({
        name,
        MAE: stats.count > 0 ? Number((stats.sumError / stats.count).toFixed(2)) : 0,
        Bias: stats.count > 0 ? Number((stats.sumBias / stats.count).toFixed(2)) : 0,
        count: stats.count
    }));
};

export const getCloudCoverBuckets = (data) => {
    const buckets = {
        '0-25%': { sumBias: 0, count: 0 },
        '25-50%': { sumBias: 0, count: 0 },
        '50-75%': { sumBias: 0, count: 0 },
        '75-100%': { sumBias: 0, count: 0 },
    };

    data.forEach(row => {
        if (row.Val_Historia > 0.1 && row.zachmurzenie != null) {
            const bias = row.Val_HRES - row.Val_Historia;
            const clouds = row.zachmurzenie;

            let bName = '';
            if (clouds <= 25) bName = '0-25%';
            else if (clouds <= 50) bName = '25-50%';
            else if (clouds <= 75) bName = '50-75%';
            else bName = '75-100%';

            buckets[bName].sumBias += bias;
            buckets[bName].count += 1;
        }
    });

    return Object.entries(buckets).map(([name, stats]) => ({
        name,
        Bias: stats.count > 0 ? Number((stats.sumBias / stats.count).toFixed(2)) : 0,
    }));
};

export const getPrecipitationAnomalies = (data) => {
    const result = {
        'Czyste niebo': { sumError: 0, count: 0 },
        'Opady / Śnieg': { sumError: 0, count: 0 }
    };

    data.forEach(row => {
        if (row.Val_Historia > 0.1) {
            const absErr = Math.abs(row.Val_HRES - row.Val_Historia);
            // Jeśi obie wartości to null, uznajemy to za brak wady/deszczu
            const isBadWeather = (row.opady_pow_all || 0) > 0.5 || (row.w_sniegu || 0) > 0;

            const bucket = isBadWeather ? 'Opady / Śnieg' : 'Czyste niebo';
            result[bucket].sumError += absErr;
            result[bucket].count += 1;
        }
    });

    return Object.entries(result).map(([name, stats]) => ({
        name,
        MAE: stats.count > 0 ? Number((stats.sumError / stats.count).toFixed(2)) : 0
    }));
};

export const getCloudDeltaImpact = (data) => {
    // 1. Sort by location and chronological time
    const sorted = [...data].sort((a, b) => {
        if (a.lokalizacja < b.lokalizacja) return -1;
        if (a.lokalizacja > b.lokalizacja) return 1;
        return a.dataGodzinaUTC.localeCompare(b.dataGodzinaUTC);
    });

    const buckets = {
        'Silne Rozpogodzenie (<-40%)': { sumHres: 0, sumKor: 0, count: 0 },
        'Przejaśnienie (-40% do -10%)': { sumHres: 0, sumKor: 0, count: 0 },
        'Stabilnie (-10% do +10%)': { sumHres: 0, sumKor: 0, count: 0 },
        'Wzrost Chmur (+10% do +40%)': { sumHres: 0, sumKor: 0, count: 0 },
        'Nagły Front (>+40%)': { sumHres: 0, sumKor: 0, count: 0 }
    };

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        // Tylko jeśli to to samo miasto i obie godziny mają podane zachmurzenie i produkcja to "dzień"
        if (prev.lokalizacja === curr.lokalizacja &&
            prev.zachmurzenie != null && curr.zachmurzenie != null &&
            curr.Val_Historia > 0.1) {

            const delta = curr.zachmurzenie - prev.zachmurzenie;

            let bName = '';
            if (delta < -40) bName = 'Silne Rozpogodzenie (<-40%)';
            else if (delta < -10) bName = 'Przejaśnienie (-40% do -10%)';
            else if (delta <= 10) bName = 'Stabilnie (-10% do +10%)';
            else if (delta <= 40) bName = 'Wzrost Chmur (+10% do +40%)';
            else bName = 'Nagły Front (>+40%)';

            buckets[bName].sumHres += Math.abs(curr.Blad_Abs_HRES);
            buckets[bName].sumKor += Math.abs(curr.Blad_Abs_Korekta);
            buckets[bName].count += 1;
        }
    }

    return Object.entries(buckets).map(([name, stats]) => ({
        name,
        MAE_HRES: stats.count > 0 ? Number((stats.sumHres / stats.count).toFixed(2)) : 0,
        MAE_Korekta: stats.count > 0 ? Number((stats.sumKor / stats.count).toFixed(2)) : 0,
        count: stats.count
    }));
};

export const getMapDataForDate = (data, dateStr) => {
    if (!data || !dateStr) return [];

    // Szukamy wierszy, które pasują do daty (godzinowej `YYYY-MM-DD HH:mm` lub dziennej `YYYY-MM-DD`)
    const filtered = data.filter(row => row.dataGodzinaUTC.startsWith(dateStr));

    const locMap = {};
    filtered.forEach(row => {
        const loc = row.lokalizacja;
        if (!locMap[loc]) {
            locMap[loc] = {
                lokalizacja: loc,
                sumHres: 0, sumKor: 0, count: 0,
                temp: 0, clouds: 0, rad: 0
            };
        }
        locMap[loc].sumHres += Math.abs(row.Blad_Abs_HRES);
        locMap[loc].sumKor += Math.abs(row.Blad_Abs_Korekta);
        locMap[loc].temp += row.temp || 0;
        locMap[loc].clouds += row.zachmurzenie || 0;
        locMap[loc].rad += row.cps || 0;
        locMap[loc].count += 1;
    });

    return Object.values(locMap).map(loc => ({
        ...loc,
        MAE_HRES: Number((loc.sumHres / loc.count).toFixed(2)),
        MAE_Korekta: Number((loc.sumKor / loc.count).toFixed(2)),
        temp: Number((loc.temp / loc.count).toFixed(1)),
        clouds: Number((loc.clouds / loc.count).toFixed(0)),
        rad: Number((loc.rad / loc.count).toFixed(0))
    }));
};

// --- Rozbudowa (Faza 3) ---

// Obliczanie korelacji Pearsona
function getPearsonCorrelation(x, y) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    const minLength = Math.min(x.length, y.length);
    if (minLength === 0) return 0;

    for (let i = 0; i < minLength; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }

    const step1 = (minLength * sumXY) - (sumX * sumY);
    const step2 = (minLength * sumX2) - (sumX * sumX);
    const step3 = (minLength * sumY2) - (sumY * sumY);
    const step4 = Math.sqrt(step2 * step3);
    if (step4 === 0) return 0;
    return step1 / step4;
}

export const getWeatherCorrelations = (data) => {
    // Rozdzielamy talie dla każdego czynnika, by korelować tylko parametry z danymi = nie null
    const radiationData = { hresE: [], korE: [], rad: [] };
    const tempData = { hresE: [], korE: [], temp: [] };
    const cloudData = { hresE: [], korE: [], clouds: [] };

    // Filtrowanie tylko dla godzin dziennych, gdzie jest potencjał błędu
    data.forEach(row => {
        if (row.Val_Historia > 0.1) {
            const errH = Math.abs(row.Blad_Abs_HRES);
            const errK = Math.abs(row.Blad_Abs_Korekta);

            if (row.cps != null) {
                radiationData.hresE.push(errH);
                radiationData.korE.push(errK);
                radiationData.rad.push(row.cps);
            }
            if (row.temp != null) {
                tempData.hresE.push(errH);
                tempData.korE.push(errK);
                tempData.temp.push(row.temp);
            }
            if (row.zachmurzenie != null) {
                cloudData.hresE.push(errH);
                cloudData.korE.push(errK);
                cloudData.clouds.push(row.zachmurzenie);
            }
        }
    });

    return [
        {
            factor: 'Promieniowanie (CPS)',
            HRES_Correlation: Number(getPearsonCorrelation(radiationData.hresE, radiationData.rad).toFixed(2)),
            Korekta_Correlation: Number(getPearsonCorrelation(radiationData.korE, radiationData.rad).toFixed(2))
        },
        {
            factor: 'Temperatura',
            HRES_Correlation: Number(getPearsonCorrelation(tempData.hresE, tempData.temp).toFixed(2)),
            Korekta_Correlation: Number(getPearsonCorrelation(tempData.korE, tempData.temp).toFixed(2))
        },
        {
            factor: 'Zachmurzenie',
            HRES_Correlation: Number(getPearsonCorrelation(cloudData.hresE, cloudData.clouds).toFixed(2)),
            Korekta_Correlation: Number(getPearsonCorrelation(cloudData.korE, cloudData.clouds).toFixed(2))
        }
    ];
};

// Wyszukiwanie Top najgorszych godzin/dni
export const getWorstAnomalies = (data, limit = 15) => {
    if (!data || data.length === 0) return [];
    // Sort by HRES absolute error descending (or Korekta if configured)
    const sorted = [...data].sort((a, b) => b.Blad_Abs_HRES - a.Blad_Abs_HRES);
    return sorted.slice(0, limit);
};

export const getWorstDays = (data, limit = 10) => {
    if (!data || data.length === 0) return [];

    const daysMap = {};
    data.forEach(row => {
        // Odcinamy godzinę, zostaje "YYYY-MM-DD"
        const day = row.dataGodzinaUTC.substring(0, 10);
        const loc = row.lokalizacja;
        const key = `${loc}_${day}`;

        if (!daysMap[key]) {
            daysMap[key] = {
                dataGodzinaUTC: day,
                lokalizacja: loc,
                sumVal_Historia: 0,
                sumVal_HRES: 0,
                sumVal_Korekta: 0,
                sumBlad_Abs_HRES: 0,
                sumBlad_Abs_Korekta: 0,
                sumCps: 0,
                sumZachmurzenie: 0,
                sumTemp: 0,
                sumOpady: 0,
                sumSnieg: 0,
                count: 0
            };
        }
        const d = daysMap[key];
        d.sumVal_Historia += row.Val_Historia;
        d.sumVal_HRES += row.Val_HRES;
        d.sumVal_Korekta += row.Val_Korekta;
        d.sumBlad_Abs_HRES += row.Blad_Abs_HRES;
        d.sumBlad_Abs_Korekta += row.Blad_Abs_Korekta;
        d.sumCps += row.cps;
        d.sumZachmurzenie += row.zachmurzenie;
        d.sumTemp += row.temp;
        d.sumOpady += row.opady_pow_all || 0;
        d.sumSnieg += row.w_sniegu || 0;
        d.count += 1;
    });

    const daysList = Object.values(daysMap).map(d => ({
        dataGodzinaUTC: d.dataGodzinaUTC, // Zostawiamy klucz do mapowania
        lokalizacja: d.lokalizacja,
        Val_Historia: Number((d.sumVal_Historia).toFixed(2)),
        Val_HRES: Number((d.sumVal_HRES).toFixed(2)),
        Val_Korekta: Number((d.sumVal_Korekta).toFixed(2)),
        Blad_Abs_HRES: Number((d.sumBlad_Abs_HRES).toFixed(2)), // Skumulowany błąd HRES na dzień
        Blad_Abs_Korekta: Number((d.sumBlad_Abs_Korekta).toFixed(2)),
        cps: Number((d.sumCps / d.count).toFixed(2)), // Średnie dniowe promieniowanie
        zachmurzenie: Number((d.sumZachmurzenie / d.count).toFixed(2)),
        temp: Number((d.sumTemp / d.count).toFixed(2)),
        opady_pow_all: Number((d.sumOpady).toFixed(2)), // Suma opadów na dzień
        w_sniegu: Number((d.sumSnieg / d.count).toFixed(2)) // Średnia pokrywa
    }));

    const sorted = daysList.sort((a, b) => b.Blad_Abs_HRES - a.Blad_Abs_HRES);
    return sorted.slice(0, limit);
};

// Porównanie z Historią (Resztą danych, e.g. całe 12 miesięcy vs aktualny filtr)
export const getHistoryComparison = (allData, currentFilteredData) => {
    if (!allData || !currentFilteredData || currentFilteredData.length === 0) return null;

    // Obliczamy statystyki dla aktualnego przefiltrowanego okresu
    const current = getAggregatedMetrics(currentFilteredData);

    // Obliczamy statystyki dla całych 12 miesięcy
    const history = getAggregatedMetrics(allData);

    // Zwracamy paczkę gotową np. dla BarCharta lub kart porównawczych
    return [
        {
            name: 'Wybrany Okres',
            MAE_Korekta: Number(current.maeKorekta),
            MAE_HRES: Number(current.maeHres)
        },
        {
            name: 'Historia (12 Miesięcy)',
            MAE_Korekta: Number(history.maeKorekta),
            MAE_HRES: Number(history.maeHres)
        }
    ];
};

// Funkcja "Furtka" - Przetwarzająca surowe dane z excela / CSV
export const processRawSQLData = (rawData) => {
    // rawData to tablica obiektów wypluta z PapaParse np: [{ dataGodzinaUTC: "2026-01-01 12:00:00.000", lokalizacja: "PGED_Bialystok", Val_Historia: 12.5 ... }]
    const processed = [];

    // Najpierw musimy wyliczyć MAE dla wszystkich lokalizacji i MAPE dobowe
    // Krok 1: Grupujemy po dniu i lokalizacji dla MApe Dobowe
    const dailyMapeData = {};
    const locMaeData = {};

    rawData.forEach(row => {
        if (!row.lokalizacja || !row.dataGodzinaUTC) return; // Pomijamy puste wiersze

        const loc = row.lokalizacja;
        const day = row.dataGodzinaUTC.substring(0, 10);
        const keyDayLoc = `${loc}_${day}`;

        // Bezpieczne parsowanie liczbowe
        const vHist = Number(row.Val_Historia) || 0;
        const vHres = Number(row.Val_HRES) || 0;
        const vKor = Number(row.Val_Korekta) || 0;

        // Zapewnienie błędu absolutnego (często SQL go oddaje, ale wyliczmy dla pewności)
        const errAbsHres = Number(row.Blad_Abs_HRES) || Math.abs(vHres - vHist);
        const errAbsKor = Number(row.Blad_Abs_Korekta) || Math.abs(vKor - vHist);

        // Agregacja lokalizacyjna (MAE)
        if (!locMaeData[loc]) {
            locMaeData[loc] = { sumHres: 0, sumKor: 0, count: 0 };
        }
        locMaeData[loc].sumHres += errAbsHres;
        locMaeData[loc].sumKor += errAbsKor;
        locMaeData[loc].count += 1;

        // Agregacja dobowa (MAPE)
        if (!dailyMapeData[keyDayLoc]) {
            dailyMapeData[keyDayLoc] = { sumMapeHres: 0, sumMapeKor: 0, validHours: 0 };
        }

        if (vHist > 0.1) {
            dailyMapeData[keyDayLoc].sumMapeHres += (errAbsHres / Math.abs(vHist));
            dailyMapeData[keyDayLoc].sumMapeKor += (errAbsKor / Math.abs(vHist));
            dailyMapeData[keyDayLoc].validHours += 1;
        }

        processed.push({
            dataGodzinaUTC: row.dataGodzinaUTC,
            lokalizacja: row.lokalizacja,
            Val_Historia: vHist,
            Val_HRES: vHres,
            Val_Korekta: vKor,
            Blad_Abs_HRES: errAbsHres,
            Blad_Abs_Korekta: errAbsKor,
            cps: Number(row.cps) || 0,
            cps_cn: Number(row.cps_cn) || 0,
            temp: row.temp !== null && row.temp !== '' ? Number(row.temp) : null,
            zachmurzenie: row.zachmurzenie !== null && row.zachmurzenie !== '' ? Number(row.zachmurzenie) : null,
            opady_pow_all: Number(row.opady_pow_all) || 0,
            w_sniegu: Number(row.w_sniegu) || 0
        });
    });

    // Krok 2: Uzupełnianie atrybutów wyliczonych na każdy wiersz
    processed.forEach(row => {
        const keyDayLoc = `${row.lokalizacja}_${row.dataGodzinaUTC.substring(0, 10)}`;
        const dailyInfo = dailyMapeData[keyDayLoc];
        const locInfo = locMaeData[row.lokalizacja];

        row.MAPE_HRES_Doba = dailyInfo && dailyInfo.validHours > 0
            ? Number((dailyInfo.sumMapeHres / dailyInfo.validHours).toFixed(4))
            : 0;

        row.MAPE_Korekta_Doba = dailyInfo && dailyInfo.validHours > 0
            ? Number((dailyInfo.sumMapeKor / dailyInfo.validHours).toFixed(4))
            : 0;

        row.MAE_HRES = locInfo && locInfo.count > 0
            ? Number((locInfo.sumHres / locInfo.count).toFixed(2))
            : 0;

        row.MAE_Korekta = locInfo && locInfo.count > 0
            ? Number((locInfo.sumKor / locInfo.count).toFixed(2))
            : 0;
    });

    return processed;
};
