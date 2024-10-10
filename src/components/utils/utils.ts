import { BingoBoard } from "../types/types"


export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
export const NUMBER_RANGES = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75]
] as const

export const generateBoard = (): BingoBoard => {
  const board: BingoBoard = Array(5).fill(null).map(() => Array(5).fill(null))
  for (let col = 0; col < 5; col++) {
    const [min, max] = NUMBER_RANGES[col]
    const availableNumbers = Array.from({ length: max - min + 1 }, (_, index) => min + index)
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        board[col][row] = { number: 'FREE', marked: true }
      } else {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length)
        const number = availableNumbers.splice(randomIndex, 1)[0]
        board[col][row] = { number, marked: false }
      }
    }
  }
  return board
}

export const checkWin = (board: BingoBoard): boolean => {
  // Verificar filas
  for (let row = 0; row < 5; row++) {
    if (board.every(column => column[row].marked)) return true;
  }

  // Verificar columnas
  for (let col = 0; col < 5; col++) {
    if (board[col].every(cell => cell.marked)) return true;
  }

  // Verificar diagonal principal
  if (board.every((column, index) => column[index].marked)) return true;

  // Verificar diagonal secundaria
  if (board.every((column, index) => column[4 - index].marked)) return true;

  return false;
}

export const saveGameState = (state: Record<string, unknown>): void => {
  localStorage.setItem('bingoGameState', JSON.stringify(state))
}

export const loadGameState = (): Record<string, unknown> | null => {
  const savedState = localStorage.getItem('bingoGameState')
  return savedState ? JSON.parse(savedState) : null
}