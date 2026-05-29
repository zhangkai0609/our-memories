import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getSpaceInfo, linkPartner, unlinkPartner } from '../lib/space'

import avatarPets from '../assets/profile/profile-avatar-pets.webp'
import heroPolaroid from '../assets/profile/profile-hero-polaroid.webp'
import heroHousePhoto from '../assets/profile/profile-hero-house-photo.webp'
import memberGift from '../assets/profile/profile-member-gift.webp'
import profileTeddy from '../assets/profile/profile-teddy.webp'
import notePaper from '../assets/profile/profile-note-paper.webp'
import bottomLeftFlower from '../assets/profile/profile-bottom-left-flower.webp'
import daisyNearTeddy from '../assets/profile/profile-daisy-near-teddy.webp'
import topFlower from '../assets/profile/profile-top-flower.webp'
import laceHeart from '../assets/profile/profile-lace-heart.webp'
import pinkFlowerCard from '../assets/profile/profile-pink-flower-card.webp'
import leftFlowerMember from '../assets/profile/profile-left-flower-member.webp'

import settingsHeroPolaroid from '../assets/settings/settings-hero-polaroid.webp'
import settingsHeroHousePhoto from '../assets/settings/settings-hero-house-photo.webp'
import settingsTopFlower from '../assets/settings/settings-top-flower.webp'
import settingsLaceHeart from '../assets/settings/settings-lace-heart.webp'
import settingsTeddy from '../assets/settings/settings-teddy.webp'
import settingsBottomFlower from '../assets/settings/settings-bottom-flower.webp'
import settingsBottomLace from '../assets/settings/settings-bottom-lace.webp'
import settingsPaperTape from '../assets/settings/settings-paper-tape.webp'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#e87c69', pFixed: '#ffdad4',
  secondary: '#536346', brown: '#3f302b', text: '#56423f', light: '#8b7770',
  border: '#dcc0bc', card: '#fcf9f2', tagBg: '#f7e4dc',
}

const navItems = [
  { id: 'home', icon: '🏠', label: '首页', to: '/' },
  { id: 'diary', icon: '📔', label: '日记', to: '/gallery' },
  { id: 'new', icon: '＋', label: '', to: '/new', primary: true },
  { id: 'map', icon: '🗺', label: '地图', to: '/map' },
  { id: 'profile', icon: '👤', label: '我的', to: '/my' },
]

const settingsItems = [
  [
    { id: 'space', icon: '🏠', title: '小窝设置', desc: '管理你们的小窝' },
    { id: 'privacy', icon: '🔒', title: '隐私设置', desc: '守护你们的回忆' },
    { id: 'backup', icon: '💾', title: '数据备份', desc: '备份回忆，永不丢失' },
    { id: 'trash', icon: '🗑', title: '回收站', desc: '找回删除的内容' },
  ],
  [
    { id: 'theme', icon: '🎨', title: '主题皮肤', desc: '更换喜欢的风格' },
    { id: 'notify', icon: '🔔', title: '通知设置', desc: '管理消息通知' },
    { id: 'export', icon: '📤', title: '导出回忆', desc: '导出您的回忆数据' },
    { id: 'help', icon: '💬', title: '帮助与反馈', desc: '常见问题与反馈' },
  ],
]

export default function MyPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ diary: 128, photos: 356, footprints: 48, dates: 12 })
  const [spaceInfo, setSpaceInfo] = useState(null)
  const [showPartnerInput, setShowPartnerInput] = useState(false)
  const [partnerPhone, setPartnerPhone] = useState('')
  const [linkMsg, setLinkMsg] = useState('')
  const [showSpaceModal, setShowSpaceModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      const roomCode = localStorage.getItem('room_code')
      if (roomCode) {
        const { count: diaryCount } = await supabase.from('memories').select('id', { count: 'exact' }).eq('room_code', roomCode)
        if (diaryCount != null) setStats(s => ({ ...s, diary: diaryCount }))
      }
      const info = await getSpaceInfo()
      setSpaceInfo(info)
    } catch { /* use defaults */ }
  }

  async function handleLinkPartner() {
    if (!/^1[3-9]\d{9}$/.test(partnerPhone.replace(/[\s\-]/g, ''))) {
      setLinkMsg('请输入正确的手机号'); return
    }
    const result = await linkPartner(partnerPhone)
    if (result.success) {
      setLinkMsg('关联成功！对方注册时将自动加入你的小窝')
      setShowPartnerInput(false)
      const info = await getSpaceInfo()
      setSpaceInfo(info)
    } else {
      setLinkMsg(result.error || '关联失败')
    }
  }

  async function handleUnlink() {
    await unlinkPartner()
    const info = await getSpaceInfo()
    setSpaceInfo(info)
  }

  const statItems = [
    { icon: '📔', label: '日记', value: stats.diary, unit: '篇' },
    { icon: '📷', label: '相册', value: stats.photos, unit: '张' },
    { icon: '🗺', label: '足迹', value: stats.footprints, unit: '个' },
    { icon: '💝', label: '纪念日', value: stats.dates, unit: '个' },
  ]

  // 设置页视图
  if (showSettings) {
    return (
      <SettingsView onBack={() => setShowSettings(false)} />
    )
  }

  return (
    <div style={{ minHeight: '100svh', background: C.bg, paddingBottom: 100, position: 'relative' }}>
      {/* 背景纸纹 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* ===== HEADER ===== */}
        <MyHeader navigate={navigate} onSettings={() => setShowSettings(true)} />

        {/* ===== USER INFO ===== */}
        <UserInfoCard spaceInfo={spaceInfo} onManageSpace={() => setShowSpaceModal(true)} />

        {/* ===== STATS ===== */}
        <StatsCard items={statItems} />

        {/* ===== MEMBER CARD ===== */}
        <MemberCard />

        {/* ===== SETTINGS ===== */}
        <SettingsSection />

        {/* ===== BOTTOM NOTE ===== */}
        <BottomNote />

        <div style={{ height: 20 }} />
      </div>

      {/* ===== BOTTOM NAV ===== */}
      <BottomNav navigate={navigate} />

      {/* ===== SPACE MODAL ===== */}
      {showSpaceModal && (
        <SpaceModal
          spaceInfo={spaceInfo}
          showPartnerInput={showPartnerInput}
          partnerPhone={partnerPhone}
          setPartnerPhone={setPartnerPhone}
          linkMsg={linkMsg}
          onLinkPartner={handleLinkPartner}
          onUnlink={handleUnlink}
          onToggleInput={() => { setShowPartnerInput(!showPartnerInput); setLinkMsg(''); }}
          onClose={() => { setShowSpaceModal(false); setShowPartnerInput(false); setLinkMsg(''); }}
        />
      )}

      <style>{myCSS}</style>
    </div>
  )
}

// ====================== HEADER ======================
function MyHeader({ navigate, onSettings }) {
  return (
    <header style={{ padding: '14px 18px 6px', position: 'relative' }}>
      {/* 顶部花装饰 */}
      <img src={topFlower} alt="" style={{
        position: 'absolute', top: 2, right: 8, width: 60, opacity: 0.52,
        pointerEvents: 'none', zIndex: 0,
        mixBlendMode: 'multiply',
        maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div>
          <h1 style={{
            fontFamily: 'EB Garamond, serif', fontSize: 28, color: C.primary,
            fontWeight: 600, margin: 0, letterSpacing: '-0.01em',
          }}>
            My · 我的
          </h1>
          <p style={{ fontSize: 12, color: C.light, margin: '2px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            属于我们的小窝，收藏所有回忆
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 4 }}>
          <button style={headerIconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button style={headerIconBtn} onClick={onSettings}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button style={headerIconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>
        </div>
      </div>
    </header>
  )
}

// ====================== USER INFO CARD ======================
function UserInfoCard({ spaceInfo, onManageSpace }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      margin: '4px 18px 14px', padding: '16px',
      background: 'linear-gradient(135deg, rgba(252,249,242,0.96), rgba(250,245,238,0.92))',
      borderRadius: 24, border: '1px solid rgba(220,192,188,0.25)',
      boxShadow: '0 6px 24px rgba(156,66,51,0.06)',
      position: 'relative',
    }}>
      {/* 蕾丝装饰 */}
      <img src={laceHeart} alt="" style={{
        position: 'absolute', top: -6, right: 10, width: 36, opacity: 0.5,
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* 头像 */}
      <div style={{
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(156,66,51,0.18)',
          boxShadow: '0 3px 14px rgba(156,66,51,0.10)',
        }}>
          <img src={avatarPets} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* 编辑按钮 */}
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 22, height: 22, borderRadius: '50%',
          background: C.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, border: '2px solid #fff',
          boxShadow: '0 2px 6px rgba(156,66,51,0.20)',
        }}>✎</div>
      </div>

      {/* 信息 */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.brown, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          小周同学
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: 4, padding: '3px 10px', borderRadius: 12,
          background: C.tagBg, color: C.primary,
          fontSize: 11, fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif',
          border: '1px solid rgba(156,66,51,0.10)',
        }}>
          <span style={{ fontSize: 10 }}>♥</span> 情侣模式
        </span>

        {/* 伴侣信息 */}
        {spaceInfo?.partner_phone ? (
          <div style={{ marginTop: 4, fontSize: 11, color: C.secondary, fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            💑 已关联 {spaceInfo.partner_phone}
            <button onClick={onManageSpace} style={{
              background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 10,
              textDecoration: 'underline',
            }}>管理</button>
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            <button onClick={onManageSpace} style={{
              background: 'none', border: 'none', color: C.pLight, cursor: 'pointer',
              fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 0,
            }}>
              💑 邀请伴侣加入 →
            </button>
          </div>
        )}
      </div>

      {/* 拍立得照片 */}
      <div style={{
        position: 'relative', flexShrink: 0, width: 56, height: 68,
        transform: 'rotate(4deg)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, background: '#faf7f2',
          borderRadius: 3, boxShadow: '0 3px 12px rgba(156,66,51,0.10)',
          padding: '4px 4px 14px',
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 1, overflow: 'hidden', background: '#e8e0d8' }}>
            <img src={heroHousePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
        {/* 胶带 */}
        <div style={{
          position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(-3deg)',
          width: 22, height: 10, background: 'rgba(252,249,242,0.6)', borderRadius: 2, zIndex: 2,
        }} />
      </div>
    </div>
  )
}

// ====================== STATS CARD ======================
function StatsCard({ items }) {
  return (
    <div style={{
      margin: '0 18px 14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      background: 'linear-gradient(135deg, rgba(252,249,242,0.96), rgba(250,245,238,0.92))',
      borderRadius: 24, padding: '18px 10px',
      border: '1px solid rgba(220,192,188,0.25)',
      boxShadow: '0 4px 20px rgba(156,66,51,0.05)',
      position: 'relative',
    }}>
      {/* 粉色花装饰 */}
      <img src={pinkFlowerCard} alt="" style={{
        position: 'absolute', top: -4, right: 12, width: 34, opacity: 0.55,
        pointerEvents: 'none', zIndex: 1,
        mixBlendMode: 'multiply',
        maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
      }} />

      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          position: 'relative', zIndex: 1,
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {item.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.primary, fontFamily: 'EB Garamond, serif', lineHeight: 1 }}>
              {item.value}
            </span>
            <span style={{ fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {item.unit}
            </span>
          </div>
          {/* 虚线分隔 */}
          {i < 3 && (
            <div style={{
              position: 'absolute', right: 0, top: '20%', height: '60%',
              width: 1, borderLeft: '1px dashed rgba(220,192,188,0.35)',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ====================== MEMBER CARD ======================
function MemberCard() {
  return (
    <div style={{
      margin: '0 18px 14px', position: 'relative',
      background: 'linear-gradient(135deg, rgba(255,240,243,0.98) 0%, rgba(255,230,235,0.90) 100%)',
      borderRadius: 24, padding: '18px 16px',
      border: '1px solid rgba(156,66,51,0.12)',
      boxShadow: '0 4px 20px rgba(156,66,51,0.05)',
      display: 'flex', alignItems: 'center', gap: 12,
      overflow: 'hidden',
    }}>
      {/* 装饰 */}
      <img src={leftFlowerMember} alt="" style={{
        position: 'absolute', left: -6, top: -6, width: 56, opacity: 0.4,
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
        maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
      }} />
      <img src={memberGift} alt="" style={{
        position: 'absolute', right: 8, top: -4, width: 52, opacity: 0.65,
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* 文字 */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <h3 style={{
          fontFamily: 'EB Garamond, serif', fontSize: 18, color: C.primary,
          fontWeight: 600, margin: '0 0 4px',
        }}>我们的回忆会员</h3>
        <p style={{ fontSize: 12, color: C.light, margin: '0 0 8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          解锁更多专属回忆特权
        </p>
        <span style={{ fontSize: 11, color: C.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          有效至 2025.06.20
        </span>
      </div>

      {/* 按钮 */}
      <button style={{
        padding: '8px 18px', borderRadius: 999,
        background: C.card, color: C.primary,
        border: '1px solid rgba(156,66,51,0.15)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        boxShadow: '0 2px 8px rgba(156,66,51,0.06)',
        whiteSpace: 'nowrap', position: 'relative', zIndex: 1,
      }}>查看特权</button>
    </div>
  )
}

// ====================== SETTINGS ======================
function SettingsSection() {
  return (
    <div style={{
      margin: '0 18px 14px',
      background: 'linear-gradient(135deg, rgba(252,249,242,0.96), rgba(250,245,238,0.92))',
      borderRadius: 24, padding: '18px 14px',
      border: '1px solid rgba(220,192,188,0.25)',
      boxShadow: '0 4px 20px rgba(156,66,51,0.05)',
    }}>
      <h3 style={{
        fontFamily: 'EB Garamond, serif', fontSize: 18, color: C.brown,
        fontWeight: 600, margin: '0 0 14px 6px',
      }}>设置</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {settingsItems.map((col, colIdx) => (
          <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {col.map(item => (
              <button key={item.id} onClick={() => console.log(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 12px', borderRadius: 16,
                  border: '1px solid rgba(220,192,188,0.20)',
                  background: 'rgba(252,249,242,0.6)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(156,66,51,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(156,66,51,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(252,249,242,0.6)'
                  e.currentTarget.style.borderColor = 'rgba(220,192,188,0.20)'
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: C.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.brown, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 10, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.desc}
                  </div>
                </div>
                <span style={{ color: C.light, fontSize: 12, flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ====================== BOTTOM NOTE ======================
function BottomNote() {
  return (
    <div style={{
      margin: '0 18px', position: 'relative',
      background: 'linear-gradient(135deg, rgba(252,249,242,0.94), rgba(250,245,238,0.88))',
      borderRadius: 20, padding: '18px 14px',
      border: '1px solid rgba(220,192,188,0.25)',
      boxShadow: '0 4px 16px rgba(156,66,51,0.04)',
      display: 'flex', alignItems: 'center', gap: 10,
      overflow: 'hidden',
      transform: 'rotate(-0.3deg)',
    }}>
      {/* 便签纸 */}
      <img src={notePaper} alt="" style={{
        position: 'absolute', left: -4, bottom: -4, width: 56, opacity: 0.45,
        pointerEvents: 'none', mixBlendMode: 'multiply',
      }} />
      {/* 左下花 */}
      <img src={bottomLeftFlower} alt="" style={{
        position: 'absolute', left: -4, bottom: -2, width: 42, opacity: 0.48,
        pointerEvents: 'none', mixBlendMode: 'multiply',
        maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
      }} />

      {/* 文字 */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 15, color: C.brown, fontWeight: 500, margin: '0 0 4px' }}>
          每一份回忆都值得珍藏
        </p>
        <p style={{ fontSize: 12, color: C.light, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          感谢你与我一起记录生活的点滴
        </p>
      </div>

      {/* 小熊 */}
      <img src={profileTeddy} alt="" style={{
        width: 64, flexShrink: 0, position: 'relative', zIndex: 1,
        marginRight: -4, marginBottom: -6, objectFit: 'contain',
      }} />
      {/* 小熊旁的雏菊 */}
      <img src={daisyNearTeddy} alt="" style={{
        position: 'absolute', right: 52, bottom: 2, width: 24, opacity: 0.5,
        pointerEvents: 'none', zIndex: 2,
      }} />
    </div>
  )
}

// ====================== BOTTOM NAV ======================
function BottomNav({ navigate }) {
  const [active] = useState('profile')

  function handleNav(item) {
    if (item.to) navigate(item.to)
  }

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', justifyContent: 'center',
      padding: '0 20px max(14px, env(safe-area-inset-bottom))',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: 'rgba(252,249,242,0.88)', backdropFilter: 'blur(16px)',
        borderRadius: 24, padding: '8px 12px',
        boxShadow: '0 4px 24px rgba(156,66,51,0.10), 0 1px 4px rgba(0,0,0,0.04)',
        border: '1px solid rgba(220,192,188,0.25)',
      }}>
        {navItems.map(item => (
          item.primary ? (
            <button key={item.id} onClick={() => handleNav(item)} style={{
              width: 44, height: 44, borderRadius: '50%',
              background: C.primary, color: '#fff',
              border: 'none', fontSize: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(156,66,51,0.32)',
              marginTop: -22, transition: 'transform 0.2s',
            }}>
              ＋
            </button>
          ) : (
            <button key={item.id} onClick={() => handleNav(item)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
              color: active === item.id ? C.primary : C.light,
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
              transition: 'color 0.2s',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontWeight: active === item.id ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        ))}
      </div>
    </nav>
  )
}

// ====================== SPACE MODAL ======================
function SpaceModal({ spaceInfo, showPartnerInput, partnerPhone, setPartnerPhone, linkMsg, onLinkPartner, onUnlink, onToggleInput, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(30,10,8,0.40)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 360,
        background: C.card, borderRadius: 24, padding: '24px 20px',
        boxShadow: '0 16px 48px rgba(60,20,15,0.20)',
        border: '1px solid rgba(220,192,188,0.30)',
        animation: 'modalIn 0.25s ease-out',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(0,0,0,0.04)', border: 'none',
          cursor: 'pointer', fontSize: 16, color: C.light,
        }}>✕</button>

        <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, color: C.brown, fontWeight: 600, margin: '0 0 16px' }}>
          🏠 小窝设置
        </h3>

        {spaceInfo?.partner_phone ? (
          <div>
            <div style={{
              padding: '12px 14px', borderRadius: 14,
              background: 'rgba(83,99,70,0.06)', border: '1px solid rgba(83,99,70,0.15)',
              marginBottom: 14,
            }}>
              <p style={{ fontSize: 13, color: C.secondary, margin: '0 0 4px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500 }}>
                💑 已关联伴侣
              </p>
              <p style={{ fontSize: 14, color: C.brown, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                {spaceInfo.partner_phone}
              </p>
            </div>
            <button onClick={onUnlink} style={{
              width: '100%', padding: '12px', borderRadius: 14,
              background: 'rgba(156,66,51,0.06)', border: '1px solid rgba(156,66,51,0.15)',
              color: C.primary, cursor: 'pointer', fontSize: 13,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              解除关联
            </button>
          </div>
        ) : showPartnerInput ? (
          <div>
            <p style={{ fontSize: 13, color: C.light, margin: '0 0 10px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              输入伴侣注册时使用的手机号，对方注册后将自动加入你的小窝，共享所有回忆。
            </p>
            <input type="tel" placeholder="伴侣手机号" value={partnerPhone}
              onChange={e => setPartnerPhone(e.target.value)} maxLength={13}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 14,
                border: '1.5px solid rgba(220,192,188,0.5)', fontSize: 15,
                background: C.card, color: C.brown, outline: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                marginBottom: 10,
              }} />
            {linkMsg && (
              <p style={{ fontSize: 12, color: linkMsg.includes('成功') ? C.secondary : C.primary, margin: '0 0 10px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {linkMsg}
              </p>
            )}
            <button onClick={onLinkPartner} style={{
              width: '100%', padding: '12px', borderRadius: 14,
              background: C.primary, color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 12px rgba(156,66,51,0.20)',
            }}>
              确认关联
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: C.light, margin: '0 0 14px', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.6 }}>
              关联伴侣后，你们将共享同一个回忆空间。对方注册后所有回忆数据会自动同步。
            </p>
            <button onClick={onToggleInput} style={{
              width: '100%', padding: '12px', borderRadius: 14,
              background: C.primary, color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 12px rgba(156,66,51,0.20)',
            }}>
              💑 邀请伴侣加入
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ====================== SETTINGS VIEW ======================
const accountItems = [
  { id: 'accountInfo', icon: '👤', title: '账号信息', desc: '查看和修改个人信息' },
  { id: 'password', icon: '🔑', title: '密码设置', desc: '修改登录密码' },
  { id: 'privacy', icon: '🛡', title: '隐私设置', desc: '管理谁可以看到我们的回忆' },
  { id: 'devices', icon: '📱', title: '登录设备管理', desc: '查看和管理已登录设备' },
]

const generalItems = [
  { id: 'theme', icon: '🎨', title: '主题皮肤', desc: '更换喜欢的风格' },
  { id: 'fontSize', icon: '🔤', title: '字体大小', desc: '调整文字显示大小' },
  { id: 'notify', icon: '🔔', title: '通知设置', desc: '管理消息通知' },
  { id: 'language', icon: '🌐', title: '语言设置', desc: '选择你的语言' },
]

const aboutItems = [
  { id: 'helpFeedback', icon: '💬', title: '帮助与反馈', desc: '常见问题与反馈' },
  { id: 'about', icon: '📖', title: '关于 Our Memories', desc: '了解我们的故事' },
]

function SettingsView({ onBack }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const navigate = useNavigate()

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError('')
    localStorage.removeItem('room_code')
    window.location.reload()
    // navigate 会被 RoomGuard 拦截到 /welcome
    }
  }

  return (
    <div style={{ minHeight: '100svh', background: C.bg, paddingBottom: 40, position: 'relative' }}>
      {/* 背景纸纹 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ===== HEADER ===== */}
        <div style={{ padding: '14px 18px 6px', position: 'relative' }}>
          <img src={settingsTopFlower} alt="" style={{
            position: 'absolute', top: 2, right: 8, width: 60, opacity: 0.52,
            pointerEvents: 'none', zIndex: 0, mixBlendMode: 'multiply',
            maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
          }} />
          <img src={settingsLaceHeart} alt="" style={{
            position: 'absolute', top: 40, right: 14, width: 36, opacity: 0.45,
            pointerEvents: 'none', zIndex: 0,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <button onClick={onBack} style={{
              background: 'none', border: 'none', color: C.primary, cursor: 'pointer',
              fontSize: 15, padding: 0, fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>← 返回</button>
            <h1 style={{
              fontFamily: 'EB Garamond, serif', fontSize: 26, color: C.primary,
              fontWeight: 600, margin: '4px 0 0', letterSpacing: '-0.01em',
            }}>设置</h1>
            <p style={{ fontSize: 12, color: C.light, margin: '2px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              管理你的小窝，让回忆更美好
            </p>
          </div>

          {/* 拍立得照片装饰 */}
          <div style={{
            position: 'absolute', top: 16, right: 10, width: 54, height: 64,
            transform: 'rotate(5deg)', zIndex: 1,
          }}>
            <div style={{
              position: 'absolute', inset: 0, background: '#faf7f2',
              borderRadius: 3, boxShadow: '0 3px 12px rgba(156,66,51,0.10)',
              padding: '4px 4px 14px',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 1, overflow: 'hidden', background: '#e8e0d8' }}>
                <img src={settingsHeroHousePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{
              position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(-4deg)',
              width: 20, height: 10, background: 'rgba(252,249,242,0.6)', borderRadius: 2, zIndex: 2,
            }} />
          </div>
        </div>

        {/* ===== NOTEBOOK PANEL ===== */}
        <div style={{
          margin: '10px 18px', position: 'relative',
          background: 'linear-gradient(180deg, rgba(252,249,242,0.99) 0%, rgba(250,245,238,0.96) 100%)',
          borderRadius: 28, border: '1px solid rgba(220,192,188,0.25)',
          boxShadow: '0 8px 32px rgba(156,66,51,0.06), 0 2px 8px rgba(90,55,45,0.03)',
          padding: '20px 14px 10px',
          overflow: 'hidden',
        }}>
          {/* 网格纸纹理 */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 28,
            backgroundImage: `linear-gradient(rgba(156,66,51,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(156,66,51,0.05) 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
          }} />

          {/* 左侧装订孔 */}
          <div style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 16, zIndex: 2,
          }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, rgba(255,240,243,0.8), rgba(220,192,188,0.4))',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 2px rgba(255,255,255,0.5)',
                border: '1px solid rgba(220,192,188,0.3)',
              }} />
            ))}
          </div>

          {/* 顶部胶带 */}
          <img src={settingsPaperTape} alt="" style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-3deg)',
            width: 70, opacity: 0.7, pointerEvents: 'none', zIndex: 1,
          }} />

          {/* 底部装饰 */}
          <img src={settingsBottomFlower} alt="" style={{
            position: 'absolute', bottom: 6, right: 6, width: 48, opacity: 0.5,
            pointerEvents: 'none', zIndex: 1, mixBlendMode: 'multiply',
            maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
          }} />
          <img src={settingsBottomLace} alt="" style={{
            position: 'absolute', bottom: 4, left: 18, width: 42, opacity: 0.45,
            pointerEvents: 'none', zIndex: 1,
          }} />

          <div style={{ position: 'relative', zIndex: 1, paddingLeft: 6 }}>

            {/* ===== 账号与安全 ===== */}
            <SettingsGroup title="账号与安全" icon="🔒" items={accountItems} />

            {/* ===== 通用设置 ===== */}
            <SettingsGroup title="通用设置" icon="⚙" items={generalItems} />

            {/* ===== 关于我们 ===== */}
            <SettingsGroup title="关于我们" icon="♥" items={aboutItems} />

          </div>
        </div>

        {/* ===== LOGOUT CARD ===== */}
        <div style={{
          margin: '14px 18px', position: 'relative',
          background: 'linear-gradient(135deg, rgba(252,249,242,0.94), rgba(255,240,243,0.90))',
          borderRadius: 22, padding: '18px 16px',
          border: '1px solid rgba(220,192,188,0.25)',
          boxShadow: '0 4px 16px rgba(156,66,51,0.05)',
          display: 'flex', alignItems: 'center', gap: 12,
          overflow: 'hidden',
        }}>
          {/* 小熊装饰 */}
          <img src={settingsTeddy} alt="" style={{
            position: 'absolute', right: 4, bottom: -8, width: 56, opacity: 0.55,
            pointerEvents: 'none', zIndex: 0,
          }} />

          {/* 左侧图标 */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(178,74,60,0.08)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, position: 'relative', zIndex: 1,
          }}>🚪</div>

          {/* 文字 + 按钮 */}
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#b24a3c', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              退出小屋
            </h3>
            <p style={{ fontSize: 12, color: C.light, margin: '2px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              退出当前账号
            </p>
          </div>

          <button onClick={() => setShowLogoutModal(true)} style={{
            padding: '10px 20px', borderRadius: 999,
            background: '#b24a3c', color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 3px 10px rgba(178,74,60,0.18)',
            whiteSpace: 'nowrap', position: 'relative', zIndex: 1,
          }}>
            退出
          </button>
        </div>

      </div>

      {/* ===== LOGOUT CONFIRM MODAL ===== */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div onClick={() => { if (!loggingOut) setShowLogoutModal(false) }} style={{
            position: 'absolute', inset: 0,
            background: 'rgba(30,10,8,0.40)', backdropFilter: 'blur(4px)',
          }} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: 330,
            background: C.card, borderRadius: 24, padding: '28px 22px 22px',
            boxShadow: '0 16px 48px rgba(60,20,15,0.22)',
            border: '1px solid rgba(220,192,188,0.30)',
            textAlign: 'center',
            animation: 'modalIn 0.25s ease-out',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <h3 style={{
              fontFamily: 'EB Garamond, serif', fontSize: 20, color: C.brown,
              fontWeight: 600, margin: '0 0 6px',
            }}>确定要退出小屋吗？</h3>
            <p style={{
              fontSize: 13, color: C.light, margin: '0 0 20px',
              fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.6,
            }}>
              退出后需要重新登录才能继续查看回忆。
            </p>

            {logoutError && (
              <p style={{
                fontSize: 12, color: '#b24a3c', margin: '0 0 14px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: 'rgba(178,74,60,0.05)', padding: '8px 12px', borderRadius: 10,
              }}>{logoutError}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogoutModal(false)} disabled={loggingOut}
                style={{
                  flex: 1, padding: '12px', borderRadius: 16,
                  background: 'transparent', border: '1.5px solid rgba(220,192,188,0.4)',
                  color: C.text, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>取消</button>
              <button onClick={handleLogout} disabled={loggingOut}
                style={{
                  flex: 1, padding: '12px', borderRadius: 16,
                  background: '#b24a3c', color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  opacity: loggingOut ? 0.7 : 1,
                  boxShadow: '0 3px 10px rgba(178,74,60,0.20)',
                }}>
                {loggingOut ? '退出中...' : '退出小屋'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ====================== SETTINGS GROUP ======================
function SettingsGroup({ title, icon, items }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <h3 style={{
          fontFamily: 'EB Garamond, serif', fontSize: 17, color: C.brown,
          fontWeight: 600, margin: 0,
        }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map(item => (
          <button key={item.id} onClick={() => console.log(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 14,
              border: '1px solid rgba(220,192,188,0.18)',
              background: 'rgba(252,249,242,0.5)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(156,66,51,0.04)'
              e.currentTarget.style.borderColor = 'rgba(156,66,51,0.22)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(252,249,242,0.5)'
              e.currentTarget.style.borderColor = 'rgba(220,192,188,0.18)'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: C.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.brown, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', marginTop: 1 }}>
                {item.desc}
              </div>
            </div>
            <span style={{ color: C.light, fontSize: 14, flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ====================== HELPERS ======================
const headerIconBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const myCSS = `
@keyframes modalIn {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
button:active { transform: scale(0.95) !important; }
input:focus { outline: none; border-color: ${C.primary} !important; box-shadow: 0 0 0 3px rgba(156,66,51,0.08) !important; }
`
