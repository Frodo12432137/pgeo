import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ErrorDistributionPanel = ({ data }) => {
    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Group by lokalizacja
        const locations = {};
        data.forEach(row => {
            if (!locations[row.lokalizacja]) {
                locations[row.lokalizacja] = { name: row.lokalizacja, sumKorekta: 0, sumHres: 0, count: 0 };
            }
            locations[row.lokalizacja].sumKorekta += row.Blad_Abs_Korekta;
            locations[row.lokalizacja].sumHres += row.Blad_Abs_HRES;
            locations[row.lokalizacja].count += 1;
        });

        return Object.values(locations).map(loc => ({
            name: loc.name,
            Korekta: Number((loc.sumKorekta / loc.count).toFixed(2)),
            HRES: Number((loc.sumHres / loc.count).toFixed(2))
        }));
    }, [data]);

    return (
        <div className="glass-panel col-span-12 lg:col-span-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-primary">Średni Błąd w Lokatach (MAE)</h3>
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={aggregatedData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
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
                        <Bar dataKey="Korekta" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="HRES" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ErrorDistributionPanel;
