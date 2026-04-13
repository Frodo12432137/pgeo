import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

const HourlyErrorsChart = ({ data, selectedLocation }) => {
    // Dla czytelności, jeśli danych jest za dużo (> 500 punktów), weźmiemy tylko co N-ty punkt lub zagregujemy.
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Safe date parsing to avoid 'Invalid Date' crash
        const safeDate = (dateStr) => {
            if (!dateStr) return new Date();
            const d = new Date(dateStr.replace(' ', 'T'));
            return isNaN(d) ? new Date() : d;
        };

        // Sort logic to ensure consecutive timestamps
        const sorted = [...data].sort((a, b) => safeDate(a.dataGodzinaUTC) - safeDate(b.dataGodzinaUTC));

        // If we have data from multiple locations for the identical hour, we should aggregate them.
        const groupedByHour = {};
        sorted.forEach(row => {
            const time = row.dataGodzinaUTC;
            if (!groupedByHour[time]) {
                groupedByHour[time] = { 
                    time, 
                    sumValKorekta: 0, sumValHres: 0, sumHistoria: 0,
                    sumBladKorekta: 0, sumBladHres: 0,
                    count: 0 
                };
            }
            groupedByHour[time].sumValKorekta += row.Val_Korekta;
            groupedByHour[time].sumValHres += row.Val_HRES;
            groupedByHour[time].sumHistoria += row.Val_Historia;
            
            const errK = row.Blad_Abs_Korekta !== undefined ? Math.abs(row.Blad_Abs_Korekta) : Math.abs(row.Val_Korekta - row.Val_Historia);
            const errH = row.Blad_Abs_HRES !== undefined ? Math.abs(row.Blad_Abs_HRES) : Math.abs(row.Val_HRES - row.Val_Historia);
            
            groupedByHour[time].sumBladKorekta += errK;
            groupedByHour[time].sumBladHres += errH;
            groupedByHour[time].count += 1;
        });

        const aggregated = Object.values(groupedByHour).map(item => {
            const dateObj = safeDate(item.time);
            return {
                time: item.time,
                displayTime: format(dateObj, 'dd MMM HH:mm', { locale: pl }),
                "Korekta (Suma)": Number(Math.abs(item.sumValKorekta - item.sumHistoria).toFixed(2)),
                "HRES (Suma)": Number(Math.abs(item.sumValHres - item.sumHistoria).toFixed(2)),
                "Korekta (Śr. z lok.)": Number((item.sumBladKorekta / item.count).toFixed(2)),
                "HRES (Śr. z lok.)": Number((item.sumBladHres / item.count).toFixed(2))
            };
        });

        // Downsample if more than 200 points to keep UI responsive
        if (aggregated.length > 200) {
            const step = Math.ceil(aggregated.length / 200);
            return aggregated.filter((_, i) => i % step === 0);
        }

        return aggregated;
    }, [data]);

    const showLocationAverage = selectedLocation === 'Wszystkie';

    return (
        <div className="glass-panel col-span-12 flex flex-col">
            <h3 className="text-lg font-semibold mb-1 text-primary">Przebieg godzinowy - Odchylenia Absolutne</h3>
            <p className="text-sm text-muted mb-4">
                {showLocationAverage ? 'Porównanie błędu sumy całego bilansu oraz średniego błędu pojedynczego oddziału' : 'Wartości dla wybranego filtru'}
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
                            dataKey="Korekta (Suma)"
                            stroke="var(--color-accent)"
                            strokeWidth={showLocationAverage ? 3 : 2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="HRES (Suma)"
                            stroke="var(--color-brand)"
                            strokeWidth={showLocationAverage ? 3 : 2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        {showLocationAverage && (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="Korekta (Śr. z lok.)"
                                    stroke="var(--color-accent)"
                                    strokeDasharray="5 5"
                                    strokeWidth={1}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="HRES (Śr. z lok.)"
                                    stroke="var(--color-brand)"
                                    strokeDasharray="5 5"
                                    strokeWidth={1}
                                    dot={false}
                                />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HourlyErrorsChart;
