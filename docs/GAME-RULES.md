# Neon Signal — Game Rules

## Objective

Play five rounds and finish with the highest total score. Each round has six phases: Lock, Peek, Bluff, Challenge, Guess, and Reveal.

A room needs at least two players and supports up to eight active players. Spectators can watch without taking a player place.

## The six phases

1. **Lock:** Each player creates a secret three-digit code. Each digit must be 1–9; repeated digits are allowed. Keep the code private.
2. **Peek:** The game privately shows a player one digit from another player's code and its position (first, middle, or last). Use this information to help with guesses.
3. **Bluff:** Choose a supported clue statement about your own code. You may tell the truth, choose a false statement, or submit no clue.
4. **Challenge:** Each player may challenge one other player's clue, or skip. Do not challenge yourself.
5. **Guess:** Make up to three guesses against other players' codes. A guess must contain exactly three digits from 1–9.
6. **Reveal:** Secret codes and challenge outcomes are revealed, and the round's score changes are added to the total.

## Supported clues

The game uses exact, structured clue templates so that each statement can be checked against the secret code. A player selects the clue type and value from the controls; free-form text is not accepted.

- **First digit:** “My first digit is 7.”
- **Middle digit:** “My middle digit is 4.”
- **Last digit:** “My last digit is 2.”
- **Contains digit:** “My code contains the digit 4.”
- **Digit sum:** “The sum of my digits is 13.”

The examples above use the secret code `742`. A clue is true only when it accurately describes the player's locked code.

## Scoring

### Guessing

- +3 for each digit in the correct position.
- +1 for each correct digit in the wrong position.
- +5 additional points for an exact three-digit match.
- Up to three guesses per player per round.

An exact match therefore earns 14 points (3 × 3 points, plus the 5-point exact-match bonus). A digit is never counted more than once.

### Challenges and clues

- **+4** to a challenger who catches a false clue.
- **+4** to a challenger who catches a missing clue.
- **−3** to a player who challenges a clue that is true.
- **+2** to the author of a clue that is not successfully challenged.
- A blank clue earns no +2 clue bonus.

A false clue that is not successfully challenged can earn its author the +2 clue bonus. This is the bluffing reward: the player successfully avoids being caught. A true clue that is challenged unsuccessfully also earns the author the +2 clue bonus.

### Special rounds

- Rounds 1, 2, 4, and 5 use normal scoring.
- **Round 3 doubles every point change**, including guess points, clue bonuses, challenge rewards, and challenge penalties.
- **Round 5 is the final round.** The game announces “Last round,” displays `R5/5`, reveals the final codes, and declares the player with the highest total score as the winner.

## Spectators

A spectator joins with a room code using **Watch A Game**. Spectators can see the game phase, player list, scoreboard, reactions, and final standings. They do not submit guesses, clues, or challenges and do not count toward the eight-player limit.
