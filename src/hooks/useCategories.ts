import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_CATEGORIES, DEMO_TRANSACTIONS } from '@/lib/demo'
import type { Category, TxType } from '@/types'

const KEY = ['categories']
const USAGE_KEY = ['category-usage']

/**
 * Ambil kategori milik user.
 * Default: kategori tersembunyi DIBUANG (untuk pemilih transaksi & anggaran).
 * Halaman Kategori memakai `includeHidden` agar user bisa menampilkannya lagi.
 */
export function useCategories(type?: TxType, includeHidden = false) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Category[]> => {
      if (isDemo()) return DEMO_CATEGORIES
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name')
      if (error) throw error
      return data as Category[]
    },
    select: (rows) => {
      let out = includeHidden ? rows : rows.filter((c) => !c.hidden)
      if (type) out = out.filter((c) => c.type === type)
      return out
    },
  })
}

/**
 * Berapa transaksi yang memakai tiap kategori → dipakai untuk memberi peringatan
 * jujur sebelum menghapus ("kategori ini dipakai 47 transaksi").
 */
export function useCategoryUsage() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...USAGE_KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Map<string, number>> => {
      const m = new Map<string, number>()
      const rows = isDemo()
        ? DEMO_TRANSACTIONS.map((t) => ({ category_id: t.category_id }))
        : await supabase
            .from('transactions')
            .select('category_id')
            .not('category_id', 'is', null)
            .then(({ data, error }) => {
              if (error) throw error
              return (data ?? []) as { category_id: string | null }[]
            })
      for (const r of rows) {
        if (r.category_id) m.set(r.category_id, (m.get(r.category_id) ?? 0) + 1)
      }
      return m
    },
  })
}

export interface CategoryInput {
  name: string
  icon: string
  color: string
  type: TxType
}

/** Buat / ubah / hapus / sembunyikan kategori. */
export function useCategoryMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  // Hapus kategori juga mengubah transaksi (category_id → null) & anggaran → segarkan semua
  const invalidate = () => qc.invalidateQueries()

  const create = useMutation({
    mutationFn: async (input: CategoryInput) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase
        .from('categories')
        .insert({ ...input, user_id: user!.id, is_default: false })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id: string }) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('categories').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  /** Sembunyikan / tampilkan kembali — merapikan daftar tanpa menyentuh riwayat. */
  const setHidden = useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('categories').update({ hidden }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove, setHidden }
}
