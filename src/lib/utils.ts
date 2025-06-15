// 引入 clsx 用于条件 class 合并，twMerge 用于合并 Tailwind CSS 类名
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// cn 函数：合并多个 className，自动去重和合并 Tailwind CSS 冲突
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
