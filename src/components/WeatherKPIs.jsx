import React, { useMemo } from 'react';
import { AlertTriangle, CloudRain, ThermometerSnowflake, Sun } from 'lucide-react';
import { getTemperatureBuckets, getCloudCoverBuckets, getPrecipitationAnomalies } from '../utils/dataProcessing';

const WeatherKPIs = ({ data }) => {
    const kpis = useMemo(() => {
        if (!data || data.length === 0) return null;

        const tempBuckets = getTemperatureBuckets(data);
        const cloudBuckets = getCloudCoverBuckets(data);
        const anomalies = getPrecipitationAnomalies(data);

        // Znajdź najgorszy przedział temperaturowy dla HRES
        const worstTemp = tempBuckets.reduce((max, obj) => Math.abs(obj.Bias) > Math.abs(max.Bias) ? obj : max, tempBuckets[0]);
        // Najgorsze zachmurzenie
        const worstCloud = cloudBuckets.reduce((max, obj) => Math.abs(obj.Bias) > Math.abs(max.Bias) ? obj : max, cloudBuckets[0]);

        // Różnica w MAE między dniami czystymi a z opadami
        const cleanMAE = anomalies.find(a => a.name === 'Czyste niebo')?.MAE || 0;
        const badMAE = anomalies.find(a => a.name === 'Opady / Śnieg')?.MAE || 0;
        const weatherImpact = badMAE - cleanMAE;

        return { worstTemp, worstCloud, weatherImpact, badMAE };
    }, [data]);

    if (!kpis) return null;

    return (
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="glass-panel flex flex-col justify-between border-t-2 border-[var(--color-danger)]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-secondary font-semibold text-sm uppercase tracking-wide">Krytyczna Temperatura</h3>
                    <ThermometerSnowflake size={20} className="text-danger" />
                </div>
                <div>
                    <span className="text-2xl font-bold text-primary">{kpis.worstTemp?.name}</span>
                    <p className="text-sm mt-1">
                        Bias HRES: <span className="font-bold text-[var(--color-danger)]">{kpis.worstTemp?.Bias > 0 ? '+' : ''}{kpis.worstTemp?.Bias} MW</span>
                    </p>
                    <p className="text-xs text-muted mt-1">Największe średnie odchylenie kierunkowe na HRES</p>
                </div>
            </div>

            <div className="glass-panel flex flex-col justify-between border-t-2 border-[var(--color-brand)]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-secondary font-semibold text-sm uppercase tracking-wide">Problem z Chmurami</h3>
                    <Sun size={20} className="text-muted" />
                </div>
                <div>
                    <span className="text-2xl font-bold text-primary">Pokrycie {kpis.worstCloud?.name}</span>
                    <p className="text-sm mt-1">
                        Bias HRES: <span className="font-bold text-[var(--color-danger)]">{kpis.worstCloud?.Bias > 0 ? '+' : ''}{kpis.worstCloud?.Bias} MW</span>
                    </p>
                    <p className="text-xs text-muted mt-1">Przy takim zachmurzeniu HRES gubi prognozę najbardziej</p>
                </div>
            </div>

            <div className="glass-panel flex flex-col justify-between border-t-2 border-[#8b5cf6]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-secondary font-semibold text-sm uppercase tracking-wide">Efekt Śniegu / Deszczu</h3>
                    <CloudRain size={20} className="text-[#8b5cf6]" />
                </div>
                <div>
                    <span className="text-2xl font-bold text-primary">
                        {kpis.weatherImpact > 0 ? '+' : ''}{kpis.weatherImpact.toFixed(2)} <span className="text-base font-normal text-muted">MW MAE</span>
                    </span>
                    <p className="text-sm mt-1">
                        Błąd podczas opadów: <span className="font-bold text-primary">{kpis.badMAE.toFixed(2)} MW</span>
                    </p>
                    <p className="text-xs text-muted mt-1">O tyle rośnie średni błąd HRES, gdy pada śnieg lub deszcz</p>
                </div>
            </div>
        </div>
    );
};

export default WeatherKPIs;
