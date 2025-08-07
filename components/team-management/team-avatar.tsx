"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Team } from "@/lib/types/team-management"

interface TeamAvatarProps {
  team: Team
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function TeamAvatar({ team, size = "md", className = "" }: TeamAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm", 
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg"
  }

  // Get first two letters of team name for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {team.clubImage?.url && (
        <AvatarImage 
          src={team.clubImage.url} 
          alt={`${team.name} logo`}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
        {getInitials(team.name)}
      </AvatarFallback>
    </Avatar>
  )
}
