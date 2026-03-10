import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const SystemBackground: React.FC = () => {
  const [numbers, setNumbers] = useState<{ id: number; x: number; y: number; value: string }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNumber = {
        id: Date.now(),
        x: Math.random() * 100,
        y: -10,
        value: Math.random() > 0.5 ? '1' : '0',
      };
      setNumbers(prev => [...prev, newNumber]);
    }, 200);

    const animationInterval = setInterval(() => {
      setNumbers(prev => 
        prev.map(n => ({ ...n, y: n.y + 2, value: Math.random() > 0.5 ? '1' : '0' }))
            .filter(n => n.y < 110)
      );
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(animationInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#001f3f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#003366] to-[#001f3f] opacity-50" />
      <AnimatePresence>
        {numbers.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: n.y + '%' }}
            exit={{ opacity: 0 }}
            style={{ left: n.x + '%' }}
            className="absolute text-cyan-400 font-mono text-xl font-bold"
          >
            {n.value}
          </motion.div>
        ))}
      </AnimatePresence>
      {/* Futuristic frame overlay */}
      <div className="absolute inset-4 border-2 border-cyan-900/50 pointer-events-none">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
      </div>
    </div>
  );
};

export default SystemBackground;
