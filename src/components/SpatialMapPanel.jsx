import React, { useMemo } from 'react';
import { getMapDataForDate } from '../utils/dataProcessing';

// Procentowe współrzędne dla 8 lokalizacji PGE Dystrybucja (przybliżone na siatce udającej Polskę)
// x:0 = lewa, x:100 = prawa (wschód), y:0 = góra, y:100 = dół (południe)
const CITY_COORDS = {
    'PGED_Bialystok': { x: 88, y: 28 },
    'PGED_Lodz_miasto': { x: 55, y: 55 },
    'PGED_Lodz_teren': { x: 52, y: 58 }, // Lekko przesunięte względem miasta
    'PGED_Zamosc': { x: 87, y: 73 },
    'PGED_Rzeszow': { x: 78, y: 82 },
    'PGED_Warszawa': { x: 65, y: 45 },
    'PGED_Lublin': { x: 82, y: 65 },
    'PGED_Skarzysko_Kamienna': { x: 65, y: 65 },
};

const SpatialMapPanel = ({ data, selectedDateStr }) => {
    const mapData = useMemo(() => {
        return getMapDataForDate(data, selectedDateStr);
    }, [data, selectedDateStr]);

    if (!selectedDateStr) {
        return (
            <div className="glass-panel col-span-12 xl:col-span-6 flex flex-col items-center justify-center min-h-[400px]">
                <h3 className="text-lg font-semibold mb-2 text-primary">Przestrzenna Heatmapa (Geomapping)</h3>
                <p className="text-sm text-muted">Kliknij na wiersz w "Rejestrze Anomalii" poniżej, aby wygenerować rzut przestrzenny błędów.</p>
            </div>
        );
    }

    if (mapData.length === 0) {
        return (
            <div className="glass-panel col-span-12 xl:col-span-6 flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-sm text-muted">Brak danych przestrzennych dla terminu: {selectedDateStr}</p>
            </div>
        );
    }

    return (
        <div className="glass-panel col-span-12 xl:col-span-6 flex flex-col relative overflow-hidden">
            <h3 className="text-lg font-semibold mb-1 text-primary">Rozkład błędu HRES: {selectedDateStr}</h3>
            <p className="text-sm text-muted mb-4">Geolokalizacja obszarów największych pomyłek modelu</p>

            {/* Stylizowany kontener udający planszę radaru/mapy */}
            <div className="flex-1 w-full min-h-[400px] relative mt-2 bg-black/20 border border-[var(--border-glass)] rounded-xl overflow-hidden">
                {/* Delikatna siatka tła (grid) */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(var(--border-glass) 1px, transparent 1px), linear-gradient(90deg, var(--border-glass) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    opacity: 0.2
                }}></div>

                {/* Renderowanie miast jako bąbelków na siatce */}
                {mapData.map((loc, idx) => {
                    const coords = CITY_COORDS[loc.lokalizacja] || { x: 50, y: 50 }; // Fallback na środek

                    // Skalowanie wielkości bąbla (błędu HRES) na mapie od 15px do 60px
                    const baseSize = 10;
                    const sizeHres = Math.min(Math.max(baseSize + (loc.MAE_HRES * 2), 15), 80);

                    // Kolor bąbla na podstawie siły chmur (szare/deszczowe vs jasne)
                    const isBadWeather = loc.clouds > 60 || loc.temp < 0;
                    const bubbleColor = isBadWeather ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'; // Czerwony dla opadów/chmur, Niebieski dla Czystych

                    return (
                        <div key={idx} className="absolute group cursor-pointer" style={{
                            left: `${coords.x}%`,
                            top: `${coords.y}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: Math.round(sizeHres)
                        }}>
                            {/* Środek punktu (lokalizacja) */}
                            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg"></div>

                            {/* Bąbel błędu (HRES) */}
                            <div className="rounded-full shadow-2xl transition-all duration-500 ease-in-out border border-white/20"
                                style={{
                                    width: `${sizeHres}px`,
                                    height: `${sizeHres}px`,
                                    backgroundColor: bubbleColor,
                                    backdropFilter: 'blur(2px)'
                                }}>
                            </div>

                            {/* Tooltip przy najeżdżaniu */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-glass)] backdrop-blur-md rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                <p className="text-white font-bold text-sm border-b border-white/10 pb-1 mb-1">{loc.lokalizacja.replace('PGED_', '').replace('_', ' ')}</p>
                                <p className="text-[11px] text-[var(--color-danger)] font-medium">Błąd HRES: {loc.MAE_HRES} MW</p>
                                <p className="text-[11px] text-accent font-medium mt-0.5">Błąd Korekta: {loc.MAE_Korekta} MW</p>
                                <div className="mt-2 pt-2 border-t border-white/10 flex gap-3 text-[10px] text-muted">
                                    <span>☁️ {loc.clouds}%</span>
                                    <span>🌡️ {loc.temp}°C</span>
                                    <span>☀️ {loc.rad} W/m²</span>
                                </div>
                            </div>

                            {/* Podpis z nazwą miasta pod bubblem */}
                            <p className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-[10px] font-semibold text-secondary whitespace-nowrap opacity-80 pointer-events-none drop-shadow-md">
                                {loc.lokalizacja.replace('PGED_', '').replace('_', ' ')}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[10px] text-muted bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full bg-red-500/50"></span> Strefa brzydkiej pogody
                <span className="w-2 h-2 rounded-full bg-blue-500/50 ml-2"></span> Strefa dobrej pogody
            </div>
        </div>
    );
};

export default SpatialMapPanel;
