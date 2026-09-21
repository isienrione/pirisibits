import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'
import { IS_IOS } from './platform.js'

// iOS App Store build collects no data and must not open a Supabase client.
export const supabase =
  !IS_IOS && env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey)
    : null

export const isSupabaseConfigured = () => Boolean(supabase)
