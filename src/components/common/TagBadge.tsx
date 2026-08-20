"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagBadgeProps extends Omit<BadgeProps, 'onClick'> {
  tag: string;
  interactive?: boolean;
  onClick?: (tag: string) => void;
  isSelected?: boolean;
}

export function TagBadge({ tag, interactive, onClick, isSelected, className, variant = "secondary", ...props }: TagBadgeProps) {
  const handleClick = () => {
    if (onClick && interactive) {
      onClick(tag);
    }
  };

  return (
    <Badge
      variant={isSelected && interactive ? "default" : variant}
      className={cn(
        "text-sm py-1 px-3 rounded-full shadow-sm",
        interactive && "cursor-pointer hover:opacity-80 transition-opacity",
        isSelected && interactive && "ring-2 ring-primary ring-offset-1",
        className
      )}
      onClick={handleClick as any}
      aria-pressed={interactive ? isSelected : undefined}
      {...props}
    >
      {tag}
    </Badge>
  );
}
