import React from 'react';
import EventCalendar from '../components/EventCalendar';

const CalendarPage = () => {
    return (
        <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-6 text-center">
                Event Calendar
            </h1>
            <EventCalendar />
        </div>
    );
};

export default CalendarPage;
