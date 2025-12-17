import React from 'react';
import { useStore } from '../store';
import { TreeState } from '../types';

export const UI: React.FC = () => {
  const { treeState, toggleState } = useStore();
  const isTree = treeState === TreeState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-center md:items-start text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-5xl text-yellow-400 tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          ARIX
        </h1>
        <p className="font-sans text-emerald-100 text-xs md:text-sm tracking-[0.3em] uppercase mt-2 opacity-80">
          Signature Collection
        </p>
      </header>

      {/* Footer / Controls */}
      <footer className="flex flex-col items-center pb-8">
        <div className="pointer-events-auto group relative">
          {/* Button Background Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          
          <button 
            onClick={toggleState}
            className="relative px-8 py-4 bg-emerald-950 border border-yellow-500/50 rounded-full text-yellow-100 font-serif tracking-widest uppercase text-sm md:text-base hover:bg-emerald-900 hover:text-white hover:border-yellow-400 transition-all duration-300 shadow-[0_0_20px_rgba(251,191,36,0.1)] active:scale-95"
          >
            {isTree ? "Release Magic" : "Summon Tree"}
          </button>
        </div>
        
        <p className="mt-6 text-emerald-200/40 text-[10px] uppercase tracking-widest">
          Interactive WebGL Experience
        </p>
      </footer>
    </div>
  );
};