import React from "react";

export function PlannerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse text-left">
      {/* Top Banner Skeleton */}
      <div className="p-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-6 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      </div>

      {/* Grid Bento Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="md:col-span-3 space-y-4">
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-44" />
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-60" />
        </div>

        {/* Center Main Column */}
        <div className="md:col-span-6 space-y-4">
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-64" />
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
          </div>
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-3 space-y-4">
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-48" />
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-44" />
        </div>
      </div>
    </div>
  );
}

export default PlannerSkeleton;
