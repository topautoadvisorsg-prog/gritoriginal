import { FieldMapping } from "@/shared/types/fighter";
import { ImportRow } from "./ImportPreviewTable";

export type FighterLike = { id: string; firstName: string; lastName: string };
export type FightLike = { id: string; eventDate: string; opponentName: string; fighterId?: string };

export function detectFighterDuplicates(
  data: Record<string, string>[],
  mappedMappings: FieldMapping[],
  fighters: FighterLike[]
): ImportRow[] {
  const firstNameMapping = mappedMappings.find(m => m.systemField === 'first_name' || m.systemField === 'firstName');
  const lastNameMapping = mappedMappings.find(m => m.systemField === 'last_name' || m.systemField === 'lastName');
  const idMapping = mappedMappings.find(m => m.systemField === 'id');

  return data.map((row, index) => {
    const csvFirstName = firstNameMapping ? row[firstNameMapping.csvField]?.toLowerCase().trim() : '';
    const csvLastName = lastNameMapping ? row[lastNameMapping.csvField]?.toLowerCase().trim() : '';
    const csvId = idMapping ? row[idMapping.csvField]?.trim() : '';
    
    let matchedFighter = csvId ? fighters.find(f => f.id === csvId) : undefined;
    
    if (!matchedFighter && csvFirstName && csvLastName) {
      matchedFighter = fighters.find(fighter => {
        const fighterFirstName = fighter.firstName.toLowerCase();
        const fighterLastName = fighter.lastName.toLowerCase();
        return fighterFirstName === csvFirstName && fighterLastName === csvLastName;
      });
    }

    const isDuplicate = !!matchedFighter;

    return {
      id: `row-${index}`,
      data: row,
      status: isDuplicate ? "duplicate" as const : "ready" as const,
      statusMessage: isDuplicate 
        ? `Matches existing fighter: ${matchedFighter?.firstName} ${matchedFighter?.lastName}` 
        : undefined,
      matchedFighterId: matchedFighter?.id,
    };
  });
}

export function detectFightHistoryDuplicates(
  data: Record<string, string>[],
  mappedMappings: FieldMapping[],
  fighters: FighterLike[],
  fights: FightLike[]
): ImportRow[] {
  const fighterIdMapping = mappedMappings.find(m => m.systemField === 'fighter_id');
  const fighterNameMapping = mappedMappings.find(m => m.systemField === 'fighter_full_name');
  const fightIdMapping = mappedMappings.find(m => m.systemField === 'fight_id');
  const eventDateMapping = mappedMappings.find(m => m.systemField === 'event_date');
  const opponentMapping = mappedMappings.find(m => m.systemField === 'opponent_full_name');

  return data.map((row, index) => {
    const csvFighterId = fighterIdMapping ? row[fighterIdMapping.csvField]?.trim() : '';
    const csvFighterName = fighterNameMapping ? row[fighterNameMapping.csvField]?.trim() : '';
    const csvFightId = fightIdMapping ? row[fightIdMapping.csvField]?.trim() : '';
    const csvEventDate = eventDateMapping ? row[eventDateMapping.csvField]?.trim() : '';
    const csvOpponent = opponentMapping ? row[opponentMapping.csvField]?.trim() : '';

    let matchedFighter = csvFighterId ? fighters.find(f => f.id === csvFighterId) : undefined;
    
    if (!matchedFighter && csvFighterName) {
      const [firstName, ...lastParts] = csvFighterName.split(' ');
      const lastName = lastParts.join(' ');
      matchedFighter = fighters.find(fighter => {
        const fighterFirstName = fighter.firstName.toLowerCase();
        const fighterLastName = fighter.lastName.toLowerCase();
        return fighterFirstName === firstName?.toLowerCase() && fighterLastName === lastName?.toLowerCase();
      });
    }

    if (!matchedFighter) {
      return {
        id: `row-${index}`,
        data: row,
        status: "error" as const,
        statusMessage: `Fighter not found: ${csvFighterName || csvFighterId || 'Unknown'}. Import fighter first.`,
      };
    }

    let opponentFound = false;
    if (csvOpponent) {
      const [oppFirst, ...oppLastParts] = csvOpponent.split(' ');
      const oppLast = oppLastParts.join(' ');
      opponentFound = !!fighters.find(fighter => {
        return fighter.firstName.toLowerCase() === oppFirst?.toLowerCase() && 
               fighter.lastName.toLowerCase() === oppLast?.toLowerCase();
      });
    }

    let existingFight = csvFightId ? fights.find(f => f.id === csvFightId) : undefined;
    
    if (!existingFight && csvEventDate && csvOpponent) {
      existingFight = fights.find(f => 
        f.eventDate === csvEventDate && 
        f.opponentName.toLowerCase() === csvOpponent.toLowerCase() &&
        (f as any).fighterId === matchedFighter?.id
      );
    }

    const isDuplicate = !!existingFight;

    let statusMessage: string;
    if (isDuplicate) {
      statusMessage = `Duplicate fight: ${csvOpponent} on ${csvEventDate}`;
    } else if (!opponentFound && csvOpponent) {
      statusMessage = `Linked to: ${matchedFighter.firstName} ${matchedFighter.lastName} | Opponent "${csvOpponent}" not in system (will auto-link later)`;
    } else {
      statusMessage = `Linked to: ${matchedFighter.firstName} ${matchedFighter.lastName}`;
    }

    return {
      id: `row-${index}`,
      data: row,
      status: isDuplicate ? "duplicate" as const : "ready" as const,
      statusMessage,
      matchedFighterId: matchedFighter?.id,
    };
  });
}
