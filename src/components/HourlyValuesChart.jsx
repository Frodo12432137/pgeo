import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const HourlyValuesChart = ({ data, selectedLocation }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const safeDate = (dateStr) => {
            if (!dateStr) return new Date();
            const d = new Date(dateStr.replace(' ', 'T'));
            return isNaN(d) ? new Date() : d;
        };

        const sorted = [...data].sort((a, b) => safeDate(a.dataGodzinaUTC) - safeDate(b.dataGodzinaUTC));

        const groupedByHour = {};
        sorted.forEach(row => {
            const time = row.dataGodzinaUTC;
            if (!groupedByHour[time]) {
                groupedByHour[time] = { time, sumKorekta: 0, sumHres: 0, sumHistoria: 0 };
            }
            groupedByHour[time].sumKorekta += row.Val_Korekta;
            groupedByHour[time].sumHres += row.Val_HRES;
            groupedByHour[time].sumHistoria += row.Val_Historia;
        });

        const aggregated = Object.values(groupedByHour).map(item => {
            const dateObj = safeDate(item.time);
            return {
                time: item.time,
                displayTime: format(dateObj, 'dd MMM HH:mm', { locale: pl }),
                Korekta: Number(item.sumKorekta.toFixed(2)),
                HRES: Number(item.sumHres.toFixed(2)),
                Wykonanie: Number(item.sumHistoria.toFixed(2))
            };
        });

        if (aggregated.length > 200) {
            const step = Math.ceil(aggregated.length / 200);
            return aggregated.filter((_, i) => i % step === 0);
        }

        return aggregated;
    }, [data]);

    const isSum = selectedLocation === 'Wszystkie';

    return (
        <div className="glass-panel col-span-12 flex flex-col mt-6">
            <h3 className="text-lg font-semibold mb-1 text-primary">Przebieg godzinowy - Wartości (Wykonanie vs Modele)</h3>
            <p className="text-sm text-muted mb-4">
                {isSum ? 'Suma bilansu dla wszystkich oddziałów (MW)' : 'Wartości dla wybranego oddziału (MW)'}
            </p>

            <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                        <XAxis
                            dataKey="displayTime"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickMargin={10}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickFormatter={(val) => `${val} MW`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey="Wykonanie"
                            stroke="#9ca3af"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Korekta"
                            stroke="var(--color-accent)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="HRES"
                            stroke="var(--color-brand)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HourlyValuesChart;
