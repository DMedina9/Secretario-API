import React, { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Set locale to Spanish
dayjs.locale('es');

const Calendar = ({ currentDate, asistencias, onPrevMonth, onNextMonth, onSelectDate, onSelectAsistencia }) => {

    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDay = startOfMonth.day(); // 0 (Sunday) to 6 (Saturday)
    const daysInMonth = currentDate.daysInMonth();

    // Generate days array
    const days = [];

    // Add empty slots
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const getAsistenciaForDay = (day) => {
        if (!day) return null;
        const dateStr = currentDate.date(day).format('YYYY-MM-DD');
        return asistencias.find(a => dayjs(a.fecha).format('YYYY-MM-DD') === dateStr);
    };

    return (
        <div>
            <div className="calendar-controls">
                <button className="btn btn-sm btn-secondary" onClick={onPrevMonth}>&lt; Anterior</button>
                <span className="calendar-month-title" style={{ textTransform: 'capitalize' }}>
                    {currentDate.format('MMMM YYYY')}
                </span>
                <button className="btn btn-sm btn-secondary" onClick={onNextMonth}>Siguiente &gt;</button>
            </div>

            <div className="calendar-grid">
                {weekDays.map(day => (
                    <div key={day} className="calendar-header-cell">{day}</div>
                ))}

                {days.map((day, index) => {
                    if (!day) {
                        return <div key={`empty-${index}`} className="calendar-day-cell empty"></div>;
                    }

                    const asistencia = getAsistenciaForDay(day);
                    const currentDayDate = currentDate.date(day);
                    const isToday = currentDayDate.isSame(dayjs(), 'day');
                    const diaSemana = currentDayDate.day();
                    const esFinde = diaSemana === 0 || diaSemana === 6;

                    return (
                        <div
                            key={`day-${day}`}
                            className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                            onClick={() => {
                                if (asistencia) {
                                    onSelectAsistencia(asistencia);
                                } else {
                                    onSelectDate(currentDayDate);
                                }
                            }}
                        >
                            <span className="calendar-date-number">{day}</span>
                            {asistencia && (
                                <div className="calendar-day-content">
                                    <span className={`attendance-badge ${esFinde ? 'weekend' : ''}`}>
                                        {asistencia.asistentes}
                                    </span>
                                    {asistencia.notas && (
                                        <span className="day-notes-indicator" title={asistencia.notas}>📝</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
