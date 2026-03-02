import React, { useState, useEffect, useMemo } from 'react';
import { generateMockData } from './data/mockData';
import { filterData, getAvailableLocations, getAggregatedMetrics } from './utils/dataProcessing';

import Controls from './components/Controls';
import MetricsCards from './components/MetricsCards';
import ErrorDistributionPanel from './components/ErrorDistributionPanel';
import HourlyErrorsChart from './components/HourlyErrorsChart';
import WeatherImpactPanel from './components/WeatherImpactPanel';
import WeatherKPIs from './components/WeatherKPIs';
import TemperatureImpactChart from './components/TemperatureImpactChart';
import SnowRainImpactChart from './components/SnowRainImpactChart';
import RelativeErrorsPanel from './components/RelativeErrorsPanel';
import CorrelationPanel from './components/CorrelationPanel';
import HistoryComparisonPanel from './components/HistoryComparisonPanel';
import WorstAnomaliesTable from './components/WorstAnomaliesTable';
import CloudDeltaImpactChart from './components/CloudDeltaImpactChart';
import SpatialMapPanel from './components/SpatialMapPanel';

function App() {
  const [data, setData] = useState([]);
  const [locations, setLocations] = useState([]);

  // State for Filters
  const [selectedLocation, setSelectedLocation] = useState('Wszystkie');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-30');

  // State for Map (Phase 4)
  const [selectedAnomalyDate, setSelectedAnomalyDate] = useState(null);

  useEffect(() => {
    // Symulacja ładowania danych
    const mockDb = generateMockData();
    setData(mockDb);
    setLocations(getAvailableLocations(mockDb));
  }, []);

  // Filtered data to pass down
  const filteredData = useMemo(() => {
    return filterData(data, selectedLocation, startDate, endDate);
  }, [data, selectedLocation, startDate, endDate]);

  const aggregateMetrics = useMemo(() => {
    return getAggregatedMetrics(filteredData);
  }, [filteredData]);

  return (
    <div className="app-container">
      <Controls
        locations={locations}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      <main className="main-content">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-secondary">
            <p>Generowanie i analizowanie danych modelu...</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Karty podsumowujące (Średni MAE i Kto lepszy) */}
            <MetricsCards metrics={aggregateMetrics} />

            {/* Faza 3: Historia i Błąd Względny */}
            <div className="col-span-12 mt-4 mb-2">
              <h2 className="text-2xl font-bold text-primary border-b border-[var(--border-glass)] pb-2 inline-block">
                Wydajność Ogólna i Kontekst Historyczny
              </h2>
            </div>

            <RelativeErrorsPanel data={filteredData} />
            <HistoryComparisonPanel allData={data} currentFilteredData={filteredData} />


            {/* Dystrybucja Błędu per Lokalizacja - zajmie pół szerokości */}
            <ErrorDistributionPanel data={filteredData} />

            {/* Informacyjny kontener, jeżeli wybrano 1 lokalizację */}
            <div className="glass-panel col-span-12 lg:col-span-6 flex flex-col justify-center items-center text-center p-8">
              <h3 className="text-xl font-bold text-primary mb-2">Bieżący zakres</h3>
              <p className="text-secondary mb-4">Lokalizacja: <span className="font-semibold text-accent">{selectedLocation}</span></p>
              <p className="text-secondary">Wybrany okres od {startDate} do {endDate}. Dane są przeliczane dynamicznie dla każdego z modeli.</p>
              <div className="mt-8 flex gap-4">
                <div className="px-4 py-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">Model HRES</div>
                <div className="px-4 py-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Model Korekta</div>
              </div>
            </div>

            {/* Wykres godzinowy */}
            <HourlyErrorsChart data={filteredData} />

            {/* --- SEKCJA POGODOWA (FOCUS HRES) --- */}
            <div className="col-span-12 mt-8 mb-2">
              <h2 className="text-2xl font-bold text-primary border-b border-[var(--border-glass)] pb-2 inline-block">
                Szczegółowa Analityka Pogodowa (Model HRES)
              </h2>
              <p className="text-secondary mt-2">Dedykowane wykresy analizujące wpływ warunków atmosferycznych na błąd algorytmu fundamentalnego.</p>
            </div>

            {/* Karty KPI Najgorszych Zjawisk */}
            <WeatherKPIs data={filteredData} />

            {/* Faza 3: Współczynniki Korelacji Pogodowej */}
            <CorrelationPanel data={filteredData} />

            {/* Wpływ Temperatury i Opadów */}
            <TemperatureImpactChart data={filteredData} />
            <SnowRainImpactChart data={filteredData} />

            {/* Analityka Pogodowa promieniowania (Scatter) */}
            <WeatherImpactPanel data={filteredData} />

            {/* Faza 4: Analiza Przestrzenna i Dynamika Zmian */}
            <div className="col-span-12 mt-8 mb-2">
              <h2 className="text-2xl font-bold text-primary border-b border-[var(--border-glass)] pb-2 inline-block">
                Zaawansowane Moduły Przestrzenne i Wstrząsy
              </h2>
              <p className="text-secondary mt-2">Geomapowanie błędów w Polsce oraz badanie wrażliwości algorytmu na nagłe zmiany zachmurzenia (godzina do godziny).</p>
            </div>

            <CloudDeltaImpactChart data={filteredData} />
            <SpatialMapPanel data={filteredData} selectedDateStr={selectedAnomalyDate} />

            {/* Faza 3: Tabela Najgorszych Dni/Godzin */}
            <div className="col-span-12 mt-8 mb-2">
              <h2 className="text-2xl font-bold text-primary border-b border-[var(--border-glass)] pb-2 inline-block">
                Rejestr Anomalii: Krytyczne Błędy
              </h2>
              <p className="text-secondary mt-2">Wyszukiwarka najbardziej rozbieżnych predykcji HRES z podpiętą historią pogody w danej godzinie.</p>
            </div>
            <WorstAnomaliesTable
              data={filteredData}
              selectedDate={selectedAnomalyDate}
              onRowSelect={setSelectedAnomalyDate}
            />

          </div>
        )}
      </main>
    </div>
  );
}

export default App;
