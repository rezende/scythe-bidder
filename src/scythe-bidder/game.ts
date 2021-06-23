import { Ctx } from "boardgame.io";
import {
  FACTIONS_IFA as FACTIONS,
  MATS_IFA as MATS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  SCYTHE_BIDDER,
} from "./constants";
import { bid } from "./moves";
import {
  CombinationWithBid,
  Faction,
  GameState,
  GameWithMinMaxPlayers,
  Mat,
} from "./types";

const matToIdx: { [key: string]: number } = {};
MATS.forEach((mat, idx) => {
  matToIdx[mat] = idx;
});

const endIf = (G: GameState) => {
  let endGame = true;
  for (const combination of G.combinations) {
    if (!combination.currentHolder) endGame = false;
  }
  if (endGame === true) return G.combinations;
};

const checkBannedCombos = (faction: Faction, mat: Mat) =>
  (faction === "Rusviet" && mat === "Industrial") ||
  (faction === "Crimea" && mat === "Patriotic");

/*
  orderCombos() takes in an array of faction/player mat combinations
  and returns them in  the order in which they will play. 
  The player mat with the lowest starting priority (represented 
  here by their index in the 'mats' array) goes first, then the 
  other combinations follow in clockwise order determined by the 
  placement of their faction on the board relative to
  the first player.
*/

const orderCombos = (combinations: Array<CombinationWithBid>) => {
  const firstCombo = combinations.reduce(
    (firstSoFar: CombinationWithBid | null, currentCombo) => {
      if (
        firstSoFar === null ||
        matToIdx[currentCombo.mat] < matToIdx[firstSoFar.mat]
      ) {
        return currentCombo;
      }
      return firstSoFar;
    },
    null
  );

  if (!firstCombo) {
    return combinations;
  }

  // Find the index of the faction that will go first
  const startingIdx = FACTIONS.findIndex(
    (faction) => faction === firstCombo.faction
  );

  const combosByFaction: { [key: string]: CombinationWithBid } = {};
  combinations.forEach((combo) => {
    combosByFaction[combo.faction] = combo;
  });

  // Iterate through factions starting with the one that goes first,
  // adding any combinations that are in play to the result
  const orderedCombos = [];
  for (let i = 0; i < FACTIONS.length; i++) {
    const currentFaction = FACTIONS[(startingIdx + i) % FACTIONS.length];
    if (combosByFaction[currentFaction]) {
      orderedCombos.push(combosByFaction[currentFaction]);
    }
  }
  return orderedCombos;
};

const setup = (ctx: Ctx, setupData: any) => {
  let combosValid = false;
  let gameCombinations: Array<CombinationWithBid> = [];
  while (combosValid === false) {
    combosValid = true;
    gameCombinations = [];
    let rejectMatCount = 0;

    const remainingFactions = setupData.factions.map((x: Faction) => x);
    const remainingMats = setupData.mats.map((x: Mat) => x);

    for (let i = 0; i < ctx.numPlayers; i++) {
      const idxF = Math.floor(Math.random() * remainingFactions.length);
      const idxM = Math.floor(Math.random() * remainingMats.length);
      const pickedFaction = remainingFactions.splice(idxF, 1)[0];
      const pickedPlayerMat = remainingMats.splice(idxM, 1)[0];

      gameCombinations.push({
        faction: pickedFaction as Faction,
        mat: pickedPlayerMat as Mat,
        currentBid: -1,
        currentHolder: null,
      });
    }
    for (const gameCombo of gameCombinations) {
      if (gameCombo.mat === "Industrial" || gameCombo.mat === "Patriotic") {
        rejectMatCount = rejectMatCount + 1;
      }
      if (checkBannedCombos(gameCombo.faction, gameCombo.mat) === true) {
        combosValid = false;
        break;
      }
    }
    // reject set of valid combos to make combo generation probability equal
    if (combosValid === true) {
      if (Math.random() < 0.1425 * rejectMatCount) {
        combosValid = false;
      }
    }
  }

  return {
    combinations: orderCombos(gameCombinations),
    players: {},
    endGame: false,
    gameLogger: ["Auction start!"],
  };
};

const getNextPlayer = (playerId: number, numPlayers: number) =>
  (playerId + 1) % numPlayers;

const hasMat = (
  playerId: number,
  combinations: Array<CombinationWithBid>,
  playOrder: string[]
) => {
  const player = playOrder[playerId];
  for (const c of combinations) {
    if (parseInt(c.currentHolder?.id) === parseInt(player)) {
      return true;
    }
  }
  return false;
};

const turn = {
  order: {
    first: (G: GameState, ctx: Ctx) => 0,
    next: (G: GameState, ctx: Ctx) => {
      let nextPlayerPos = getNextPlayer(ctx.playOrderPos, ctx.numPlayers);
      while (hasMat(nextPlayerPos, G.combinations, ctx.playOrder)) {
        nextPlayerPos = getNextPlayer(nextPlayerPos, ctx.numPlayers);
      }
      return nextPlayerPos;
    },
    playOrder: (G: GameState, ctx: Ctx) => ctx.random!.Shuffle(ctx.playOrder),
  },
};

const ScytheBidderGame: GameWithMinMaxPlayers = {
  name: SCYTHE_BIDDER,
  setup,
  moves: {
    bid,
  },
  endIf,
  turn,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,
};

export default ScytheBidderGame;
