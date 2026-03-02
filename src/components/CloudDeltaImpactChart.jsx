import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCloudDeltaImpact } from '../utils/dataProcessing';

const CloudDeltaImpactChart = ({ data }) => {
    const chartData = useMemo(() => {
        return getCloudDeltaImpact(data);
    }, [data]);

    return (
        <div className="glass-panel col-span-12 xl:col-span-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-1 text-primary">Dynamika Zmian (Ramping) - Zachmurzenie</h3>
            <p className="text-sm text-muted mb-4">Wpływ gwałtownych skoków zachmurzenia (z godziny na godzinę) na średni błąd HRES</p>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} />
                        <XAxis
                            type="number"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickFormatter={(val) => `${val} MW`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            width={160}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            formatter={(value) => [`${value} MW`, '']}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="MAE_HRES" name="MAE HRES" fill="var(--color-brand)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="MAE_Korekta" name="MAE Korekta" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CloudDeltaImpactChart;
