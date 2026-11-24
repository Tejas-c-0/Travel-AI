import React, { useState } from "react";
import {
  Share2,
  ArrowBigUp,
  MessageSquare,
  Star,
  Award,
  AlertTriangle,
  Send,
  Compass,
  MapPin,
} from "lucide-react";
import { CommunityPost } from "../types";

interface CommunityTabProps {
  user?: any;
  rewardPoints: number;
  communityPosts: CommunityPost[];
  onAddPost: (
    story: string,
    tips: string,
    destination: string,
    rating: number,
    itinerarySummary?: string
  ) => void;
  onLikePost: (id: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onPlanRoute: (dest: string) => void;
}

export default function CommunityTab({
  user,
  rewardPoints,
  communityPosts,
  onAddPost,
  onLikePost,
  onAddComment,
  onPlanRoute,
}: CommunityTabProps) {
  const [storyText, setStoryText] = useState("");
  const [tipsText, setTipsText] = useState("");
  const [itineraryText, setItineraryText] = useState("");
  const [destName, setDestName] = useState("");
  const [rating, setRating] = useState(5);

  const [filterType, setFilterType] = useState<"all" | "tips" | "itineraries" | "questions">("all");
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText.trim() || !destName.trim()) return;
    onAddPost(
      storyText.trim(),
      tipsText.trim(),
      destName.trim(),
      rating,
      itineraryText.trim() || undefined
    );
    setStoryText("");
    setTipsText("");
    setItineraryText("");
    setDestName("");
    setRating(5);
  };

  const handlePostCommentSubmit = (postId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(postId, commentInput.trim());
    setCommentInput("");
  };

  const filteredPosts = communityPosts.filter((post) => {
    if (filterType === "tips") return post.tips.trim().length > 0;
    if (filterType === "itineraries") return Boolean(post.itinerarySummary);
    if (filterType === "questions") return post.story.includes("?") || post.tips.includes("?");
    return true;
  });

  return (
    <div id="community-tab-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* LEFT FEED & COMPOSER (span 8) */}
      <div className="lg:col-span-8 space-y-6">
        {/* SHARE TIP / ITINERARY FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-500" />
              Share Traveler Tip or Itinerary
            </h4>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              +100 XP per post
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Destination
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tokyo, Japan or South Goa"
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Rating
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value, 10) || 5)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value={5}>5 / 5 — Exceptional</option>
                <option value={4}>4 / 5 — Great</option>
                <option value={3}>3 / 5 — Good</option>
                <option value={2}>2 / 5 — Fair</option>
                <option value={1}>1 / 5 — Caution</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Practical Tip / Cost Hack
              </label>
              <input
                type="text"
                placeholder="e.g. 72-hour Tokyo Subway Pass saves ¥2,000"
                value={tipsText}
                onChange={(e) => setTipsText(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
                Shared Itinerary Summary (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 4 Days · Day 1 Asakusa -> Day 2 Shibuya"
                value={itineraryText}
                onChange={(e) => setItineraryText(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
              Trip Notes & Experience
            </label>
            <textarea
              required
              rows={3}
              placeholder="Share routes, honest prices, neighborhoods to stay in, or scams to avoid..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Publish to Community Feed
          </button>
        </form>

        {/* FILTER TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          {(
            [
              { id: "all", label: "All Updates" },
              { id: "tips", label: "Traveler Tips" },
              { id: "itineraries", label: "Shared Itineraries" },
              { id: "questions", label: "Q&A" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === tab.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FEED POSTS */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No posts match this filter yet. Be the first to share one above!
            </div>
          ) : (
            filteredPosts.map((post) => (
              <article
                key={post.id}
                className="p-5 sm:p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex gap-4"
              >
                {/* UPVOTE RAIL */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onLikePost(post.id)}
                    aria-label={post.hasLiked ? "Remove upvote" : "Upvote post"}
                    className={`w-10 py-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                      post.hasLiked
                        ? "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-600 dark:text-cyan-400"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    <ArrowBigUp
                      className={`w-4 h-4 ${post.hasLiked ? "fill-current" : ""}`}
                    />
                    <span className="text-xs font-bold tabular-nums">{post.likes}</span>
                  </button>
                </div>

                {/* POST BODY */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {post.author}
                        </span>
                        <span aria-hidden="true" className="text-zinc-400">·</span>
                        <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-medium">
                          <MapPin className="w-3 h-3 text-cyan-500" />
                          {post.destination}
                        </span>
                        <span aria-hidden="true" className="text-zinc-400">·</span>
                        <span className="text-zinc-400">{post.createdAt}</span>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {post.rating}.0
                    </div>
                  </div>

                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {post.story}
                  </p>

                  {post.itinerarySummary && (
                    <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" /> Shared Itinerary
                        </span>
                        <button
                          type="button"
                          onClick={() => onPlanRoute(post.destination)}
                          className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                        >
                          Use in Planner →
                        </button>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {post.itinerarySummary}
                      </p>
                    </div>
                  )}

                  {post.tips && (
                    <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        Verified Traveler Tip
                      </span>
                      <p className="text-xs text-zinc-700 dark:text-emerald-200/90 leading-relaxed">
                        {post.tips}
                      </p>
                    </div>
                  )}

                  {/* ACTIONS FOOTER */}
                  <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentPostId(
                          activeCommentPostId === post.id ? null : post.id
                        )
                      }
                      className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{post.comments.length}</span> Comments
                    </button>

                    <button
                      type="button"
                      onClick={() => onPlanRoute(post.destination)}
                      className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-cyan-500 cursor-pointer"
                    >
                      Plan Route to {post.destination.split(",")[0]}
                    </button>
                  </div>

                  {/* COMMENTS DRAWER */}
                  {activeCommentPostId === post.id && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                      {post.comments.length > 0 && (
                        <div className="space-y-2">
                          {post.comments.map((comm, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs"
                            >
                              <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {comm.author}
                                </span>
                                <span>{comm.time}</span>
                              </div>
                              <p className="text-zinc-600 dark:text-zinc-300">{comm.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment or ask a follow-up..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handlePostCommentSubmit(post.id)
                          }
                          className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-lg text-zinc-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => handlePostCommentSubmit(post.id)}
                          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-zinc-950 rounded-lg cursor-pointer"
                          aria-label="Send comment"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR (span 4) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
              Top Contributors
            </h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Earn TravelAI XP by posting verified tips and shared itineraries.
          </p>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                1. Kunal Shah · Mumbai
              </span>
              <span className="font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                4,820 XP
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                2. Sneha Rao · Ubud
              </span>
              <span className="font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                3,910 XP
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                3. {user?.name || "You"}
              </span>
              <span className="font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {rewardPoints.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
              Live Transit Alerts
            </h4>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
              <span className="font-bold text-rose-600 dark:text-rose-400 block">
                Airport Taxi Disruption · Goa
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Prepaid cab queues elevated at Dabolim. Use Kadamba shuttle buses to Candolim to save up to ₹1,500.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-400 block">
                Coastal Rain Advisory
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Afternoon showers expected mid-week; water sport bookings shift to morning slots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
