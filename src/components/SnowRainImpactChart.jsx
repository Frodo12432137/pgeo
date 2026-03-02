import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getPrecipitationAnomalies } from '../utils/dataProcessing';

const SnowRainImpactChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return getPrecipitationAnomalies(data);
    }, [data]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ backgroundColor: 'var(--bg-dark)', padding: '10px', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <p className="text-secondary mb-1">{data.name}</p>
                    <p className="text-primary text-sm mb-1">Błąd MAE HRES: <span className="font-bold">{data.MAE} MW</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel col-span-12 lg:col-span-6 flex flex-col mt-6">
            <h3 className="text-lg font-semibold mb-1 text-primary">Anomalie Pogodowe - Błąd HRES</h3>
            <p className="text-sm text-muted mb-4">Średni błąd bezwzględny modelu w warunkach ekstremalnych vs normalnych</p>

            <div className="flex-1 w-full" style={{ minHeight: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} />
                        <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `${val} MW`} />
                        <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={12} width={100} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                        <Bar dataKey="MAE" barSize={40} radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <cell
                                    key={`cell-${index}`}
                                    fill={entry.name === 'Opady / Śnieg' ? '#8b5cf6' : 'var(--text-muted)'}
                                />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SnowRainImpactChart;
