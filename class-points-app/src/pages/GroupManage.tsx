import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Trash2, Edit2, Award, GripHorizontal, RefreshCw, Download, Upload, Crown, PlusMinus } from 'lucide-react'
import * as groupDb from '../db/groups'
import * as studentDb from '../db/students'
import { useSaveStatus } from '../contexts/SaveStatusContext'
import type { Group, GroupMember, Student } from '../types'

export function GroupManage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [groupPoints, setGroupPoints] = useState<number>(0)
  const [ranking, setRanking] = useState<Array<{ group: Group; points: number }>>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Group | null>(null)
  const [showRandomGrouping, setShowRandomGrouping] = useState(false)
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [groupCount, setGroupCount] = useState(4)
  const [delta, setDelta] = useState(0)
  const [reason, setReason] = useState('')
  const { setSaving, setSaved, setError } = useSaveStatus()

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const data = await groupDb.listGroups()
    setGroups(data)
    setLoading(false)
  }, [])

  const loadStudents = useCallback(async () => {
    const data = await studentDb.listStudents()
    setStudents(data)
  }, [])

  const loadRanking = useCallback(async () => {
    const data = await groupDb.getGroupRanking()
    setRanking(data)
  }, [])

  useEffect(() => {
    loadGroups()
    loadStudents()
    loadRanking()
  }, [loadGroups, loadStudents, loadRanking])

  const handleSelectGroup = async (group: Group) => {
    setSelectedGroup(group)
    const members = await groupDb.getGroupMembers(group.id)
    setGroupMembers(members)
    const points = await groupDb.getGroupPoints(group.id)
    setGroupPoints(points)
  }

  const handleCreateGroup = async (name: string, description?: string) => {
    try {
      setSaving(true)
      await groupDb.createGroup(name, description)
      setSaved()
      loadGroups()
    } catch (err) {
      setError('创建小组失败：' + (err as Error).message)
    }
  }

  const handleUpdateGroup = async (id: string, data: { name: string; description?: string }) => {
    try {
      setSaving(true)
      await groupDb.updateGroup(id, data)
      setSaved()
      loadGroups()
      setEditing(null)
    } catch (err) {
      setError('更新小组失败：' + (err as Error).message)
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('确定删除该小组？')) return
    try {
      setSaving(true)
      await groupDb.deleteGroup(id)
      setSaved()
      loadGroups()
      if (selectedGroup?.id === id) {
        setSelectedGroup(null)
        setGroupMembers([])
        setGroupPoints(0)
      }
    } catch (err) {
      setError('删除小组失败：' + (err as Error).message)
    }
  }

  const handleAddMember = async (groupId: string, studentId: string) => {
    try {
      setSaving(true)
      await groupDb.addGroupMember(groupId, studentId)
      setSaved()
      if (selectedGroup?.id === groupId) {
        const members = await groupDb.getGroupMembers(groupId)
        setGroupMembers(members)
      }
    } catch (err) {
      setError('添加成员失败：' + (err as Error).message)
    }
  }

  const handleRemoveMember = async (groupId: string, studentId: string) => {
    try {
      setSaving(true)
      await groupDb.removeGroupMember(groupId, studentId)
      setSaved()
      if (selectedGroup?.id === groupId) {
        const members = await groupDb.getGroupMembers(groupId)
        setGroupMembers(members)
      }
    } catch (err) {
      setError('移除成员失败：' + (err as Error).message)
    }
  }

  const handleSetLeader = async (groupId: string, studentId: string) => {
    try {
      setSaving(true)
      await groupDb.setGroupLeader(groupId, studentId)
      setSaved()
      if (selectedGroup?.id === groupId) {
        const members = await groupDb.getGroupMembers(groupId)
        setGroupMembers(members)
      }
    } catch (err) {
      setError('设置组长失败：' + (err as Error).message)
    }
  }

  const handleRandomGrouping = async () => {
    if (students.length === 0) {
      alert('请先添加学生')
      return
    }
    if (groupCount <= 0) {
      alert('请设置有效的小组数量')
      return
    }
    
    try {
      setSaving(true)
      const result = await groupDb.randomGrouping(students.map(s => s.id), groupCount)
      
      // 清除现有小组
      const existingGroups = await groupDb.listGroups()
      for (const group of existingGroups) {
        await groupDb.deleteGroup(group.id)
      }
      
      // 创建新小组并添加成员
      for (const { groupName, memberIds } of result) {
        const group = await groupDb.createGroup(groupName)
        for (let i = 0; i < memberIds.length; i++) {
          await groupDb.addGroupMember(group.id, memberIds[i], i === 0) // 第一个成员为组长
        }
      }
      
      setSaved()
      loadGroups()
      setShowRandomGrouping(false)
      alert('随机分组成功！')
    } catch (err) {
      setError('随机分组失败：' + (err as Error).message)
    }
  }

  const handleAddGroupPoints = async (groupId: string) => {
    if (delta === 0) {
      alert('请设置分值')
      return
    }
    try {
      setSaving(true)
      await groupDb.addGroupPointsRecord(groupId, delta, reason || '手动操作')
      setSaved()
      if (selectedGroup?.id === groupId) {
        const points = await groupDb.getGroupPoints(groupId)
        setGroupPoints(points)
      }
      loadRanking()
      setShowPointsModal(false)
      setDelta(0)
      setReason('')
    } catch (err) {
      setError('添加积分失败：' + (err as Error).message)
    }
  }

  const availableStudents = students.filter(student => 
    !groupMembers.some(member => member.studentId === student.id)
  )

  return (
    <div className="page">
      <div className="toolbar">
        <button className="primary" onClick={() => setEditing({ id: '', name: '', createdAt: 0 } as Group)}>
          <Plus size={18} />
          添加小组
        </button>
        <button onClick={() => setShowRandomGrouping(true)}>
          <RefreshCw size={18} />
          随机分组
        </button>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3><Users size={20} /> 小组列表</h3>
          {loading ? (
            <p>加载中…</p>
          ) : (
            <div className="group-grid">
              {groups.map((group) => (
                <div 
                  key={group.id}
                  className={`group-card ${selectedGroup?.id === group.id ? 'active' : ''}`}
                  onClick={() => handleSelectGroup(group)}
                >
                  <div className="group-info">
                    <span className="group-name">{group.name}</span>
                    {group.description && <span className="group-desc">{group.description}</span>}
                  </div>
                  <div className="group-stats">
                    <span className="group-stat">
                      成员: <strong>{groupMembers.filter(m => m.groupId === group.id).length}</strong>
                    </span>
                    <span className="group-stat">
                      积分: <strong>{ranking.find(item => item.group.id === group.id)?.points || 0}</strong>
                    </span>
                  </div>
                  <div className="group-actions">
                    <button className="small" onClick={(e) => {
                      e.stopPropagation()
                      setEditing(group)
                    }}>
                      <Edit2 size={14} />
                      编辑
                    </button>
                    <button className="small danger" onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGroup(group.id)
                    }}>
                      <Trash2 size={14} />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && groups.length === 0 && <div className="panel-empty">
            <h3><Users size={48} /></h3>
            <p>暂无小组</p>
            <p className="muted">请添加或使用随机分组</p>
          </div>}
        </div>

        <div className="panel">
          {selectedGroup ? (
            <>
              <div className="group-header">
                <h3>{selectedGroup.name}</h3>
                {selectedGroup.description && <p className="group-desc">{selectedGroup.description}</p>}
                <div className="group-stats">
                  <span>成员: {groupMembers.length}</span>
                  <span>积分: {groupPoints}</span>
                  <button className="small primary" onClick={() => setShowPointsModal(true)}>
                    <PlusMinus size={14} />
                    加减分
                  </button>
                </div>
              </div>
              
              <h4>成员列表</h4>
              <ul className="member-list">
                {groupMembers.map((member) => {
                  const student = students.find(s => s.id === member.studentId)
                  return (
                    <li key={member.id}>
                      <div className="member-info">
                        {member.isLeader && <Crown size={14} className="leader-icon" />}
                        <span>{student?.name || '未知'}</span>
                        {student?.studentNo && <span className="member-no">{student.studentNo}</span>}
                      </div>
                      <div className="member-actions">
                        {!member.isLeader && (
                          <button className="small" onClick={() => handleSetLeader(selectedGroup.id, member.studentId)}>
                            设置为组长
                          </button>
                        )}
                        <button className="small danger" onClick={() => handleRemoveMember(selectedGroup.id, member.studentId)}>
                          移除
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              
              {availableStudents.length > 0 && (
                <div className="add-member">
                  <h4>添加成员</h4>
                  <select onChange={(e) => {
                    const studentId = e.target.value
                    if (studentId) {
                      handleAddMember(selectedGroup.id, studentId)
                      e.target.value = ''
                    }
                  }}>
                    <option value="">选择学生</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.studentNo})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <div className="panel-empty">
              <h3><Award size={48} /></h3>
              <p>选择一个小组查看详情</p>
              <p className="muted">或使用随机分组功能快速创建小组</p>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <h3><Award size={20} /> 小组排行榜</h3>
        <div className="ranking-list">
          {ranking.map((item, index) => (
            <div key={item.group.id} className="ranking-item">
              <div className="ranking-rank">{index + 1}</div>
              <div className="ranking-group">{item.group.name}</div>
              <div className="ranking-points">{item.points}</div>
            </div>
          ))}
        </div>
        {ranking.length === 0 && <p className="muted">暂无小组数据</p>}
      </div>

      {editing && (
        <EditGroupModal
          group={editing}
          onSave={(data) => {
            if (editing.id) {
              handleUpdateGroup(editing.id, data)
            } else {
              handleCreateGroup(data.name, data.description)
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {showRandomGrouping && (
        <RandomGroupingModal
          studentCount={students.length}
          groupCount={groupCount}
          onGroupCountChange={setGroupCount}
          onSubmit={handleRandomGrouping}
          onClose={() => setShowRandomGrouping(false)}
        />
      )}

      {showPointsModal && selectedGroup && (
        <GroupPointsModal
          groupName={selectedGroup.name}
          delta={delta}
          onDeltaChange={setDelta}
          reason={reason}
          onReasonChange={setReason}
          onSubmit={() => handleAddGroupPoints(selectedGroup.id)}
          onClose={() => setShowPointsModal(false)}
        />
      )}
    </div>
  )
}

function EditGroupModal({
  group,
  onSave,
  onClose
}: {
  group: Group
  onSave: (data: { name: string; description?: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{group.id ? '编辑小组' : '添加小组'}</h3>
        <div className="form-group">
          <label>小组名称 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>描述</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="可选" />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button
            className="primary"
            onClick={() => {
              if (!name.trim()) return alert('小组名称必填')
              onSave({ name: name.trim(), description: description.trim() || undefined })
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function RandomGroupingModal({
  studentCount,
  groupCount,
  onGroupCountChange,
  onSubmit,
  onClose
}: {
  studentCount: number
  groupCount: number
  onGroupCountChange: (count: number) => void
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>随机分组</h3>
        <p className="muted">当前共有 {studentCount} 名学生</p>
        <div className="form-group">
          <label>小组数量</label>
          <input
            type="number"
            value={groupCount}
            onChange={(e) => onGroupCountChange(parseInt(e.target.value) || 1)}
            min={1}
            max={studentCount}
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={onSubmit}>
            开始分组
          </button>
        </div>
      </div>
    </div>
  )
}

function GroupPointsModal({
  groupName,
  delta,
  onDeltaChange,
  reason,
  onReasonChange,
  onSubmit,
  onClose
}: {
  groupName: string
  delta: number
  onDeltaChange: (delta: number) => void
  reason: string
  onReasonChange: (reason: string) => void
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>为 {groupName} 加减分</h3>
        <div className="form-group">
          <label>分值（正加负减）</label>
          <input
            type="number"
            value={delta || ''}
            onChange={(e) => onDeltaChange(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>原因</label>
          <input value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="选填" />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={onSubmit}>
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
