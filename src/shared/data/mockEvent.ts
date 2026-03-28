import { Event, EventFight } from '@/shared/types/fighter';

// Mock Event Data - Uses real fighter IDs from mockFighters.ts
// Data will be empty/undefined where real data doesn't exist

export const mockEvent: Event = {
  id: 'ufc-324',
  name: 'UFC 324',
  date: '2026-02-15',
  location: {
    city: 'Las Vegas',
    state: 'NV',
    country: 'USA',
    venue: 'T-Mobile Arena',
  },
  fights: [
    // Main Event
    {
      id: 'fight-1',
      eventId: 'ufc-324',
      fighter1Id: 'lhw-c', // Alex Pereira
      fighter2Id: 'lhw-3', // Jamahal Hill
      fightType: 'Main Card',
      boutOrder: 1,
      weightClass: 'Light Heavyweight',
      isTitleFight: true,
      status: 'Scheduled',
    },
    // Co-Main Event
    {
      id: 'fight-2',
      eventId: 'ufc-324',
      fighter1Id: 'lw-c', // Islam Makhachev
      fighter2Id: 'lw-1', // Arman Tsarukyan
      fightType: 'Main Card',
      boutOrder: 2,
      weightClass: 'Lightweight',
      isTitleFight: true,
      status: 'Scheduled',
    },
    // Main Card
    {
      id: 'fight-3',
      eventId: 'ufc-324',
      fighter1Id: 'mw-2', // Israel Adesanya
      fighter2Id: 'mw-1', // Sean Strickland
      fightType: 'Main Card',
      boutOrder: 3,
      weightClass: 'Middleweight',
      isTitleFight: false,
      status: 'Scheduled',
    },
    {
      id: 'fight-4',
      eventId: 'ufc-324',
      fighter1Id: 'fw-c', // Ilia Topuria
      fighter2Id: 'fw-1', // Alexander Volkanovski
      fightType: 'Main Card',
      boutOrder: 4,
      weightClass: 'Featherweight',
      isTitleFight: true,
      status: 'Scheduled',
    },
    {
      id: 'fight-5',
      eventId: 'ufc-324',
      fighter1Id: 'hw-1', // Tom Aspinall
      fighter2Id: 'hw-2', // Ciryl Gane
      fightType: 'Main Card',
      boutOrder: 5,
      weightClass: 'Heavyweight',
      isTitleFight: false,
      status: 'Scheduled',
    },
    // Prelims
    {
      id: 'fight-6',
      eventId: 'ufc-324',
      fighter1Id: 'ww-3', // Shavkat Rakhmonov
      fighter2Id: 'ww-1', // Leon Edwards
      fightType: 'Prelim',
      boutOrder: 6,
      weightClass: 'Welterweight',
      isTitleFight: false,
      status: 'Scheduled',
    },
    {
      id: 'fight-7',
      eventId: 'ufc-324',
      fighter1Id: 'bw-c', // Merab Dvalishvili
      fighter2Id: 'bw-1', // Sean O'Malley
      fightType: 'Prelim',
      boutOrder: 7,
      weightClass: 'Bantamweight',
      isTitleFight: true,
      status: 'Scheduled',
    },
    {
      id: 'fight-8',
      eventId: 'ufc-324',
      fighter1Id: 'lw-3', // Justin Gaethje
      fighter2Id: 'lw-4', // Dustin Poirier
      fightType: 'Prelim',
      boutOrder: 8,
      weightClass: 'Lightweight',
      isTitleFight: false,
      status: 'Scheduled',
    },
    // Early Prelims
    {
      id: 'fight-9',
      eventId: 'ufc-324',
      fighter1Id: 'mw-4', // Khamzat Chimaev
      fighter2Id: 'mw-3', // Robert Whittaker
      fightType: 'Early Prelim',
      boutOrder: 9,
      weightClass: 'Middleweight',
      isTitleFight: false,
      status: 'Scheduled',
    },
    {
      id: 'fight-10',
      eventId: 'ufc-324',
      fighter1Id: 'fw-2', // Diego Lopes
      fighter2Id: 'fw-3', // Movsar Evloev
      fightType: 'Early Prelim',
      boutOrder: 10,
      weightClass: 'Featherweight',
      isTitleFight: false,
      status: 'Scheduled',
    },
  ],
  status: 'Upcoming',
};

// Helper to get fight type label
export const getFightTypeLabel = (boutOrder: number, isTitleFight: boolean): string => {
  if (boutOrder === 1) return 'MAIN EVENT';
  if (boutOrder === 2) return 'CO-MAIN EVENT';
  if (isTitleFight) return 'TITLE FIGHT';
  return '';
};

// Helper to get section label for grouping
export const getFightSectionLabel = (fightType: EventFight['fightType']): string => {
  switch (fightType) {
    case 'Main Card':
      return 'MAIN CARD';
    case 'Prelim':
      return 'PRELIMS';
    case 'Early Prelim':
      return 'EARLY PRELIMS';
    default:
      return 'EXHIBITION';
  }
};
