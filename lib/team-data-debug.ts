/**
 * Utility functions to help debug team/player data structure issues
 */

import { Player } from './types/team-management';

/**
 * Analyzes player data to find inconsistencies between teamId and team object
 * @param player The player object to analyze
 * @returns Object with analysis results
 */
export function analyzePlayerTeamData(player: Player) {
  const hasTeamId = player.teamId !== undefined && player.teamId !== null;
  const hasTeamObject = player.team !== undefined && player.team !== null;
  
  console.log(`Player: ${player.firstName} ${player.lastName} (ID: ${player.id})`);
  console.log(`- hasTeamId: ${hasTeamId}, value: ${player.teamId}`);
  console.log(`- hasTeamObject: ${hasTeamObject}, value:`, player.team);

  // Check for inconsistency where teamId doesn't match team.id
  let inconsistent = false;
  if (hasTeamId && hasTeamObject && player.team) {
    inconsistent = player.teamId !== player.team.id;
    if (inconsistent) {
      console.warn(`⚠️ Inconsistency detected: teamId (${player.teamId}) doesn't match team.id (${player.team.id})`);
    }
  }

  return {
    hasTeamId,
    hasTeamObject,
    inconsistent,
    teamIdValue: player.teamId,
    teamObjectValue: player.team,
  };
}

/**
 * Run this after fetching players to debug team assignment issues
 * @param players Array of players to analyze
 */
export function debugPlayersTeamStructure(players: Player[]) {
  console.group('Players Team Data Analysis');
  console.log(`Analyzing ${players.length} players`);
  
  const withTeamId = players.filter(p => p.teamId !== undefined && p.teamId !== null).length;
  const withTeamObject = players.filter(p => p.team !== undefined && p.team !== null).length;
  
  console.log(`- Players with teamId: ${withTeamId}/${players.length}`);
  console.log(`- Players with team object: ${withTeamObject}/${players.length}`);
  
  // Identify inconsistencies
  const inconsistencies = players.filter(p => {
    if (p.teamId && p.team) {
      return p.teamId !== p.team.id;
    }
    return false;
  });
  
  if (inconsistencies.length > 0) {
    console.warn(`⚠️ Found ${inconsistencies.length} players with inconsistent team data`);
    inconsistencies.forEach(p => {
      console.warn(`  - ${p.firstName} ${p.lastName}: teamId=${p.teamId}, team.id=${p.team?.id}`);
    });
  }
  
  console.groupEnd();
}
