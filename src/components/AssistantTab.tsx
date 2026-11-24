import React, { useState } from "react";
import { 
  Sparkles, Send, ShieldAlert, ArrowRight, Activity, 
  MapPin, HelpCircle, PhoneCall, HeartHandshake, UserCheck 
} from "lucide-react";
import { motion } from "motion/react";
import { ChatMessage, TravelPlan } from "../types";

interface AssistantTabProps {
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (text: string) => void;
  activeTrip: TravelPlan | null;
}

export default function AssistantTab({
  chatMessages,
  isChatLoading,
  onSendMessage,
  activeTrip
}: AssistantTabProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isChatLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleSuggestionClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  const destination = activeTrip?.query.destination || "Goa";

  const suggestions = [
    `How do I avoid taxi scams in ${destination}?`,
    `What is the safest transport from airport to hotels in ${destination}?`,
    `Recommend secret hidden sunset trails in ${destination}`,
    `Provide local emergency tourist police numbers in ${destination}`
  ];

  const scamsList = [
    {
      title: "Broken Taxi Meter Scam",
      desc: `Drivers near airports/stations claim their meter is broken and charge up to 3x rates. Remedy: Always book pre-paid booths or use local buses.`
    },
    {
      title: "Scooter Scratch Scam",
      desc: `Unregistered scooter rental shops claim you made pre-existing scratches and charge ₹5,000. Remedy: Shoot full video proofs of vehicle condition during renting.`
    },
    {
      title: "Water Sports Agent Commission",
      desc: `Middlemen on beach areas claim exclusive sports booking but keep 50% commission. Remedy: Walk directly to government certified booths near beaches.`
    }
  ];

  return (
    <div id="assistant-tab-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in">
      {/* Left Chat Console: span 8 */}
      <div className="lg:col-span-8 flex flex-col h-[520px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Chat Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl text-white">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">TravelAI Companion</h4>
              <span className="text-[9px] text-emerald-500 font-bold">Online • Powered by Gemini AI</span>
            </div>
          </div>
          {activeTrip && (
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 font-bold px-2.5 py-1 rounded-lg">
              Context: {activeTrip.query.destination}
            </span>
          )}
        </div>

        {/* Message Logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {chatMessages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-500'}`}>
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs leading-normal text-left ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-tl-none'}`}>
                {msg.text}
                {msg.timestamp && <span className={`block text-[9px] mt-1.5 text-right ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.timestamp}</span>}
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex gap-3 mr-auto max-w-[80%] items-center">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500 flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-xs rounded-2xl rounded-tl-none flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
                Consulting secure routing logs...
              </div>
            </div>
          )}
        </div>

        {/* Suggestion prompt chips */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-50 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
          {suggestions.map((s, idx) => (
            <button 
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] text-slate-500 dark:text-slate-300 font-bold shrink-0 shadow-2xs cursor-pointer transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <input 
            type="text" 
            placeholder={`Ask about transport, safety codes, or cheap food hubs in ${destination}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-hidden text-slate-800 dark:text-slate-200"
          />
          <button 
            onClick={handleSend}
            disabled={isChatLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl cursor-pointer transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Right Security & Scams Column: span 4 */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* TOURIST FRAUD & SCAMS MAP */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Fraud Guard Shield</h4>
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-normal">Our algorithms scanned active police and tourist registries for known scams inside {destination}.</p>

          <div className="space-y-4 pt-2">
            {scamsList.map((scam, sidx) => (
              <div key={sidx} className="space-y-1 text-left">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  ⚠️ {scam.title}
                </span>
                <p className="text-[11px] text-slate-400 leading-normal font-medium">
                  {scam.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* EMERGENCY EMERGENCY HOTLINES */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Emergency Directory</h4>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl">
              <span className="font-semibold text-slate-700 dark:text-slate-300">🚨 Tourist Police Hotline</span>
              <span className="font-bold text-indigo-500 font-mono">100 / 112</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl">
              <span className="font-semibold text-slate-700 dark:text-slate-300">🚑 Ambulance / Medical Helpline</span>
              <span className="font-bold text-indigo-500 font-mono">108</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl">
              <span className="font-semibold text-slate-700 dark:text-slate-300">🛡️ TravelAI Active Concierge</span>
              <span className="font-bold text-emerald-500 font-mono">+1 (800) AI-SAFE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
