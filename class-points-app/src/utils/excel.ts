import * as XLSX from 'xlsx'
import type { Student } from '../types'

const NAME = '姓名'
const NO = '学号'
const CLASS = '班级'

export interface ExcelRow {
  name: string
  studentNo: string
  class?: string
}

export function parseExcelFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) return reject(new Error('无法读取文件'))
        const wb = XLSX.read(data, { type: 'binary' })
        const first = wb.SheetNames[0]
        const ws = wb.Sheets[first]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1 }) as unknown[][]
        if (!rows.length) return resolve([])
        const header = (rows[0] as string[]).map((h) => (h || '').toString().trim())
        const nameIdx = header.findIndex((h) => h === NAME || h === '名字' || h === 'name')
        const noIdx = header.findIndex((h) => h === NO || h === '学号' || h === 'studentNo' || h === '编号')
        const classIdx = header.findIndex((h) => h === CLASS || h === '班级' || h === 'class')
        if (nameIdx < 0 || noIdx < 0) return reject(new Error('表格需包含「姓名」和「学号」列'))
        const out: ExcelRow[] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as unknown[]
          const name = row[nameIdx] != null ? String(row[nameIdx]).trim() : ''
          const studentNo = row[noIdx] != null ? String(row[noIdx]).trim() : ''
          if (!name || !studentNo) continue
          out.push({
            name,
            studentNo,
            class: classIdx >= 0 && row[classIdx] != null ? String(row[classIdx]).trim() : undefined
          })
        }
        resolve(out)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsBinaryString(file)
  })
}

export function exportStudentsToExcel(students: Student[]): void {
  const rows = students.map((s) => ({ [NAME]: s.name, [NO]: s.studentNo, [CLASS]: s.class || '' }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '学生列表')
  XLSX.writeFile(wb, `学生列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
