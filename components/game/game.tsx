import { useGame } from "./api/useGame";
import { useMove } from "./api/useMove";
import { Cell, X, Y, Player, GameType } from "./types";
import { useCallback, useMemo, useEffect } from "react";
import cx from "classnames";
import { GameResponse } from "./api/types";

interface WithOnMove {
  onMove: (ci: X, ri: Y, currentPlayer: Player, gameType: GameType) => void;
}

interface CellProps extends WithOnMove {
  rowIndex: Y;
  columnIndex: X;
  player: Cell;
  available: boolean;
  playerOneName: Player;
  playerTwoName: Player;
  gameType: GameType;
}

const Cell = ({
  rowIndex,
  columnIndex,
  onMove,
  player,
  available,
  playerOneName,
  playerTwoName,
  gameType,
}: CellProps) => {
  const handleClick = useCallback(() => {
    onMove(columnIndex, rowIndex, playerOneName, gameType);
  }, [onMove, columnIndex, rowIndex]);
  return (
    <div
      data-testid={`cell-${hashCoords(columnIndex, rowIndex)}`}
      className={cx(
        "cell",
        {
          empty: !player,
        },
        player === playerOneName
          ? "red"
          : player === playerTwoName
          ? "yellow"
          : null,
        !available && !player && "unavailable"
      )}
      onClick={handleClick}
    />
  );
};

export const hashCoords = (x: X, y: Y) => `x:${x}:y:${y}`;

export const Board = ({
  onMove,
  game,
}: WithOnMove & {
  game: GameResponse;
}) => {
  const possibleCoords = game.possibleCoords;
  const possibleCoordsSet = useMemo(
    () => new Set(possibleCoords.map(({ x, y }) => hashCoords(x, y))),
    [possibleCoords]
  );
  const isPossible = useCallback(
    (x: X, y: Y) => possibleCoordsSet.has(hashCoords(x, y)),
    [possibleCoordsSet]
  );
  const handleOnMove = useCallback(
    (x: X, y: Y) => {
      if (!possibleCoords.find(({ x: px, y: py }) => px === x && py === y))
        return; // TODO left/right computation
      onMove(x, y, game.currentPlayer, game.gameType);
    },
    [possibleCoords, onMove]
  );

  const randomMove = useCallback(() => {
    const random = Math.floor(Math.random() * possibleCoords.length);
    const randomCoord = possibleCoords[random];
    onMove(randomCoord.x, randomCoord.y, game.currentPlayer, game.gameType);
  }, [possibleCoords, onMove]);

  useEffect(() => {
    if (game.currentPlayer === "machine") {
      randomMove();
    }
  }, [game.currentPlayer]);

  return (
    <div className="board">
      {Array.from(Array(game.field.length).keys()).map((ri) => (
        <div className="row" key={ri}>
          {Array.from(Array(game.field[0].length).keys()).map((ci) => {
            const x = ci as X;
            const y = ri as Y;
            return (
              <Cell
                key={hashCoords(x, y)}
                rowIndex={y}
                columnIndex={x}
                onMove={handleOnMove}
                player={game.field[ri][ci]}
                available={isPossible(x, y)}
                playerOneName={game.playerOneName}
                playerTwoName={game.playerTwoName}
                gameType={game.gameType}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const useOnMove = () => {
  const { mutate: makeMove, error } = useMove();
  return [
    useCallback(
      (x: X, y: Y, currentPlayer: Player, gameType: GameType) => {
        makeMove(
          {
            x,
            y,
          },
          currentPlayer,
          gameType
        );
      },
      [makeMove]
    ),
    error,
  ] as const;
};

export const Stacker = () => {
  const { game, isLoading } = useGame();
  const [handleOnMove] = useOnMove();
  if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>{error}</div>;
  if (!game) return <div>No game (platform PS?)</div>;
  return (
    <>
      {game.winner ? <div>Winner: {game.winner}</div> : null}
      <Board onMove={handleOnMove} game={game!} />
    </>
  );
};
