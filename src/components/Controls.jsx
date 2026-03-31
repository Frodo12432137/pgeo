import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

const Controls = ({
    locations,
    selectedLocation,
    setSelectedLocation,
    startDate,
    setStartDate,
    endDate,
    setEndDate
}) => {
    return (
        <header className="glass-header">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-primary">PGEO Analytics</h1>
                        <span className="text-[9px] text-muted opacity-60 block -mt-1 uppercase tracking-tighter">v3.0 - FULL BALANCE MAE</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-muted" />
                    <select
                        className="select-input"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="Wszystkie">Wszystkie lokalizacje</option>
                        {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-muted" />
                    <input
                        type="date"
                        className="date-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-muted">-</span>
                    <input
                        type="date"
                        className="date-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>
        </header>
    );
};

export default Controls;
