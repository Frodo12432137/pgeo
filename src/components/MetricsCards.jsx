import React from 'react';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';

const MetricsCards = ({ metrics }) => {
    if (!metrics) return null;

    const diff = Math.abs(metrics.MAE_Korekta - metrics.MAE_HRES).toFixed(2);
    const isKorektaBetter = metrics.betterModel === 'Korekta';

    return (
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            <div className="glass-panel flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-muted font-semibold uppercase tracking-wider text-xs">Portfel: MAE Korekta</h3>
                    <Activity size={20} className="text-accent" />
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-primary">{metrics.MAE_Korekta} <span className="text-base text-muted font-normal">MW</span></span>
                </div>
                <p className="text-[10px] text-muted mt-2 italic">* Tylko godziny produkcji ({metrics.numProductionHours}h)</p>
            </div>

            <div className="glass-panel flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-muted font-semibold uppercase tracking-wider text-xs">Portfel: MAE HRES</h3>
                    <Activity size={20} className="text-brand" />
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-primary">{metrics.MAE_HRES} <span className="text-base text-muted font-normal">MW</span></span>
                </div>
                <p className="text-[10px] text-muted mt-2 italic">* Tylko godziny produkcji ({metrics.numProductionHours}h)</p>
            </div>

            <div className={`glass-panel flex flex-col justify-between border-l-4 ${isKorektaBetter ? 'border-l-[var(--color-accent)]' : 'border-l-[var(--color-brand)]'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-muted font-semibold uppercase tracking-wider text-xs">Zwycięzca (Model)</h3>
                    {isKorektaBetter ? <TrendingDown size={20} className="text-accent" /> : <TrendingDown size={20} className="text-brand" />}
                </div>
                <div>
                    <span className={`text-2xl font-bold ${isKorektaBetter ? 'text-accent' : 'text-brand'}`}>
                        {metrics.betterModel}
                    </span>
                    <p className="text-sm text-secondary mt-1">
                        Lepszy o <span className="font-bold text-primary">{diff} MW</span> (Daylight)
                    </p>
                </div>
            </div>

        </div>
    );
};

export default MetricsCards;
