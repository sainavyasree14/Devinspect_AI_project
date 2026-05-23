import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse bg-muted/60 rounded-xl', className)} />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card-glass p-6 rounded-2xl border border-border/30 flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div className="xl:col-span-8 card-glass p-8 rounded-3xl">
        <Skeleton className="h-6 w-40 mb-6" />
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="xl:col-span-4 card-glass p-8 rounded-3xl">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-[200px] w-[200px] rounded-full mx-auto" />
      </div>
    </div>
  </div>
);

export const ReviewCardSkeleton = () => (
  <div className="p-4 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Skeleton className="h-7 w-20 rounded-md" />
      <Skeleton className="h-4 w-40" />
    </div>
    <Skeleton className="h-3 w-16" />
  </div>
);

export default Skeleton;
