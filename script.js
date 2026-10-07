// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready(); // Уведомляем Telegram, что приложение готово
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
let gameOver = true;
let isDealing = false;

let balance = 1000;
let currentBet = 50;

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'В', 'Д', 'К', 'Т'];

function selectBet(amount) {
    if (isDealing || !gameOver) return; // Ставку можно менять только между раундами
    
    currentBet = amount;
    const betEl = document.getElementById('current-bet');
    if (betEl) betEl.textContent = currentBet;

    document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    const activeChip = document.querySelector(`.chip-${amount}`);
    if (activeChip) activeChip.classList.add('active');
}

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
        
        div.innerHTML = `
            <div class="card-corner top-left">
                <span class="card-value">${card.value}</span>
                <span class="card-suit-small">${card.suit}</span>
            </div>
            <div class="card-center-suit">${card.suit}</div>
            <div class="card-corner bottom-right">
                <span class="card-value">${card.value}</span>
                <span class="card-suit-small">${card.suit}</span>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function updateUI() {
    renderHand(playerHand, 'player-cards');
    renderHand(dealerHand, 'dealer-cards');

    document.getElementById('player-score').textContent = calculateScore(playerHand);
    document.getElementById('dealer-score').textContent = calculateScore(dealerHand);
    document.getElementById('balance').textContent = balance;
}

async function startGame() {
    if (isDealing) return;

    if (balance < currentBet) {
        document.getElementById('status-message').textContent = 'Недостаточно фишек! Выберите меньшую ставку.';
        return;
    }

    // Списываем ставку
    balance -= currentBet;
    isDealing = true;
    gameOver = false;

    createDeck();
    playerHand = [];
    dealerHand = [];

    document.getElementById('status-message').textContent = 'Раздача карт...';
    document.getElementById('btn-hit').disabled = true;
    document.getElementById('btn-stand').disabled = true;

    updateUI();

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 1-я карта игроку
    playerHand.push(deck.pop());
    updateUI();
    await sleep(250);

    // 1-я карта дилеру
    dealerHand.push(deck.pop());
    updateUI();
    await sleep(250);

    // 2-я карта игроку
    playerHand.push(deck.pop());
    updateUI();
    await sleep(250);

    isDealing = false;

    const pScore = calculateScore(playerHand);
    if (pScore === 21 && playerHand.length === 2) {
        endGame('Блэкджек! Вы выиграли x2.5!', 2.5);
    } else if (pScore > 21) {
        endGame('Перебор! Вы проиграли.', 0);
    } else {
        document.getElementById('status-message').textContent = 'Ваш ход!';
        document.getElementById('btn-hit').disabled = false;
        document.getElementById('btn-stand').disabled = false;
    }
}

function hit() {
    if (gameOver || isDealing) return;
    playerHand.push(deck.pop());
    updateUI();

    if (calculateScore(playerHand) > 21) {
        endGame('Перебор! Вы проиграли.', 0);
    }
}

async function stand() {
    if (gameOver || isDealing) return;
    isDealing = true;

    document.getElementById('btn-hit').disabled = true;
    document.getElementById('btn-stand').disabled = true;
    document.getElementById('status-message').textContent = 'Дилер берет карты...';

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (calculateScore(dealerHand) < 17) {
        dealerHand.push(deck.pop());
        updateUI();
        await sleep(300);
    }

    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);

    isDealing = false;

    if (dScore > 21 || pScore > dScore) {
        endGame('Вы выиграли x2!', 2);
    } else if (dScore > pScore) {
        endGame('Дилер выиграл.', 0);
    } else {
        endGame('Ничья! Ставка возвращена.', 1);
    }
}

function endGame(message, multiplier) {
    gameOver = true;
    
    // Выплата выигрыша
    if (multiplier > 0) {
        balance += Math.floor(currentBet * multiplier);
    }

    document.getElementById('balance').textContent = balance;
    document.getElementById('status-message').textContent = message;
    document.getElementById('btn-hit').disabled = true;
    document.getElementById('btn-stand').disabled = true;

    // Если закончились фишки — даем бесплатные
    if (balance <= 0) {
        setTimeout(() => {
            balance = 500;
            document.getElementById('balance').textContent = balance;
            document.getElementById('status-message').textContent = 'Фишки закончились! Вам начислено 500 🪙';
        }, 1500);
    }
}
