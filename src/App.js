import React, { useState } from "react";
import "./App.css";

export default function App() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

  const valueMap = ranks.reduce((acc, r, i) => {
    acc[r] = i + 1;
    return acc;
  }, {});

  function createDeck() {
    const deck = [];
    for (const s of suits) {
      for (const r of ranks) {
        deck.push({ suit: s, rank: r, value: valueMap[r], revealed: false });
      }
    }
    return deck;
  }

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function draw(deck, n) {
    const drawn = deck.slice(0, n);
    const remaining = deck.slice(n);
    return { drawn, remaining };
  }

  function getPairValue(hand) {
    const counts = {};
    for (const card of hand) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
      if (counts[card.rank] === 2) {
        return card.value;
      }
    }
    return null;
  }

  function getThirdCardValue(hand, pairRank) {
    for (const card of hand) {
      if (card.rank !== pairRank) {
        return card.value;
      }
    }
    return null;
  }

  const [deck, setDeck] = useState(() => shuffle(createDeck()));
  const [player1, setPlayer1] = useState([]);
  const [player2, setPlayer2] = useState([]);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  function deal() {
    let d = deck.slice();
    if (d.length < 6) {
      d = shuffle(createDeck());
    }

    const p1Cards = [];
    const p2Cards = [];

    setPlayer1([]);
    setPlayer2([]);
    setIsDealing(true);
    setWinner(null);
    setLastResult(null);

    function dealToPlayer(setPlayer, cards, count, next) {
      let i = 0;
      const interval = setInterval(() => {
        const result = draw(d, 1);
        d = result.remaining;
        const card = { ...result.drawn[0], revealed: false };
        cards.push(card);
        setPlayer([...cards]);

        setTimeout(() => {
          card.revealed = true;
          setPlayer([...cards]);
        }, 400);

        i++;
        if (i === count) {
          clearInterval(interval);
          next();
        }
      }, 800);
    }

    dealToPlayer(setPlayer1, p1Cards, 3, () => {
      dealToPlayer(setPlayer2, p2Cards, 3, () => {
        setDeck(d);

        setTimeout(() => {
          const p1PairValue = getPairValue(p1Cards);
          const p2PairValue = getPairValue(p2Cards);

          // 1. If one player has pair and other doesn't, pair wins
          if (p1PairValue && !p2PairValue) {
            setScore1((s) => s + 1);
            setWinner({ player: 1, type: "pair" });
            setLastResult({ winner: 1, reason: 'pair' });
          } else if (p2PairValue && !p1PairValue) {
            setScore2((s) => s + 1);
            setWinner({ player: 2, type: "pair" });
            setLastResult({ winner: 2, reason: 'pair' });
          } 
          // 2. If both have pairs, higher pair wins
          else if (p1PairValue && p2PairValue) {
            if (p1PairValue > p2PairValue) {
              setScore1((s) => s + 1);
              setWinner({ player: 1, type: "pair" });
              setLastResult({ winner: 1, reason: 'pair-high' });
            } else if (p2PairValue > p1PairValue) {
              setScore2((s) => s + 1);
              setWinner({ player: 2, type: "pair" });
              setLastResult({ winner: 2, reason: 'pair-high' });
            } else {
              // 3. If both have same pair value, higher 3rd card wins
              const p1PairRank = p1Cards.find(card => card.value === p1PairValue)?.rank;
              const p2PairRank = p2Cards.find(card => card.value === p2PairValue)?.rank;
              const p1ThirdCardValue = getThirdCardValue(p1Cards, p1PairRank);
              const p2ThirdCardValue = getThirdCardValue(p2Cards, p2PairRank);
              
              if (p1ThirdCardValue > p2ThirdCardValue) {
                setScore1((s) => s + 1);
                setWinner({ player: 1, type: "third-card" });
                setLastResult({ winner: 1, reason: 'third-card' });
              } else if (p2ThirdCardValue > p1ThirdCardValue) {
                setScore2((s) => s + 1);
                setWinner({ player: 2, type: "third-card" });
                setLastResult({ winner: 2, reason: 'third-card' });
              } else {
                setLastResult({ winner: null, reason: 'tie' });
              }
            }
          } 
          // 4. If no pairs, check cards sequentially
          else {
            let winnerFound = false;
            for (let i = 0; i < 3; i++) {
              if (p1Cards[i].value > p2Cards[i].value) {
                setScore1((s) => s + 1);
                setWinner({ player: 1, type: "cards" });
                setLastResult({ winner: 1, reason: `card-${i+1}` });
                winnerFound = true;
                break;
              } else if (p2Cards[i].value > p1Cards[i].value) {
                setScore2((s) => s + 1);
                setWinner({ player: 2, type: "cards" });
                setLastResult({ winner: 2, reason: `card-${i+1}` });
                winnerFound = true;
                break;
              }
            }
            if (!winnerFound) {
              setLastResult({ winner: null, reason: 'tie' });
            }
          }

          setIsDealing(false);
        }, 1000);
      });
    });
  }

  function resetGame() {
    setDeck(shuffle(createDeck()));
    setPlayer1([]);
    setPlayer2([]);
    setScore1(0);
    setScore2(0);
    setIsDealing(false);
    setWinner(null);
    setLastResult(null);
  }

  function renderCard(c, i) {
    const suitMap = {
      "♠": "spades",
      "♥": "hearts",
      "♦": "diamonds",
      "♣": "clubs",
    };

    const rankMap = {
      A: "ace",
      K: "king",
      Q: "queen",
      J: "jack",
      "10": "10",
      "9": "9",
      "8": "8",
      "7": "7",
      "6": "6",
      "5": "5",
      "4": "4",
      "3": "3",
      "2": "2",
    };

    const suitName = suitMap[c.suit];
    const rankName = rankMap[c.rank];
    const fileName = `${rankName}_of_${suitName}.png`;

    return React.createElement(
      "div",
      { 
        key: `${c.rank}${c.suit}-${i}`, 
        className: `card-flip ${c.revealed ? "revealed" : ""}` 
      },
      React.createElement("div", { className: "card-inner" }, [
        React.createElement("div", { className: "card-front", key: "front" },
          React.createElement("img", { src: "/cards/back.png", alt: "Card Back", className: "card-img" })
        ),
        React.createElement("div", { className: "card-back", key: "back" },
          React.createElement("img", { src: `/cards/${fileName}`, alt: `${c.rank} of ${c.suit}`, className: "card-img" })
        )
      ])
    );
  }

  return React.createElement(
    "div",
    { className: "container" },
    [
      React.createElement("h1", { key: "title" }, "Three Cards"),

      // Score display at the top
      React.createElement("div", { className: "score-display", key: "score-display" }, [
        React.createElement("div", { className: "score-box", key: "p1score" }, 
          `Score:   ${score1}`
        ),
        React.createElement("div", { className: "score-box", key: "p2score" }, 
          `Score:   ${score2}`
        )
      ]),

      lastResult && React.createElement(
        "div",
        { 
          className: `result-banner ${lastResult.winner ? `winner` : "tie"}`, 
          key: "result" 
        },
        lastResult.winner ? `Player ${lastResult.winner} wins!` : `Tie!`
      ),

      React.createElement("div", { className: "game-board", key: "game-board" }, [
        React.createElement("div", { className: "player-section", key: "p1" }, [
          React.createElement(
            "div",
            { className: "hand", key: "p1hand" },
            player1.length ? player1.map(renderCard) : React.createElement("div", { className: "empty-cards" }, "No cards")
          ),
          // Player label below cards 
          React.createElement("div", { className: "player-label", key: "p1label" }, "Player 1")
        ]),

        React.createElement("div", { className: "player-section", key: "p2" }, [
          React.createElement(
            "div",
            { className: "hand", key: "p2hand" },
            player2.length ? player2.map(renderCard) : React.createElement("div", { className: "empty-cards" }, "No cards")
          ),
          // Player label below cards 
          React.createElement("div", { className: "player-label", key: "p2label" }, "Player 2")
        ])
      ]),

      // Controls at the bottom
      React.createElement("div", { className: "controls", key: "controls" }, [
        React.createElement(
          "button",
          { 
            onClick: deal, 
            className: `draw-btn ${isDealing ? "dealing" : ""}`, 
            disabled: isDealing, 
            key: "draw" 
          },
          isDealing ? "Dealing..." : "Draw Cards"
        ),
        React.createElement(
          "button",
          { 
            onClick: resetGame, 
            className: "reset-btn", 
            disabled: isDealing, 
            key: "reset" 
          },
          "Reset"
        )
      ])
    ]
  );
}