import { useState, useEffect, useCallback } from 'react'
import { Users, PlusMinus, BarChart3, Mic2, Shuffle, PawPrint, BookOpen, Users2 } from 'lucide-react'
import { StudentManage } from './pages/StudentManage'
import { PointsOp } from './pages/PointsOp'
import { Stats } from './pages/Stats'
import { Tools } from './pages/Tools'
import { GroupManage } from './pages/GroupManage'
import { ensureDefaultPresetRules } from './db/points'
import { ensureBuiltinIdioms } from './db/idioms'
import { SaveStatusProvider } from './contexts/SaveStatusContext'
import { SaveStatusIndicator } from './components/SaveStatusIndicator'
import './App.css'

const tabs = [
  { id: 'students', label: '学生管理', icon: Users },
  { id: 'groups', label: '小组管理', icon: Users2 },
  { id: 'points', label: '积分操作', icon: PlusMinus },
  { id: 'stats', label: '数据统计', icon: BarChart3 },
  { id: 'tools', label: '教学工具', icon: Mic2 }
] as const

type TabId = (typeof tabs)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('points')
  const [voiceOpen, setVoiceOpen] = useState(false)

  useEffect(() => {
    ensureDefaultPresetRules()
    ensureBuiltinIdioms()
  }, [])

  const focusVoice = useCallback(() => {
    setTab('points')
    setVoiceOpen(true)
  }, [])

  const focusRollCall = useCallback(() => {
    setTab('tools')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        focusVoice()
      }
      if (e.key === 'F1') {
        e.preventDefault()
        focusRollCall()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusVoice, focusRollCall])

  return (
    <SaveStatusProvider>
      <div className="app">
        <header className="header">
          <h1 className="title">班级积分管理系统</h1>
          <nav className="tabs">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={tab === id ? 'active' : ''}
                onClick={() => setTab(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </header>
        <main className="main">
          {tab === 'students' && <StudentManage />}
          {tab === 'groups' && <GroupManage />}
          {tab === 'points' && <PointsOp voiceOpen={voiceOpen} onVoiceClose={() => setVoiceOpen(false)} />}
          {tab === 'stats' && <Stats />}
          {tab === 'tools' && <Tools />}
        </main>
        <footer className="footer">
          <div className="footer-left">
            <span>F1 点名 · F2 语音</span>
          </div>
          <div className="footer-right">
            <SaveStatusIndicator />
          </div>
        </footer>
      </div>
    </SaveStatusProvider>
  )
}

export default App
