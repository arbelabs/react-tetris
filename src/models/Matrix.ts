/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as _ from "lodash";
import Constants from '../constants';
import { Piece, Rotation, getBlocks, isRotation } from './Piece';

const { GAME_HEIGHT, GAME_WIDTH } = Constants;

export { Piece };
export type Coords = {
  x: number;
  y: number;
};

const serializeCoords = ({ x, y }: Coords): string => `${x},${y}`;

// Two-dimensional array
// First dimension is height. Second is width.
export type Matrix = Array<Array<Piece | 'ghost' | null>>;

export function buildMatrix(): Matrix {
  const matrix = new Array(GAME_HEIGHT);
  for (let y = 0; y < matrix.length; y++) {
    matrix[y] = buildGameRow();
  }
  return matrix;
}

function buildGameRow(): Array<null> {
  return new Array(GAME_WIDTH).fill(null);
}

export const addPieceToBoard = (
  matrix: Matrix,
  positionedPiece: PositionedPiece,
  isGhost = false
): Matrix => {
  const { piece, rotation, position } = positionedPiece;
  const block = getBlocks(piece)[rotation];

  if (!block) {
    throw new Error(
      `Unexpected: no rotation ${rotation} found to piece ${piece}`
    );
  }

  const filledCells = block.reduce<Array<Coords | false>>(
    (output, row, y) =>
      output.concat(
        row.map((cell, x) =>
          cell ? { x: x + position.x, y: y + position.y } : false
        )
      ),
    []
  );

  const filled: Set<string> = new Set(
    filledCells
      .map((value) => (value ? serializeCoords(value) : ''))
      .filter(Boolean)
  );

  const value = isGhost ? 'ghost' : piece;

  return matrix.map((row, y) =>
    row.map((cell, x) => {
      return filled.has(serializeCoords({ x, y })) ? value : cell;
    })
  );
};

export type PositionedPiece = {
  piece: Piece;
  rotation: Rotation;
  position: Coords;
};

export function setPiece(
  matrix: Matrix,
  positionedPiece: PositionedPiece
): [Matrix, number] {
  const _matrix = addPieceToBoard(matrix, positionedPiece);
  const linesCleared = clearIslands(_matrix);
  return [_matrix, linesCleared];
}

function clearIsland(matrix: Matrix, i: number, j: number, island_char: string): number {

  let height = matrix.length
  let width = matrix[0]!.length
  let numIslands = 0

  if (i >= 1 && matrix[i - 1]![j]! == island_char) {
    matrix[i - 1]![j] = null
    numIslands += 1
    numIslands += clearIsland(matrix, i - 1, j, island_char)
  }

  if (j >= 1 && matrix[i]![j - 1]! == island_char) {
    matrix[i]![j - 1] = null
    numIslands += 1
    numIslands += clearIsland(matrix, i, j - 1, island_char)
  }

  if (i < height - 1 && matrix[i + 1]![j]! == island_char) {
    matrix[i + 1]![j] = null
    numIslands += 1
    numIslands += clearIsland(matrix, i + 1, j, island_char)
  }

  if (j < width - 1 && matrix[i]![j + 1]! == island_char) {
    matrix[i]![j + 1] = null
    numIslands += 1
    numIslands += clearIsland(matrix, i, j + 1, island_char)
  }

  return numIslands
}

function clearIslands(matrix: Matrix): number {

  // console.log("MATRIX:", _matrix);

  let islandsCleared = 0;
  let _matrix = _.cloneDeep(matrix)

  for (let i = 0; i < _matrix.length; i++) {
    for (let j = 0; j < _matrix[0]!.length; j++) {

      if (_matrix[i]![j]! != null) {
        // Operate on deep copy so we don't clobber state
        let islandCount = clearIsland(_matrix, i, j, _matrix[i]![j]!)
        if (islandCount >= 10) {
          islandsCleared += islandCount
          // Operate on real copy, manipulate state this time
          clearIsland(matrix, i, j, matrix[i]![j]!)
        }
      }
    }
  }

  return islandsCleared;
}

export function isEmptyPosition(
  matrix: Matrix,
  positionedPiece: PositionedPiece
): boolean {
  const { piece, rotation, position } = positionedPiece;
  const blocks = getBlocks(piece)[rotation];

  for (let x = 0; x < Constants.BLOCK_WIDTH; x++) {
    for (let y = 0; y < Constants.BLOCK_HEIGHT; y++) {
      const block = blocks![y]![x];
      const matrixX = x + position.x;
      const matrixY = y + position.y;

      // might not be filled, ya know
      if (block) {
        // make sure it's on the matrix
        if (matrixX >= 0 && matrixX < GAME_WIDTH && matrixY < GAME_HEIGHT) {
          // make sure it's available
          if (!matrix[matrixY] || matrix![matrixY]![matrixX]) {
            // that square is taken by the matrix already
            return false;
          }
        } else {
          // there's a square in the block that's off the matrix
          return false;
        }
      }
    }
  }
  return true;
}

function assert(value: unknown): asserts value {
  if (!value) throw new Error('assertion failed');
}

function tryMove(move: (pp: PositionedPiece) => PositionedPiece) {
  return function (
    gameboard: Matrix,
    positionedPiece: PositionedPiece
  ): PositionedPiece | undefined {
    const updatedPiece = move(positionedPiece);

    if (isEmptyPosition(gameboard, updatedPiece)) {
      return updatedPiece;
    }

    return undefined;
  };
}

export const moveLeft = tryMove((positionedPiece: PositionedPiece) => {
  const newPosition = {
    ...positionedPiece.position,
    x: positionedPiece.position.x - 1
  };

  return { ...positionedPiece, position: newPosition };
});

export const moveRight = tryMove((positionedPiece: PositionedPiece) => {
  const newPosition = {
    ...positionedPiece.position,
    x: positionedPiece.position.x + 1
  };

  return { ...positionedPiece, position: newPosition };
});

export const moveDown = tryMove((positionedPiece: PositionedPiece) => {
  const newPosition = {
    ...positionedPiece.position,
    y: positionedPiece.position.y + 1
  };

  return { ...positionedPiece, position: newPosition };
});

export const flipClockwise = tryMove((positionedPiece: PositionedPiece) => {
  const rotation =
    ((positionedPiece.rotation ?? 0) + 1) % Constants.ROTATION_COUNT;
  assert(isRotation(rotation));
  return { ...positionedPiece, rotation };
});

export const flipCounterclockwise = tryMove(
  (positionedPiece: PositionedPiece) => {
    let rotation = (positionedPiece.rotation ?? 0) - 1;
    if (rotation < 0) rotation += Constants.ROTATION_COUNT;
    assert(isRotation(rotation));
    return { ...positionedPiece, rotation };
  }
);

export function hardDrop(
  gameboard: Matrix,
  positionedPiece: PositionedPiece
): PositionedPiece {
  const position = { ...positionedPiece.position };

  while (isEmptyPosition(gameboard, { ...positionedPiece, position })) {
    position.y += 1;
  }
  // at this point, we just found a non-empty position, so let's step back
  position.y -= 1;
  return { ...positionedPiece, position };
}
