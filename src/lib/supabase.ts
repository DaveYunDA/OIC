// 引入 Supabase 官方 JS SDK 的 createClient 方法
import { createClient } from '@supabase/supabase-js'

// 从环境变量中读取 Supabase 项目的 URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// 从环境变量中读取 Supabase 匿名访问密钥
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建并导出 Supabase 客户端实例，供全局使用
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
