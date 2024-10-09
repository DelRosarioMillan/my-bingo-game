import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-2">Bienvenido al Juego de Bingo</h1>
      <p className="text-2xl font-medium mb-8">Realizado por TSU. Del Rosario Johnangel</p>
      <Link href="/bingo-game" className="bg-slate-950 text-white py-2 px-4 rounded hover:bg-slate-700">
        Jugar Bingo
      </Link>
    </main>
  )
}