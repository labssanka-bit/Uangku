/**
 * Peta nama ikon (string di DB) -> komponen lucide-react.
 * Dipakai untuk render ikon kategori secara dinamis.
 */
import {
  Wallet,
  Gift,
  TrendingUp,
  CirclePlus,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Tag,
  Coffee,
  Plane,
  Smartphone,
  Shirt,
  PiggyBank,
  Baby,
  PawPrint,
  Dumbbell,
  Fuel,
  type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  gift: Gift,
  'trending-up': TrendingUp,
  'circle-plus': CirclePlus,
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  home: Home,
  receipt: Receipt,
  'gamepad-2': Gamepad2,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  tag: Tag,
  coffee: Coffee,
  plane: Plane,
  smartphone: Smartphone,
  shirt: Shirt,
  'piggy-bank': PiggyBank,
  baby: Baby,
  'paw-print': PawPrint,
  dumbbell: Dumbbell,
  fuel: Fuel,
}

/** Daftar nama ikon untuk picker saat buat kategori custom. */
export const ICON_NAMES = Object.keys(ICONS)

/** Ambil komponen ikon, fallback ke Tag bila tak dikenal. */
export function getIcon(name?: string | null): LucideIcon {
  return (name && ICONS[name]) || Tag
}

/** Pilihan warna pastel untuk kategori custom. */
export const COLOR_OPTIONS = [
  '#10b981', '#34d399', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f87171',
  '#f97316', '#f59e0b', '#eab308', '#84cc16', '#14b8a6',
  '#64748b',
]
