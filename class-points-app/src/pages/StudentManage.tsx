import { useState, useEffect } from 'react'
import { Search, Upload, Download, Plus, Trash2, Edit2, Save, RefreshCw, Users } from 'lucide-react'
import * as studentDb from '../db/students'
import { parseExcelFile, exportStudentsToExcel } from '../utils/excel'
import { useSaveStatus } from '../contexts/SaveStatusContext'
import type { Student } from '../types'

export function StudentManage() {
  const [list, setList] = useState<Student[]>([])
  const [keyword, setKeyword] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { setSaving, setSaved, setError } = useSaveStatus()

  const load = async () => {
    setLoading(true)
    const data = await studentDb.listStudents(classFilter || undefined)
    setList(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [classFilter])

  const filtered = keyword.trim()
    ? list.filter(
        (s) =>
          s.name.toLowerCase().includes(keyword.toLowerCase()) ||
          s.studentNo.toLowerCase().includes(keyword.toLowerCase())
      )
    : list

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setSaving(true)
      const rows = await parseExcelFile(file)
      const n = await studentDb.addStudentsBatch(rows)
      setSaved()
      alert(`成功导入 ${n} 条学生`)
      load()
    } catch (err) {
      setError('导入失败：' + (err as Error).message)
    }
    e.target.value = ''
  }

  const handleExport = () => {
    const toExport = keyword.trim() ? filtered : list
    if (!toExport.length) {
      alert('没有可导出的学生')
      return
    }
    exportStudentsToExcel(toExport)
  }

  const handleBackup = async () => {
    try {
      setSaving(true)
      const data = await studentDb.exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `班级积分管理备份_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSaved()
      alert('备份成功！')
    } catch (err) {
      setError('备份失败：' + (err as Error).message)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('恢复数据将覆盖当前所有数据，确定要继续吗？')) {
      e.target.value = ''
      return
    }
    try {
      setSaving(true)
      const text = await file.text()
      const data = JSON.parse(text)
      await studentDb.importAllData(data)
      setSaved()
      alert('恢复成功！')
      load()
    } catch (err) {
      setError('恢复失败：' + (err as Error).message)
    }
    e.target.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该学生？')) return
    try {
      setSaving(true)
      await studentDb.deleteStudent(id)
      setSaved()
      load()
    } catch (err) {
      setError('删除失败：' + (err as Error).message)
    }
  }

  const handleBatchDelete = async () => {
    if (!selectedIds.size || !confirm(`确定删除选中的 ${selectedIds.size} 人？`)) return
    try {
      setSaving(true)
      await studentDb.deleteStudents(Array.from(selectedIds))
      setSaved()
      setSelectedIds(new Set())
      load()
    } catch (err) {
      setError('批量删除失败：' + (err as Error).message)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((s) => s.id)))
  }

  const classes = Array.from(new Set(list.map((s) => s.class).filter(Boolean))) as string[]

  return (
    <div className="page">
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={18} />
          <input
            placeholder="姓名 / 学号 模糊搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        {classes.length > 0 && (
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="">全部班级</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <label className="btn">
          <Upload size={18} />
          导入 Excel
          <input type="file" accept=".xlsx,.xls" hidden onChange={handleImport} />
        </label>
        <button onClick={handleExport}>
          <Download size={18} />
          导出 Excel
        </button>
        <button onClick={handleBackup}>
          <Save size={18} />
          备份数据
        </button>
        <label className="btn">
          <RefreshCw size={18} />
          恢复数据
          <input type="file" accept=".json" hidden onChange={handleRestore} />
        </label>
        <button className="primary" onClick={() => setEditing({ id: '', name: '', studentNo: '', createdAt: 0 } as Student)}>
          <Plus size={18} />
          添加学生
        </button>
        {selectedIds.size > 0 && (
          <button className="danger" onClick={handleBatchDelete}>
            <Trash2 size={18} />
            删除选中 ({selectedIds.size})
          </button>
        )}
      </div>

      {editing && (
        <EditStudentModal
          student={editing}
          onSave={async (data) => {
            if (editing.id) {
              await studentDb.updateStudent(editing.id, data)
            } else {
              await studentDb.addStudent(data)
            }
            setEditing(null)
            load()
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {loading ? (
        <p>加载中…</p>
      ) : (
        <div className="student-grid">
          {filtered.map((s) => (
            <div key={s.id} className="student-card">
              <div className="student-avatar">
                {s.name.charAt(0)}
              </div>
              <div className="student-name">{s.name}</div>
              <div className="student-id">{s.studentNo}</div>
              {s.class && (
                <div className="student-stat">
                  班级: <strong>{s.class}</strong>
                </div>
              )}
              <div className="student-card-actions">
                <button className="small" onClick={() => setEditing(s)}>
                  <Edit2 size={14} />
                  编辑
                </button>
                <button className="small danger" onClick={() => handleDelete(s.id)}>
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && <div className="panel-empty">
        <h3><Users size={48} /></h3>
        <p>暂无学生</p>
        <p className="muted">请导入或添加学生</p>
      </div>}
    </div>
  )
}

function EditStudentModal({
  student,
  onSave,
  onClose
}: {
  student: Student
  onSave: (data: { name: string; studentNo: string; class?: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(student.name)
  const [studentNo, setStudentNo] = useState(student.studentNo)
  const [cls, setCls] = useState(student.class || '')
  const { setSaving, setSaved, setError } = useSaveStatus()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{student.id ? '编辑学生' : '添加学生'}</h3>
        <div className="form-group">
          <label>姓名 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>学号 *</label>
          <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
        </div>
        <div className="form-group">
          <label>班级</label>
          <input value={cls} onChange={(e) => setCls(e.target.value)} placeholder="可选" />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button
            className="primary"
            onClick={async () => {
              if (!name.trim() || !studentNo.trim()) return alert('姓名和学号必填')
              try {
                setSaving(true)
                await onSave({ name: name.trim(), studentNo: studentNo.trim(), class: cls.trim() || undefined })
                setSaved()
              } catch (err) {
                setError('保存失败：' + (err as Error).message)
              }
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
