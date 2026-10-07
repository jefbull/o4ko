// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        const nameElement = document.getElementById('user-name');
        if (nameElement) {
            nameElement.textContent = `👤 ${user.first_name} ${user.last_name || ''}`.trim();
        }
    }
}

let deck = [];
let playerHand = [];
let dealerHand = [];
let gameOver = false;

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'В', 'Д', 'К', 'Т'];

function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let val of values) {
            deck.push({ suit: suit, value: val });
        }
    }
    deck.sort(() => Math.random() - 0.5);
}

function getCardValue(card) {
    if (['В', 'Д', 'К'].includes(card.value)) return 10;
    if (card.value === 'Т') return 11;
    return parseInt(card.value);
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;

    for (let card of hand) {
        score += getCardValue(card);
        if (card.value === 'Т') aces++;
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }

    return score;
}

function renderHand(hand, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    
    hand.forEach(card => {
        const div = document.createElement('div');
        const isRed = card.suit === '♥' || card.suit === '♦';
        div.className = 'card' + (isRed ? ' red' : '');
        div.textContent = card.value + card.suit;
        container.appendChild(div);
    });
}

function updateUI() {
    renderHand(playerHand, 'player-cards');
    renderHand(dealerHand, 'dealer-cards');

    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);

    document.getElementById('player-score').textContent = pScore;
    document.getElementById('dealer-score').textContent = dScore;

    if (pScore > 21) {
        endGame('Перебор! Вы проиграли.');
    } else if (pScore === 21 && playerHand.length === 2) {
        endGame('Блэкджек! Вы выиграли!');
    }
}

function startGame() {
    createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop()];
    gameOver = false;

    document.getElementById('status-message').textContent = 'Ваш ход!';
    document.getElementById('btn-hit').disabled = false;
    document.getElementById('btn-stand').disabled = false;

    updateUI();
}

function hit() {
    if (gameOver) return;
    playerHand.push(deck.pop());
    updateUI();
}

function stand() {
    if (gameOver) return;

    while (calculateScore(dealerHand) < 17) {
        dealerHand.push(deck.pop());
    }

    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);

    renderHand(dealerHand, 'dealer-cards');
    document.getElementById('dealer-score').textContent = dScore;

    if (dScore > 21 || pScore > dScore) {
        endGame('Вы выиграли!');
    } else if (dScore > pScore) {
        endGame('Дилер выиграл.');
    } else {
        endGame('Ничья!');
    }
}

function endGame(message) {
    gameOver = true;
    document.getElementById('status-message').textContent = message;
    document.getElementById('btn-hit').disabled = true;
    document.getElementById('btn-stand').disabled = true;
}
