"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { themes } from '@/components/themes/themes'
import { GameTheme } from '@/components/types/types'


export default function Home() {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(themes.default)

  useEffect(() => {
    const savedTheme = localStorage.getItem('bingoTheme')
    if (savedTheme) {
      setCurrentTheme(JSON.parse(savedTheme))
    }
  }, [])

  const handleThemeChange = (themeName: string) => {
    const newTheme = themes[themeName as keyof typeof themes]
    setCurrentTheme(newTheme)
    localStorage.setItem('bingoTheme', JSON.stringify(newTheme))
  }

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center p-8 ${currentTheme.secondaryColor}`}>
      <Card className={`w-full max-w-md ${currentTheme.primaryColor} border-none shadow-lg`}>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-white">
            Bienvenido al Juego de Bingo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <Select onValueChange={handleThemeChange}>
            <SelectTrigger className={`w-[180px] ${currentTheme.accentColor} text-white`}>
              <SelectValue placeholder="Selecciona un tema" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(themes).map((themeName) => (
                <SelectItem key={themeName} value={themeName}>
                  {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/bingo-game" 
              className={`${currentTheme.accentColor} text-white py-3 px-6 rounded-full font-bold text-lg shadow-md hover:shadow-lg transition-all duration-300`}
            >
              Jugar Bingo
            </Link>
          </motion.div>
        </CardContent>
      </Card>
    </main>
  )
}