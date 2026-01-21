'use client';

import { useEffect, useState } from 'react';

interface HeatmapData {
    [date: string]: number;
}

export default function Heatmap({ className = '' }: { className?: string }) {
    const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const res = await fetch('/api/heatmap');
                if (res.ok) {
                    const data = await res.json();
                    setHeatmapData(data.heatmap || {});
                }
            } catch (error) {
                console.error('Error fetching heatmap:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmap();
    }, []);

    // Generate days for the selected month
    const generateMonthDays = () => {
        const year = selectedYear;
        const month = selectedMonth;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
        let startDayOfWeek = firstDay.getDay();
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday start

        const weeks: (string | null)[][] = [];
        let currentWeek: (string | null)[] = [];

        // Add empty cells for days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            currentWeek.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            currentWeek.push(date.toISOString().split('T')[0]);

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Fill remaining days of the last week
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }

        return weeks;
    };

    const weeks = generateMonthDays();

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-800';
        if (count <= 5) return 'bg-[var(--theme-primary,#1db954)]/30';
        if (count <= 15) return 'bg-[var(--theme-primary,#1db954)]/50';
        if (count <= 30) return 'bg-[var(--theme-primary,#1db954)]/70';
        return 'bg-[var(--theme-primary,#1db954)]';
    };

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Don't go beyond current month
        if (selectedYear === currentYear && selectedMonth === currentMonth) return;

        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const isCurrentMonth = () => {
        const now = new Date();
        return selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
    };

    // Calculate stats for current view
    const allDates = weeks.flat().filter(d => d !== null) as string[];
    const totalListens = allDates.reduce((a, d) => a + (heatmapData[d] || 0), 0);
    const activeDays = allDates.filter(d => (heatmapData[d] || 0) > 0).length;
    const bestDay = allDates.reduce((best, d) => {
        const count = heatmapData[d] || 0;
        return count > best.count ? { date: d, count } : best;
    }, { date: '', count: 0 });

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="skeleton h-32 w-full rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className={`glass-panel rounded-2xl p-4 ${className}`}>
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                    📅 Activité
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousMonth}
                        className="text-gray-500 hover:text-white p-1 transition-colors"
                        title="Mois précédent"
                    >
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <span className="text-xs text-gray-400 min-w-[120px] text-center">
                        {months[selectedMonth]} {selectedYear}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        disabled={isCurrentMonth()}
                        className={`p-1 transition-colors ${isCurrentMonth() ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-white'}`}
                        title="Mois suivant"
                    >
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{totalListens}</div>
                    <div className="text-[10px] text-gray-500">Écoutes</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{activeDays}</div>
                    <div className="text-[10px] text-gray-500">Jours actifs</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-[var(--theme-primary,#1db954)]">{bestDay.count}</div>
                    <div className="text-[10px] text-gray-500">Meilleur jour</div>
                </div>
            </div>

            {/* Day labels */}
            <div className="flex gap-1 mb-1 justify-center">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <div key={i} className="w-6 text-center text-[10px] text-gray-500 font-medium">{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex flex-col gap-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex gap-1 justify-center">
                        {week.map((date, dayIndex) => {
                            if (date === null) {
                                return <div key={dayIndex} className="w-6 h-6"></div>;
                            }
                            const count = heatmapData[date] || 0;
                            const dayNum = new Date(date).getDate();
                            return (
                                <div
                                    key={date}
                                    className={`w-6 h-6 rounded ${getColor(count)} flex items-center justify-center text-[9px] transition-all hover:ring-1 hover:ring-white/50 cursor-pointer ${count > 0 ? 'text-white' : 'text-gray-600'}`}
                                    title={`${dayNum} ${months[selectedMonth]}: ${count} écoutes`}
                                >
                                    {dayNum}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-gray-500">
                <span>0</span>
                <div className="flex gap-[2px]">
                    <div className="w-3 h-3 rounded-sm bg-gray-800"></div>
                    <div className="w-3 h-3 rounded-sm bg-[var(--theme-primary,#1db954)]/30"></div>
                    <div className="w-3 h-3 rounded-sm bg-[var(--theme-primary,#1db954)]/50"></div>
                    <div className="w-3 h-3 rounded-sm bg-[var(--theme-primary,#1db954)]/70"></div>
                    <div className="w-3 h-3 rounded-sm bg-[var(--theme-primary,#1db954)]"></div>
                </div>
                <span>30+</span>
            </div>
        </div>
    );
}
