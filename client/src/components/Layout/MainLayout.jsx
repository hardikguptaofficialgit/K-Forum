import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#0f1115] text-gray-100 font-sans selection:bg-emerald-500/30">
            {/* Desktop Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Navigation */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <MobileHeader />

            {/* Main Content Area */}
            <main className={`
                relative z-10 
                pt-[120px] md:pt-8 
                px-4 md:px-8 
                pb-24 md:pb-8
                min-h-screen
                transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'md:pl-80' : 'md:pl-32 lg:pl-40'}
            `}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
