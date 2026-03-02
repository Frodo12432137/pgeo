import React, { useState, useMemo } from 'react';
import { getWorstAnomalies, getWorstDays } from '../utils/dataProcessing';

const WorstAnomaliesTable = ({ data, selectedDate, onRowSelect }) => {
    const [viewMode, setViewMode] = useState('godziny'); // 'godziny' or 'dni'

    const hourlyAnomalies = useMemo(() => {
        return getWorstAnomalies(data, 10);
    }, [data]);

    const dailyAnomalies = useMemo(() => {
        return getWorstDays(data, 10);
    }, [data]);

    const anomalies = viewMode === 'godziny' ? hourlyAnomalies : dailyAnomalies;

    if (!anomalies || anomalies.length === 0) return null;

    return (
        <div className="glass-panel col-span-12 flex flex-col mt-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-semibold text-primary">
                    Wyszukiwarka Najgorszych Błędów (Top 10 HRES Anomalii)
                </h3>
                <div className="flex bg-black/30 rounded-lg p-1 border border-[var(--border-glass)]">
                    <button
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'godziny' ? 'bg-blue-600 text-white' : 'text-secondary hover:text-white'}`}
                        onClick={() => setViewMode('godziny')}
                    >
                        Godziny
                    </button>
                    <button
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'dni' ? 'bg-blue-600 text-white' : 'text-secondary hover:text-white'}`}
                        onClick={() => setViewMode('dni')}
                    >
                        Całe Dnie
                    </button>
                </div>
            </div>
            <p className="text-sm text-muted mb-4">{viewMode === 'godziny' ? 'Godziny' : 'Doby (skumulowane MW)'} i lokalizacje w których rozbieżność prognozy była największa wraz z tłem pogodowym.</p>

            <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-[var(--border-glass)] text-left">
                    <thead>
                        <tr>
                            <th className="px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">{viewMode === 'godziny' ? 'Data i Czas' : 'Data'}</th>
                            <th className="px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Lokalizacja</th>
                            <th className="px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider border-r border-[var(--border-glass)]">Wykonanie</th>
                            <th className="px-3 py-3 text-xs font-semibold text-brand uppercase tracking-wider">Prog. HRES</th>
                            <th className="px-3 py-3 text-xs font-semibold text-[var(--color-danger)] uppercase tracking-wider border-r border-[var(--border-glass)]">Błąd HRES (MW / %)</th>
                            <th className="px-3 py-3 text-xs font-semibold text-accent uppercase tracking-wider">Prog. Korekta</th>
                            <th className="px-3 py-3 text-xs font-semibold text-accent uppercase tracking-wider border-r border-[var(--border-glass)]">Błąd Kor. (MW / %)</th>
                            <th className="px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider" title="Promieniowanie słoneczne">Promień.</th>
                            <th className="px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Chmury</th>
                            <th className="px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Temp.</th>
                            <th className="px-3 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Opad/Śnieg</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-glass)] bg-black/10">
                        {anomalies.map((row, idx) => {
                            const mapeHres = row.Val_Historia > 0 ? ((row.Blad_Abs_HRES / row.Val_Historia) * 100).toFixed(1) : '-';
                            const mapeKorekta = row.Val_Historia > 0 ? ((row.Blad_Abs_Korekta / row.Val_Historia) * 100).toFixed(1) : '-';

                            const rowDateStr = viewMode === 'godziny' ? row.dataGodzinaUTC.substring(0, 16) : row.dataGodzinaUTC;
                            const isSelected = selectedDate === rowDateStr;

                            return (
                                <tr
                                    key={idx}
                                    onClick={() => onRowSelect && onRowSelect(rowDateStr)}
                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-white/10 border-l-2 border-brand' : 'hover:bg-white/5'}`}
                                >
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-primary">
                                        {rowDateStr}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-primary font-medium">{row.lokalizacja}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-white font-bold border-r border-[var(--border-glass)]">
                                        {row.Val_Historia} MW
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-brand">
                                        {row.Val_HRES} MW
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-[var(--color-danger)] border-r border-[var(--border-glass)]">
                                        {row.Blad_Abs_HRES} MW <span className="text-xs text-secondary font-normal ml-1">({mapeHres}%)</span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-accent">
                                        {row.Val_Korekta} MW
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-accent border-r border-[var(--border-glass)]">
                                        {row.Blad_Abs_Korekta} MW <span className="text-xs text-secondary font-normal ml-1">({mapeKorekta}%)</span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted">
                                        {row.cps} W/m²
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted">
                                        {row.zachmurzenie.toFixed(0)}%
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted">
                                        {row.temp}°C
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted">
                                        {(row.opady_pow_all || 0).toFixed(1)} / {(row.w_sniegu || 0).toFixed(1)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WorstAnomaliesTable;
