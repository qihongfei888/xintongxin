import type { VoiceParseResult } from '../types'

/**
 * 解析自然语言积分指令，支持：
 * - 给张三加2分 主动答题
 * - 给李四减1分 纪律差
 * - 全班加3分 表现好
 * - 张三 王五 各加2分 答题
 * 兼容普通话、四川话、粤语常见说法（加/减分、加分/扣分）
 */
export function parseVoicePointsCommand(
  text: string,
  allNames: string[]
): VoiceParseResult {
  const raw = (text || '').trim()
  if (!raw) return { studentNames: [], delta: 0, reason: '', raw, confidence: 'incomplete' }

  let delta = 0
  let reason = ''
  const names: string[] = []

  // 归一化：加分/扣分 -> 加/减
  let t = raw
    .replace(/\s+/g, ' ')
    .replace(/加分/g, '加')
    .replace(/扣分/g, '减')
    .replace(/扣/g, '减')

  // 匹配 "加N分" 或 "减N分" 或 "加 N 分"
  const deltaMatch = t.match(/(?:加|减)\s*(\d+)\s*分?/)
  if (deltaMatch) {
    const num = parseInt(deltaMatch[1], 10)
    delta = t.includes('减') ? -num : num
  }

  // 原因：通常出现在「分」后面，取最后一段或引号内
  const afterFen = t.split(/分\s*/).slice(1).join(' ').trim()
  if (afterFen) reason = afterFen.split(/\s+/).slice(0, 5).join(' ').trim()
  const reasonInQuotes = t.match(/[「『"]([^」』"]+)[」』"]/)
  if (reasonInQuotes) reason = reasonInQuotes[1].trim()

  // 全班
  if (/全班|全体|大家|所有人/.test(t)) {
    return {
      studentNames: [...allNames],
      delta,
      reason: reason || '全班操作',
      raw,
      confidence: delta !== 0 ? 'high' : 'low'
    }
  }

  // 提取可能的人名：连续2-4个汉字，且不在关键词里
  const keywords = new Set('全班全体大家所有人加减分各'.split(''))
  const possibleNames = t.match(/[\u4e00-\u9fa5]{2,4}/g) || []
  for (const seg of possibleNames) {
    if (keywords.has(seg)) continue
    if (/^\d+$/.test(seg)) continue
    if (allNames.includes(seg)) names.push(seg)
  }

  // 去重并保持顺序
  const uniqueNames = Array.from(new Set(names))

  const hasDelta = delta !== 0
  const hasTarget = uniqueNames.length > 0 || /全班|全体|大家|所有人/.test(t)
  let confidence: 'high' | 'low' | 'incomplete' = 'low'
  if (hasDelta && hasTarget) confidence = uniqueNames.length > 0 || /全班|全体|大家|所有人/.test(t) ? 'high' : 'low'
  else if (!hasDelta || !hasTarget) confidence = 'incomplete'

  return {
    studentNames: uniqueNames.length > 0 ? uniqueNames : allNames.length > 0 && /全班|全体|大家|所有人/.test(t) ? allNames : [],
    delta,
    reason: reason || (hasDelta ? '语音操作' : ''),
    raw,
    confidence
  }
}
