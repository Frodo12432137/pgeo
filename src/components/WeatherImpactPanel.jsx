import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

const WeatherImpactPanel = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Filter daylight hours and reasonable history signals
        const daylightData = data.filter(d => d.cps_cn > 10 && d.Val_Historia > 5);

        return daylightData.map(row => ({
            cps: Number(row.cps.toFixed(0)), /* X: Promieniowanie */
            errorKorekta: Number((row.Val_Korekta - row.Val_Historia).toFixed(2)), /* Y: Błąd (prognoza - wykonanie) */
            errorHres: Number((row.Val_HRES - row.Val_Historia).toFixed(2)),
            temp: row.temp,
            lokalizacja: row.lokalizacja,
            zachmurzenie: row.zachmurzenie
        }));
    }, [data]);

    // Downsample to max 500 points to keep UI unblocked
    const sampledData = useMemo(() => {
        if (chartData.length > 500) {
            const step = Math.ceil(chartData.length / 500);
            return chartData.filter((_, i) => i % step === 0);
        }
        return chartData;
    }, [chartData]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ backgroundColor: 'var(--bg-dark)', padding: '10px', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <p className="text-secondary mb-1">{data.lokalizacja}</p>
                    <p className="text-primary text-sm">CPS: {data.cps} W/m²</p>
                    <p className="text-primary text-sm">Zachmurzenie: {data.zachmurzenie.toFixed(0)}%</p>
                    <p className="text-[var(--color-accent)] text-sm font-semibold mt-2">Błąd Korekta: {data.errorKorekta} MW</p>
                    <p className="text-[var(--color-brand)] text-sm font-semibold">Błąd HRES: {data.errorHres} MW</p>
                    <p className="text-muted text-xs mt-1">(Wartość dodatnia = Przeszacowanie)</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel col-span-12 flex flex-col mt-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-primary">Analityka Pogodowa: Wpływ Promieniowania na Błąd</h3>
                    <p className="text-sm text-muted">Błąd Prognozy [MW] w zależności od Intensywności Promieniowania Słonecznego [W/m²]</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-h-[300px] border border-[var(--border-glass)] rounded-xl p-4 bg-black/10">
                    <h4 className="text-center font-medium text-[var(--color-accent)] mb-2">Model Korekta</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                            <XAxis type="number" dataKey="cps" name="CPS" unit=" W/m²" stroke="var(--text-muted)" fontSize={11} domain={['minData', 'maxData']} />
                            <YAxis type="number" dataKey="errorKorekta" name="Błąd" unit=" MW" stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
                            <ZAxis range={[30, 30]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--text-secondary)' }} />
                            <Scatter name="Korekta" data={sampledData} fill="var(--color-accent)" fillOpacity={0.6} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex-1 min-h-[300px] border border-[var(--border-glass)] rounded-xl p-4 bg-black/10">
                    <h4 className="text-center font-medium text-[var(--color-brand)] mb-2">Model HRES</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                            <XAxis type="number" dataKey="cps" name="CPS" unit=" W/m²" stroke="var(--text-muted)" fontSize={11} domain={['minData', 'maxData']} />
                            <YAxis type="number" dataKey="errorHres" name="Błąd" unit=" MW" stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
                            <ZAxis range={[30, 30]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--text-secondary)' }} />
                            <Scatter name="HRES" data={sampledData} fill="var(--color-brand)" fillOpacity={0.6} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default WeatherImpactPanel;
