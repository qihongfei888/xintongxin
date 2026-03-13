import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Check, AlertCircle } from 'lucide-react'
import * as studentDb from '../db/students'
import * as pointsDb from '../db/points'
import { parseVoicePointsCommand } from '../utils/voiceParse'
import { useSaveStatus } from '../contexts/SaveStatusContext'
import type { Student, VoiceParseResult, PresetRule } from '../types'

interface PointsOpProps {
  voiceOpen: boolean
  onVoiceClose: () => void
}

export function PointsOp({ voiceOpen, onVoiceClose }: PointsOpProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [delta, setDelta] = useState(0)
  const [reason, setReason] = useState('')
  const [presetRules, setPresetRules] = useState<PresetRule[]>(pointsDb.defaultPresetRules)
  const [voiceResult, setVoiceResult] = useState<VoiceParseResult | null>(null)
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { setSaving, setSaved, setError } = useSaveStatus()

  const load = useCallback(async () => {
    const list = await studentDb.listStudents()
    setStudents(list)
    const rules = await pointsDb.getPresetRules()
    if (rules.length) setPresetRules(rules)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const applyPreset = (rule: (typeof presetRules)[0]) => {
    setDelta(rule.defaultDelta)
    setReason(rule.defaultReason)
  }

  const submit = async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) {
      alert('请先选择学生')
      return
    }
    if (delta === 0) {
      alert('请设置加减分值')
      return
    }
    try {
      setSaving(true)
      await pointsDb.addPointsRecord({
        studentIds: ids,
        delta,
        reason: reason || '手动操作',
        at: Date.now(),
        source: 'manual'
      })
      setSaved()
      setSelectedIds(new Set())
      setDelta(0)
      setReason('')
      setVoiceResult(null)
      load()
    } catch (err) {
      setError('提交失败：' + (err as Error).message)
    }
  }

  const applyVoiceResult = useCallback((result: VoiceParseResult) => {
    if (result.confidence === 'incomplete') {
      setVoiceError('指令不完整，请说清楚：给谁加/减几分、原因')
      return
    }
    setVoiceError(null)
    const names = result.studentNames
    const ids = students.filter((s) => names.includes(s.name)).map((s) => s.id)
    setSelectedIds(new Set(ids))
    setDelta(result.delta)
    setReason(result.reason)
    setVoiceResult(result)
  }, [students])

  useEffect(() => {
    if (!voiceOpen) return
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition; SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError('当前浏览器不支持语音识别，请使用 Chrome/Edge')
      return
    }
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'zh-CN'
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript
      const result = parseVoicePointsCommand(text, students.map((s) => s.name))
      applyVoiceResult(result)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    return () => {
      try { rec.abort() } catch {}
      recognitionRef.current = null
    }
  }, [voiceOpen, students, applyVoiceResult])

  const startVoice = () => {
    setVoiceError(null)
    setVoiceResult(null)
    setListening(true)
    try {
      recognitionRef.current?.start()
    } catch (e) {
      setVoiceError('无法启动麦克风，请检查权限')
      setListening(false)
    }
  }

  const stopVoice = () => {
    try { recognitionRef.current?.stop() } catch {}
    setListening(false)
  }

  useEffect(() => {
    if (voiceOpen && listening) {
      const t = setTimeout(stopVoice, 15000)
      return () => clearTimeout(t)
    }
  }, [voiceOpen, listening])

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === students.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(students.map((s) => s.id)))
  }

  return (
    <div className="page points-op">
      <div className="voice-bar">
        <button
          className={listening ? 'primary' : ''}
          onClick={listening ? stopVoice : startVoice}
          title="F2 唤醒语音"
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
          {listening ? '正在听…' : '语音操作 (F2)'}
        </button>
        {voiceError && (
          <span className="voice-error">
            <AlertCircle size={16} />
            {voiceError}
          </span>
        )}
        {voiceResult && (
          <span className="voice-result">
            <Check size={16} />
            已解析：{voiceResult.raw}
            <button className="small" onClick={() => setVoiceResult(null)}>清除</button>
          </span>
        )}
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>选择学生</h3>
          <button className="small" onClick={selectAll}>
            {selectedIds.size === students.length ? '取消全选' : '全选'}
          </button>
          <ul className="student-checklist">
            {students.slice(0, 200).map((s) => (
              <li key={s.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  {s.name}（{s.studentNo}）
                </label>
              </li>
            ))}
          </ul>
          {students.length > 200 && <p className="muted">仅显示前200人，请用搜索筛选</p>}
        </div>

        <div className="panel">
          <h3>加减分</h3>
          <div className="preset-rules">
            {presetRules.map((r) => (
              <button key={r.id} className="small" onClick={() => applyPreset(r)}>
                {r.label} {r.defaultDelta > 0 ? '+' : ''}{r.defaultDelta}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label>分值（正加负减）</label>
            <input
              type="number"
              value={delta || ''}
              onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="form-group">
            <label>原因</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="选填" />
          </div>
          <button className="primary big" onClick={submit} disabled={!selectedIds.size || delta === 0}>
            确认提交
          </button>
        </div>
      </div>
    </div>
  )
}
