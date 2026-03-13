import { useState, useEffect, useCallback } from 'react'
import { Shuffle, Volume2, PawPrint, BookOpen, Plus, Calendar, Users, RefreshCw, Download, Printer } from 'lucide-react'
import * as studentDb from '../db/students'
import * as pointsDb from '../db/points'
import * as rollCallDb from '../db/rollCall'
import * as petsDb from '../db/pets'
import * as idiomsDb from '../db/idioms'
import type { Student } from '../types'

type ToolTab = 'rollcall' | 'pet' | 'idiom' | 'duty' | 'seat'

export function Tools() {
  const [tab, setTab] = useState<ToolTab>('rollcall')

  return (
    <div className="page">
      <div className="tool-tabs">
        <button className={tab === 'rollcall' ? 'active' : ''} onClick={() => setTab('rollcall')}>
          <Shuffle size={18} /> 随机点名
        </button>
        <button className={tab === 'pet' ? 'active' : ''} onClick={() => setTab('pet')}>
          <PawPrint size={18} /> 养宠互动
        </button>
        <button className={tab === 'idiom' ? 'active' : ''} onClick={() => setTab('idiom')}>
          <BookOpen size={18} /> 成语接龙
        </button>
        <button className={tab === 'duty' ? 'active' : ''} onClick={() => setTab('duty')}>
          <Calendar size={18} /> 值日表
        </button>
        <button className={tab === 'seat' ? 'active' : ''} onClick={() => setTab('seat')}>
          <Users size={18} /> 座位表
        </button>
      </div>
      {tab === 'rollcall' && <RollCall />}
      {tab === 'pet' && <PetSection />}
      {tab === 'idiom' && <IdiomChain />}
      {tab === 'duty' && <DutySchedule />}
      {tab === 'seat' && <SeatTable />}
    </div>
  )
}

function RollCall() {
  const [students, setStudents] = useState<Student[]>([])
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<Student | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    const list = await studentDb.listStudents()
    setStudents(list)
    const next: Record<string, number> = {}
    for (const s of list) {
      next[s.id] = await rollCallDb.getRollCallCountByStudent(s.id)
    }
    setCounts(next)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pool = students.filter((s) => !excludedIds.has(s.id))
  const pick = () => {
    if (!pool.length) {
      setResult(null)
      alert('没有可点名的学生')
      return
    }
    const idx = Math.floor(Math.random() * pool.length)
    const chosen = pool[idx]
    setResult(chosen)
    rollCallDb.addRollCallRecord(chosen.id)
    setCounts((prev) => ({ ...prev, [chosen.id]: (prev[chosen.id] || 0) + 1 }))
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(chosen.name)
      u.lang = 'zh-CN'
      window.speechSynthesis.speak(u)
    }
  }

  const toggleExclude = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetExcluded = () => setExcludedIds(new Set())

  return (
    <div className="panel tools-panel">
      <h3><Shuffle size={20} /> 随机点名（F1）</h3>
      <div className="rollcall-area">
        <div className="rollcall-result">
          {result ? (
            <p className="big-text result-name">{result.name}</p>
          ) : (
            <p className="muted">点击下方按钮随机抽取</p>
          )}
        </div>
        <button className="primary big" onClick={pick}>
          <Shuffle size={24} /> 点名
        </button>
        <div className="exclude-list">
          <span>排除已点：</span>
          <button className="small" onClick={resetExcluded}>重置排除</button>
          {students.slice(0, 30).map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={excludedIds.has(s.id)}
                onChange={() => toggleExclude(s.id)}
              />
              {s.name}({counts[s.id] || 0})
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function PetSection() {
  const [students, setStudents] = useState<Student[]>([])
  const [items, setItems] = useState<Awaited<ReturnType<typeof petsDb.listPetItems>>>([])
  const [studentPets, setStudentPets] = useState<Awaited<ReturnType<typeof petsDb.getAllStudentPets>>>([])
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [sList, itemsList, spList, records] = await Promise.all([
        studentDb.listStudents(),
        petsDb.listPetItems(),
        petsDb.getAllStudentPets(),
        pointsDb.listPointsRecords()
      ])
      if (cancelled) return
      setStudents(sList)
      setItems(itemsList)
      setStudentPets(spList)
      const pm: Record<string, number> = {}
      for (const s of sList) {
        pm[s.id] = pointsDb.sumDelta(records, s.id)
      }
      setPointsMap(pm)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]))
  const byStudent: Record<string, { itemId: string; name: string }[]> = {}
  for (const sp of studentPets) {
    const name = itemMap[sp.itemId]?.name ?? sp.itemId
    if (!byStudent[sp.studentId]) byStudent[sp.studentId] = []
    byStudent[sp.studentId].push({ itemId: sp.itemId, name })
  }

  const exchange = async (studentId: string, itemId: string) => {
    const item = itemMap[itemId]
    if (!item) return
    const points = pointsMap[studentId] ?? 0
    if (points < item.cost) {
      alert('积分不足')
      return
    }
    await petsDb.addStudentPet(studentId, itemId)
    await pointsDb.addPointsRecord({
      studentIds: [studentId],
      delta: -item.cost,
      reason: `兑换${item.name}`,
      at: Date.now(),
      source: 'manual'
    })
    setPointsMap((prev) => ({ ...prev, [studentId]: (prev[studentId] ?? 0) - item.cost }))
    setStudentPets(await petsDb.getAllStudentPets())
  }

  const ranking = students
    .map((s) => ({ student: s, pets: (byStudent[s.id] || []).length, points: pointsMap[s.id] ?? 0 }))
    .sort((a, b) => b.pets - a.pets)
    .slice(0, 10)

  return (
    <div className="panel tools-panel">
      <h3><PawPrint size={20} /> 养宠互动</h3>
      <p className="muted">积分兑换虚拟宠物/道具，积分不足时无法兑换。</p>
      <div className="pet-items">
        {items.map((item) => (
          <div key={item.id} className="pet-item">
            <span>{item.name}</span>
            <span>{item.cost} 分</span>
          </div>
        ))}
      </div>
      <h4>兑换</h4>
      <div className="exchange-list">
        {students.slice(0, 50).map((s) => (
          <div key={s.id} className="exchange-row">
            <span>{s.name}（当前 {pointsMap[s.id] ?? 0} 分）</span>
            <div>
              {items.map((item) => (
                <button
                  key={item.id}
                  className="small"
                  disabled={(pointsMap[s.id] ?? 0) < item.cost}
                  onClick={() => exchange(s.id, item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <h4>宠物排行榜</h4>
      <ol className="pet-ranking">
        {ranking.map((r, i) => (
          <li key={r.student.id}>{i + 1}. {r.student.name} — {r.pets} 个宠物/道具</li>
        ))}
      </ol>
    </div>
  )
}

function IdiomChain() {
  const [students, setStudents] = useState<Student[]>([])
  const [lastIdiom, setLastIdiom] = useState('')
  const [input, setInput] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [history, setHistory] = useState<Awaited<ReturnType<typeof idiomsDb.listIdiomChainRecords>>>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    studentDb.listStudents().then(setStudents)
    idiomsDb.listIdiomChainRecords(20).then(setHistory)
  }, [])

  const checkAndSubmit = async () => {
    const word = input.trim()
    if (!word) return
    const needFirst = lastIdiom ? lastIdiom.slice(-1) : null
    const firstChar = word.charAt(0)
    if (needFirst && firstChar !== needFirst) {
      setMessage(`请接以「${needFirst}」开头的成语`)
      return
    }
    const exists = await idiomsDb.hasIdiom(word)
    if (!exists) {
      setMessage('成语库中暂无该词，可先添加自定义成语')
      return
    }
    const sid = selectedStudentId || students[0]?.id
    if (!sid) {
      setMessage('请先选择学生')
      return
    }
    const pointsAward = 2
    await pointsDb.addPointsRecord({
      studentIds: [sid],
      delta: pointsAward,
      reason: `成语接龙：${word}`,
      at: Date.now(),
      source: 'manual'
    })
    await idiomsDb.addIdiomChainRecord(sid, word, lastIdiom || '(开头)', pointsAward)
    setLastIdiom(word)
    setInput('')
    setMessage('接龙正确 +2 分')
    setHistory(await idiomsDb.listIdiomChainRecords(20))
  }

  const addCustom = async () => {
    const word = input.trim()
    if (!word) return
    await idiomsDb.addCustomIdiom(word)
    setInput('')
    setMessage('已添加自定义成语')
  }

  return (
    <div className="panel tools-panel">
      <h3><BookOpen size={20} /> 成语接龙</h3>
      <p className="muted">接龙正确可手动/语音加分，此处接龙成功默认 +2 分。</p>
      <div className="idiom-area">
        <div className="form-group">
          <label>当前接龙字：{lastIdiom ? `「${lastIdiom.slice(-1)}」` : '任意'}</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入成语"
            onKeyDown={(e) => e.key === 'Enter' && checkAndSubmit()}
          />
        </div>
        <div className="form-group">
          <label>答题学生</label>
          <select
            value={selectedStudentId ?? ''}
            onChange={(e) => setSelectedStudentId(e.target.value || null)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="idiom-actions">
          <button className="primary" onClick={checkAndSubmit}>确认接龙</button>
          <button onClick={addCustom}>添加自定义成语</button>
        </div>
        {message && <p className="muted">{message}</p>}
      </div>
      <h4>接龙历史</h4>
      <ul className="idiom-history">
        {history.map((r) => {
          const s = students.find((x) => x.id === r.studentId)
          return (
            <li key={r.id}>
              {r.prevIdiom} → <strong>{r.idiom}</strong>（{s?.name ?? r.studentId}）
              {r.pointsAwarded != null && ` +${r.pointsAwarded}分`}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DutySchedule() {
  const [students, setStudents] = useState<Student[]>([])
  const [week, setWeek] = useState<number>(1)
  const [studentList, setStudentList] = useState<string>('')
  const [schedule, setSchedule] = useState<Record<string, string[]>>({})
  const [studentsPerDay, setStudentsPerDay] = useState<number>(2)

  useEffect(() => {
    studentDb.listStudents().then((list) => {
      setStudents(list)
      setStudentList(list.map(s => s.name).join('\n'))
    })
  }, [])

  const generateDutySchedule = () => {
    if (!studentList.trim()) {
      alert('请输入学生名单！')
      return
    }

    const studentNames = studentList.split('\n').filter(line => line.trim())

    if (studentNames.length === 0) {
      alert('请输入有效的学生名单！')
      return
    }

    const days = ['周一', '周二', '周三', '周四', '周五']
    const dutySchedule: Record<string, string[]> = {}

    // 随机分配学生到每天
    const shuffledStudents = [...studentNames].sort(() => Math.random() - 0.5)
    let studentIndex = 0

    days.forEach(day => {
      dutySchedule[day] = []
      // 每天分配指定数量的学生
      for (let i = 0; i < studentsPerDay && studentIndex < shuffledStudents.length; i++) {
        dutySchedule[day].push(shuffledStudents[studentIndex])
        studentIndex++
      }
    })

    // 如果还有剩余学生，循环分配
    if (studentIndex < shuffledStudents.length) {
      let dayIndex = 0
      while (studentIndex < shuffledStudents.length) {
        const day = days[dayIndex % days.length]
        if (dutySchedule[day].length < studentsPerDay + 1) {
          dutySchedule[day].push(shuffledStudents[studentIndex])
          studentIndex++
        }
        dayIndex++
      }
    }

    setSchedule(dutySchedule)
  }

  const regenerateSchedule = () => {
    generateDutySchedule()
  }

  const printSchedule = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const scheduleHtml = Object.entries(schedule).map(([day, students]) => `
        <div style="margin: 15px 0; padding: 15px; background: #f7fafc; border-radius: 8px;">
          <strong style="color: #667eea; font-size: 1.1rem;">${day}</strong>
          <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            ${students.map(s => `<span style="padding: 8px 16px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 20px;">${s}</span>`).join('')}
          </div>
        </div>
      `).join('')

      printWindow.document.write(`
        <html>
          <head>
            <title>第${week}周值日表</title>
            <style>
              body { font-family: "Microsoft YaHei", sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { text-align: center; color: #2d3748; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <h1>🗓️ 第${week}周值日表</h1>
            ${scheduleHtml}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="panel tools-panel">
      <h3><Calendar size={20} /> 值日表生成器</h3>
      <p className="muted">智能生成一周值日表，支持手动编辑学生名单和自定义每天值日生数量。</p>
      
      <div className="form-group">
        <label>学生名单（每行一个学生）</label>
        <textarea
          value={studentList}
          onChange={(e) => setStudentList(e.target.value)}
          rows={6}
          placeholder="输入学生名单，每行一个学生&#10;例如：&#10;张三&#10;李四&#10;王五"
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>周数</label>
          <input
            type="number"
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            min={1}
          />
        </div>
        <div className="form-group">
          <label>每天值日生数量</label>
          <input
            type="number"
            value={studentsPerDay}
            onChange={(e) => setStudentsPerDay(Number(e.target.value))}
            min={1}
            max={5}
          />
        </div>
      </div>
      
      <div className="button-group">
        <button className="primary" onClick={generateDutySchedule}>
          <Calendar size={18} /> 生成值日表
        </button>
        {Object.keys(schedule).length > 0 && (
          <>
            <button onClick={regenerateSchedule}>
              <RefreshCw size={18} /> 重新生成
            </button>
            <button onClick={printSchedule}>
              <Printer size={18} /> 打印
            </button>
          </>
        )}
      </div>
      
      {Object.keys(schedule).length > 0 && (
        <div className="duty-schedule">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar size={20} />
            第{week}周值日表
          </h4>
          <div className="duty-table">
            {Object.entries(schedule).map(([day, students]) => (
              <div key={day} className="duty-row">
                <div className="duty-day">{day}</div>
                <div className="duty-students">
                  {students.map((student, index) => (
                    <span key={index} className="duty-tag">
                      {student}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SeatTable() {
  const [students, setStudents] = useState<Student[]>([])
  const [studentList, setStudentList] = useState<string>('')
  const [columns, setColumns] = useState<number>(8)
  const [rows, setRows] = useState<number>(6)
  const [seats, setSeats] = useState<string[][]>([])
  const [draggedSeat, setDraggedSeat] = useState<{ row: number; col: number } | null>(null)

  useEffect(() => {
    studentDb.listStudents().then((list) => {
      setStudents(list)
      setStudentList(list.map(s => s.name).join('\n'))
    })
  }, [])

  const generateSeatTable = () => {
    if (!studentList.trim()) {
      alert('请输入学生名单！')
      return
    }

    const studentNames = studentList.split('\n').filter(line => line.trim())

    if (studentNames.length === 0) {
      alert('请输入有效的学生名单！')
      return
    }

    // 随机打乱学生顺序
    const shuffledStudents = [...studentNames].sort(() => Math.random() - 0.5)
    let studentIndex = 0

    // 生成座位表
    const newSeats: string[][] = []
    for (let i = 0; i < rows; i++) {
      const row: string[] = []
      for (let j = 0; j < columns; j++) {
        if (studentIndex < shuffledStudents.length) {
          row.push(shuffledStudents[studentIndex])
          studentIndex++
        } else {
          row.push('')
        }
      }
      newSeats.push(row)
    }

    setSeats(newSeats)
  }

  const handleDragStart = (row: number, col: number) => {
    setDraggedSeat({ row, col })
  }

  const handleDragEnd = () => {
    setDraggedSeat(null)
  }

  const handleDrop = (targetRow: number, targetCol: number) => {
    if (draggedSeat && (draggedSeat.row !== targetRow || draggedSeat.col !== targetCol)) {
      const newSeats = seats.map(row => [...row])
      const temp = newSeats[draggedSeat.row][draggedSeat.col]
      newSeats[draggedSeat.row][draggedSeat.col] = newSeats[targetRow][targetCol]
      newSeats[targetRow][targetCol] = temp
      setSeats(newSeats)
    }
    setDraggedSeat(null)
  }

  const regenerateSeats = () => {
    generateSeatTable()
  }

  const printSeats = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const seatHtml = seats.map((row, rowIndex) => `
        <div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 10px; margin-bottom: 10px;">
          ${row.map((student, colIndex) => `
            <div style="
              padding: 20px 10px;
              background: ${student ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f7fafc'};
              color: ${student ? 'white' : '#a0aec0'};
              border-radius: 12px;
              text-align: center;
              font-weight: 500;
              border: ${student ? 'none' : '2px dashed #cbd5e0'};
            ">
              ${student || '空位'}
            </div>
          `).join('')}
        </div>
      `).join('')

      printWindow.document.write(`
        <html>
          <head>
            <title>班级座位表</title>
            <style>
              body { font-family: "Microsoft YaHei", sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
              h1 { text-align: center; color: #2d3748; margin-bottom: 20px; }
              .desk { 
                text-align: center; 
                margin-bottom: 30px; 
                padding: 15px 50px;
                background: linear-gradient(135deg, #ed8936, #dd6b20);
                color: white;
                border-radius: 30px;
                display: inline-block;
                font-weight: bold;
                font-size: 1.2rem;
              }
            </style>
          </head>
          <body>
            <h1>🪑 班级座位表</h1>
            <div style="text-align: center;">
              <div class="desk">👨‍🏫 讲台</div>
            </div>
            ${seatHtml}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="panel tools-panel">
      <h3><Users size={20} /> 座位表生成器</h3>
      <p className="muted">智能生成班级座位表，支持自定义行列数，拖拽调整座位位置。</p>
      
      <div className="form-group">
        <label>学生名单（每行一个学生）</label>
        <textarea
          value={studentList}
          onChange={(e) => setStudentList(e.target.value)}
          rows={6}
          placeholder="输入学生名单，每行一个学生&#10;例如：&#10;张三&#10;李四&#10;王五"
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>列数</label>
          <input
            type="number"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            min={1}
            max={12}
          />
        </div>
        <div className="form-group">
          <label>行数</label>
          <input
            type="number"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            min={1}
            max={10}
          />
        </div>
      </div>
      
      <div className="button-group">
        <button className="primary" onClick={generateSeatTable}>
          <Users size={18} /> 生成座位表
        </button>
        {seats.length > 0 && (
          <>
            <button onClick={regenerateSeats}>
              <RefreshCw size={18} /> 重新生成
            </button>
            <button onClick={printSeats}>
              <Printer size={18} /> 打印
            </button>
          </>
        )}
      </div>
      
      {seats.length > 0 && (
        <div className="seat-table">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={20} />
            班级座位表（拖拽可调整位置）
          </h4>
          <div className="teacher-desk">
            <div className="desk">讲台</div>
          </div>
          <div 
            className="seat-grid" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {seats.map((row, rowIndex) => (
              row.map((student, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  draggable
                  onDragStart={() => handleDragStart(rowIndex, colIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(rowIndex, colIndex)}
                  className={student ? 'seat-occupied' : 'seat-empty'}
                  style={{
                    opacity: draggedSeat?.row === rowIndex && draggedSeat?.col === colIndex ? 0.5 : 1,
                  }}
                >
                  {student || <span>空位</span>}
                </div>
              ))
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
