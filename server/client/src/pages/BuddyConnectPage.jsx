import React from 'react';
import BuddyConnect from '../components/BuddyConnect';

const BuddyConnectPage = () => {
    return (
        <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 text-center">
                Find Buddies
            </h1>
            <div className="[&>div]:mt-0">
                <BuddyConnect />
            </div>
        </div>
    );
};

export default BuddyConnectPage;
