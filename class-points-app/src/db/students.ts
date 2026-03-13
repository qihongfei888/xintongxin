import { getDB, id } from './index'
import type { Student } from '../types'

export async function listStudents(classFilter?: string): Promise<Student[]> {
  const db = await getDB()
  let list = await db.getAll('students')
  if (classFilter) list = list.filter((s) => s.class === classFilter)
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

export async function searchStudents(keyword: string): Promise<Student[]> {
  const db = await getDB()
  const all = await db.getAll('students')
  const k = keyword.trim().toLowerCase()
  if (!k) return all
  return all.filter(
    (s) =>
      s.name.toLowerCase().includes(k) ||
      s.studentNo.toLowerCase().includes(k) ||
      (s.class && s.class.toLowerCase().includes(k))
  )
}

export async function getStudent(id: string): Promise<Student | undefined> {
  const db = await getDB()
  return db.get('students', id)
}

export async function addStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const db = await getDB()
  const student: Student = {
    ...data,
    id: id(),
    createdAt: Date.now()
  }
  await db.add('students', student)
  return student
}

export async function addStudentsBatch(rows: Array<{ name: string; studentNo: string; class?: string }>): Promise<number> {
  const db = await getDB()
  const allStudents = await db.getAll('students')
  const existingStudentNos = new Set(allStudents.map(s => s.studentNo))
  const toAdd: Student[] = []
  
  for (const row of rows) {
    if (!row.name?.trim() || !row.studentNo?.trim()) continue
    const studentNo = String(row.studentNo).trim()
    if (existingStudentNos.has(studentNo)) continue
    toAdd.push({
      id: id(),
      name: row.name.trim(),
      studentNo,
      class: row.class?.trim(),
      createdAt: Date.now()
    })
    existingStudentNos.add(studentNo)
  }
  
  if (toAdd.length > 0) {
    const tx = db.transaction('students', 'readwrite')
    for (const s of toAdd) await tx.store.add(s)
    await tx.done
  }
  
  return toAdd.length
}

export async function updateStudent(id: string, data: Partial<Pick<Student, 'name' | 'studentNo' | 'class'>>): Promise<void> {
  const db = await getDB()
  const cur = await db.get('students', id)
  if (!cur) return
  await db.put('students', { ...cur, ...data })
}

export async function deleteStudent(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('students', id)
}

export async function deleteStudents(ids: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('students', 'readwrite')
  for (const id of ids) await tx.store.delete(id)
  await tx.done
}

export async function exportAllData(): Promise<{
  students: Student[]
  pointsRecords: any[]
  presetRules: any[]
  rollCallRecords: any[]
  petItems: any[]
  studentPets: any[]
  idioms: any[]
  idiomChainRecords: any[]
}> {
  const db = await getDB()
  const [
    students,
    pointsRecords,
    presetRules,
    rollCallRecords,
    petItems,
    studentPets,
    idioms,
    idiomChainRecords
  ] = await Promise.all([
    db.getAll('students'),
    db.getAll('pointsRecords'),
    db.getAll('presetRules'),
    db.getAll('rollCallRecords'),
    db.getAll('petItems'),
    db.getAll('studentPets'),
    db.getAll('idioms'),
    db.getAll('idiomChainRecords')
  ])
  return {
    students,
    pointsRecords,
    presetRules,
    rollCallRecords,
    petItems,
    studentPets,
    idioms,
    idiomChainRecords
  }
}

export async function importAllData(data: {
  students: Student[]
  pointsRecords: any[]
  presetRules: any[]
  rollCallRecords: any[]
  petItems: any[]
  studentPets: any[]
  idioms: any[]
  idiomChainRecords: any[]
}): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['students', 'pointsRecords', 'presetRules', 'rollCallRecords', 'petItems', 'studentPets', 'idioms', 'idiomChainRecords'], 'readwrite')
  
  await Promise.all([
    tx.objectStore('students').clear(),
    tx.objectStore('pointsRecords').clear(),
    tx.objectStore('presetRules').clear(),
    tx.objectStore('rollCallRecords').clear(),
    tx.objectStore('petItems').clear(),
    tx.objectStore('studentPets').clear(),
    tx.objectStore('idioms').clear(),
    tx.objectStore('idiomChainRecords').clear()
  ])
  
  await Promise.all([
    ...data.students.map(item => tx.objectStore('students').add(item)),
    ...data.pointsRecords.map(item => tx.objectStore('pointsRecords').add(item)),
    ...data.presetRules.map(item => tx.objectStore('presetRules').add(item)),
    ...data.rollCallRecords.map(item => tx.objectStore('rollCallRecords').add(item)),
    ...data.petItems.map(item => tx.objectStore('petItems').add(item)),
    ...data.studentPets.map(item => tx.objectStore('studentPets').add(item)),
    ...data.idioms.map(item => tx.objectStore('idioms').add(item)),
    ...data.idiomChainRecords.map(item => tx.objectStore('idiomChainRecords').add(item))
  ])
  
  await tx.done
}
