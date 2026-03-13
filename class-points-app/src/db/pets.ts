import { getDB, id } from './index'
import type { PetItem, StudentPet } from '../types'

const defaultItems: PetItem[] = [
  { id: 'pet-1', name: '小猫咪', cost: 10, type: 'pet' },
  { id: 'pet-2', name: '小狗狗', cost: 15, type: 'pet' },
  { id: 'pet-3', name: '小兔子', cost: 20, type: 'pet' },
  { id: 'prop-1', name: '星星徽章', cost: 5, type: 'prop' },
  { id: 'prop-2', name: '彩虹笔', cost: 8, type: 'prop' }
]

export async function listPetItems(): Promise<PetItem[]> {
  const db = await getDB()
  let list = await db.getAll('petItems')
  if (list.length === 0) {
    for (const item of defaultItems) await db.add('petItems', item)
    list = defaultItems
  }
  return list
}

export async function addStudentPet(studentId: string, itemId: string): Promise<StudentPet> {
  const db = await getDB()
  const r: StudentPet = { id: id(), studentId, itemId, at: Date.now() }
  await db.add('studentPets', r)
  return r
}

export async function getStudentPets(studentId: string): Promise<StudentPet[]> {
  const db = await getDB()
  return db.getAllFromIndex('studentPets', 'by-student', studentId)
}

export async function getAllStudentPets(): Promise<StudentPet[]> {
  const db = await getDB()
  return db.getAll('studentPets')
}
