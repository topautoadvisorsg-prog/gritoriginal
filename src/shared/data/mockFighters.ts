import { Fighter, WeightClass } from '@/shared/types/fighter';

// Helper to generate fighter data
const createFighter = (
  id: string,
  firstName: string,
  lastName: string,
  nickname: string | undefined,
  nationality: string,
  weightClass: WeightClass,
  gender: 'Male' | 'Female',
  ranking: number | undefined,
  isChampion: boolean,
  record: { wins: number; losses: number; draws: number },
  imageUrl?: string
): Fighter => ({
  id,
  firstName,
  lastName,
  nickname,
  dateOfBirth: '1990-01-01',
  nationality,
  gender,
  weightClass,
  stance: 'Orthodox',
  gym: 'Elite MMA',
  headCoach: 'John Smith',
  team: 'Team Elite',
  imageUrl: imageUrl || `https://via.placeholder.com/300x400/1a1a2e/00d4ff?text=${firstName[0]}${lastName[0]}`,
  bodyImageUrl: undefined, // Optional full-body stance image
  organization: 'UFC',
  physicalStats: {
    age: 30,
    height: "6'0\"",
    heightInches: 72,
    reach: "74\"",
    reachInches: 74,
    legReach: "40\"",
    legReachInches: 40,
    weight: 185,
  },
  record: {
    wins: record.wins,
    losses: record.losses,
    draws: record.draws,
    noContests: 0,
  },
  performance: {
    koWins: Math.floor(record.wins * 0.4),
    tkoWins: Math.floor(record.wins * 0.2),
    submissionWins: Math.floor(record.wins * 0.2),
    decisionWins: Math.floor(record.wins * 0.2),
    finishRate: 70,
    avgFightTimeMinutes: 10,
    strikeAccuracy: 50,
    strikeDefense: 55,
    takedownAccuracy: 45,
    strikesLandedPerMin: 4.5,
    strikesAbsorbedPerMin: 3.2,
    takedownDefense: 75,
    submissionDefense: 80,
    submissionAvg: 0.5,
    winStreak: 2,
    lossStreak: 0,
    koStreak: 1,
    subStreak: 0,
  },
  history: [],
  notes: [], // Empty array - data-driven field
  riskSignals: [], // Empty array - data-driven field
  isActive: true,
  ranking,
  isChampion,
  lastUpdated: new Date().toISOString(),
  createdAt: '2022-01-01T00:00:00Z',
});

// UFC Heavyweight Division
export const heavyweightFighters: Fighter[] = [
  createFighter('hw-c', 'Jon', 'Jones', 'Bones', 'USA', 'Heavyweight', 'Male', undefined, true, { wins: 28, losses: 1, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-03/JONES_JON_L_BELT_03-04.png'),
  createFighter('hw-1', 'Tom', 'Aspinall', '', 'United Kingdom', 'Heavyweight', 'Male', 1, false, { wins: 15, losses: 3, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-07/ASPINALL_TOM_L_BELT_07-27.png'),
  createFighter('hw-2', 'Ciryl', 'Gane', 'Bon Gamin', 'France', 'Heavyweight', 'Male', 2, false, { wins: 12, losses: 2, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-01/GANE_CIRYL_L_01-21.png'),
  createFighter('hw-3', 'Stipe', 'Miocic', '', 'USA', 'Heavyweight', 'Male', 3, false, { wins: 20, losses: 4, draws: 0 }),
  createFighter('hw-4', 'Sergei', 'Pavlovich', '', 'Russia', 'Heavyweight', 'Male', 4, false, { wins: 18, losses: 2, draws: 0 }),
  createFighter('hw-5', 'Curtis', 'Blaydes', 'Razor', 'USA', 'Heavyweight', 'Male', 5, false, { wins: 18, losses: 4, draws: 0 }),
  createFighter('hw-6', 'Alexander', 'Volkov', 'Drago', 'Russia', 'Heavyweight', 'Male', 6, false, { wins: 38, losses: 10, draws: 0 }),
  createFighter('hw-7', 'Jailton', 'Almeida', 'Malhadinho', 'Brazil', 'Heavyweight', 'Male', 7, false, { wins: 21, losses: 2, draws: 0 }),
  createFighter('hw-8', 'Marcin', 'Tybura', '', 'Poland', 'Heavyweight', 'Male', 8, false, { wins: 25, losses: 8, draws: 0 }),
  createFighter('hw-9', 'Tai', 'Tuivasa', 'Bam Bam', 'Australia', 'Heavyweight', 'Male', 9, false, { wins: 15, losses: 7, draws: 0 }),
  createFighter('hw-10', 'Derrick', 'Lewis', 'The Black Beast', 'USA', 'Heavyweight', 'Male', 10, false, { wins: 28, losses: 12, draws: 0 }),
  createFighter('hw-11', 'Shamil', 'Gaziev', '', 'Russia', 'Heavyweight', 'Male', 11, false, { wins: 15, losses: 1, draws: 0 }),
  createFighter('hw-12', 'Alexandr', 'Romanov', 'King Kong', 'Moldova', 'Heavyweight', 'Male', 12, false, { wins: 18, losses: 2, draws: 0 }),
  createFighter('hw-13', 'Rodrigo', 'Nascimento', 'Monstro', 'Brazil', 'Heavyweight', 'Male', 13, false, { wins: 14, losses: 3, draws: 0 }),
  createFighter('hw-14', 'Marcos', 'Rogerio de Lima', 'Pezao', 'Brazil', 'Heavyweight', 'Male', 14, false, { wins: 22, losses: 10, draws: 0 }),
  createFighter('hw-15', 'Serghei', 'Spivak', 'Polar Bear', 'Ukraine', 'Heavyweight', 'Male', 15, false, { wins: 17, losses: 4, draws: 0 }),
];

// UFC Light Heavyweight Division  
export const lightHeavyweightFighters: Fighter[] = [
  createFighter('lhw-c', 'Alex', 'Pereira', 'Poatan', 'Brazil', 'Light Heavyweight', 'Male', undefined, true, { wins: 11, losses: 2, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/PEREIRA_ALEX_L_BELT_10-05.png'),
  createFighter('lhw-1', 'Magomed', 'Ankalaev', '', 'Russia', 'Light Heavyweight', 'Male', 1, false, { wins: 19, losses: 1, draws: 1 }),
  createFighter('lhw-2', 'Jiri', 'Prochazka', 'Denisa', 'Czech Republic', 'Light Heavyweight', 'Male', 2, false, { wins: 30, losses: 5, draws: 1 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-06/PROCHAZKA_JIRI_L_BELT_06-10.png'),
  createFighter('lhw-3', 'Jamahal', 'Hill', 'Sweet Dreams', 'USA', 'Light Heavyweight', 'Male', 3, false, { wins: 12, losses: 2, draws: 0 }),
  createFighter('lhw-4', 'Jan', 'Blachowicz', 'Legendary Polish Power', 'Poland', 'Light Heavyweight', 'Male', 4, false, { wins: 29, losses: 10, draws: 1 }),
  createFighter('lhw-5', 'Aleksandar', 'Rakic', '', 'Austria', 'Light Heavyweight', 'Male', 5, false, { wins: 14, losses: 4, draws: 0 }),
  createFighter('lhw-6', 'Khalil', 'Rountree Jr.', 'The War Horse', 'USA', 'Light Heavyweight', 'Male', 6, false, { wins: 13, losses: 5, draws: 0 }),
  createFighter('lhw-7', 'Nikita', 'Krylov', 'The Miner', 'Ukraine', 'Light Heavyweight', 'Male', 7, false, { wins: 30, losses: 10, draws: 0 }),
  createFighter('lhw-8', 'Anthony', 'Smith', 'Lionheart', 'USA', 'Light Heavyweight', 'Male', 8, false, { wins: 38, losses: 20, draws: 0 }),
  createFighter('lhw-9', 'Johnny', 'Walker', '', 'Brazil', 'Light Heavyweight', 'Male', 9, false, { wins: 21, losses: 8, draws: 0 }),
  createFighter('lhw-10', 'Ryan', 'Spann', 'Superman', 'USA', 'Light Heavyweight', 'Male', 10, false, { wins: 22, losses: 10, draws: 0 }),
  createFighter('lhw-11', 'Volkan', 'Oezdemir', 'No Time', 'Switzerland', 'Light Heavyweight', 'Male', 11, false, { wins: 19, losses: 8, draws: 0 }),
  createFighter('lhw-12', 'Bogdan', 'Guskov', '', 'Russia', 'Light Heavyweight', 'Male', 12, false, { wins: 16, losses: 2, draws: 0 }),
  createFighter('lhw-13', 'Azamat', 'Murzakanov', '', 'Russia', 'Light Heavyweight', 'Male', 13, false, { wins: 12, losses: 1, draws: 0 }),
  createFighter('lhw-14', 'Dustin', 'Jacoby', 'The Hanyak', 'USA', 'Light Heavyweight', 'Male', 14, false, { wins: 19, losses: 8, draws: 0 }),
  createFighter('lhw-15', 'Alonzo', 'Menifield', 'Atomic', 'USA', 'Light Heavyweight', 'Male', 15, false, { wins: 15, losses: 4, draws: 0 }),
];

// UFC Middleweight Division
export const middleweightFighters: Fighter[] = [
  createFighter('mw-c', 'Dricus', 'Du Plessis', 'Stillknocks', 'South Africa', 'Middleweight', 'Male', undefined, true, { wins: 22, losses: 2, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/DU_PLESSIS_DRICUS_L_BELT_08-17.png'),
  createFighter('mw-1', 'Sean', 'Strickland', 'Tarzan', 'USA', 'Middleweight', 'Male', 1, false, { wins: 29, losses: 6, draws: 0 }),
  createFighter('mw-2', 'Israel', 'Adesanya', 'The Last Stylebender', 'Nigeria', 'Middleweight', 'Male', 2, false, { wins: 24, losses: 3, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-09/ADESANYA_ISRAEL_L_09-09.png'),
  createFighter('mw-3', 'Robert', 'Whittaker', 'The Reaper', 'Australia', 'Middleweight', 'Male', 3, false, { wins: 26, losses: 7, draws: 0 }),
  createFighter('mw-4', 'Khamzat', 'Chimaev', 'Borz', 'Sweden', 'Middleweight', 'Male', 4, false, { wins: 13, losses: 0, draws: 0 }),
  createFighter('mw-5', 'Nassourdine', 'Imavov', 'The Sniper', 'France', 'Middleweight', 'Male', 5, false, { wins: 15, losses: 4, draws: 0 }),
  createFighter('mw-6', 'Jared', 'Cannonier', 'The Killa Gorilla', 'USA', 'Middleweight', 'Male', 6, false, { wins: 17, losses: 7, draws: 0 }),
  createFighter('mw-7', 'Paulo', 'Costa', 'Borrachinha', 'Brazil', 'Middleweight', 'Male', 7, false, { wins: 14, losses: 3, draws: 0 }),
  createFighter('mw-8', 'Caio', 'Borralho', '', 'Brazil', 'Middleweight', 'Male', 8, false, { wins: 17, losses: 1, draws: 0 }),
  createFighter('mw-9', 'Brendan', 'Allen', '', 'USA', 'Middleweight', 'Male', 9, false, { wins: 24, losses: 6, draws: 0 }),
  createFighter('mw-10', 'Roman', 'Dolidze', '', 'Georgia', 'Middleweight', 'Male', 10, false, { wins: 14, losses: 3, draws: 0 }),
  createFighter('mw-11', 'Gregory', 'Rodrigues', 'Robocop', 'Brazil', 'Middleweight', 'Male', 11, false, { wins: 15, losses: 6, draws: 0 }),
  createFighter('mw-12', 'Michel', 'Pereira', 'Demolidor', 'Brazil', 'Middleweight', 'Male', 12, false, { wins: 32, losses: 11, draws: 2 }),
  createFighter('mw-13', 'Chris', 'Curtis', 'The Action Man', 'USA', 'Middleweight', 'Male', 13, false, { wins: 31, losses: 11, draws: 0 }),
  createFighter('mw-14', 'Shara', 'Magomedov', 'Bullet', 'Russia', 'Middleweight', 'Male', 14, false, { wins: 15, losses: 0, draws: 0 }),
  createFighter('mw-15', 'Brad', 'Tavares', '', 'USA', 'Middleweight', 'Male', 15, false, { wins: 21, losses: 9, draws: 0 }),
];

// UFC Welterweight Division
export const welterweightFighters: Fighter[] = [
  createFighter('ww-c', 'Belal', 'Muhammad', 'Remember The Name', 'USA', 'Welterweight', 'Male', undefined, true, { wins: 24, losses: 3, draws: 0 }),
  createFighter('ww-1', 'Leon', 'Edwards', 'Rocky', 'United Kingdom', 'Welterweight', 'Male', 1, false, { wins: 22, losses: 3, draws: 0 }),
  createFighter('ww-2', 'Kamaru', 'Usman', 'The Nigerian Nightmare', 'Nigeria', 'Welterweight', 'Male', 2, false, { wins: 20, losses: 4, draws: 0 }),
  createFighter('ww-3', 'Shavkat', 'Rakhmonov', 'Nomad', 'Kazakhstan', 'Welterweight', 'Male', 3, false, { wins: 18, losses: 0, draws: 0 }),
  createFighter('ww-4', 'Colby', 'Covington', 'Chaos', 'USA', 'Welterweight', 'Male', 4, false, { wins: 17, losses: 4, draws: 0 }),
  createFighter('ww-5', 'Jack', 'Della Maddalena', '', 'Australia', 'Welterweight', 'Male', 5, false, { wins: 17, losses: 2, draws: 0 }),
  createFighter('ww-6', 'Gilbert', 'Burns', 'Durinho', 'Brazil', 'Welterweight', 'Male', 6, false, { wins: 22, losses: 7, draws: 0 }),
  createFighter('ww-7', 'Sean', 'Brady', '', 'USA', 'Welterweight', 'Male', 7, false, { wins: 17, losses: 1, draws: 0 }),
  createFighter('ww-8', 'Michael', 'Page', 'Venom', 'United Kingdom', 'Welterweight', 'Male', 8, false, { wins: 22, losses: 3, draws: 0 }),
  createFighter('ww-9', 'Geoff', 'Neal', 'Handz of Steel', 'USA', 'Welterweight', 'Male', 9, false, { wins: 16, losses: 5, draws: 0 }),
  createFighter('ww-10', 'Ian', 'Garry', 'The Future', 'Ireland', 'Welterweight', 'Male', 10, false, { wins: 15, losses: 0, draws: 0 }),
  createFighter('ww-11', 'Stephen', 'Thompson', 'Wonderboy', 'USA', 'Welterweight', 'Male', 11, false, { wins: 17, losses: 7, draws: 0 }),
  createFighter('ww-12', 'Joaquin', 'Buckley', 'New Mansa', 'USA', 'Welterweight', 'Male', 12, false, { wins: 20, losses: 6, draws: 0 }),
  createFighter('ww-13', 'Kevin', 'Holland', 'Trailblazer', 'USA', 'Welterweight', 'Male', 13, false, { wins: 26, losses: 12, draws: 0 }),
  createFighter('ww-14', 'Vicente', 'Luque', 'The Silent Assassin', 'Brazil', 'Welterweight', 'Male', 14, false, { wins: 22, losses: 10, draws: 0 }),
  createFighter('ww-15', 'Neil', 'Magny', 'The Haitian Sensation', 'USA', 'Welterweight', 'Male', 15, false, { wins: 29, losses: 12, draws: 0 }),
];

// UFC Lightweight Division
export const lightweightFighters: Fighter[] = [
  createFighter('lw-c', 'Islam', 'Makhachev', '', 'Russia', 'Lightweight', 'Male', undefined, true, { wins: 26, losses: 1, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/MAKHACHEV_ISLAM_L_BELT_06-01.png'),
  createFighter('lw-1', 'Arman', 'Tsarukyan', 'Ahalkalakets', 'Armenia', 'Lightweight', 'Male', 1, false, { wins: 22, losses: 3, draws: 0 }),
  createFighter('lw-2', 'Charles', 'Oliveira', 'Do Bronx', 'Brazil', 'Lightweight', 'Male', 2, false, { wins: 34, losses: 10, draws: 0 }),
  createFighter('lw-3', 'Justin', 'Gaethje', 'The Highlight', 'USA', 'Lightweight', 'Male', 3, false, { wins: 25, losses: 5, draws: 0 }),
  createFighter('lw-4', 'Dustin', 'Poirier', 'The Diamond', 'USA', 'Lightweight', 'Male', 4, false, { wins: 30, losses: 9, draws: 0 }),
  createFighter('lw-5', 'Max', 'Holloway', 'Blessed', 'USA', 'Lightweight', 'Male', 5, false, { wins: 26, losses: 7, draws: 0 }),
  createFighter('lw-6', 'Michael', 'Chandler', 'Iron', 'USA', 'Lightweight', 'Male', 6, false, { wins: 23, losses: 8, draws: 0 }),
  createFighter('lw-7', 'Beneil', 'Dariush', '', 'USA', 'Lightweight', 'Male', 7, false, { wins: 22, losses: 6, draws: 0 }),
  createFighter('lw-8', 'Dan', 'Hooker', 'The Hangman', 'New Zealand', 'Lightweight', 'Male', 8, false, { wins: 24, losses: 13, draws: 0 }),
  createFighter('lw-9', 'Mateusz', 'Gamrot', 'Gamer', 'Poland', 'Lightweight', 'Male', 9, false, { wins: 24, losses: 3, draws: 0 }),
  createFighter('lw-10', 'Rafael', 'Fiziev', 'Ataman', 'Kazakhstan', 'Lightweight', 'Male', 10, false, { wins: 13, losses: 3, draws: 0 }),
  createFighter('lw-11', 'Renato', 'Moicano', 'Money', 'Brazil', 'Lightweight', 'Male', 11, false, { wins: 19, losses: 5, draws: 0 }),
  createFighter('lw-12', 'Benoit', 'Saint Denis', 'God of War', 'France', 'Lightweight', 'Male', 12, false, { wins: 13, losses: 2, draws: 0 }),
  createFighter('lw-13', 'Jalin', 'Turner', 'The Tarantula', 'USA', 'Lightweight', 'Male', 13, false, { wins: 14, losses: 7, draws: 0 }),
  createFighter('lw-14', 'Bobby', 'Green', 'King', 'USA', 'Lightweight', 'Male', 14, false, { wins: 32, losses: 15, draws: 0 }),
  createFighter('lw-15', 'Grant', 'Dawson', 'KGD', 'USA', 'Lightweight', 'Male', 15, false, { wins: 21, losses: 2, draws: 0 }),
];

// UFC Featherweight Division
export const featherweightFighters: Fighter[] = [
  createFighter('fw-c', 'Ilia', 'Topuria', 'El Matador', 'Spain', 'Featherweight', 'Male', undefined, true, { wins: 16, losses: 0, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/TOPURIA_ILIA_L_BELT_02-17.png'),
  createFighter('fw-1', 'Alexander', 'Volkanovski', 'The Great', 'Australia', 'Featherweight', 'Male', 1, false, { wins: 26, losses: 4, draws: 0 }),
  createFighter('fw-2', 'Diego', 'Lopes', '', 'Brazil', 'Featherweight', 'Male', 2, false, { wins: 26, losses: 6, draws: 0 }),
  createFighter('fw-3', 'Movsar', 'Evloev', '', 'Russia', 'Featherweight', 'Male', 3, false, { wins: 18, losses: 0, draws: 0 }),
  createFighter('fw-4', 'Yair', 'Rodriguez', 'El Pantera', 'Mexico', 'Featherweight', 'Male', 4, false, { wins: 16, losses: 4, draws: 0 }),
  createFighter('fw-5', 'Brian', 'Ortega', 'T-City', 'USA', 'Featherweight', 'Male', 5, false, { wins: 16, losses: 3, draws: 0 }),
  createFighter('fw-6', 'Josh', 'Emmett', '', 'USA', 'Featherweight', 'Male', 6, false, { wins: 18, losses: 5, draws: 0 }),
  createFighter('fw-7', 'Arnold', 'Allen', 'Almighty', 'United Kingdom', 'Featherweight', 'Male', 7, false, { wins: 19, losses: 3, draws: 0 }),
  createFighter('fw-8', 'Calvin', 'Kattar', 'The Boston Finisher', 'USA', 'Featherweight', 'Male', 8, false, { wins: 24, losses: 8, draws: 0 }),
  createFighter('fw-9', 'Bryce', 'Mitchell', 'Thug Nasty', 'USA', 'Featherweight', 'Male', 9, false, { wins: 16, losses: 2, draws: 0 }),
  createFighter('fw-10', 'Giga', 'Chikadze', 'Ninja', 'Georgia', 'Featherweight', 'Male', 10, false, { wins: 15, losses: 4, draws: 0 }),
  createFighter('fw-11', 'Lerone', 'Murphy', 'The Miracle', 'United Kingdom', 'Featherweight', 'Male', 11, false, { wins: 16, losses: 0, draws: 1 }),
  createFighter('fw-12', 'Dan', 'Ige', '50K', 'USA', 'Featherweight', 'Male', 12, false, { wins: 18, losses: 8, draws: 0 }),
  createFighter('fw-13', 'Sodiq', 'Yusuff', 'Super', 'Nigeria', 'Featherweight', 'Male', 13, false, { wins: 14, losses: 3, draws: 0 }),
  createFighter('fw-14', 'Edson', 'Barboza', 'Junior', 'Brazil', 'Featherweight', 'Male', 14, false, { wins: 24, losses: 12, draws: 0 }),
  createFighter('fw-15', 'Cub', 'Swanson', 'Killer', 'USA', 'Featherweight', 'Male', 15, false, { wins: 29, losses: 13, draws: 0 }),
];

// UFC Bantamweight Division
export const bantamweightFighters: Fighter[] = [
  createFighter('bw-c', 'Merab', 'Dvalishvili', 'The Machine', 'Georgia', 'Bantamweight', 'Male', undefined, true, { wins: 18, losses: 4, draws: 0 }),
  createFighter('bw-1', 'Sean', "O'Malley", 'Sugar', 'USA', 'Bantamweight', 'Male', 1, false, { wins: 18, losses: 2, draws: 0 }, 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-03/OMALLEY_SEAN_L_BELT_03-09.png'),
  createFighter('bw-2', 'Cory', 'Sandhagen', 'The Sandman', 'USA', 'Bantamweight', 'Male', 2, false, { wins: 17, losses: 5, draws: 0 }),
  createFighter('bw-3', 'Petr', 'Yan', 'No Mercy', 'Russia', 'Bantamweight', 'Male', 3, false, { wins: 17, losses: 5, draws: 0 }),
  createFighter('bw-4', 'Marlon', 'Vera', 'Chito', 'Ecuador', 'Bantamweight', 'Male', 4, false, { wins: 22, losses: 10, draws: 0 }),
  createFighter('bw-5', 'Deiveson', 'Figueiredo', 'Deus da Guerra', 'Brazil', 'Bantamweight', 'Male', 5, false, { wins: 24, losses: 3, draws: 0 }),
  createFighter('bw-6', 'Song', 'Yadong', 'Kung Fu Monkey', 'China', 'Bantamweight', 'Male', 6, false, { wins: 21, losses: 8, draws: 0 }),
  createFighter('bw-7', 'Umar', 'Nurmagomedov', '', 'Russia', 'Bantamweight', 'Male', 7, false, { wins: 18, losses: 0, draws: 0 }),
  createFighter('bw-8', 'Rob', 'Font', '', 'USA', 'Bantamweight', 'Male', 8, false, { wins: 20, losses: 7, draws: 0 }),
  createFighter('bw-9', 'Mario', 'Bautista', 'El Guapo', 'USA', 'Bantamweight', 'Male', 9, false, { wins: 14, losses: 3, draws: 0 }),
  createFighter('bw-10', 'Henry', 'Cejudo', 'Triple C', 'USA', 'Bantamweight', 'Male', 10, false, { wins: 16, losses: 4, draws: 0 }),
  createFighter('bw-11', 'Jonathan', 'Martinez', 'Dragon', 'USA', 'Bantamweight', 'Male', 11, false, { wins: 19, losses: 5, draws: 0 }),
  createFighter('bw-12', 'Dominick', 'Cruz', 'The Dominator', 'USA', 'Bantamweight', 'Male', 12, false, { wins: 24, losses: 4, draws: 0 }),
  createFighter('bw-13', 'Kyler', 'Phillips', 'Matrix', 'USA', 'Bantamweight', 'Male', 13, false, { wins: 12, losses: 3, draws: 0 }),
  createFighter('bw-14', 'Marcus', 'McGhee', '', 'USA', 'Bantamweight', 'Male', 14, false, { wins: 10, losses: 1, draws: 0 }),
  createFighter('bw-15', 'Said', 'Nurmagomedov', '', 'Russia', 'Bantamweight', 'Male', 15, false, { wins: 18, losses: 2, draws: 0 }),
];

// UFC Flyweight Division
export const flyweightFighters: Fighter[] = [
  createFighter('flw-c', 'Alexandre', 'Pantoja', 'The Cannibal', 'Brazil', 'Flyweight', 'Male', undefined, true, { wins: 28, losses: 5, draws: 0 }),
  createFighter('flw-1', 'Brandon', 'Royval', 'Raw Dawg', 'USA', 'Flyweight', 'Male', 1, false, { wins: 16, losses: 7, draws: 0 }),
  createFighter('flw-2', 'Brandon', 'Moreno', 'The Assassin Baby', 'Mexico', 'Flyweight', 'Male', 2, false, { wins: 21, losses: 7, draws: 2 }),
  createFighter('flw-3', 'Amir', 'Albazi', 'The Prince', 'Iraq', 'Flyweight', 'Male', 3, false, { wins: 17, losses: 1, draws: 0 }),
  createFighter('flw-4', 'Kai', 'Kara-France', 'Dont Blink', 'New Zealand', 'Flyweight', 'Male', 4, false, { wins: 24, losses: 11, draws: 0 }),
  createFighter('flw-5', 'Manel', 'Kape', 'Starboy', 'Portugal', 'Flyweight', 'Male', 5, false, { wins: 20, losses: 7, draws: 0 }),
  createFighter('flw-6', 'Steve', 'Erceg', '', 'Australia', 'Flyweight', 'Male', 6, false, { wins: 13, losses: 2, draws: 0 }),
  createFighter('flw-7', 'Matheus', 'Nicolau', '', 'Brazil', 'Flyweight', 'Male', 7, false, { wins: 20, losses: 4, draws: 0 }),
  createFighter('flw-8', 'Muhammad', 'Mokaev', 'The Punisher', 'United Kingdom', 'Flyweight', 'Male', 8, false, { wins: 12, losses: 0, draws: 0 }),
  createFighter('flw-9', 'Tim', 'Elliott', '', 'USA', 'Flyweight', 'Male', 9, false, { wins: 19, losses: 13, draws: 0 }),
  createFighter('flw-10', 'Alex', 'Perez', '', 'USA', 'Flyweight', 'Male', 10, false, { wins: 24, losses: 8, draws: 0 }),
  createFighter('flw-11', 'Tagir', 'Ulanbekov', '', 'Russia', 'Flyweight', 'Male', 11, false, { wins: 16, losses: 2, draws: 0 }),
  createFighter('flw-12', 'Joshua', 'Van', '', 'Thailand', 'Flyweight', 'Male', 12, false, { wins: 12, losses: 1, draws: 0 }),
  createFighter('flw-13', 'David', 'Dvorak', '', 'Czech Republic', 'Flyweight', 'Male', 13, false, { wins: 22, losses: 6, draws: 0 }),
  createFighter('flw-14', 'CJ', 'Vergara', '', 'USA', 'Flyweight', 'Male', 14, false, { wins: 12, losses: 4, draws: 0 }),
  createFighter('flw-15', 'Asu', 'Almabayev', '', 'Kazakhstan', 'Flyweight', 'Male', 15, false, { wins: 20, losses: 2, draws: 0 }),
];

// Women's Strawweight Division
export const wStrawweightFighters: Fighter[] = [
  createFighter('wsw-c', 'Zhang', 'Weili', 'Magnum', 'China', "Women's Strawweight", 'Female', undefined, true, { wins: 24, losses: 3, draws: 0 }),
  createFighter('wsw-1', 'Tatiana', 'Suarez', '', 'USA', "Women's Strawweight", 'Female', 1, false, { wins: 10, losses: 0, draws: 0 }),
  createFighter('wsw-2', 'Rose', 'Namajunas', 'Thug', 'USA', "Women's Strawweight", 'Female', 2, false, { wins: 12, losses: 6, draws: 0 }),
  createFighter('wsw-3', 'Yan', 'Xiaonan', '', 'China', "Women's Strawweight", 'Female', 3, false, { wins: 17, losses: 4, draws: 0 }),
  createFighter('wsw-4', 'Amanda', 'Lemos', '', 'Brazil', "Women's Strawweight", 'Female', 4, false, { wins: 14, losses: 3, draws: 0 }),
  createFighter('wsw-5', 'Virna', 'Jandiroba', 'Carcara', 'Brazil', "Women's Strawweight", 'Female', 5, false, { wins: 20, losses: 3, draws: 0 }),
  createFighter('wsw-6', 'Jessica', 'Andrade', 'Bate Estaca', 'Brazil', "Women's Strawweight", 'Female', 6, false, { wins: 25, losses: 12, draws: 0 }),
  createFighter('wsw-7', 'Marina', 'Rodriguez', '', 'Brazil', "Women's Strawweight", 'Female', 7, false, { wins: 17, losses: 4, draws: 0 }),
  createFighter('wsw-8', 'Mackenzie', 'Dern', '', 'USA', "Women's Strawweight", 'Female', 8, false, { wins: 13, losses: 5, draws: 0 }),
  createFighter('wsw-9', 'Angela', 'Hill', 'Overkill', 'USA', "Women's Strawweight", 'Female', 9, false, { wins: 16, losses: 13, draws: 0 }),
  createFighter('wsw-10', 'Tabatha', 'Ricci', '', 'Brazil', "Women's Strawweight", 'Female', 10, false, { wins: 10, losses: 2, draws: 0 }),
  createFighter('wsw-11', 'Carla', 'Esparza', 'Cookie Monster', 'USA', "Women's Strawweight", 'Female', 11, false, { wins: 19, losses: 7, draws: 0 }),
  createFighter('wsw-12', 'Amanda', 'Ribas', '', 'Brazil', "Women's Strawweight", 'Female', 12, false, { wins: 13, losses: 4, draws: 0 }),
  createFighter('wsw-13', 'Loopy', 'Godinez', '', 'Mexico', "Women's Strawweight", 'Female', 13, false, { wins: 11, losses: 4, draws: 0 }),
  createFighter('wsw-14', 'Yazmin', 'Jauregui', '', 'Mexico', "Women's Strawweight", 'Female', 14, false, { wins: 11, losses: 1, draws: 0 }),
  createFighter('wsw-15', 'Luana', 'Pinheiro', 'Dread', 'Brazil', "Women's Strawweight", 'Female', 15, false, { wins: 12, losses: 3, draws: 0 }),
];

// Women's Flyweight Division
export const wFlyweightFighters: Fighter[] = [
  createFighter('wflw-c', 'Valentina', 'Shevchenko', 'Bullet', 'Kyrgyzstan', "Women's Flyweight", 'Female', undefined, true, { wins: 23, losses: 4, draws: 0 }),
  createFighter('wflw-1', 'Alexa', 'Grasso', '', 'Mexico', "Women's Flyweight", 'Female', 1, false, { wins: 16, losses: 4, draws: 1 }),
  createFighter('wflw-2', 'Manon', 'Fiorot', 'The Beast', 'France', "Women's Flyweight", 'Female', 2, false, { wins: 11, losses: 1, draws: 0 }),
  createFighter('wflw-3', 'Erin', 'Blanchfield', 'Cold Blooded', 'USA', "Women's Flyweight", 'Female', 3, false, { wins: 12, losses: 2, draws: 0 }),
  createFighter('wflw-4', 'Maycee', 'Barber', 'The Future', 'USA', "Women's Flyweight", 'Female', 4, false, { wins: 14, losses: 3, draws: 0 }),
  createFighter('wflw-5', 'Rose', 'Namajunas', 'Thug', 'USA', "Women's Flyweight", 'Female', 5, false, { wins: 12, losses: 6, draws: 0 }),
  createFighter('wflw-6', 'Jessica', 'Andrade', 'Bate Estaca', 'Brazil', "Women's Flyweight", 'Female', 6, false, { wins: 25, losses: 12, draws: 0 }),
  createFighter('wflw-7', 'Natalia', 'Silva', '', 'Brazil', "Women's Flyweight", 'Female', 7, false, { wins: 17, losses: 6, draws: 0 }),
  createFighter('wflw-8', 'Amanda', 'Ribas', '', 'Brazil', "Women's Flyweight", 'Female', 8, false, { wins: 13, losses: 4, draws: 0 }),
  createFighter('wflw-9', 'Taila', 'Santos', '', 'Brazil', "Women's Flyweight", 'Female', 9, false, { wins: 21, losses: 2, draws: 0 }),
  createFighter('wflw-10', 'Jennifer', 'Maia', '', 'Brazil', "Women's Flyweight", 'Female', 10, false, { wins: 21, losses: 10, draws: 0 }),
  createFighter('wflw-11', 'Karine', 'Silva', '', 'Brazil', "Women's Flyweight", 'Female', 11, false, { wins: 18, losses: 4, draws: 0 }),
  createFighter('wflw-12', 'Tracy', 'Cortez', '', 'USA', "Women's Flyweight", 'Female', 12, false, { wins: 11, losses: 2, draws: 0 }),
  createFighter('wflw-13', 'Viviane', 'Araujo', '', 'Brazil', "Women's Flyweight", 'Female', 13, false, { wins: 12, losses: 6, draws: 0 }),
  createFighter('wflw-14', 'Casey', "O'Neill", 'King', 'Australia', "Women's Flyweight", 'Female', 14, false, { wins: 10, losses: 2, draws: 0 }),
  createFighter('wflw-15', 'Miranda', 'Maverick', '', 'USA', "Women's Flyweight", 'Female', 15, false, { wins: 15, losses: 5, draws: 0 }),
];

// Women's Bantamweight Division
export const wBantamweightFighters: Fighter[] = [
  createFighter('wbw-c', 'Raquel', 'Pennington', 'Rocky', 'USA', "Women's Bantamweight", 'Female', undefined, true, { wins: 16, losses: 8, draws: 0 }),
  createFighter('wbw-1', 'Julianna', 'Pena', 'The Venezuelan Vixen', 'USA', "Women's Bantamweight", 'Female', 1, false, { wins: 12, losses: 5, draws: 0 }),
  createFighter('wbw-2', 'Kayla', 'Harrison', '', 'USA', "Women's Bantamweight", 'Female', 2, false, { wins: 17, losses: 1, draws: 0 }),
  createFighter('wbw-3', 'Mayra', 'Bueno Silva', '', 'Brazil', "Women's Bantamweight", 'Female', 3, false, { wins: 10, losses: 3, draws: 0 }),
  createFighter('wbw-4', 'Ketlen', 'Vieira', 'Fenomeno', 'Brazil', "Women's Bantamweight", 'Female', 4, false, { wins: 14, losses: 4, draws: 0 }),
  createFighter('wbw-5', 'Holly', 'Holm', 'The Preacher\'s Daughter', 'USA', "Women's Bantamweight", 'Female', 5, false, { wins: 15, losses: 7, draws: 0 }),
  createFighter('wbw-6', 'Macy', 'Chiasson', '', 'USA', "Women's Bantamweight", 'Female', 6, false, { wins: 10, losses: 3, draws: 0 }),
  createFighter('wbw-7', 'Irene', 'Aldana', 'Robles', 'Mexico', "Women's Bantamweight", 'Female', 7, false, { wins: 14, losses: 7, draws: 0 }),
  createFighter('wbw-8', 'Miesha', 'Tate', 'Cupcake', 'USA', "Women's Bantamweight", 'Female', 8, false, { wins: 20, losses: 9, draws: 0 }),
  createFighter('wbw-9', 'Norma', 'Dumont', '', 'Brazil', "Women's Bantamweight", 'Female', 9, false, { wins: 10, losses: 3, draws: 0 }),
  createFighter('wbw-10', 'Sara', 'McMann', '', 'USA', "Women's Bantamweight", 'Female', 10, false, { wins: 14, losses: 7, draws: 0 }),
  createFighter('wbw-11', 'Pannie', 'Kianzad', 'Banzai', 'Sweden', "Women's Bantamweight", 'Female', 11, false, { wins: 18, losses: 7, draws: 0 }),
  createFighter('wbw-12', 'Germaine', 'de Randamie', 'Iron Lady', 'Netherlands', "Women's Bantamweight", 'Female', 12, false, { wins: 10, losses: 5, draws: 0 }),
  createFighter('wbw-13', 'Karol', 'Rosa', '', 'Brazil', "Women's Bantamweight", 'Female', 13, false, { wins: 17, losses: 6, draws: 0 }),
  createFighter('wbw-14', 'Yana', 'Santos', '', 'Russia', "Women's Bantamweight", 'Female', 14, false, { wins: 14, losses: 5, draws: 0 }),
  createFighter('wbw-15', 'Ailin', 'Perez', '', 'Argentina', "Women's Bantamweight", 'Female', 15, false, { wins: 10, losses: 3, draws: 0 }),
];

// Women's Featherweight Division
export const wFeatherweightFighters: Fighter[] = [
  createFighter('wfw-1', 'Norma', 'Dumont', '', 'Brazil', "Women's Featherweight", 'Female', 1, false, { wins: 10, losses: 3, draws: 0 }),
  createFighter('wfw-2', 'Macy', 'Chiasson', '', 'USA', "Women's Featherweight", 'Female', 2, false, { wins: 10, losses: 3, draws: 0 }),
  createFighter('wfw-3', 'Germaine', 'de Randamie', 'Iron Lady', 'Netherlands', "Women's Featherweight", 'Female', 3, false, { wins: 10, losses: 5, draws: 0 }),
];

// Combine all fighters
export const allFighters: Fighter[] = [
  ...heavyweightFighters,
  ...lightHeavyweightFighters,
  ...middleweightFighters,
  ...welterweightFighters,
  ...lightweightFighters,
  ...featherweightFighters,
  ...bantamweightFighters,
  ...flyweightFighters,
  ...wStrawweightFighters,
  ...wFlyweightFighters,
  ...wBantamweightFighters,
  ...wFeatherweightFighters,
];

// Get fighters by weight class
export const getFightersByWeightClass = (weightClass: WeightClass): Fighter[] => {
  return allFighters.filter(f => f.weightClass === weightClass);
};

// Get fighters by organization
export const getFightersByOrganization = (org: string): Fighter[] => {
  return allFighters.filter(f => f.organization === org);
};
