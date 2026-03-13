import { useState, useEffect } from 'react'
import { Download, User } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import * as studentDb from '../db/students'
import * as pointsDb from '../db/points'
import type { Student, PointsRecord } from '../types'

type Range = 'day' | 'week' | 'month'

export function Stats() {
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<PointsRecord[]>([])
  const [range, setRange] = useState<Range>('week')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [sList, rList] = await Promise.all([
        studentDb.listStudents(),
        pointsDb.listPointsRecords()
      ])
      if (!cancelled) {
        setStudents(sList)
        setRecords(rList)
        if (sList.length && !selectedStudentId) setSelectedStudentId(sList[0].id)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedStudentId])

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const from = range === 'day' ? now - 7 * dayMs : range === 'week' ? now - 4 * 7 * dayMs : now - 3 * 30 * dayMs

  const filteredRecords = records.filter((r) => r.at >= from)

  const ranking = students.map((s) => ({
    id: s.id,
    name: s.name,
    points: pointsDb.sumDelta(filteredRecords, s.id)
  })).sort((a, b) => b.points - a.points).slice(0, 20)

  const byReason: Record<string, number> = {}
  for (const r of filteredRecords) {
    const key = r.reason || '其他'
    byReason[key] = (byReason[key] || 0) + 1
  }
  const reasonChart = Object.entries(byReason).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  const voiceCount = filteredRecords.filter((r) => r.source === 'voice').length
  const manualCount = filteredRecords.length - voiceCount
  const voicePie = [
    { name: '语音操作', value: voiceCount, color: 'var(--primary)' },
    { name: '手动操作', value: manualCount, color: 'var(--muted)' }
  ].filter((d) => d.value > 0)

  const student = students.find((s) => s.id === selectedStudentId)
  const studentRecords = selectedStudentId
    ? filteredRecords.filter((r) => r.studentIds.includes(selectedStudentId))
    : []
  const byDay: Record<string, number> = {}
  for (const r of studentRecords) {
    const key = new Date(r.at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    byDay[key] = (byDay[key] || 0) + r.delta
  }
  const curveData = Object.entries(byDay)
    .map(([date, delta]) => ({ date, 积分: delta }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const exportReport = () => {
    const lines = ['姓名,学号,积分']
    ranking.forEach((r) => {
      const s = students.find((x) => x.id === r.id)
      lines.push(`${s?.name ?? ''},${s?.studentNo ?? ''},${r.points}`)
    })
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `积分报表_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="page">
      <div className="toolbar">
        <select value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="day">近7日</option>
          <option value="week">近4周</option>
          <option value="month">近3月</option>
        </select>
        <button onClick={exportReport}><Download size={18} /> 导出报表</button>
      </div>

      <div className="stats-grid">
        <div className="panel chart-panel">
          <h3>班级积分排名（前20）</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ranking} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              <Bar dataKey="points" fill="var(--primary)" name="积分" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <h3>操作方式占比</h3>
          {voicePie.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={voicePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {voicePie.map((_, i) => (
                    <Cell key={i} fill={voicePie[i].color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">暂无数据</p>
          )}
        </div>

        <div className="panel chart-panel">
          <h3>奖惩类型分布</h3>
          {reasonChart.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reasonChart} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Bar dataKey="value" fill="var(--warn)" name="次数" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">暂无数据</p>
          )}
        </div>

        <div className="panel chart-panel full-width">
          <h3>学生积分变化</h3>
          <select
            value={selectedStudentId ?? ''}
            onChange={(e) => setSelectedStudentId(e.target.value || null)}
            style={{ maxWidth: 200, marginBottom: 8 }}
          >
            <option value="">选择学生</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {curveData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Line type="monotone" dataKey="积分" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">选择学生后显示其积分曲线</p>
          )}
        </div>
      </div>
    </div>
  )
}
