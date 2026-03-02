import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { getWeatherCorrelations } from '../utils/dataProcessing';

const CorrelationPanel = ({ data }) => {
    const chartData = useMemo(() => {
        return getWeatherCorrelations(data);
    }, [data]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: 'var(--bg-dark)', padding: '10px', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <p className="text-secondary mb-2">{payload[0].payload.factor}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color, fontSize: '14px', fontWeight: 600 }}>
                            Korelacja {entry.name}: {entry.value}
                        </p>
                    ))}
                    <p className="text-xs text-muted mt-2">1 = pełna korelacja, 0 = brak, -1 = odwrotna</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel col-span-12 lg:col-span-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-1 text-primary">Wskaźniki Korelacji (Zmiana Błędu względem Pogody)</h3>
            <p className="text-sm text-muted mb-4">Współczynnik Pearsona: jak bardzo pogoda warunkuje wielkość błędu modelu</p>

            <div className="flex-1 w-full" style={{ minHeight: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} />
                        <XAxis type="number" stroke="var(--text-muted)" fontSize={12} domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} />
                        <YAxis dataKey="factor" type="category" stroke="var(--text-primary)" fontSize={12} width={120} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <ReferenceLine x={0} stroke="var(--text-secondary)" />
                        <Bar dataKey="HRES_Correlation" name="HRES" fill="var(--color-brand)" barSize={20} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Korekta_Correlation" name="Korekta" fill="var(--color-accent)" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CorrelationPanel;
