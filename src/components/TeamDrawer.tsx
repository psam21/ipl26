'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TeamData } from '@/types';
import { X, Shield, AlertCircle, Users } from 'lucide-react';
import { RosterTable } from './RosterTable';
import { PitchView } from './PitchView';

interface TeamDrawerProps {
  team: TeamData;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamDrawer({ team, isOpen, onClose }: TeamDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            layoutId={`card-${team.code}`}
            className="fixed inset-0 md:inset-10 z-50 bg-zinc-900 border border-zinc-800 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="h-full overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter">{team.name}</h2>
                  <div className="flex gap-4 mt-2 text-sm text-zinc-400">
                    <span>Purse: <span className="text-green-400">{team.purseLeft} Cr</span></span>
                    <span>Squad: {team.playersBought}</span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SWOT Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-2">
                  <div className="bg-green-900/10 border border-green-900/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3 text-green-400">
                      <Shield className="w-5 h-5" />
                      <h3 className="font-bold">Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {team.analysis.strongPoints.map((point, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-green-500">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <h3 className="font-bold">Weaknesses</h3>
                    </div>
                    <ul className="space-y-2">
                      {team.analysis.weakPoints.map((point, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-red-500">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best XI Pitch View */}
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 h-fit">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Predicted Best XI
                  </h3>
                  <PitchView bestXI={team.analysis.bestXI} teamCode={team.code} />
                </div>

                {/* Full Roster */}
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 h-fit">
                  <h3 className="text-lg font-bold text-white mb-4">Full Squad</h3>
                  <RosterTable roster={team.roster} teamCode={team.code} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
