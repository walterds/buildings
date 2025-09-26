// Game logic will be implemented here.
console.log("Game script loaded.");

const SUITS = ['Oros', 'Copas', 'Espadas', 'Bastos'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let deck = [];

function createDeck() {
    deck = [];
    for (const suit of SUITS) {
        for (const number of NUMBERS) {
            deck.push({ suit, number });
        }
    }
    return deck;
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards(numPlayers, cardsPerPlayer) {
    const playersHands = Array(numPlayers).fill(null).map(() => []);
    for (let i = 0; i < cardsPerPlayer; i++) {
        for (let j = 0; j < numPlayers; j++) {
            if (deck.length > 0) {
                playersHands[j].push(deck.pop());
            }
        }
    }
    return playersHands;
}

let players = [];
let currentPlayerIndex = 0;

function initializeGame(numPlayers = 2) {
    createDeck();
    shuffleDeck();
    players = dealCards(numPlayers, 5).map((hand, index) => ({
        id: index,
        hand: hand,
        score: 0,
        structures: []
    }));
    renderPlayerHand();
    console.log("Game initialized with", numPlayers, "players.");
    console.log(players);
}

function drawCard() {
    if (deck.length > 0) {
        const currentPlayer = players[currentPlayerIndex];
        if (currentPlayer.hand.length < 7) {
            const card = deck.pop();
            currentPlayer.hand.push(card);
            renderPlayerHand();
        } else {
            alert("You cannot have more than 7 cards in your hand.");
        }
    } else {
        alert("The draw pile is empty.");
    }
}

function renderPlayerHand() {
    const playerHandContainer = document.getElementById('player-hand');
    playerHandContainer.innerHTML = '';
    const currentPlayer = players[currentPlayerIndex];

    if (!currentPlayer) return;

    currentPlayer.hand.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = `${card.number} of ${card.suit}`;
        playerHandContainer.appendChild(cardElement);
    });
}

function buildStructure() {
    const currentPlayer = players[currentPlayerIndex];
    // For simplicity, this function will automatically detect and build the first available structure.
    // A more advanced implementation would let the player choose which cards to use.

    // Check for Fortress: 3 consecutive cards of the same suit
    const fortress = findFortress(currentPlayer.hand);
    if (fortress) {
        build(fortress, 'Fortress', 4);
        return;
    }

    // Check for Market: 3 cards of the same number
    const market = findMarket(currentPlayer.hand);
    if (market) {
        build(market, 'Market', 3);
        return;
    }

    // Check for Tower: 4 cards of the same suit
    const tower = findTower(currentPlayer.hand);
    if (tower) {
        build(tower, 'Tower', 2);
        return;
    }

    // Check for House: 2 cards of the same number
    const house = findHouse(currentPlayer.hand);
    if (house) {
        build(house, 'House', 1);
        return;
    }

    alert("No structures can be built with your current hand.");
}

function findHouse(hand) {
    const counts = hand.reduce((acc, card) => {
        acc[card.number] = (acc[card.number] || 0) + 1;
        return acc;
    }, {});

    for (const number in counts) {
        if (counts[number] >= 2) {
            return hand.filter(card => card.number == number).slice(0, 2);
        }
    }
    return null;
}

function findMarket(hand) {
    const counts = hand.reduce((acc, card) => {
        acc[card.number] = (acc[card.number] || 0) + 1;
        return acc;
    }, {});

    for (const number in counts) {
        if (counts[number] >= 3) {
            return hand.filter(card => card.number == number).slice(0, 3);
        }
    }
    return null;
}

function findTower(hand) {
    const counts = hand.reduce((acc, card) => {
        acc[card.suit] = (acc[card.suit] || 0) + 1;
        return acc;
    }, {});

    for (const suit in counts) {
        if (counts[suit] >= 4) {
            return hand.filter(card => card.suit == suit).slice(0, 4);
        }
    }
    return null;
}

function findFortress(hand) {
    const suits = {};
    hand.forEach(card => {
        if (!suits[card.suit]) {
            suits[card.suit] = [];
        }
        suits[card.suit].push(card.number);
    });

    for (const suit in suits) {
        const numbers = suits[suit].sort((a, b) => a - b);
        if (numbers.length >= 3) {
            for (let i = 0; i <= numbers.length - 3; i++) {
                if (numbers[i+1] === numbers[i] + 1 && numbers[i+2] === numbers[i] + 2) {
                    const fortressCards = hand.filter(card => card.suit === suit && (card.number === numbers[i] || card.number === numbers[i+1] || card.number === numbers[i+2]));
                    return fortressCards.slice(0,3);
                }
            }
        }
    }
    return null;
}


function build(cards, structureName, points) {
    const currentPlayer = players[currentPlayerIndex];
    currentPlayer.structures.push({ name: structureName, points: points, cards: cards });
    currentPlayer.score += points;

    // Remove cards from hand
    cards.forEach(cardToRemove => {
        const index = currentPlayer.hand.findIndex(card => card.suit === cardToRemove.suit && card.number === cardToRemove.number);
        if (index > -1) {
            currentPlayer.hand.splice(index, 1);
        }
    });

    renderPlayerHand();
    renderBuiltStructures();
    alert(`You built a ${structureName}!`);
}

function renderBuiltStructures() {
    const builtStructuresContainer = document.getElementById('built-structures');
    builtStructuresContainer.innerHTML = '';
    const currentPlayer = players[currentPlayerIndex];

    if (!currentPlayer) return;

    currentPlayer.structures.forEach(structure => {
        const structureElement = document.createElement('div');
        structureElement.className = 'structure';
        structureElement.innerHTML = `<h3>${structure.name} (${structure.points} pts)</h3>`;
        structure.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = `${card.number} of ${card.suit}`;
            structureElement.appendChild(cardElement);
        });
        builtStructuresContainer.appendChild(structureElement);
    });
}

function discardCard() {
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer.hand.length > 0) {
        const cardToDiscard = prompt("Which card to discard? (Enter number then suit, e.g., '7 Oros')");
        if (cardToDiscard) {
            const [number, suit] = cardToDiscard.split(' ');
            const cardIndex = currentPlayer.hand.findIndex(c => c.number == number && c.suit === suit);
            if (cardIndex !== -1) {
                currentPlayer.hand.splice(cardIndex, 1);
                renderPlayerHand();
            } else {
                alert("Card not found in your hand.");
            }
        }
    } else {
        alert("Your hand is empty.");
    }
}

function useIntervention() {
    const currentPlayer = players[currentPlayerIndex];
    const interventionCardIndex = currentPlayer.hand.findIndex(card => card.number === 10);

    if (interventionCardIndex === -1) {
        alert("You do not have an intervention card (a 10).");
        return;
    }

    const targetPlayerIndex = parseInt(prompt(`Which player to target? (0-${players.length - 1})`), 10);
    if (isNaN(targetPlayerIndex) || targetPlayerIndex < 0 || targetPlayerIndex >= players.length || targetPlayerIndex === currentPlayerIndex) {
        alert("Invalid target player.");
        return;
    }

    const interventionCard = currentPlayer.hand.splice(interventionCardIndex, 1)[0];
    // The card is "burned" - effectively removed from the game for this round.

    const targetPlayer = players[targetPlayerIndex];
    const hasStructure = checkForAnyStructure(targetPlayer.hand);

    if (hasStructure) {
        alert(`Player ${targetPlayerIndex} has a structure! They must build it. You are blocked next turn.`);
        currentPlayer.blocked = true;
        // In a real game, we'd force the build. For now, we'll just notify.
    } else {
        alert(`Player ${targetPlayerIndex} has no structure. They lose their next turn.`);
        targetPlayer.blocked = true;
    }

    renderPlayerHand();
    nextTurn();
}

function checkForAnyStructure(hand) {
    return findFortress(hand) || findMarket(hand) || findTower(hand) || findHouse(hand);
}

function nextTurn() {
    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    } while (players[currentPlayerIndex].blocked);

    players[currentPlayerIndex].blocked = false; // Unblock for their actual turn

    document.getElementById('turn-indicator').textContent = `Player ${currentPlayerIndex + 1}'s Turn`;
    renderPlayerHand();
    renderBuiltStructures();
    alert(`It is now Player ${currentPlayerIndex + 1}'s turn.`);
}

function initializeGame(numPlayers = 2, startingPlayerIndex = 0) {
    createDeck();
    shuffleDeck();
    players = dealCards(numPlayers, 5).map((hand, index) => ({
        ...players[index], // Preserve scores across rounds
        id: index,
        hand: hand,
        structures: [],
        blocked: false
    }));

    if (players.some(p => p.score === undefined)) {
        players.forEach(p => p.score = 0);
    }


    currentPlayerIndex = startingPlayerIndex;
    document.getElementById('turn-indicator').textContent = `Player ${currentPlayerIndex + 1}'s Turn`;
    updateAllUI();
    console.log("Game initialized for a new round.");
}

function checkEndOfRound() {
    const currentPlayer = players[currentPlayerIndex];
    const uniqueStructures = new Set(currentPlayer.structures.map(s => s.name));

    if (deck.length === 0 || uniqueStructures.size === 4) {
        endRound();
        return true;
    }
    return false;
}

function endRound() {
    alert("Round over!");
    updateScores();
    renderScoreboard();

    if (checkForWinner()) {
        return; // Game over, do not start a new round
    }

    const nextStartingPlayer = (currentPlayerIndex + 1) % players.length;
    initializeGame(players.length, nextStartingPlayer);
}

function checkForWinner() {
    const playersWith25Plus = players.filter(p => p.score >= 25);

    if (playersWith25Plus.length === 0) {
        return false; // No winner yet
    }

    let winner = playersWith25Plus[0];

    if (playersWith25Plus.length > 1) {
        // Tie-breaker 1: Highest score
        const highestScore = Math.max(...playersWith25Plus.map(p => p.score));
        let tiedPlayers = playersWith25Plus.filter(p => p.score === highestScore);

        if (tiedPlayers.length > 1) {
            // Tie-breaker 2: More structures in the final round
            const mostStructures = Math.max(...tiedPlayers.map(p => p.structures.length));
            tiedPlayers = tiedPlayers.filter(p => p.structures.length === mostStructures);
            winner = tiedPlayers[0]; // If still tied, first player to reach the score wins
        } else {
            winner = tiedPlayers[0];
        }
    }

    alert(`Player ${winner.id + 1} wins the game with ${winner.score} points!`);
    // Disable game buttons
    document.getElementById('draw-card').disabled = true;
    document.getElementById('build-structure').disabled = true;
    document.getElementById('discard-card').disabled = true;
    document.getElementById('use-intervention').disabled = true;

    return true;
}

function updateScores() {
    // Scores are already updated when structures are built.
    // This function can be expanded if there are end-of-round bonuses.
    console.log("Final scores for the round:", players.map(p => p.score));
}

function renderScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = '';
    players.forEach(player => {
        const playerScore = document.createElement('div');
        playerScore.textContent = `Player ${player.id + 1}: ${player.score} points`;
        scoreboard.appendChild(playerScore);
    });
}

function updateAllUI() {
    renderPlayerHand();
    renderBuiltStructures();
    renderScoreboard();
}

document.getElementById('draw-card').addEventListener('click', () => {
    drawCard();
    if (!checkEndOfRound()) nextTurn();
});
document.getElementById('build-structure').addEventListener('click', () => {
    buildStructure();
    if (!checkEndOfRound()) nextTurn();
});
document.getElementById('discard-card').addEventListener('click', () => {
    discardCard();
    if (!checkEndOfRound()) nextTurn();
});
document.getElementById('use-intervention').addEventListener('click', () => {
    useIntervention();
    checkEndOfRound(); // Intervention doesn't automatically end the turn in the same way
});


// Initialize the game
initializeGame();