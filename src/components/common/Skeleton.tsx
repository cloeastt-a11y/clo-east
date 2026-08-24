import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-[#E7E7E0] rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="w-full aspect-[4/5] bg-[#E7E7E0] rounded-2xl animate-pulse" />
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-1">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
};
