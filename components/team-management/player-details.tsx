"use client";

import { useState, useEffect } from "react";
import { Player} from "@/lib/types/team-management";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchPlayerById } from "@/lib/redux/playerSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPositionDisplayName } from "@/lib/utils";
import {
  User,
  CalendarDays,
  MapPin,
  FileText,
  Medal,
  Edit,
  Calendar,
  DollarSign,
  FileSignature,
  Clock,
  Clipboard
} from "lucide-react";

interface PlayerDetailsProps {
  player: Player;
  onEditPlayer: (player: Player) => void;
}

export function PlayerDetails({ player, onEditPlayer }: PlayerDetailsProps) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("overview");
  const { teams } = useAppSelector(state => state.teams);

  // Fetch detailed player data when viewing
  useEffect(() => {
    dispatch(fetchPlayerById(player.id));
  }, [player.id, dispatch]);

  // Get team name from player object or ID
  const getTeamName = (player: Player) => {
    // If player has a team object directly, use that
    if (player.team && player.team.name) {
      return player.team.name;
    }
    
    // Otherwise fall back to finding by teamId
    const teamId = player.teamId;
    if (!teamId || !teams) return "No Team";
    
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Player Profile Header */}
      <Card className="overflow-hidden border shadow-lg">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 h-32 flex items-end p-6">
          <div className="flex flex-col sm:flex-row w-full items-start sm:items-center gap-4 relative">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-xl flex items-center justify-center">
              {player.playerImage ? (
                <img
                  src={player.playerImage}
                  alt={player.firstName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder-player.png";
                  }}
                />
              ) : (
                <User className="h-16 w-16 text-gray-300" />
              )}
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-2xl font-bold">
                {player.firstName} {player.lastName}
              </h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 hover:bg-white/30 text-white">
                  {getPositionDisplayName(player.position)}
                </Badge>
                <span className="text-white/80 text-sm">
                  {getTeamName(player)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onEditPlayer(player)}
              className="absolute top-0 right-0 sm:relative bg-white/20 hover:bg-white/30 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
        <CardContent className="pt-6">
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="contract" className="flex items-center gap-1" disabled={!player.contract}>
                <FileSignature className="h-4 w-4" />
                Contract
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-1" disabled={!player.matchParticipations?.length}>
                <Calendar className="h-4 w-4" />
                Matches
              </TabsTrigger>
              <TabsTrigger value="objectives" className="flex items-center gap-1" disabled={!player.objectiveProgress?.length}>
                <Medal className="h-4 w-4" />
                Objectives
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Personal Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Age</p>
                        <p className="text-muted-foreground">
                          {calculateAge(player.dateOfBirth)} years 
                          <span className="text-xs ml-2">
                            (Born {formatDate(player.dateOfBirth)})
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Team</p>
                        <p className="text-muted-foreground">{getTeamName(player)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Position</p>
                        <p className="text-muted-foreground">{getPositionDisplayName(player.position)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {player.contract && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Contract Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Salary</p>
                          <p className="text-muted-foreground">
                            {formatCurrency(player.contract.salary)}/year
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Contract Period</p>
                          <p className="text-muted-foreground">
                            {formatDate(player.contract.startDate)} to {formatDate(player.contract.endDate)}
                          </p>
                        </div>
                      </div>
                      {player.contract.hasBonus && (
                        <div className="flex items-start gap-2">
                          <Medal className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Bonus Eligible</p>
                            <p className="text-muted-foreground">
                              {player.contract.signatureBonus ? formatCurrency(player.contract.signatureBonus) : 'Yes'}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Matches</p>
                        <p className="text-muted-foreground">
                          {player.matchParticipations?.length || 0} appearances
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Medal className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Objectives</p>
                        <p className="text-muted-foreground">
                          {player.objectiveProgress?.filter(p => p.completedAt)?.length || 0} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clipboard className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Registration Date</p>
                        <p className="text-muted-foreground">
                          {player.createdAt ? formatDate(player.createdAt) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* We'll add match history and objectives progress in later stages */}
              <div className="text-center p-4 text-muted-foreground">
                <p>More player statistics and history coming soon...</p>
              </div>
            </TabsContent>

            {/* Contract Tab */}
            <TabsContent value="contract" className="space-y-4">
              {player.contract ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold">Contract Period</h3>
                        <p className="text-muted-foreground">
                          From {formatDate(player.contract.startDate)} to {formatDate(player.contract.endDate)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold">Salary</h3>
                        <p className="text-muted-foreground">
                          {formatCurrency(player.contract.salary)} per year
                        </p>
                      </div>
                    </div>

                    {player.contract.hasBonus && (
                      <div>
                        <h3 className="font-semibold">Bonus Information</h3>
                        <p className="text-muted-foreground">
                          {player.contract.signatureBonus 
                            ? `Signature Bonus: ${formatCurrency(player.contract.signatureBonus)}` 
                            : 'Performance bonuses may apply'}
                        </p>
                      </div>
                    )}

                    {player.contract.description && (
                      <div>
                        <h3 className="font-semibold">Additional Terms</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{player.contract.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center p-8">
                  <FileSignature className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No Contract Found</h3>
                  <p className="text-muted-foreground">This player doesn&apos;t have an active contract.</p>
                  {/* We can add a button to create contract here */}
                </div>
              )}
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches">
              <div className="text-center p-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold mb-1">Match History</h3>
                <p className="text-muted-foreground">This section will display the player&apos;s match participations.</p>
                {/* We'll implement match history in later stages */}
              </div>
            </TabsContent>

            {/* Objectives Tab */}
            <TabsContent value="objectives">
              <div className="text-center p-8">
                <Medal className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold mb-1">Objectives & Progress</h3>
                <p className="text-muted-foreground">This section will display the player&apos;s objectives and progress.</p>
                {/* We'll implement objectives tracking in later stages */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
