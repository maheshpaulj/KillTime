'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';

const TOTAL_WEALTH = 1000000000000; // $1 Trillion

const ITEMS = [
  { id: 'coffee', name: 'Cup of Coffee', price: 5, icon: '☕' },
  { id: 'toast', name: 'Avocado Toast', price: 10, icon: '🥑' },
  { id: 'netflix', name: 'Netflix (80 Years)', price: 15000, icon: '🍿' },
  { id: 'rolex', name: 'Rolex', price: 15000, icon: '⌚' },
  { id: 'student_loan', name: 'Pay Off Student Loan', price: 40000, icon: '🎓' },
  { id: 'tesla', name: 'Tesla Model S', price: 90000, icon: '🚗' },
  { id: 'house', name: 'Average US House', price: 400000, icon: '🏠' },
  { id: 'mcdonalds_franchise', name: 'McDonalds Franchise', price: 1500000, icon: '🍔' },
  { id: 'superbowl', name: 'Super Bowl Ad (30s)', price: 7000000, icon: '📺' },
  { id: 'mansion', name: 'LA Mansion', price: 15000000, icon: '🌴' },
  { id: 'jet', name: 'Private Jet', price: 20000000, icon: '✈️' },
  { id: 'island', name: 'Private Island', price: 50000000, icon: '🏝️' },
  { id: 'tuvalu', name: 'Tuvalu (Entire Country GDP)', price: 60000000, icon: '🇹🇻' },
  { id: 'yacht', name: 'Mega Yacht', price: 300000000, icon: '🛥️' },
  { id: 'monalisa', name: 'The Mona Lisa', price: 860000000, icon: '🖼️' },
  { id: 'pyramid', name: 'Build a Pyramid', price: 1000000000, icon: '🔺' },
  { id: 'fiji', name: 'Fiji (Entire Country GDP)', price: 5000000000, icon: '🇫🇯' },
  { id: 'nba', name: 'NBA Team', price: 3000000000, icon: '🏀' },
  { id: 'hunger', name: 'Solve World Hunger', price: 6000000000, icon: '🌍' }, 
  { id: 'jwst', name: 'James Webb Telescope', price: 10000000000, icon: '🔭' },
  { id: 'homelessness', name: 'End US Homelessness', price: 20000000000, icon: '🏙️' },
  { id: 'iceland', name: 'Iceland (Entire Country GDP)', price: 28000000000, icon: '🇮🇸' },
  { id: 'twitter', name: 'Twitter (X)', price: 44000000000, icon: '🐦' },
  { id: 'spotify', name: 'Buy Spotify', price: 50000000000, icon: '🎵' },
  { id: 'airbnb', name: 'Buy Airbnb', price: 90000000000, icon: '🏡' },
  { id: 'starship', name: 'Fleet of Starships', price: 100000000000, icon: '🚀' },
  { id: 'disney', name: 'Buy The Walt Disney Co.', price: 200000000000, icon: '🐭' },
  { id: 'newzealand', name: 'New Zealand (Entire Country GDP)', price: 250000000000, icon: '🇳🇿' },
];

export default function SpendGame() {
  // Cart stores the quantity of each item bought: { 'coffee': 5, 'tesla': 1 }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  // Framer motion value for the smooth rolling number effect
  const animatedBalance = useMotionValue(TOTAL_WEALTH);
  const displayBalance = useTransform(animatedBalance, (latest) => 
    `$${Math.round(latest).toLocaleString()}`
  );

  useEffect(() => { setMounted(true); }, []);

  // Derived state: calculate total spent and remaining balance
  const totalSpent = ITEMS.reduce((sum, item) => sum + (item.price * (cart[item.id] || 0)), 0);
  const currentBalance = TOTAL_WEALTH - totalSpent;
  const percentageLeft = (currentBalance / TOTAL_WEALTH) * 100;

  // Animate the money counter whenever the balance changes
  useEffect(() => {
    const controls = animate(animatedBalance, currentBalance, { duration: 0.5, ease: "easeOut" });
    return controls.stop;
  }, [currentBalance, animatedBalance]);

  const handleBuy = (item: typeof ITEMS[0]) => {
    if (currentBalance >= item.price) {
      setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    }
  };

  const handleSell = (item: typeof ITEMS[0]) => {
    if (cart[item.id] > 0) {
      setCart(prev => ({ ...prev, [item.id]: prev[item.id] - 1 }));
    }
  };

  const handleInputChange = (item: typeof ITEMS[0], value: string) => {
    const num = parseInt(value) || 0;
    if (num < 0) return;
    
    // Calculate max affordable if they type a massive number
    const costDifference = (num - (cart[item.id] || 0)) * item.price;
    if (costDifference > currentBalance) {
      const maxAffordableAdd = Math.floor(currentBalance / item.price);
      setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + maxAffordableAdd }));
    } else {
      setCart(prev => ({ ...prev, [item.id]: num }));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f4f4f0] font-sans pb-32">
      
      {/* STICKY HEADER - The Money Counter */}
      <div className="sticky top-0 z-50 bg-[#1e293b] border-b-[6px] border-black shadow-[0_8px_0px_rgba(0,0,0,0.2)] p-4 flex flex-col items-center">
        <div className="w-full max-w-5xl flex justify-between items-center relative">
          <Link href="/" className="bg-[#fbbf24] text-black font-bold text-sm py-2 px-4 border-2 border-black shadow-[2px_2px_0px_black] hover:bg-yellow-300 active:translate-y-1 active:shadow-none transition-all">
            &larr; HUB
          </Link>
          <h1 className="text-white font-black text-xl hidden sm:block tracking-widest uppercase">Spend Elon&apos;s Fortune</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
        
        {/* The Animated Odometor */}
        <motion.div className="text-4xl sm:text-6xl font-black text-[#4ade80] tracking-tighter mt-4 mb-2">
          {displayBalance}
        </motion.div>
        
        {/* Wealth Bar */}
        <div className="w-full max-w-2xl h-4 bg-gray-700 border-2 border-black rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#4ade80]"
            initial={{ width: '100%' }}
            animate={{ width: `${percentageLeft}%`, backgroundColor: percentageLeft < 10 ? '#ef4444' : percentageLeft < 50 ? '#fbbf24' : '#4ade80' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* ITEMS GRID */}
      <div className="max-w-5xl mx-auto p-4 sm:p-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ITEMS.map(item => {
            const qty = cart[item.id] || 0;
            const canAfford = currentBalance >= item.price;

            return (
              <div key={item.id} className="bg-white border-[4px] border-black p-6 flex flex-col items-center text-center shadow-[6px_6px_0px_black] hover:-translate-y-1 hover:shadow-[10px_10px_0px_black] transition-all duration-200">
                <span className="text-6xl mb-4 select-none">{item.icon}</span>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{item.name}</h2>
                <p className="text-lg font-bold text-[#4ade80] my-2">${item.price.toLocaleString()}</p>
                
                <div className="mt-auto w-full grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleSell(item)}
                    disabled={qty === 0}
                    className={`font-bold py-2 border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-1 active:shadow-none transition-all ${qty > 0 ? 'bg-red-400 hover:bg-red-500 text-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Sell
                  </button>
                  
                  <input 
                    type="number"
                    value={qty}
                    onChange={(e) => handleInputChange(item, e.target.value)}
                    className="w-full text-center font-bold border-2 border-black outline-none focus:bg-blue-50 hide-arrows"
                  />

                  <button 
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`font-bold py-2 border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-1 active:shadow-none transition-all ${canAfford ? 'bg-[#4ade80] hover:bg-green-500 text-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Buy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THE RECEIPT (Only shows if you bought something) */}
      {totalSpent > 0 && (
        <div className="max-w-2xl mx-auto mt-12 bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_black]">
          <h2 className="text-3xl font-black mb-6 text-center border-b-4 border-black pb-4">Your Receipt</h2>
          <div className="space-y-3">
            {ITEMS.filter(item => cart[item.id] > 0).map(item => (
              <div key={item.id} className="flex justify-between items-end font-medium text-lg border-b-2 border-dashed border-gray-300 pb-2">
                <span className="flex-1">{item.name}</span>
                <span className="w-16 text-center">x{cart[item.id].toLocaleString()}</span>
                <span className="w-32 text-right font-bold text-gray-900">${(item.price * cart[item.id]).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6 pt-6 border-t-4 border-black text-2xl font-black text-gray-900">
            <span>TOTAL SPENT</span>
            <span className="text-[#ef4444]">${totalSpent.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Global CSS to hide number input arrows */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows {
          -moz-appearance: textfield;
        }
      `}} />
    </div>
  );
}