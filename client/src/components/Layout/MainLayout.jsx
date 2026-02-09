import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-transparent text-gray-100 font-sans selection:bg-violet-500/30">

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
