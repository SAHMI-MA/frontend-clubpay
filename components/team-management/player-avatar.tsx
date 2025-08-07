"use client"

import { Player } from "@/lib/types/team-management"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface PlayerAvatarProps {
  player: Player
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-24 w-24"
}

export function PlayerAvatar({ player, size = "md", className }: PlayerAvatarProps) {
  // Generate initials from player name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {player.playerImage?.url ? (
        <AvatarImage 
          src={player.playerImage.url} 
          alt={`${player.firstName} ${player.lastName}`}
        />
      ) : null}
      <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
        {getInitials(player.firstName, player.lastName)}
      </AvatarFallback>
    </Avatar>
  )
}
