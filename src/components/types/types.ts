export type GameStats = {
    totalGames: number
    wins: number
    fastestWin: number | null
    averageWinTime: number | null
    longestGame: number
    shortestGame: number
    totalNumbersCalled: number
  }
  
  export type BingoCell = {
    number: number | 'FREE'
    marked: boolean
  }
  
  export type BingoBoard = BingoCell[][]
  
  export type GameTheme = {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    textColor: string
    borderColor: string
    cellBgColor: string
    cellTextColor: string
    selectedBorderColor: string
    selectedTextColor: string
  }