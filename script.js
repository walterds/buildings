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
let isDiscardMode = false;

// This duplicate function was causing a syntax error and has been removed.
// The correct initializeGame function is defined later in the script and handles
// the start of new rounds.

function drawCard() {
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer.hand.length >= 6) {
        alert("You cannot have more than 6 cards in your hand. You must discard first.");
        return;
    }
    if (deck.length > 0) {
        const card = deck.pop();
        currentPlayer.hand.push(card);
        updateAllUI();
        if (!checkEndOfRound()) nextTurn();
    } else {
        alert("The draw pile is empty.");
    }
}

function renderPlayerHand() {
    const playerHandContainer = document.getElementById('player-hand');
    playerHandContainer.innerHTML = '';
    const currentPlayer = players[currentPlayerIndex];

    if (!currentPlayer) return;

    document.getElementById('player-hand-title').textContent = `${currentPlayer.name}'s Hand`;

    if (currentPlayer.isBot) {
        currentPlayer.hand.forEach(() => {
            const cardElement = createAsciiCardBack();
            playerHandContainer.appendChild(cardElement);
        });
    } else {
        // Human player's hand
        currentPlayer.hand.forEach((card, index) => {
            const cardElement = createAsciiCard(card);
            if (isDiscardMode) {
                cardElement.classList.add('discard-mode');
                cardElement.onclick = () => handleCardClick(index);
            }
            playerHandContainer.appendChild(cardElement);
        });
    }
}

function createAsciiCardBack() {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.innerHTML = `
.-------.
|#######|
|#######|
|#######|
|#######|
|#######|
'-------'
    `;
    return cardElement;
}

function createAsciiCard(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    const suitSymbol = {
        'Oros': '●',
        'Copas': '♥',
        'Espadas': '♠',
        'Bastos': '♣'
    }[card.suit];

    cardElement.innerHTML = `
.-------.
| ${card.number.toString().padEnd(2)}    |
|       |
|   ${suitSymbol}   |
|       |
|    ${card.number.toString().padStart(2)} |
'-------'
    `;
    return cardElement;
}

// This function is no longer needed as building is handled by buildSpecificStructure
// function buildStructure() { ... }

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

    updateAllUI();
    alert(`${currentPlayer.name} built a ${structureName}!`);
}

function renderBuiltStructures() {
    const builtStructuresContainer = document.getElementById('built-structures');
    builtStructuresContainer.innerHTML = '';
    const currentPlayer = players[currentPlayerIndex];

    if (!currentPlayer) return;

    document.getElementById('built-structures-title').textContent = `${currentPlayer.name}'s Structures`;

    currentPlayer.structures.forEach(structure => {
        const structureElement = document.createElement('div');
        structureElement.className = 'structure';
        structureElement.innerHTML = `<h3>${structure.name} (${structure.points} pts)</h3>`;
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        structure.cards.forEach(card => {
            const cardElement = createAsciiCard(card);
            cardContainer.appendChild(cardElement);
        });
        structureElement.appendChild(cardContainer);
        builtStructuresContainer.appendChild(structureElement);
    });
}

function handleCardClick(cardIndex) {
    if (!isDiscardMode) return;

    const currentPlayer = players[currentPlayerIndex];
    currentPlayer.hand.splice(cardIndex, 1);

    isDiscardMode = false;
    document.getElementById('discard-card').classList.remove('active-mode');

    updateAllUI();
    if (!checkEndOfRound()) nextTurn();
}

function discardCard() {
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer.isBot || currentPlayer.hand.length === 0) {
        return; // Bots don't use this, and can't discard from empty hand
    }

    isDiscardMode = !isDiscardMode; // Toggle discard mode
    const discardButton = document.getElementById('discard-card');

    if (isDiscardMode) {
        alert("DISCARD MODE: Click a card in your hand to discard it. Click the discard button again to cancel.");
        discardButton.classList.add('active-mode');
    } else {
        discardButton.classList.remove('active-mode');
    }
    // Re-render the hand to add/remove click listeners and styles
    renderPlayerHand();
}

function useIntervention(targetPlayerIndex) {
    const currentPlayer = players[currentPlayerIndex];
    const interventionCardIndex = currentPlayer.hand.findIndex(card => card.number === 10);

    if (interventionCardIndex === -1) {
        if (!currentPlayer.isBot) alert("You do not have an intervention card (a 10).");
        return;
    }

    if (targetPlayerIndex === undefined) { // If target not provided by bot, prompt the human
        const targetOptions = players
            .map((p, i) => i !== currentPlayerIndex ? `${i}: ${p.name}` : null)
            .filter(Boolean)
            .join('\n');
        targetPlayerIndex = parseInt(prompt(`Who to target with your intervention card?\n${targetOptions}`), 10);
    }

    if (isNaN(targetPlayerIndex) || targetPlayerIndex < 0 || targetPlayerIndex >= players.length || targetPlayerIndex === currentPlayerIndex) {
        if (!currentPlayer.isBot) alert("Invalid target player.");
        return;
    }

    const interventionCard = currentPlayer.hand.splice(interventionCardIndex, 1)[0];
    const targetPlayer = players[targetPlayerIndex];
    const hasStructure = checkForAnyStructure(targetPlayer.hand);

    if (hasStructure) {
        alert(`${targetPlayer.name} has a structure! They must build it. ${currentPlayer.name} is blocked next turn.`);
        currentPlayer.blocked = true;
    } else {
        alert(`${targetPlayer.name} has no structure. They lose their next turn.`);
        targetPlayer.blocked = true;
    }

    updateAllUI();
    if (!checkEndOfRound()) nextTurn();
}

function checkForAnyStructure(hand) {
    return findFortress(hand) || findMarket(hand) || findTower(hand) || findHouse(hand);
}

function nextTurn() {
    const currentPlayer = players[currentPlayerIndex];

    // Enforce 6-card limit at the end of a turn.
    if (currentPlayer.hand.length > 6) {
        if (currentPlayer.isBot) {
            // Bot automatically discards the least valuable card.
            // Simple AI: discard the first card that's not a 10.
            let cardToDiscardIndex = currentPlayer.hand.findIndex(c => c.number !== 10);
            if (cardToDiscardIndex === -1) { // All cards are 10s
                cardToDiscardIndex = 0;
            }
            const discardedCard = currentPlayer.hand.splice(cardToDiscardIndex, 1)[0];
            console.log(`${currentPlayer.name} has more than 6 cards and must discard. Discarded ${discardedCard.number} of ${discardedCard.suit}.`);
            alert(`${currentPlayer.name} has more than 6 cards and discarded one.`);
            updateAllUI();
        } else {
            // For the human player, block and force a discard.
            alert("You have more than 6 cards. You must discard one to end your turn.");
            return; // Do not proceed to the next player's turn.
        }
    }

    let nextPlayerFound = false;
    let loopedOnce = false;

    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        if (currentPlayerIndex === 0 && loopedOnce) { // Looped through all players
            endRound(); // Or handle game state where no one can move
            return;
        }
        if(currentPlayerIndex === players.length -1) loopedOnce = true;

        if (!players[currentPlayerIndex].blocked) {
            nextPlayerFound = true;
        } else {
            console.log(`${players[currentPlayerIndex].name} is blocked.`);
            players[currentPlayerIndex].blocked = false; // Unblock for their *next* turn
        }
    } while (!nextPlayerFound);

    document.getElementById('turn-indicator').textContent = `${players[currentPlayerIndex].name}'s Turn`;
    updateAllUI();

    if (players[currentPlayerIndex].isBot) {
        setGameActionsDisabled(true);
        alert(`It is now ${players[currentPlayerIndex].name}'s turn.`);
        setTimeout(playBotTurn, 1500);
    } else {
        setGameActionsDisabled(false);
        alert(`It is now ${players[currentPlayerIndex].name}'s turn.`);
    }
}

function playBotTurn() {
    const bot = players[currentPlayerIndex];
    console.log(`${bot.name} is thinking...`);

    // 1. Try to build a structure (highest value first)
    const fortress = findFortress(bot.hand);
    if (fortress) {
        console.log(`${bot.name} builds a Fortress.`);
        build(fortress, 'Fortress', 4);
        if (!checkEndOfRound()) nextTurn();
        return;
    }
    const market = findMarket(bot.hand);
    if (market) {
        console.log(`${bot.name} builds a Market.`);
        build(market, 'Market', 3);
        if (!checkEndOfRound()) nextTurn();
        return;
    }
    const tower = findTower(bot.hand);
    if (tower) {
        console.log(`${bot.name} builds a Tower.`);
        build(tower, 'Tower', 2);
        if (!checkEndOfRound()) nextTurn();
        return;
    }
    const house = findHouse(bot.hand);
    if (house) {
        console.log(`${bot.name} builds a House.`);
        build(house, 'House', 1);
        if (!checkEndOfRound()) nextTurn();
        return;
    }

    // 2. Try to use an intervention card
    if (bot.hand.some(card => card.number === 10)) {
        let targetPlayerIndex = -1;
        let highestScore = -1;
        players.forEach((p, i) => {
            if (i !== currentPlayerIndex && p.score > highestScore) {
                highestScore = p.score;
                targetPlayerIndex = i;
            }
        });
        if (targetPlayerIndex !== -1) {
            console.log(`${bot.name} uses an intervention card on ${players[targetPlayerIndex].name}.`);
            useIntervention(targetPlayerIndex); // This function now handles the turn change
            return;
        }
    }

    // 3. Draw a card if hand is not full
    if (bot.hand.length < 6 && deck.length > 0) {
        console.log(`${bot.name} draws a card.`);
        const card = deck.pop();
        bot.hand.push(card);
        updateAllUI();
        if (!checkEndOfRound()) nextTurn();
        return;
    }

    // 4. Discard a card (if no other action is possible, this is the default)
    if (bot.hand.length > 0) {
        let cardToDiscardIndex = bot.hand.findIndex(c => c.number !== 10);
        if (cardToDiscardIndex === -1) cardToDiscardIndex = 0;
        const discardedCard = bot.hand.splice(cardToDiscardIndex, 1)[0];
        console.log(`${bot.name} discards ${discardedCard.number} of ${discardedCard.suit}.`);
        updateAllUI();
        if (!checkEndOfRound()) nextTurn();
        return;
    }

    // If bot can do nothing (e.g., empty hand, empty deck), pass the turn
    console.log(`${bot.name} has no actions to take.`);
    nextTurn();
}

function initializeGame(numPlayers, startingPlayerIndex = 0) {
    createDeck();
    shuffleDeck();
    const newHands = dealCards(numPlayers, 5);

    players.forEach((player, index) => {
        player.hand = newHands[index];
        player.structures = [];
        player.blocked = false;
    });

    currentPlayerIndex = startingPlayerIndex;
    document.getElementById('turn-indicator').textContent = `${players[currentPlayerIndex].name}'s Turn`;
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

    alert(`${winner.name} wins the game with ${winner.score} points!`);

    // Disable all game actions now that the game is over
    setGameActionsDisabled(true);

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
        playerScore.textContent = `${player.name}: ${player.score} points`;
        scoreboard.appendChild(playerScore);
    });
}

function updateAllUI() {
    renderPlayerHand();
    renderBuiltStructures();
    renderScoreboard();
    updateBuildButtons();
    updateDeckCount();
}

function updateDeckCount() {
    document.getElementById('deck-count').textContent = deck.length;
}

function updateBuildButtons() {
    const currentPlayer = players[currentPlayerIndex];
    const isHumanTurn = !currentPlayer.isBot;

    if (!isHumanTurn) {
        document.getElementById('build-house').disabled = true;
        document.getElementById('build-tower').disabled = true;
        document.getElementById('build-market').disabled = true;
        document.getElementById('build-fortress').disabled = true;
        return;
    }

    const hand = currentPlayer.hand;
    document.getElementById('build-house').disabled = !findHouse(hand);
    document.getElementById('build-tower').disabled = !findTower(hand);
    document.getElementById('build-market').disabled = !findMarket(hand);
    document.getElementById('build-fortress').disabled = !findFortress(hand);
}

function setGameActionsDisabled(disabled) {
    document.getElementById('draw-card').disabled = disabled;
    document.getElementById('discard-card').disabled = disabled;
    document.getElementById('use-intervention').disabled = disabled;
    // The build buttons are handled by updateBuildButtons, but we can also disable them here for safety.
    document.getElementById('build-house').disabled = disabled;
    document.getElementById('build-tower').disabled = disabled;
    document.getElementById('build-market').disabled = disabled;
    document.getElementById('build-fortress').disabled = disabled;
}

function buildSpecificStructure(structureType) {
    const currentPlayer = players[currentPlayerIndex];
    let cardsToBuild, structureName, points;

    switch (structureType) {
        case 'House':
            cardsToBuild = findHouse(currentPlayer.hand);
            structureName = 'House';
            points = 1;
            break;
        case 'Tower':
            cardsToBuild = findTower(currentPlayer.hand);
            structureName = 'Tower';
            points = 2;
            break;
        case 'Market':
            cardsToBuild = findMarket(currentPlayer.hand);
            structureName = 'Market';
            points = 3;
            break;
        case 'Fortress':
            cardsToBuild = findFortress(currentPlayer.hand);
            structureName = 'Fortress';
            points = 4;
            break;
    }

    if (cardsToBuild) {
        build(cardsToBuild, structureName, points);
        if (!checkEndOfRound()) {
            nextTurn();
        }
    } else {
        // This case should not be reachable if buttons are disabled correctly, but it's good for safety.
        alert(`You cannot build a ${structureName}.`);
    }
}

document.getElementById('draw-card').addEventListener('click', drawCard);
document.getElementById('discard-card').addEventListener('click', discardCard);
document.getElementById('use-intervention').addEventListener('click', useIntervention);

// New event listeners for specific build buttons
document.getElementById('build-house').addEventListener('click', () => buildSpecificStructure('House'));
document.getElementById('build-tower').addEventListener('click', () => buildSpecificStructure('Tower'));
document.getElementById('build-market').addEventListener('click', () => buildSpecificStructure('Market'));
document.getElementById('build-fortress').addEventListener('click', () => buildSpecificStructure('Fortress'));


function setupGame() {
    const playerName = prompt("Enter your name:", "Player 1");
    let numBots;
    do {
        numBots = parseInt(prompt("How many bots to play against? (1-3)", "1"), 10);
    } while (isNaN(numBots) || numBots < 1 || numBots > 3);

    const botNames = ['R2-D2', 'C-3PO', 'Data', 'HAL 9000', 'T-800'].sort(() => 0.5 - Math.random());

    const humanPlayer = {
        name: playerName,
        isBot: false,
        score: 0,
    };
    const botPlayers = Array.from({ length: numBots }, (_, i) => ({
        name: botNames[i],
        isBot: true,
        score: 0,
    }));

    players = [humanPlayer, ...botPlayers];
    // Initialize player-specific properties for the first round
    players.forEach((p,i) => {
        p.id = i;
        p.structures = [];
        p.hand = [];
        p.blocked = false;
    });


    initializeGame(players.length);
}

// Initialize the game
setupGame();