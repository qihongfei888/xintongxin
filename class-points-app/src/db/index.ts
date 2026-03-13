import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Student, PointsRecord, PresetRule, RollCallRecord, PetItem, StudentPet, Idiom, IdiomChainRecord, Group, GroupMember, GroupPointsRecord } from '../types'

const DB_NAME = 'class-points-db'
const DB_VERSION = 1

export interface ClassPointsDB extends DBSchema {
  students: { key: string; value: Student; indexes: { 'by-name': string; 'by-no': string; 'by-class': string } }
  pointsRecords: { key: string; value: PointsRecord; indexes: { 'by-at': number; 'by-student': string } }
  presetRules: { key: string; value: PresetRule }
  rollCallRecords: { key: string; value: RollCallRecord; indexes: { 'by-at': number } }
  petItems: { key: string; value: PetItem }
  studentPets: { key: string; value: StudentPet; indexes: { 'by-student': string } }
  idioms: { key: string; value: Idiom; indexes: { 'by-text': string } }
  idiomChainRecords: { key: string; value: IdiomChainRecord; indexes: { 'by-at': number } }
  groups: { key: string; value: Group }
  groupMembers: { key: string; value: GroupMember; indexes: { 'by-group': string; 'by-student': string } }
  groupPointsRecords: { key: string; value: GroupPointsRecord; indexes: { 'by-at': number; 'by-group': string } }
}

let dbPromise: Promise<IDBPDatabase<ClassPointsDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ClassPointsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const students = db.createObjectStore('students', { keyPath: 'id' })
        students.createIndex('by-name', 'name')
        students.createIndex('by-no', 'studentNo')
        students.createIndex('by-class', 'class')
        const pointsRecords = db.createObjectStore('pointsRecords', { keyPath: 'id' })
        pointsRecords.createIndex('by-at', 'at')
        pointsRecords.createIndex('by-student', 'studentIds', { multiEntry: true })
        db.createObjectStore('presetRules', { keyPath: 'id' })
        const rollCallRecords = db.createObjectStore('rollCallRecords', { keyPath: 'id' })
        rollCallRecords.createIndex('by-at', 'at')
        db.createObjectStore('petItems', { keyPath: 'id' })
        const studentPets = db.createObjectStore('studentPets', { keyPath: 'id' })
        studentPets.createIndex('by-student', 'studentId')
        const idioms = db.createObjectStore('idioms', { keyPath: 'id' })
        idioms.createIndex('by-text', 'text')
        const idiomChainRecords = db.createObjectStore('idiomChainRecords', { keyPath: 'id' })
        idiomChainRecords.createIndex('by-at', 'at')
        
        // 小组相关存储
        db.createObjectStore('groups', { keyPath: 'id' })
        const groupMembers = db.createObjectStore('groupMembers', { keyPath: 'id' })
        groupMembers.createIndex('by-group', 'groupId')
        groupMembers.createIndex('by-student', 'studentId')
        const groupPointsRecords = db.createObjectStore('groupPointsRecords', { keyPath: 'id' })
        groupPointsRecords.createIndex('by-at', 'at')
        groupPointsRecords.createIndex('by-group', 'groupId')
      }
    })
  }
  return dbPromise
}

export function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
