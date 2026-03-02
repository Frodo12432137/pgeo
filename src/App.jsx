import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { generateMockData } from './data/mockData';
import { filterData, getAvailableLocations, getAggregatedMetrics, processRawSQLData } from './utils/dataProcessing';

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
  useEffect(() => {
    // 1. Sprawdzenie, czy skrypt Python wstrzyknął ukrytego DIVa z Base64 (Najbezpieczniejsza metoda na Windows)
    const injectedDataNode = document.getElementById('pgeo-injected-data');
    if (injectedDataNode && injectedDataNode.getAttribute('data-b64')) {
      setLoadingMsg('Rozpakowywanie wstrzykniętego bloku danych... To zajmie tylko chwilę.');

      setTimeout(() => {
        try {
          const b64Data = injectedDataNode.getAttribute('data-b64');
          // Dekoduj z Base64 (obsługa UTF-8 na wypadek polskich, dziwnych znaków ze SQL)
          const decodedText = decodeURIComponent(escape(window.atob(b64Data)));
          const parsedData = JSON.parse(decodedText);

          if (parsedData.length > 0) {
            setLoadingMsg('Agregacja tysięcy rekordów Bazy Danych...');
            setTimeout(() => {
              const processedDb = processRawSQLData(parsedData);
              setData(processedDb);
              setLocations(getAvailableLocations(processedDb));
              setLoadingMsg('');
            }, 50);
          } else {
            setLoadingMsg('');
          }
        } catch (err) {
          alert('Krytyczny błąd podczas dekodowania Bazy: ' + err.message);
          setLoadingMsg('');
        }
      }, 50);
    }
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  // Ładowanie prawdziwych danych z pliku Excel/CSV
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingMsg(`Wczytywanie pliku ${file.name}... Proszę cierpliwie czekać (może zająć do ok. 10 sekund)`);

    try {
      // FileReader jest asynchroniczny, wczytujemy plik jako ArrayBuffer żeby go podać do XLSX
      const data = await file.arrayBuffer();

      // Zmuszamy UI do odświeżenia przez setTimeout 0, bo duży Excel zawiesza na moment główny wątek JS
      setTimeout(() => {
        try {
          // Wczytanie skoroszytu Excela
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          setLoadingMsg('Wyciąganie tabel SQL i kompresja danych...');

          // Konwersja tabeli Excela na czystą tablicę obiektów z nagłówkami
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

          if (jsonData.length === 0) {
            alert("Plik Excel jest pusty.");
            setLoadingMsg('');
            return;
          }

          setLoadingMsg('Składanie wskaźników HRES dla tysięcy rekordów (MAPE, MAE)...');

          // Odsunięcie w czasie samego przetworzenia, by pasek Loading mógł się narysować na froncie.
          setTimeout(() => {
            const processedDb = processRawSQLData(jsonData);
            setData(processedDb);
            setLocations(getAvailableLocations(processedDb));
            setLoadingMsg('');
          }, 100);

        } catch (err) {
          alert('Wystąpił błąd podczas dekodowania Excela: ' + err.message);
          setLoadingMsg('');
        }
      }, 50);

    } catch (error) {
      alert("Nie udało się otworzyć tego pliku: " + error.message);
      setLoadingMsg('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ target: { files: [e.dataTransfer.files[0]] } });
    }
  };

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
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div
              className={`glass-panel p-12 text-center max-w-2xl w-full border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-accent bg-accent/5' : 'border-[var(--border-glass)] hover:border-accent/50'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >

              {loadingMsg ? (
                <>
                  <div className="w-16 h-16 border-4 border-t-accent border-r-accent border-b-white/10 border-l-white/10 rounded-full animate-spin mx-auto mb-6"></div>
                  <h2 className="text-2xl font-bold text-primary mb-2">Ładowanie</h2>
                  <p className="text-secondary">{loadingMsg}</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M12 18v-6" />
                      <path d="M9 15l3-3 3 3" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-primary mb-4">Dashboard czeka na bazę danych...</h2>
                  <p className="text-secondary mb-8 text-lg">Aby bezpiecznie wgrać setki tysięcy rekordów omijając limit pamięci Chrome, <strong>uruchom skrypt Python (wgraj_dane.py)</strong> dostarczony z plikami i wklej w nim ścieżkę do swojego pliku Excel / CSV!</p>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={loadMockData}
                      className="px-6 py-3 rounded-lg border border-[var(--border-glass)] text-secondary hover:text-white hover:bg-white/5 transition-all font-medium"
                    >
                      Brak bazy? Załaduj wbudowane dane testowe
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-6 text-center opacity-70">
                    Opcja przesuwania plików (Drag & Drop) została wyłączona w celu uchronienia Twojej przeglądarki przed całkowitym zawieszeniem wynikającym z ograniczeń pamięciowych dla ogromnych zrzutów z baz systemowych.
                  </p>
                </>
              )}
            </div>
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
