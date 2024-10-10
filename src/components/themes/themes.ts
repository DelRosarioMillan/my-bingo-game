import { GameTheme } from "../types/types";


export const themes: Record<string, GameTheme> = {
  default: {
    primaryColor: 'bg-blue-500',
    secondaryColor: 'bg-blue-100',
    accentColor: 'bg-yellow-400',
    textColor: 'text-gray-800',
    borderColor: 'border-blue-500',
    cellBgColor: 'bg-white',
    cellTextColor: 'text-gray-800',
    selectedBorderColor: 'border-green-500',
    selectedTextColor: 'text-green-600'
  },
  dark: {
    primaryColor: 'bg-gray-800',
    secondaryColor: 'bg-gray-700',
    accentColor: 'bg-purple-500',
    textColor: 'text-gray-200',
    borderColor: 'border-gray-600',
    cellBgColor: 'bg-gray-600',
    cellTextColor: 'text-white',
    selectedBorderColor: 'border-purple-500',
    selectedTextColor: 'text-purple-400'
  },
  nature: {
    primaryColor: 'bg-green-600',
    secondaryColor: 'bg-green-100',
    accentColor: 'bg-yellow-400',
    textColor: 'text-green-800',
    borderColor: 'border-green-600',
    cellBgColor: 'bg-white',
    cellTextColor: 'text-green-800',
    selectedBorderColor: 'border-yellow-500',
    selectedTextColor: 'text-yellow-600'
  },
  pink: {
    primaryColor: 'bg-pink-500',
    secondaryColor: 'bg-pink-100',
    accentColor: 'bg-yellow-300',
    textColor: 'text-pink-800',
    borderColor: 'border-pink-500',
    cellBgColor: 'bg-white',
    cellTextColor: 'text-pink-800',
    selectedBorderColor: 'border-purple-500',
    selectedTextColor: 'text-purple-600'
  },
  ocean: {
    primaryColor: 'bg-blue-600',
    secondaryColor: 'bg-blue-100',
    accentColor: 'bg-teal-400',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-600',
    cellBgColor: 'bg-white',
    cellTextColor: 'text-blue-800',
    selectedBorderColor: 'border-teal-500',
    selectedTextColor: 'text-teal-600'
  },
  autumn: {
    primaryColor: 'bg-orange-600',
    secondaryColor: 'bg-orange-100',
    accentColor: 'bg-yellow-500',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-600',
    cellBgColor: 'bg-white',
    cellTextColor: 'text-orange-800',
    selectedBorderColor: 'border-red-500',
    selectedTextColor: 'text-red-600'
  }
}