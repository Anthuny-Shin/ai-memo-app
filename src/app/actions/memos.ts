'use server'

import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { Memo, MemoFormData } from '@/types/memo'

type DbMemo = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

function toMemo(row: DbMemo): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listMemos(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('createdAt', { ascending: false })

  if (error) {
    throw new Error(`메모 목록 조회 실패: ${error.message}`)
  }

  return (data as DbMemo[]).map(toMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const now = new Date().toISOString()
  const newMemo = {
    id: uuidv4(),
    title: formData.title,
    content: formData.content,
    category: formData.category,
    tags: formData.tags,
    createdAt: now,
    updatedAt: now,
  }

  const { data, error } = await supabase
    .from('memos')
    .insert(newMemo)
    .select()
    .single()

  if (error) {
    throw new Error(`메모 생성 실패: ${error.message}`)
  }

  return toMemo(data as DbMemo)
}

export async function updateMemo(id: string, formData: MemoFormData): Promise<Memo> {
  const updatedFields = {
    title: formData.title,
    content: formData.content,
    category: formData.category,
    tags: formData.tags,
    updatedAt: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('memos')
    .update(updatedFields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`메모 수정 실패: ${error.message}`)
  }

  return toMemo(data as DbMemo)
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase.from('memos').delete().eq('id', id)

  if (error) {
    throw new Error(`메모 삭제 실패: ${error.message}`)
  }
}

export async function clearMemos(): Promise<void> {
  const { error } = await supabase.from('memos').delete().neq('id', '')

  if (error) {
    throw new Error(`메모 전체 삭제 실패: ${error.message}`)
  }
}
