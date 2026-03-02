import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHistoryComparison } from '../utils/dataProcessing';
import { History } from 'lucide-react';

const HistoryComparisonPanel = ({ allData, currentFilteredData }) => {
    const chartData = useMemo(() => {
        return getHistoryComparison(allData, currentFilteredData);
    }, [allData, currentFilteredData]);

    if (!chartData) return null;

    return (
        <div className="glass-panel col-span-12 lg:col-span-6 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
                <History size={20} className="text-secondary" />
                <h3 className="text-lg font-semibold text-primary">Porównanie z Historią (Ostatnie 12 mies)</h3>
            </div>
            <p className="text-sm text-muted mb-4">Weryfikacja jakości modeli w wybranym przedziale kontra średnia roczna</p>

            <div className="flex-1 w-full" style={{ minHeight: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `${val} MW`} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="MAE_Korekta" name="Korekta" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="MAE_HRES" name="HRES" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HistoryComparisonPanel;
