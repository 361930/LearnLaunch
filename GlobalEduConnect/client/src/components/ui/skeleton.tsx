import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "pulse" | "wave" | "shimmer";
}

export function Skeleton({
  className,
  variant = "pulse",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-muted rounded-md",
        {
          "animate-pulse": variant === "pulse",
          "animate-shimmer relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent": variant === "shimmer",
          "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-wave": variant === "wave",
        },
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton({ variant = "pulse" }: { variant?: "pulse" | "wave" | "shimmer" } = {}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <Skeleton className="h-8 w-3/4 mb-4" variant={variant} />
      <Skeleton className="h-4 w-full mb-2" variant={variant} />
      <Skeleton className="h-4 w-full mb-2" variant={variant} />
      <Skeleton className="h-4 w-2/3" variant={variant} />
    </div>
  );
}

export function ProfileSkeleton({ variant = "pulse" }: { variant?: "pulse" | "wave" | "shimmer" } = {}) {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" variant={variant} />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" variant={variant} />
          <Skeleton className="h-4 w-[150px]" variant={variant} />
        </div>
      </div>
    </div>
  );
}

export function ClassCardSkeleton({ variant = "pulse" }: { variant?: "pulse" | "wave" | "shimmer" } = {}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-2/3 mb-3" variant={variant} />
        <Skeleton className="h-5 w-16 rounded-full" variant={variant} />
      </div>
      <Skeleton className="h-4 w-full mb-2" variant={variant} />
      <Skeleton className="h-4 w-1/2 mb-4" variant={variant} />
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-8 w-8 rounded-full" variant={variant} />
        <Skeleton className="h-6 w-24" variant={variant} />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton({ variant = "pulse" }: { variant?: "pulse" | "wave" | "shimmer" } = {}) {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-start space-x-2">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" variant={variant} />
        <div className="flex-1">
          <Skeleton className="h-16 w-full rounded-xl" variant={variant} />
        </div>
      </div>
      <div className="flex items-start space-x-2 flex-row-reverse">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" variant={variant} />
        <div className="flex-1">
          <Skeleton className="h-12 w-full rounded-xl" variant={variant} />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ variant = "pulse" }: { variant?: "pulse" | "wave" | "shimmer" } = {}) {
  return (
    <div className="flex items-center space-x-4 py-3">
      <Skeleton className="h-12 w-12 rounded-md" variant={variant} />
      <Skeleton className="h-4 w-[250px]" variant={variant} />
      <Skeleton className="h-4 w-[100px] ml-auto" variant={variant} />
      <Skeleton className="h-4 w-[80px]" variant={variant} />
    </div>
  );
}

export function FormSkeleton({ variant = "pulse" }: { variant?: "pulse" | "wave" | "shimmer" } = {}) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3 mb-2" variant={variant} />
      <Skeleton className="h-10 w-full mb-6" variant={variant} />
      
      <Skeleton className="h-8 w-1/3 mb-2" variant={variant} />
      <Skeleton className="h-10 w-full mb-6" variant={variant} />
      
      <Skeleton className="h-8 w-1/3 mb-2" variant={variant} />
      <Skeleton className="h-24 w-full mb-6" variant={variant} />
      
      <div className="flex justify-end">
        <Skeleton className="h-10 w-24" variant={variant} />
      </div>
    </div>
  );
}

export function ChallengeCardSkeleton({ variant = "pulse" }: { variant?: "pulse" | "wave" | "shimmer" } = {}) {
  return (
    <div className="h-full flex flex-col rounded-xl border border-border overflow-hidden">
      {/* Image area */}
      <Skeleton className="h-40 w-full" variant={variant} />
      
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-3/4 mb-2" variant={variant} />
          <Skeleton className="h-4 w-16 rounded-full" variant={variant} />
        </div>
        <Skeleton className="h-4 w-1/2 mb-3" variant={variant} />
      </div>
      
      {/* Content */}
      <div className="px-4 pb-3 flex-grow">
        <Skeleton className="h-4 w-full mb-2" variant={variant} />
        <Skeleton className="h-4 w-full mb-3" variant={variant} />
        
        {/* Challenge details */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Skeleton className="h-3 w-full" variant={variant} />
          <Skeleton className="h-3 w-full" variant={variant} />
          <Skeleton className="h-3 w-full" variant={variant} />
          <Skeleton className="h-3 w-full" variant={variant} />
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          <Skeleton className="h-4 w-12 rounded-full" variant={variant} />
          <Skeleton className="h-4 w-16 rounded-full" variant={variant} />
          <Skeleton className="h-4 w-14 rounded-full" variant={variant} />
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t flex justify-between items-center">
        <div className="flex items-center">
          <Skeleton className="h-5 w-5 rounded-full mr-2" variant={variant} />
          <Skeleton className="h-4 w-20" variant={variant} />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" variant={variant} />
          <Skeleton className="h-8 w-16 rounded-md" variant={variant} />
        </div>
      </div>
    </div>
  );
}