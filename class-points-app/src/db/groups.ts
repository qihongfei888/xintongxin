import { getDB, id } from './index'
import type { Group, GroupMember, GroupPointsRecord } from '../types'

export async function createGroup(name: string, description?: string): Promise<Group> {
  const db = await getDB()
  const group: Group = {
    id: id(),
    name,
    description,
    createdAt: Date.now()
  }
  await db.add('groups', group)
  return group
}

export async function listGroups(): Promise<Group[]> {
  const db = await getDB()
  return db.getAll('groups')
}

export async function getGroup(id: string): Promise<Group | undefined> {
  const db = await getDB()
  return db.get('groups', id)
}

export async function updateGroup(id: string, data: Partial<Pick<Group, 'name' | 'description'>>): Promise<void> {
  const db = await getDB()
  const group = await db.get('groups', id)
  if (!group) return
  await db.put('groups', { ...group, ...data })
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['groups', 'groupMembers', 'groupPointsRecords'], 'readwrite')
  await tx.objectStore('groupPointsRecords').index('by-group').openCursor(id).then(async (cursor) => {
    if (cursor) {
      await cursor.delete()
      await cursor.continue()
    }
  })
  await tx.objectStore('groupMembers').index('by-group').openCursor(id).then(async (cursor) => {
    if (cursor) {
      await cursor.delete()
      await cursor.continue()
    }
  })
  await tx.objectStore('groups').delete(id)
  await tx.done
}

export async function addGroupMember(groupId: string, studentId: string, isLeader: boolean = false): Promise<GroupMember> {
  const db = await getDB()
  
  // 检查学生是否已经在小组中
  const existing = await db.getAllFromIndex('groupMembers', 'by-student', studentId)
  if (existing.some(member => member.groupId === groupId)) {
    throw new Error('该学生已经在该小组中')
  }
  
  // 如果设置为组长，先取消其他成员的组长身份
  if (isLeader) {
    const members = await db.getAllFromIndex('groupMembers', 'by-group', groupId)
    for (const member of members) {
      if (member.isLeader) {
        await db.put('groupMembers', { ...member, isLeader: false })
      }
    }
  }
  
  const member: GroupMember = {
    id: id(),
    groupId,
    studentId,
    isLeader,
    joinedAt: Date.now()
  }
  await db.add('groupMembers', member)
  return member
}

export async function removeGroupMember(groupId: string, studentId: string): Promise<void> {
  const db = await getDB()
  const members = await db.getAllFromIndex('groupMembers', 'by-group', groupId)
  const member = members.find(m => m.studentId === studentId)
  if (member) {
    await db.delete('groupMembers', member.id)
  }
}

export async function setGroupLeader(groupId: string, studentId: string): Promise<void> {
  const db = await getDB()
  const members = await db.getAllFromIndex('groupMembers', 'by-group', groupId)
  
  // 取消所有成员的组长身份
  for (const member of members) {
    await db.put('groupMembers', { ...member, isLeader: member.studentId === studentId })
  }
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const db = await getDB()
  return db.getAllFromIndex('groupMembers', 'by-group', groupId)
}

export async function getStudentGroups(studentId: string): Promise<GroupMember[]> {
  const db = await getDB()
  return db.getAllFromIndex('groupMembers', 'by-student', studentId)
}

export async function addGroupPointsRecord(groupId: string, delta: number, reason: string, source: 'manual' | 'voice' = 'manual'): Promise<GroupPointsRecord> {
  const db = await getDB()
  const record: GroupPointsRecord = {
    id: id(),
    groupId,
    delta,
    reason,
    at: Date.now(),
    source
  }
  await db.add('groupPointsRecords', record)
  return record
}

export async function getGroupPointsRecords(groupId: string): Promise<GroupPointsRecord[]> {
  const db = await getDB()
  const records = await db.getAllFromIndex('groupPointsRecords', 'by-group', groupId)
  return records.sort((a, b) => b.at - a.at)
}

export function calculateGroupPoints(records: GroupPointsRecord[]): number {
  return records.reduce((sum, record) => sum + record.delta, 0)
}

export async function getGroupPoints(groupId: string): Promise<number> {
  const records = await getGroupPointsRecords(groupId)
  return calculateGroupPoints(records)
}

export async function getGroupRanking(): Promise<Array<{ group: Group; points: number }>> {
  const groups = await listGroups()
  const ranking = await Promise.all(
    groups.map(async (group) => {
      const points = await getGroupPoints(group.id)
      return { group, points }
    })
  )
  return ranking.sort((a, b) => b.points - a.points)
}

export async function randomGrouping(studentIds: string[], groupCount: number): Promise<Array<{ groupName: string; memberIds: string[] }>> {
  // 随机打乱学生顺序
  const shuffled = [...studentIds].sort(() => Math.random() - 0.5)
  const groups: Array<{ groupName: string; memberIds: string[] }> = []
  
  // 创建指定数量的小组
  for (let i = 0; i < groupCount; i++) {
    groups.push({ groupName: `小组${i + 1}`, memberIds: [] })
  }
  
  // 平均分配学生到各个小组
  shuffled.forEach((studentId, index) => {
    const groupIndex = index % groupCount
    groups[groupIndex].memberIds.push(studentId)
  })
  
  return groups
}
