/** 17 tema warna. CSS variable di src/themes.css (data-theme di <html>). */
export interface ThemeDef {
  id: string
  name: string
  /** warna swatch untuk picker (primary, accent) */
  primary: string
  accent: string
  bg: string
}

const mk = (id: string, name: string, h: number, s: number, ah: number, as: number): ThemeDef => ({
  id, name,
  primary: `hsl(${h} ${s}% 35%)`,
  accent: `hsl(${ah} ${as}% 54%)`,
  bg: `hsl(${h} ${Math.min(s, 28)}% 96.5%)`,
})

// Urut & nilai SAMA dengan gen_themes.cjs
export const THEMES: ThemeDef[] = [
  mk('maroon', 'Maroon Klasik', 345, 50, 340, 40),
  mk('rose', 'Rose Quartz', 342, 60, 330, 52),
  mk('cherry', 'Cherry Wine', 352, 62, 358, 50),
  mk('coral', 'Sunset Coral', 12, 70, 25, 60),
  mk('amber', 'Amber Senja', 35, 72, 45, 62),
  mk('mocha', 'Cokelat Mocha', 25, 38, 30, 30),
  mk('olive', 'Olive Hutan', 78, 42, 68, 36),
  mk('emerald', 'Emerald Hutan', 152, 52, 162, 44),
  mk('mint', 'Tosca Mint', 165, 46, 175, 40),
  mk('teal', 'Teal Laut', 184, 55, 192, 46),
  mk('sky', 'Langit Cerah', 202, 66, 196, 56),
  mk('sapphire', 'Sapphire', 222, 70, 226, 60),
  mk('indigo', 'Midnight Indigo', 243, 56, 252, 46),
  mk('lavender', 'Lavender Lembut', 255, 42, 268, 36),
  mk('ungu', 'Royal Ungu', 272, 52, 286, 46),
  mk('slate', 'Slate Pro', 215, 26, 220, 20),
  mk('graphite', 'Graphite Gelap', 220, 10, 220, 9),
]

export const DEFAULT_THEME = 'maroon'

/** Terapkan tema ke <html data-theme>. */
export function applyTheme(id: string) {
  if (typeof document === 'undefined') return
  const valid = THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME
  document.documentElement.setAttribute('data-theme', valid)
}
