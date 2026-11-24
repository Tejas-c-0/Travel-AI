import React, { useState } from "react";
import { 
  Bookmark, CheckSquare, ListTodo, BookOpen, Trash2, Calendar, 
  MapPin, Plus, Sparkles, BookMarked, Camera, ChevronRight 
} from "lucide-react";
import { motion } from "motion/react";
import { TravelPlan } from "../types";

interface SavedTabProps {
  savedTrips: TravelPlan[];
  onDeleteTrip: (id: string) => void;
  onSelectTrip: (trip: TravelPlan) => void;

  // Checklist state
  wishlist: string[];
  onAddWish: (e: React.FormEvent, wish: string) => void;
  onRemoveWish: (wish: string) => void;

  // Journal state
  journalEntries: { id: string; title: string; date: string; content: string; image?: string }[];
  onAddJournal: (entry: { title: string; content: string; image?: string }) => void;
}

export default function SavedTab({
  savedTrips,
  onDeleteTrip,
  onSelectTrip,
  wishlist,
  onAddWish,
  onRemoveWish,
  journalEntries,
  onAddJournal
}: SavedTabProps) {
  const [newWish, setNewWish] = useState("");
  const [jTitle, setJTitle] = useState("");
  const [jContent, setJContent] = useState("");
  const [jPhoto, setJPhoto] = useState("https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&auto=format&fit=crop&q=60");

  // Checklist state (local management for rapid reactive toggle)
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: "c1", text: "Validate passport expiration date is > 6 months", done: true },
    { id: "c2", text: "Book sleeper bus or AC trains to Candolim beachfront", done: false },
    { id: "c3", text: "Download maps offline inside TravelAI local directory", done: true },
    { id: "c4", text: "Take photo proofs of rented vehicle condition to bypass scratches scams", done: false },
    { id: "c5", text: "Pack high-spectrum SPF 50 sunscreen & mosquito roll-on", done: false }
  ]);

  const [newChecklistItem, setNewChecklistItem] = useState("");

  const handleToggleChecklist = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    setChecklist([...checklist, { id: "cl_" + Date.now(), text: newChecklistItem.trim(), done: false }]);
    setNewChecklistItem("");
  };

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jTitle.trim() || !jContent.trim()) return;
    onAddJournal({
      title: jTitle,
      content: jContent,
      image: jPhoto
    });
    setJTitle("");
    setJContent("");
  };

  return (
    <div id="saved-tab-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in">
      
      {/* LEFT COLUMN: Saved Trips & Wishlist (span 8) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* SAVED AI PLANS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">My Saved AI Plans</h3>
          </div>

          {savedTrips.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-slate-400 text-xs">
              No saved trips found. Go to the <strong>AI Trip Planner</strong> tab and generate a plan to save it!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedTrips.map(trip => (
                <div 
                  key={trip.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col justify-between hover:border-indigo-500/30 transition-all text-left"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-sm text-[9px] font-extrabold tracking-widest uppercase">
                        {trip.query?.style || "Standard"} Trip
                      </span>
                      <button 
                        onClick={() => onDeleteTrip(trip.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                      Trip to {trip.query?.destination || "Destination"}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      From {trip.query?.startingLocation || "Origin"} • {trip.query?.days || 3} Days • {trip.query?.travelers || 1} Pax
                    </p>
                    <p className="text-[11px] font-bold text-emerald-500">
                      Cost: ₹{(trip.budgetBreakdown?.totalBudget || 0).toLocaleString()}
                    </p>
                  </div>

                  <button 
                    onClick={() => onSelectTrip(trip)}
                    className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    View Plan Sheet <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PERSONAL TRAVEL DIARY / JOURNAL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">My Travel Diary</h3>
          </div>

          {/* New Journal Entry Form */}
          <form onSubmit={handleJournalSubmit} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="text" 
                required
                placeholder="Entry Title (e.g., Beach Sunset walk)"
                value={jTitle}
                onChange={e => setJTitle(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
              <select 
                value={jPhoto} 
                onChange={e => setJPhoto(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&auto=format&fit=crop&q=60">🏖️ Beach Vibe Photo</option>
                <option value="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&auto=format&fit=crop&q=60">🗼 City Landmark Photo</option>
                <option value="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&auto=format&fit=crop&q=60">🛖 Forest & Nature Photo</option>
                <option value="https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=500&auto=format&fit=crop&q=60">🍜 Street Food Photo</option>
              </select>
            </div>
            <textarea 
              required
              rows={3}
              placeholder="Record your memories, secret travel hacks, or scam warnings here..."
              value={jContent}
              onChange={e => setJContent(e.target.value)}
              className="w-full text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
            <button 
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Save Entry
            </button>
          </form>

          {/* Journal list */}
          <div className="space-y-4">
            {journalEntries.map(entry => (
              <div 
                key={entry.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row gap-5 items-start"
              >
                {entry.image && (
                  <div className="w-full sm:w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                    <img src={entry.image} alt={entry.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-1.5 flex-1 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{entry.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {entry.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {entry.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Checklist & Wishlist Sidebar (span 4) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* ESSENTIAL TRAVEL CHECKLIST */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Travel Checklist</h4>
          </div>

          <form onSubmit={handleAddChecklistItem} className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. Charge backup powerbank" 
              value={newChecklistItem}
              onChange={e => setNewChecklistItem(e.target.value)}
              className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-xs rounded-xl"
            />
            <button 
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-2.5">
            {checklist.map(item => (
              <div 
                key={item.id} 
                onClick={() => handleToggleChecklist(item.id)}
                className="flex items-center gap-3 p-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/25 rounded-lg cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                  {item.done && <span className="text-[10px] font-black">✓</span>}
                </div>
                <span className={`text-xs text-left ${item.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PERSONAL WISHLIST */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">My Wishlist</h4>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!newWish.trim()) return;
            onAddWish(e, newWish.trim());
            setNewWish("");
          }} className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. Butterfly Beach" 
              value={newWish}
              onChange={e => setNewWish(e.target.value)}
              className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-xs rounded-xl"
            />
            <button 
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-2">
            {wishlist.map(item => (
              <div 
                key={item}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/60 dark:border-slate-800 flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 font-semibold"
              >
                <span>⭐ {item}</span>
                <button 
                  onClick={() => onRemoveWish(item)}
                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
