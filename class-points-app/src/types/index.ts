/** 学生 */
export interface Student {
  id: string
  name: string
  studentNo: string
  class?: string
  createdAt: number
}

/** 积分记录（不可删除） */
export interface PointsRecord {
  id: string
  studentIds: string[]
  delta: number
  reason: string
  ruleId?: string
  at: number
  source: 'manual' | 'voice'
}

/** 预设规则 */
export interface PresetRule {
  id: string
  label: string
  defaultDelta: number
  defaultReason: string
}

/** 点名记录 */
export interface RollCallRecord {
  id: string
  studentId: string
  at: number
}

/** 宠物/道具 */
export interface PetItem {
  id: string
  name: string
  cost: number
  type: 'pet' | 'prop'
}

/** 学生拥有的宠物/道具 */
export interface StudentPet {
  id: string
  studentId: string
  itemId: string
  at: number
}

/** 成语 */
export interface Idiom {
  id: string
  text: string
  pinyin?: string
}

/** 接龙记录 */
export interface IdiomChainRecord {
  id: string
  studentId: string
  idiom: string
  prevIdiom: string
  at: number
  pointsAwarded?: number
}

/** 语音解析结果 */
export interface VoiceParseResult {
  studentNames: string[]
  delta: number
  reason: string
  raw: string
  confidence: 'high' | 'low' | 'incomplete'
}

/** 小组 */
export interface Group {
  id: string
  name: string
  description?: string
  createdAt: number
}

/** 小组成员 */
export interface GroupMember {
  id: string
  groupId: string
  studentId: string
  isLeader: boolean
  joinedAt: number
}

/** 小组积分记录 */
export interface GroupPointsRecord {
  id: string
  groupId: string
  delta: number
  reason: string
  at: number
  source: 'manual' | 'voice'
}
