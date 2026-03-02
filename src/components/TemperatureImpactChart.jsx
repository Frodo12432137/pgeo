import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { getTemperatureBuckets } from '../utils/dataProcessing';

const TemperatureImpactChart = ({ data }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Sort temperature buckets logically
        const order = { 'Poniżej 0°C': 1, '0°C - 5°C': 2, '5°C - 15°C': 3, 'Powyżej 15°C': 4 };
        const buckets = getTemperatureBuckets(data);
        return buckets.sort((a, b) => order[a.name] - order[b.name]);
    }, [data]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ backgroundColor: 'var(--bg-dark)', padding: '10px', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <p className="text-secondary mb-1">{data.name}</p>
                    <p className="text-primary text-sm mb-1">Próbki: {data.count} h</p>
                    <p className={`text-sm font-bold ${data.Bias > 0 ? 'text-[var(--color-danger)]' : 'text-blue-400'}`}>
                        Bias HRES: {data.Bias > 0 ? '+' : ''}{data.Bias} MW
                    </p>
                    <p className="text-muted text-xs mt-1">{data.Bias > 0 ? '(Przeszacowanie)' : '(Niedoszacowanie)'}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel col-span-12 lg:col-span-6 flex flex-col mt-6">
            <h3 className="text-lg font-semibold mb-1 text-primary">Wpływ Temperatury - Kierunek błędu HRES</h3>
            <p className="text-sm text-muted mb-4">Gdzie model myli się najbardziej i w którą stronę (+ przeszacowanie / - niedoszacowanie)</p>

            <div className="flex-1 w-full" style={{ minHeight: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `${val} MW`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                        <ReferenceLine y={0} stroke="var(--text-secondary)" strokeDasharray="3 3" />
                        <Bar dataKey="Bias" radius={[4, 4, 4, 4]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.Bias > 0 ? 'var(--color-danger)' : '#60a5fa'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TemperatureImpactChart;
