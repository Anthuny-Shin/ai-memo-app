import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 환경변수가 설정되지 않았습니다.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
