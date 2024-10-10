"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronUp, Volume2, VolumeX, CheckCircle2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import confetti from 'canvas-confetti'
import { themes } from '@/components/themes/themes'
import { GameStats, BingoBoard, GameTheme } from '@/components/types/types'
import { BINGO_LETTERS, checkWin, generateBoard, NUMBER_RANGES, loadGameState, saveGameState } from '@/components/utils/utils'


const initialGameStats: GameStats = {
  totalGames: 0,
  wins: 0,
  fastestWin: null,
  averageWinTime: null,
  longestGame: 0,
  shortestGame: Infinity,
  totalNumbersCalled: 0
}

export default function BingoGame() {
  const [playerBoards, setPlayerBoards] = useState<BingoBoard[]>([])
  const [currentNumber, setCurrentNumber] = useState<{ letter: string, number: number } | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [numBoards, setNumBoards] = useState(10)
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
  const [gameTheme, setGameTheme] = useState<GameTheme>(themes.default)
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('bingoTheme')
    if (savedTheme) {
      setGameTheme(JSON.parse(savedTheme))
    }
  }, [])

  const drawNumberRef = useRef<HTMLButtonElement>(null)

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
  }, [winner, availableNumbers, gameStartTime, numbersCalled, playSound])

  const startNewRound = useCallback(() => {
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
  }, [numBoards, playSound])

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
  }, [winner, gameStarted, drawNumber, startNewRound])

  useEffect(() => {
    const savedState = loadGameState()
    if (savedState) {
      setPlayerBoards(savedState.playerBoards as BingoBoard[] || [])
      setCurrentNumber(savedState.currentNumber as { letter: string, number: number } | null || null)
      setWinner(savedState.winner as string | null || null)
      setScores(savedState.scores as Record<string, number> || {})
      setNumBoards(savedState.numBoards  as number || 10)
      setSelectedBoards(savedState.selectedBoards as number[] || [])
      setGameStarted(savedState.gameStarted as boolean || false)
      setRound(savedState.round as number || 1)
      setGameStats(savedState.gameStats as GameStats || initialGameStats)
      setDrawnNumbers(savedState.drawnNumbers as { letter: string, number: number }[] || [])
      setGameStartTime(savedState.gameStartTime as number | null || null)
      setAvailableNumbers(savedState.availableNumbers as number[][] || [])
      setNumbersCalled(savedState.numbersCalled as number || 0)
      setGameTheme(savedState.gameTheme as GameTheme || themes.default)
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
        numbersCalled,
        gameTheme
      })
    }
  }, [playerBoards, currentNumber, winner, scores, numBoards, selectedBoards, gameStarted, round, gameStats, drawnNumbers, gameStartTime, availableNumbers, numbersCalled, gameTheme])

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

  const renderBoard = (board: BingoBoard, index: number) => (
    <Card 
      key={index} 
      className={`w-full ${gameTheme.secondaryColor} ${
        selectedBoards.includes(index + 1) 
          ? `${gameTheme.selectedBorderColor} border-4` 
          : `${gameTheme.borderColor} border-2`
      }`}
    >
      <CardHeader>
        <CardTitle className={`text-center ${
          selectedBoards.includes(index + 1) 
            ? gameTheme.selectedTextColor 
            : gameTheme.textColor
        } flex items-center justify-center`}>
          {selectedBoards.includes(index + 1) && (
            <CheckCircle2 className="w-5 h-5 mr-2" />
          )}
          Cartón {index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1" role="table" aria-label={`Cartón de Bingo ${index + 1}`}>
          {BINGO_LETTERS.map((letter) => (
            <div key={letter} className={`text-center font-bold ${gameTheme.textColor}`} role="columnheader">{letter}</div>
          ))}
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {board.map((column, colIndex) => (
                <motion.div
                  key={`${colIndex}-${rowIndex}`}
                  className={`aspect-square flex items-center justify-center border-2 rounded-md text-sm font-bold
                    ${column[rowIndex].marked ? gameTheme.accentColor : gameTheme.cellBgColor}
                    ${column[rowIndex].marked ? 'text-white' : gameTheme.cellTextColor}
                    ${selectedBoards.includes(index + 1) ? `${gameTheme.selectedBorderColor} border-2` : `${gameTheme.borderColor} border`}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: column[rowIndex].marked ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  role="cell"
                  aria-label={`${BINGO_LETTERS[colIndex]}${column[rowIndex].number}, ${column[rowIndex].marked ? 'marcado' : 'no marcado'}`}
                >
                  {column[rowIndex].number}
                </motion.div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderDrawnNumbers = () => (
    <Card className={`${gameTheme.secondaryColor} ${gameTheme.borderColor} border-2`}>
      <CardHeader>
        <CardTitle className={gameTheme.textColor}>Números Sacados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {BINGO_LETTERS.map(letter => 
            <div key={letter} className={`text-center font-bold ${gameTheme.textColor}`}>{letter}</div>
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
                    className={`w-10 h-10 rounded-full ${gameTheme.primaryColor} text-white flex items-center justify-center font-bold`}
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
    <div className={`container mx-auto p-4 min-h-screen ${gameTheme.secondaryColor}`}>
      <h1 className={`text-4xl font-bold mb-8 text-center ${gameTheme.textColor}`}>Juego de Bingo</h1>
      {!gameStarted ? (
        <Card className={`max-w-md mx-auto ${gameTheme.primaryColor} ${gameTheme.borderColor} border-2`}>
          <CardHeader>
            <CardTitle className="text-white">Configuración del Juego</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numBoards" className="text-white">Número de Cartones (10-100):</Label>
                <Slider
                  id="numBoards"
                  min={10}
                  max={100}
                  step={1}
                  value={[numBoards]}
                  onValueChange={(value) => setNumBoards(value[0])}
                  className="mt-2"
                  aria-valuemin={10}
                  aria-valuemax={100}
                  aria-valuenow={numBoards}
                  aria-valuetext={`${numBoards} cartones`}
                />
                <p className="text-center mt-2 text-white" aria-live="polite">{numBoards} Cartones</p>
              </div>
              <div>
                <Label id="board-selection" className="text-white">Selecciona tus cartones:</Label>
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
                        <Label htmlFor={`board-${boardNum}`} className="text-sm text-white">Cartón {boardNum}</Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <Label htmlFor="theme-select" className="text-white">Tema del juego:</Label>
                <Select
                  onValueChange={(value) => {
                    setGameTheme(themes[value as keyof typeof themes])
                  }}
                >
                  <SelectTrigger id="theme-select" className="w-full mt-2">
                    <SelectValue placeholder="Selecciona un tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Predeterminado</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="nature">Naturaleza</SelectItem>
                    <SelectItem value="pink">Rosa</SelectItem>
                    <SelectItem value="ocean">Océano</SelectItem>
                    <SelectItem value="autumn">Otoño</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setGameStarted(true)}
                className={`w-full ${gameTheme.accentColor} text-white`}
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
                className={gameTheme.primaryColor}
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
                    <Badge variant="secondary" className={`text-2xl px-4 py-2 ${gameTheme.accentColor} text-white`}>
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
                className={gameTheme.primaryColor}
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
              className={`${gameTheme.accentColor} border-l-4 border-yellow-500 text-white p-4 rounded`}
              role="alert"
              aria-live="assertive"
            >
              <p className="font-bold">¡{winner} ha ganado la ronda {round}!</p>
            </motion.div>
          )}
          <Tabs defaultValue="game" className="w-full">
            <TabsList className={`grid w-full grid-cols-3 ${gameTheme.primaryColor}`}>
              <TabsTrigger value="game" className="text-white">Juego</TabsTrigger>
              <TabsTrigger value="drawn-numbers" className="text-white">Números Sacados</TabsTrigger>
              <TabsTrigger value="stats" className="text-white">Estadísticas</TabsTrigger>
            </TabsList>
            <TabsContent value="game">
              <Card className={`${gameTheme.secondaryColor} ${gameTheme.borderColor} border-2`}>
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
                    <CardTitle className={gameTheme.textColor}>Puntuaciones (Ronda {round})</CardTitle>
                    {showScores ? <ChevronUp size={24} className={gameTheme.textColor} /> : <ChevronDown size={24} className={gameTheme.textColor} />}
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
                            <Badge key={key} variant="outline" className={`text-sm p-2 ${gameTheme.textColor}`}>
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
              <Card className={`${gameTheme.secondaryColor} ${gameTheme.borderColor} border-2`}>
                <CardHeader>
                  <CardTitle className={gameTheme.textColor}>Estadísticas del Juego</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className={`font-semibold ${gameTheme.textColor}`}>Total de juegos: {gameStats.totalGames}</p>
                      <p className={`font-semibold ${gameTheme.textColor}`}>Victorias: {gameStats.wins}</p>
                    </div>
                    <div>
                      <p className={`font-semibold ${gameTheme.textColor}`}>
                        Victoria más rápida: {
                          gameStats.fastestWin !== null
                            ? `${gameStats.fastestWin.toFixed(2)} segundos`
                            : 'N/A'
                        }
                      </p>
                      <p className={`font-semibold ${gameTheme.textColor}`}>
                        Tiempo promedio de victoria: {
                          gameStats.averageWinTime !== null
                            ? `${gameStats.averageWinTime.toFixed(2)} segundos`
                            : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className={`font-semibold ${gameTheme.textColor}`}>Juego más largo: {gameStats.longestGame} números llamados</p>
                      <p className={`font-semibold ${gameTheme.textColor}`}>Juego más corto: {gameStats.shortestGame === Infinity ? 'N/A' : `${gameStats.shortestGame} números llamados`}</p>
                    </div>
                    <div>
                      <p className={`font-semibold ${gameTheme.textColor}`}>Promedio de números llamados por juego: {
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
      <div className={`mt-8 text-center text-sm ${gameTheme.textColor}`}>
        <p>Atajos de teclado: N - Sacar Número, R - Nueva Ronda (cuando hay un ganador)</p>
      </div>
    </div>
  )
}