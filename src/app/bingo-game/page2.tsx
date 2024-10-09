"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronUp } from 'lucide-react'
import confetti from 'canvas-confetti'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
const NUMBER_RANGES = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75]
]

type GameMode = 'classic' | 'blackout' | 'corners' | 'four-corners'
type GameStats = {
  totalGames: number
  wins: number
  fastestWin: number | null
  averageWinTime: number | null
  mostFrequentNumbers: number[]
}

const generateBoard = () => {
  const board = []
  for (let i = 0; i < 5; i++) {
    const column = []
    const [min, max] = NUMBER_RANGES[i]
    const availableNumbers = Array.from({ length: max - min + 1 }, (_, index) => min + index)
    for (let j = 0; j < 5; j++) {
      if (i === 2 && j === 2) {
        column.push({ number: 'FREE', marked: true })
      } else {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length)
        const number = availableNumbers.splice(randomIndex, 1)[0]
        column.push({ number, marked: false })
      }
    }
    board.push(column)
  }
  return board
}

const checkWin = (board: any[][], mode: GameMode) => {
  switch (mode) {
    case 'classic':
      for (let i = 0; i < 5; i++) {
        if (board.every(column => column[i].marked)) return true
        if (board[i].every(cell => cell.marked)) return true
      }
      if (board.every((column, index) => column[index].marked)) return true
      if (board.every((column, index) => column[4 - index].marked)) return true
      return false
    case 'blackout':
      return board.every(column => column.every(cell => cell.marked))
    case 'corners':
      return board[0][0].marked && board[0][4].marked && board[4][0].marked && board[4][4].marked
    case 'four-corners':
      const corners = [
        board[0][0], board[0][4],
        board[4][0], board[4][4]
      ]
      return corners.filter(cell => cell.marked).length >= 4
    default:
      return false
  }
}

const saveGameState = (state: any) => {
  localStorage.setItem('bingoGameState', JSON.stringify(state))
}

const loadGameState = () => {
  const savedState = localStorage.getItem('bingoGameState')
  return savedState ? JSON.parse(savedState) : null
}

const initialGameStats: GameStats = {
  totalGames: 0,
  wins: 0,
  fastestWin: null,
  averageWinTime: null,
  mostFrequentNumbers: []
}

export default function BingoGame() {
  const [playerBoards, setPlayerBoards] = useState<any[][]>([])
  const [currentNumber, setCurrentNumber] = useState<{letter: string, number: number} | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [numBoards, setNumBoards] = useState(50)
  const [selectedBoards, setSelectedBoards] = useState<number[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [round, setRound] = useState(1)
  const [showScores, setShowScores] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [gameStats, setGameStats] = useState<GameStats>(initialGameStats)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)

  useEffect(() => {
    const savedState = loadGameState()
    if (savedState) {
      setPlayerBoards(savedState.playerBoards || [])
      setCurrentNumber(savedState.currentNumber || null)
      setWinner(savedState.winner || null)
      setScores(savedState.scores || {})
      setNumBoards(savedState.numBoards || 50)
      setSelectedBoards(savedState.selectedBoards || [])
      setGameStarted(savedState.gameStarted || false)
      setRound(savedState.round || 1)
      setGameMode(savedState.gameMode || 'classic')
      setGameStats(savedState.gameStats || initialGameStats)
      setDrawnNumbers(savedState.drawnNumbers || [])
      setGameStartTime(savedState.gameStartTime || null)
    }
  }, [])

  useEffect(() => {
    if (gameStarted) {
      const newPlayerBoards = Array(numBoards).fill(null).map(() => generateBoard())
      setPlayerBoards(newPlayerBoards)
      setScores(prevScores => {
        const newScores = { ...prevScores }
        for (let i = 1; i <= numBoards; i++) {
          if (!newScores[`carton${i}`]) newScores[`carton${i}`] = 0
        }
        return newScores
      })
      setDrawnNumbers([])
      setGameStartTime(Date.now())
    }
  }, [numBoards, gameStarted])

  useEffect(() => {
    if (gameStarted) {
      saveGameState({
        playerBoards,
        currentNumber,
        winner,
        scores,
        numBoards,
        selectedBoards,
        gameStarted,
        round,
        gameMode,
        gameStats,
        drawnNumbers,
        gameStartTime
      })
    }
  }, [playerBoards, currentNumber, winner, scores, numBoards, selectedBoards, gameStarted, round, gameMode, gameStats, drawnNumbers, gameStartTime])

  const drawNumber = () => {
    if (winner) return
    const columnIndex = Math.floor(Math.random() * 5)
    const [min, max] = NUMBER_RANGES[columnIndex]
    let newNumber
    do {
      newNumber = Math.floor(Math.random() * (max - min + 1)) + min
    } while (drawnNumbers.includes(newNumber))
    setCurrentNumber({ letter: BINGO_LETTERS[columnIndex], number: newNumber })
    setDrawnNumbers(prev => [...prev, newNumber])

    const markBoard = (board: any[][], boardId: number) => {
      const newBoard = board.map((column, colIndex) => 
        colIndex === columnIndex 
          ? column.map(cell => cell.number === newNumber ? { ...cell, marked: true } : cell)
          : column
      )
      if (checkWin(newBoard, gameMode)) {
        setWinner(`Cartón ${boardId}`)
        setScores(prevScores => ({
          ...prevScores,
          [`carton${boardId}`]: (prevScores[`carton${boardId}`] || 0) + 1
        }))
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        const winTime = (Date.now() - (gameStartTime || 0)) / 1000
        setGameStats(prev => ({
          totalGames: prev.totalGames + 1,
          wins: prev.wins + 1,
          fastestWin: prev.fastestWin === null ? winTime : Math.min(prev.fastestWin, winTime),
          averageWinTime: prev.averageWinTime === null
            ? winTime
            : (prev.averageWinTime * prev.wins + winTime) / (prev.wins + 1),
          mostFrequentNumbers: updateMostFrequentNumbers(prev.mostFrequentNumbers, drawnNumbers)
        }))
      }
      return newBoard
    }

    setPlayerBoards(playerBoards.map((board, index) => markBoard(board, index + 1)))
  }

  const updateMostFrequentNumbers = (prevFrequent: number[], newNumbers: number[]) => {
    const frequency: Record<number, number> = {}
    newNumbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1
    })
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1] || parseInt(a[0]) - parseInt(b[0]))
      .slice(0, 5)
      .map(([num]) => parseInt(num))
  }

  const startNewRound = () => {
    setPlayerBoards(Array(numBoards).fill(null).map(() => generateBoard()))
    setCurrentNumber(null)
    setWinner(null)
    setRound(prevRound => prevRound + 1)
    setDrawnNumbers([])
    setGameStartTime(Date.now())
  }

  const resetGame = () => {
    setPlayerBoards([])
    setCurrentNumber(null)
    setWinner(null)
    setScores({})
    setRound(1)
    setSelectedBoards([])
    setGameStarted(false)
    setShowScores(false)
    setDrawnNumbers([])
    setGameStartTime(null)
    setGameStats(initialGameStats)
    localStorage.removeItem('bingoGameState')
  }

  const renderBoard = (board: any[][], index: number) => (
    <Card key={index} className="w-full">
      <CardHeader>
        <CardTitle className="text-center">
          {selectedBoards.includes(index + 1) ? `Tu Cartón ${index + 1}` : `Cartón ${index + 1}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1">
          {BINGO_LETTERS.map((letter, letterIndex) => (
            <div key={letter} className="text-center font-bold">{letter}</div>
          ))}
          {board.flat().map((cell, cellIndex) => (
            <motion.div
              key={cellIndex}
              className={`aspect-square flex items-center justify-center border-2 rounded-md text-sm font-bold
                ${cell.marked ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}
              initial={{ scale: 1 }}
              animate={{ scale: cell.marked ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              {cell.number}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Juego de Bingo</h1>
      {!gameStarted ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Configuración del Juego</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numBoards">Número de Cartones (1-500):</Label>
                <Slider
                  id="numBoards"
                  min={1}
                  max={500}
                  step={1}
                  value={[numBoards]}
                  onValueChange={(value) => setNumBoards(value[0])}
                  className="mt-2"
                />
                <p className="text-center mt-2">{numBoards} Cartones</p>
              </div>
              <div>
                <Label htmlFor="gameMode">Modo de Juego:</Label>
                <Select value={gameMode} onValueChange={(value: GameMode) => setGameMode(value)}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Selecciona un modo de juego" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Clásico</SelectItem>
                    <SelectItem value="blackout">Blackout</SelectItem>
                    <SelectItem value="corners">Esquinas</SelectItem>
                    <SelectItem value="four-corners">Cuatro Esquinas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Selecciona tus cartones:</Label>
                <ScrollArea className="h-[200px] mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Array.from({ length: numBoards }, (_, i) => i + 1).map((boardNum) => (
                      <div key={boardNum} className="flex items-center space-x-2">
                        <Checkbox
                          id={`board-${boardNum}`}
                          checked={selectedBoards.includes(boardNum)}
                          onCheckedChange={(checked) => {
                            setSelectedBoards(prev => 
                              checked 
                                ? [...prev, boardNum]
                                : prev.filter(num => num !== boardNum)
                            )
                          }}
                        />
                        <Label htmlFor={`board-${boardNum}`} className="text-sm">Cartón {boardNum}</Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Button onClick={() => setGameStarted(true)} className="w-full" disabled={selectedBoards.length === 0}>
                Iniciar Juego
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Button onClick={drawNumber} disabled={!!winner} size="lg">
                Sacar Número
              </Button>
              <AnimatePresence mode="wait">
                {currentNumber && (
                  <motion.div
                    key={`${currentNumber.letter}-${currentNumber.number}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Badge variant="secondary" className="text-2xl px-4 py-2">
                      {currentNumber.letter}-{currentNumber.number}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={startNewRound} disabled={!winner} size="lg">
                Nueva Ronda
              </Button>
              <Button onClick={resetGame} variant="outline" size="lg">
                Reiniciar Juego
              </Button>
            </div>
          </div>
          {winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded"
              role="alert"
            >
              <p className="font-bold">¡{winner} ha ganado la ronda {round}!</p>
            </motion.div>
          )}
          <Tabs defaultValue="game" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="game">Juego</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>
            <TabsContent value="game">
              <Card>
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => setShowScores(!showScores)}
                >
                  <div className="flex justify-between items-center">
                    <CardTitle>Puntuaciones (Ronda {round})</CardTitle>
                    {showScores ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {showScores && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {Object.entries(scores).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-sm p-2">
                              {key.replace('carton', 'Cartón ')}: {value || 0}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Render selected boards first */}
                {playerBoards
                  .filter((_, index) => selectedBoards.includes(index + 1))
                  .map((board, index) => renderBoard(board, selectedBoards[index] - 1))}
                {/* Render non-selected boards */}
                {playerBoards
                  .filter((_, index) => !selectedBoards.includes(index + 1))
                  .map((board, index) => {
                    const nonSelectedIndex = playerBoards.findIndex((_, i) => !selectedBoards.includes(i + 1));
                    return renderBoard(board, nonSelectedIndex + index);
                  })}
              </div>
            </TabsContent>
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas del Juego</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold">Total de juegos: {gameStats.totalGames}</p>
                      <p className="font-semibold">Victorias: {gameStats.wins}</p>
                    </div>
                    <div>
                      <p className="font-semibold">
                        Victoria más rápida: {
                          gameStats.fastestWin !== null
                            ? `${gameStats.fastestWin.toFixed(2)} segundos`
                            : 'N/A'
                        }
                      </p>
                      <p className="font-semibold">
                        Tiempo promedio de victoria: {
                          gameStats.averageWinTime !== null
                            ? `${gameStats.averageWinTime.toFixed(2)} segundos`
                            : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Números más frecuentes:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {gameStats.mostFrequentNumbers.map(num => (
                          <Badge key={num} variant="secondary">{num}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">Números sacados en esta ronda:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {drawnNumbers.map(num => (
                          <Badge key={num} variant="outline">{num}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}