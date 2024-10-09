"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react'
import confetti from 'canvas-confetti'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
const NUMBER_RANGES = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75]
]

type GameStats = {
  totalGames: number
  wins: number
  fastestWin: number | null
  averageWinTime: number | null
  longestGame: number
  shortestGame: number
  totalNumbersCalled: number
}

const initialGameStats: GameStats = {
  totalGames: 0,
  wins: 0,
  fastestWin: null,
  averageWinTime: null,
  longestGame: 0,
  shortestGame: Infinity,
  totalNumbersCalled: 0
}

const generateBoard = () => {
  const board = Array(5).fill(null).map(() => Array(5).fill(null))
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

const checkWin = (board: any[][]) => {
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

const saveGameState = (state: any) => {
  localStorage.setItem('bingoGameState', JSON.stringify(state))
}

const loadGameState = () => {
  const savedState = localStorage.getItem('bingoGameState')
  return savedState ? JSON.parse(savedState) : null
}

export default function BingoGame() {
  const [playerBoards, setPlayerBoards] = useState<any[][][]>([])
  const [currentNumber, setCurrentNumber] = useState<{ letter: string, number: number } | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [numBoards, setNumBoards] = useState(50)
  const [selectedBoards, setSelectedBoards] = useState<number[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [round, setRound] = useState(1)
  const [showScores, setShowScores] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>(initialGameStats)
  const [drawnNumbers, setDrawnNumbers] = useState<{ letter: string, number: number }[]>([])
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [availableNumbers, setAvailableNumbers] = useState<number[][]>([])
  const [numbersCalled, setNumbersCalled] = useState(0)

  const drawNumberRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'n' && !winner && gameStarted) {
        event.preventDefault()
        drawNumber()
      } else if (event.key === 'r' && winner) {
        event.preventDefault()
        startNewRound()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [winner, gameStarted])

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
      setGameStats(savedState.gameStats || initialGameStats)
      setDrawnNumbers(savedState.drawnNumbers || [])
      setGameStartTime(savedState.gameStartTime || null)
      setAvailableNumbers(savedState.availableNumbers || [])
      setNumbersCalled(savedState.numbersCalled || 0)
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
      setAvailableNumbers(NUMBER_RANGES.map(([min, max]) => 
        Array.from({ length: max - min + 1 }, (_, index) => min + index)
      ))
      setNumbersCalled(0)
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
        gameStats,
        drawnNumbers,
        gameStartTime,
        availableNumbers,
        numbersCalled
      })
    }
  }, [playerBoards, currentNumber, winner, scores, numBoards, selectedBoards, gameStarted, round, gameStats, drawnNumbers, gameStartTime, availableNumbers, numbersCalled])

  const playSound = useCallback((soundName: string) => {
    if (soundEnabled) {
      const audio = new Audio(`/sounds/${soundName}.mp3`)
      audio.play().catch(error => console.error('Error playing sound:', error))
    }
  }, [soundEnabled])

  const drawNumber = useCallback(() => {
    if (winner) return

    // Verificar si quedan números disponibles
    const remainingNumbers = availableNumbers.flat().length
    if (remainingNumbers === 0) {
      alert("No quedan más números disponibles. Inicie una nueva ronda.")
      return
    }

    // Seleccionar una columna aleatoria que aún tenga números disponibles
    let columnIndex
    do {
      columnIndex = Math.floor(Math.random() * 5)
    } while (availableNumbers[columnIndex].length === 0)

    // Seleccionar un número aleatorio de la columna seleccionada
    const numberIndex = Math.floor(Math.random() * availableNumbers[columnIndex].length)
    const newNumber = availableNumbers[columnIndex][numberIndex]

    // Actualizar el estado
    setCurrentNumber({ letter: BINGO_LETTERS[columnIndex], number: newNumber })
    setDrawnNumbers(prev => [...prev, { letter: BINGO_LETTERS[columnIndex], number: newNumber }])
    setAvailableNumbers(prev => {
      const newAvailable = [...prev]
      newAvailable[columnIndex] = newAvailable[columnIndex].filter(n => n !== newNumber)
      return newAvailable
    })
    setNumbersCalled(prev => prev + 1)

    playSound('number-drawn')

    setPlayerBoards(prevBoards => {
      const updatedBoards = prevBoards.map(board =>
        board.map((column, colIndex) =>
          column.map(cell => {
            if (colIndex === columnIndex && cell.number === newNumber) {
              playSound('number-marked')
              return { ...cell, marked: true }
            }
            return cell
          })
        )
      )

      updatedBoards.forEach((board, index) => {
        if (checkWin(board)) {
          const boardId = index + 1
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
          playSound('winner')
          const winTime = (Date.now() - (gameStartTime || 0)) / 1000
          setGameStats(prev => ({
            totalGames: prev.totalGames + 1,
            wins: prev.wins + 1,
            fastestWin: prev.fastestWin === null ? winTime : Math.min(prev.fastestWin, winTime),
            averageWinTime: prev.averageWinTime === null
              ? winTime
              : (prev.averageWinTime * prev.wins + winTime) / (prev.wins + 1),
            longestGame: Math.max(prev.longestGame, numbersCalled + 1),
            shortestGame: Math.min(prev.shortestGame, numbersCalled + 1),
            totalNumbersCalled: prev.totalNumbersCalled + numbersCalled + 1
          }))
        }
      })

      return updatedBoards
    })
  }, [winner, availableNumbers, drawnNumbers, gameStartTime, numbersCalled, playSound])

  const startNewRound = () => {
    setPlayerBoards(Array(numBoards).fill(null).map(() => generateBoard()))
    setCurrentNumber(null)
    setWinner(null)
    setRound(prevRound => prevRound + 1)
    setDrawnNumbers([])
    setGameStartTime(Date.now())
    setAvailableNumbers(NUMBER_RANGES.map(([min, max]) => 
      Array.from({ length: max - min + 1 }, (_, index) => min + index)
    ))
    setNumbersCalled(0)
    playSound('new-round')
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
    setAvailableNumbers([])
    setNumbersCalled(0)
    localStorage.removeItem('bingoGameState')
    playSound('game-reset')
  }

  const renderBoard = (board: any[][], index: number) => (
    <Card key={index} className="w-full">
      <CardHeader>
        <CardTitle className="text-center">
          Cartón {index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1" role="table" aria-label={`Cartón de Bingo ${index + 1}`}>
          {BINGO_LETTERS.map((letter, letterIndex) => (
            <div key={letter} className="text-center font-bold" role="columnheader">{letter}</div>
          ))}
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            board.map((column, colIndex) => (
              <motion.div
                key={`${colIndex}-${rowIndex}`}
                className={`aspect-square flex items-center justify-center border-2 rounded-md text-sm font-bold
                  ${column[rowIndex].marked ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}
                  ${selectedBoards.includes(index + 1) ? 'border-blue-500' : ''}`}
                initial={{ scale: 1 }}
                animate={{ scale: column[rowIndex].marked ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.3 }}
                role="cell"
                aria-label={`${BINGO_LETTERS[colIndex]}${column[rowIndex].number}, ${column[rowIndex].marked ? 'marcado' : 'no marcado'}`}
              >
                {column[rowIndex].number}
              </motion.div>
            ))
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderDrawnNumbers = () => (
    <Card>
      <CardHeader>
        <CardTitle>Números Sacados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {BINGO_LETTERS.map(letter => 
            <div key={letter} className="text-center font-bold">{letter}</div>
          )}
          {BINGO_LETTERS.map(letter => {
            const numbersForLetter = drawnNumbers
              .filter(dn => dn.letter === letter)
              .sort((a, b) => a.number - b.number);
            return (
              <div key={letter} className="flex flex-col items-center gap-2">
                {numbersForLetter.map((dn, index) => (
                  <motion.div
                    key={`${dn.letter}${dn.number}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
                  >
                    {dn.number}
                  </motion.div>
                ))}
              </div>
            );
          })}
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
                  aria-valuemin={1}
                  aria-valuemax={500}
                  aria-valuenow={numBoards}
                  aria-valuetext={`${numBoards} cartones`}
                />
                <p className="text-center mt-2" aria-live="polite">{numBoards} Cartones</p>
              </div>
              <div>
                <Label id="board-selection">Selecciona tus cartones:</Label>
                <ScrollArea className="h-[200px] mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2" role="group" aria-labelledby="board-selection">
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
                          aria-label={`Seleccionar Cartón ${boardNum}`}
                        />
                        <Label htmlFor={`board-${boardNum}`} className="text-sm">Cartón {boardNum}</Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Button
                onClick={() => setGameStarted(true)}
                className="w-full"
                disabled={selectedBoards.length === 0}
                aria-disabled={selectedBoards.length === 0}
              >
                Iniciar Juego
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={drawNumber}
                disabled={!!winner}
                size="lg"
                ref={drawNumberRef}
                aria-label="Sacar Número (Tecla N)"
              >
                Sacar Número (N)
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
              <Button
                onClick={startNewRound}
                disabled={!winner}
                size="lg"
                aria-label="Nueva Ronda (Tecla R)"
              >
                Nueva Ronda (R)
              </Button>
              <Button onClick={resetGame} variant="outline" size="lg" aria-label="Reiniciar Juego">
                Reiniciar Juego
              </Button>
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant="ghost"
                size="icon"
                aria-label={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
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
              aria-live="assertive"
            >
              <p className="font-bold">¡{winner} ha ganado la ronda {round}!</p>
            </motion.div>
          )}
          <Tabs defaultValue="game" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="game">Juego</TabsTrigger>
              <TabsTrigger value="drawn-numbers">Números Sacados</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>
            <TabsContent value="game">
              <Card>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowScores(!showScores)}
                  role="button"
                  aria-expanded={showScores}
                  aria-controls="scores-content"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setShowScores(!showScores)
                    }
                  }}
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
                      id="scores-content"
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
                {playerBoards.map((board, index) => renderBoard(board, index))}
              </div>
            </TabsContent>
            <TabsContent value="drawn-numbers">
              {renderDrawnNumbers()}
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
                      <p className="font-semibold">Juego más largo: {gameStats.longestGame} números llamados</p>
                      <p className="font-semibold">Juego más corto: {gameStats.shortestGame === Infinity ? 'N/A' : `${gameStats.shortestGame} números llamados`}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Promedio de números llamados por juego: {
                        gameStats.totalGames > 0
                          ? (gameStats.totalNumbersCalled / gameStats.totalGames).toFixed(2)
                          : 'N/A'
                      }</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>Atajos de teclado: N - Sacar Número, R - Nueva Ronda (cuando hay un ganador)</p>
      </div>
    </div>
  )
}