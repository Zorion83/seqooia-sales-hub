import { useState, useMemo, useEffect } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts"

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août',
                'Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['lu','ma','me','je','ve','sa','di']
const BONUS  = [
  {ca:5000,b:200},{ca:10000,b:200},{ca:15000,b:250},{ca:20000,b:300},
  {ca:25000,b:350},{ca:30000,b:400},{ca:35000,b:450},{ca:40000,b:500},
]
const USER = { name:'Jean', email:'remycdl@seqooia.com', initial:'J' }

const WEBHOOK_SALES_URL = 'https://ihdvyfsvkgbeixyfnzxi.supabase.co/functions/v1/iclosed-webhook'
const WEBHOOK_RDV_URL   = 'https://ihdvyfsvkgbeixyfnzxi.supabase.co/functions/v1/iclosed-rdv-webhook'

const RDV_STATUSES = {
  booked:    { label:'Réservé',  bg:'rgba(59,130,246,0.15)',  color:'#60a5fa',  dot:'#3b82f6' },
  present:   { label:'Présent',  bg:'rgba(34,197,94,0.15)',   color:'#4ade80',  dot:'#22c55e' },
  'no-show': { label:'No-show',  bg:'rgba(239,68,68,0.15)',   color:'#f87171',  dot:'#ef4444' },
  cancelled: { label:'Annulé',   bg:'rgba(107,114,128,0.15)', color:'#9ca3af',  dot:'#6b7280' },
}

const RDV_JSON_EXAMPLE = `{
  "contact_name": "Jean Dupont",
  "contact_email": "jean.dupont@example.com",
  "closer_email": "remycdl@seqooia.com",
  "appointment_date": "2026-03-20T14:00:00",
  "status": "booked"
}`

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? JSON.parse(s) : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)) }
    catch {}
  }, [key, val])
  return [val, setVal]
}

/* ══════════════════════════════════════════════
   FORMATTERS
══════════════════════════════════════════════ */
const fmtEur  = (n) =>
  new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n) + ' €'
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})
}
const fmtDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}) +
    ' ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
}
const pct = (a,b) => b===0 ? '0%' : (Math.round(a/b*100)) + '%'

/* ══════════════════════════════════════════════
   SVG IDCON SYSTEM
══════════════════════════════════════════════ */
function Ico({ path, size=18, className="", stroke="currentColor", fill="none", style={} }) {
  const paths = Array.isArray(path) ? path : [path]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}>
      {paths.map((p,i) => <path key={i} d={p} />)}
    </svg>
  )
}
const IC = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  cart:      "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  calendar:  "M8 2v4M16 2v4M3 10h18M21 8H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z",
  clock:     "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  trend:     "M22 7l-8.5 8.5-5-5L2 17M16 7h6v6",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  euro:      "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM6 12h8M7.5 8.5C8.5 6.5 10 5.5 12 5.5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5",
  target:    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  phone:     "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  zap:       "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  bell:      "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  chevL:     "M15 18l-6-6 6-6",
  chevR:     "M9 18l6-6-6-6",
  check:     "M20 6L9 17l-5-5",
  xmark:     "M18 6L6 18M6 6l12 12",
  copy:      "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2M8 4h8",
  link:      "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  lock:      "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  file:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  moon:      "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  info:      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
  trash:     "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  play:      "M5 3l14 9-14 9V3z",
  webhook:   "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z",
  alertCirc: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
  pencil:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
}

/* ══════════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════════ */
function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
      style={{
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? 'white' : '#9ca3af',
      }}
      onMouseEnter={e=>{ if(!active){ e.currentTarget.style.color='#e5e7eb'; e.currentTarget.style.background='rgba(255,255,255,0.05)' }}}
      onMouseLeave={e=>{ if(!active){ e.currentTarget.style.color='#9ca3af'; e.currentTarget.style.background='transparent' }}}
    >
      <Ico path={IC[icon]} size={15} />
      <span>{label}</span>
    </button>
  )
}

function Sidebar({ page, setPage }) {
  return (
    <div className="flex flex-col flex-shrink-0"
      style={{width:256, background:'#0d0f18', borderRight:'1px solid rgba(255,255,255,0.05)'}}>
      <div className="flex items-center gap-3 px-4 py-4"
        style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:'#22c55e'}}>
          <Ico path={IC.bell} size={17} stroke="white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Seqooia</div>
          <div className="text-xs" style={{color:'#6b7280'}}>Sales Hub</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        <NavItem icon="dashboard"  label="Dashboard"       active={page==='dashboard'}   onClick={()=>setPage('dashboard')} />
        <NavItem icon="cart"       label="Mes Ventes"      active={page==='ventes'}      onClick={()=>setPage('ventes')} />
        <NavItem icon="calendar"   label="Mes RDVs"        active={page==='rdvs'}        onClick={()=>setPage('rdvs')} />
        <NavItem icon="clock"      label="Disponibilités"  active={page==='dispo'}       onClick={()=>setPage('dispo')} />
        <NavItem icon="trend"      label="Mes Commissions" active={page==='commissions'} onClick={()=>setPage('commissions')} />
        <NavItem icon="settings"   label="Réglages"        active={page==='reglages'}    onClick={()=>setPage('reglages')} />
      </nav>
      <div className="p-3" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="flex items-center gap-3 px-2 py-1.5 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{background:'#16a34a'}}>
            {USER.initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{USER.name}</div>
            <div className="text-xs truncate" style={{color:'#6b7280'}}>{USER.email}</div>
          </div>
        </div>
        <div className="flex items-center px-1">
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all"
            style={{color:'#9ca3af'}}
            onMouseEnter={e=>e.currentTarget.style.color='#e5e7eb'}
            onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}>
            <Ico path={IC.logout} size={13} />
            <span>Déconnexion</span>
          </button>
          <button className="ml-auto p-1.5 rounded-md" style={{color:'#9ca3af'}}>
            <Ico path={IC.moon} size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MonthNav({ month, year, onPrev, onNext }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrev} className="p-1.5 rounded-md transition-all" style={{color:'#9ca3af'}}
        onMouseEnter={e=>{ e.currentTarget.style.color='white'; e.currentTarget.style.background='rgba(255,255,255,0.1)' }}
        onMouseLeave={e=>{ e.currentTarget.style.color='#9ca3af'; e.currentTarget.style.background='transparent' }}>
        <Ico path={IC.chevL} size={15} />
      </button>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
        <Ico path={IC.calendar} size={13} style={{color:'#9ca3af'}} />
        <span className="text-sm text-white font-medium">{MONTHS[month]} {year}</span>
      </div>
      <button onClick={onNext} className="p-1.5 rounded-md transition-all" style={{color:'#9ca3af'}}
        onMouseEnter={e=>{ e.currentTarget.style.color='white'; e.currentTarget.style.background='rgba(255,255,255,0.1)' }}
        onMouseLeave={e=>{ e.currentTarget.style.color='#9ca3af'; e.currentTarget.style.background='transparent' }}>
        <Ico path={IC.chevR} size={15} />
      </button>
    </div>
  )
}

function Card({ children, className="" }) {
  return (
    <div className={`rounded-xl p-5 ${className}`}
      style={{background:'#131824', border:'1px solid #1e2232'}}>
      {children}
    </div>
  )
}

function StatCard({ label, value, icon, iconBg, iconColor, sub }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3"
      style={{background:'#131824', border:'1px solid #1e2232'}}>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{color:'#9ca3af'}}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{background: iconBg}}>
          <Ico path={IC[icon]} size={15} style={{color: iconColor}} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {sub && <div className="text-xs mt-1" style={{color:'#6b7280'}}>{sub}</div>}
      </div>
    </div>
  )
}

function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" style={{color:'#4b5563'}}>
      <Ico path={IC[icon]} size={40} className="mb-3 opacity-30" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = RDV_STATUSES[status] || RDV_STATUSES.booked
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{background: s.bg, color: s.color}}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: s.dot}} />
      {s.label}
    </span>
  )
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).catch(()=>{})
    setOk(true); setTimeout(()=>setOk(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1.5 rounded transition-all flex-shrink-0"
      style={{color: ok ? '#4ade80' : '#9ca3af'}}>
      <Ico path={ok ? IC.check : IC.copy} size={14} />
    </button>
  )
}

/* ══════════════════════════════════════════════
   PAGE: DASHBOARD
══════════════════════════════════════════════ */
function Dashboard({ month, year, onPrev, onNext, rdvs, offDays }) {
  const [chartPeriod, setChartPeriod] = useState('Mois')
  const hour = new Date().getHours()
  const greeting = hour < 6 ? 'Bonne nuit' : hour < 12 ? 'Bonjour'
    : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // Filter RDVs for current month
  const monthRdvs = useMemo(() => rdvs.filter(r => {
    const d = new Date(r.appointment_date)
    return d.getMonth()===month && d.getFullYear()===year
  }), [rdvs, month, year])

  const presents  = monthRdvs.filter(r => r.status==='present').length
  const noShows   = monthRdvs.filter(r => r.status==='no-show').length
  const totalRdvs = monthRdvs.length
  const closingPct = totalRdvs > 0 ? Math.round(presents / totalRdvs * 100) : 0

  // Offs this week
  const now  = new Date()
  const wMon = new Date(now); wMon.setDate(now.getDate() - ((now.getDay()+6)%7))
  const wSun = new Date(wMon); wSun.setDate(wMon.getDate()+6)
  const weekOffs = offDays.filter(d => {
    const dt = new Date(d.year, d.month, d.day)
    return dt >= wMon && dt <= wSun
  })

  const stats = [
    { label:'CA Total (TTC)',  value:'0,00 €', icon:'euro',   iconBg:'rgba(34,197,94,0.15)',   iconColor:'#4ade80', sub:'↗ 0% vs mois dernier' },
    { label:'Taux de closing', value: closingPct+'%', icon:'target', iconBg:'rgba(59,130,246,0.15)', iconColor:'#60a5fa',
      sub:`↗ ${closingPct}% — ${presents} ventes / ${totalRdvs} RDVs` },
    { label:'Cash collecté',   value:'0,00 €', icon:'trend',  iconBg:'rgba(34,197,94,0.15)',   iconColor:'#4ade80', sub:'↗ 0% vs mois dernier' },
    { label:'Cash par call',   value:'0,00 €', icon:'phone',  iconBg:'rgba(249,115,22,0.15)',  iconColor:'#fb923c',
      sub:`↗ 0% sur ${totalRdvs} RDVs` },
    { label:'Ventes',   value:'0',      icon:'cart',   iconBg:'rgba(249,115,22,0.15)',  iconColor:'#fb923c', sub:'↗ 0% vs mois dernier' },
    { label:'Panier Moyen',    value:'0,00 €', icon:'zap',    iconBg:'rgba(168,85,247,0.15)',  iconColor:'#c084fc', sub:'↗ 0% vs mois dernier' },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, Jean 👋</h1>
          <p className="text-sm mt-1" style={{color:'#9ca3af'}}>Vue d'ensemble de l'activité</p>
        </div>
        <MonthNav month={month} year={year} onPrev={onPrev} onNext={onNext} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((s,i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Évolution du CA */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Évolution du CA</h2>
          <div className="flex rounded-lg overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.1)'}}>
            {['Jour','Semaine','Mois','Année'].map(p=>(
              <button key={p} onClick={()=>setChartPeriod(p)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={chartPeriod===p ? {background:'#22c55e',color:'white'} : {color:'#9ca3af'}}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center h-40" style={{color:'#6b7280'}}>
          <span className="text-sm">Aucune donnée ce mois</span>
        </div>
      </Card>

      {/* Répartition mensualités */}
      <Card>
        <h2 className="font-semibold text-white mb-5">Répartition mensualités</h2>
        <div className="flex items-center justify-center h-28" style={{color:'#6b7280'}}>
          <span className="text-sm">Aucune vente</span>
        </div>
      </Card>

      {/* Bonus Cash Rentrant */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Ico path={IC.trend} size={16} style={{color:'#4ade80'}} />
            <h2 className="font-semibold text-white">Bonus Cash Rentrant</h2>
          </div>
          <span className="text-lg font-bold text-white">0,00 €</span>
        </div>
        <div className="text-xs mb-4" style={{color:'#6b7280'}}>0,00€ encaissé</div>
        <div className="h-1.5 rounded-full mb-4" style={{background:'rgba(255,255,255,0.1)'}}>
          <div className="h-1.5 rounded-full" style={{width:'0%',background:'#22c55e'}} />
        </div>
        {BONUS.map(t=>(
          <div key={t.ca} className="flex items-center justify-between py-2.5"
            style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full" style={{background:'#374151'}} />
              <span className="text-sm" style={{color:'#d1d5db'}}>{fmtEur(t.ca)}</span>
            </div>
            <span className="text-sm font-medium" style={{color:'#4ade80'}}>+{fmtEur(t.b)}</span>
          </div>
        ))}
      </Card>

      {/* Derniers RDVs */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Ico path={IC.calendar} size={15} style={{color:'#60a5fa'}} />
          <h2 className="font-semibold text-white">Derniers RDVs</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{background:'rgba(59,130,246,0.15)',color:'#60a5fa'}}>
            {totalRdvs} ce mois
          </span>
        </div>
        {monthRdvs.length === 0 ? (
          <div className="text-center text-sm py-6" style={{color:'#6b7280'}}>Aucun RDV ce mois</div>
        ) : (
          <div className="space-y-2">
            {monthRdvs.slice(-3).reverse().map(r=>(
              <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{background:'rgba(255,255,255,0.03)'}}>
                <div>
                  <div className="text-sm font-medium text-white">{r.contact_name}</div>
                  <div className="text-xs" style={{color:'#6b7280'}}>{fmtDateTime(r.appointment_date)}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Offs cette semaine */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Ico path={IC.calendar} size={15} style={{color:'#fb923c'}} />
          <h2 className="font-semibold text-white">Offs cette semaine</h2>
        </div>
        {weekOffs.length === 0 ? (
          <div className="text-center text-sm py-6" style={{color:'#6b7280'}}>
            Aucun jour off cette semaine 🎉
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {weekOffs.map((d,i)=>(
              <span key={i} className="px-3 py-1 rounded-full text-sm"
                style={{background:'rgba(239,68,68,0.15)',color:'#f87171'}}>
                {d.day} {MONTHS[d.month]}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PAGE: MES VENTES
══════════════════════════════════════════════ */
function MesVentes({ month, year, onPrev, onNext }) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Ventes</h1>
          <p className="text-sm mt-1" style={{color:'#9ca3af'}}>0 vente(s) ce mois</p>
        </div>
        <MonthNav month={month} year={year} onPrev={onPrev} onNext={onNext} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="CA Total (TTC)"   value="0,00 €" icon="euro"  iconBg="rgba(34,197,94,0.15)"  iconColor="#4ade80" />
        <StatCard label="Nombre de ventes" value="0"      icon="cart"  iconBg="rgba(249,115,22,0.15)" iconColor="#fb923c" />
        <StatCard label="Panier moyen"     value="0,00 €" icon="trend" iconBg="rgba(168,85,247,0.15)" iconColor="#c084fc" />
      </div>
      <div className="rounded-xl overflow-hidden" style={{background:'#131824',border:'1px solid #1e2232'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              {['Date','Client','Produit','Montant TTC','Mensualités'].map(h=>(
                <th key={h} className="text-left text-xs font-medium px-5 py-3.5" style={{color:'#9ca3af'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5}><EmptyState icon="cart" message="Aucune vente ce mois" /></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PAGE: MES RDVs
══════════════════════════════════════════════ */
function MesRDVs({ month, year, onPrev, onNext, rdvs, onUpdateStatus, onDeleteRdv }) {
  const [filterStatus, setFilterStatus] = useState('all')

  const monthRdvs = useMemo(() => rdvs.filter(r => {
    const d = new Date(r.appointment_date)
    return d.getMonth()===month && d.getFullYear()===year
  }), [rdvs, month, year])

  const filtered = filterStatus === 'all'
    ? monthRdvs
    : monthRdvs.filter(r => r.status === filterStatus)

  const total    = monthRdvs.length
  const presents = monthRdvs.filter(r=>r.status==='present').length
  const noShows  = monthRdvs.filter(r=>r.status==='no-show').length
  const noShowPct= total > 0 ? Math.round(noShows/total*100) : 0

  const statusFilters = [
    {key:'all',    label:'Tous'},
    {key:'booked', label:'Réservés'},
    {key:'present',label:'Présents'},
    {key:'no-show',label:'No-show'},
    {key:'cancelled',label:'Annulés'},
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes RDVs</h1>
          <p className="text-sm mt-1" style={{color:'#9ca3af'}}>{total} rendez-vous ce mois</p>
        </div>
        <MonthNav month={month} year={year} onPrev={onPrev} onNext={onNext} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total RDVs" value={String(total)} icon="calendar" iconBg="rgba(59,130,246,0.15)"  iconColor="#60a5fa" />
        <StatCard label="Présents"   value={String(presents)} icon="check" iconBg="rgba(34,197,94,0.15)"  iconColor="#4ade80" />
        <StatCard label="No-show"    value={pct(noShows,total)} icon="xmark" iconBg="rgba(239,68,68,0.15)" iconColor="#f87171"
          sub={`${noShows} no-show sur ${total} RDVs`} />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {statusFilters.map(f=>(
          <button key={f.key} onClick={()=>setFilterStatus(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filterStatus===f.key
              ? {background:'#22c55e', color:'white'}
              : {background:'rgba(255,255,255,0.05)', color:'#9ca3af', border:'1px solid rgba(255,255,255,0.08)'}}>
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{background:'rgba(255,255,255,0.1)'}}>
                {monthRdvs.filter(r=>r.status===f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{background:'#131824',border:'1px solid #1e2232'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              {['Date & heure','Client','Email','Statut','Actions'].map(h=>(
                <th key={h} className="text-left text-xs font-medium px-5 py-3.5" style={{color:'#9ca3af'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="calendar" message="Aucun rendez-vous pour ce filtre" /></td></tr>
            ) : (
              filtered.map(r=>(
                <tr key={r.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <td className="px-5 py-3.5 text-sm" style={{color:'#d1d5db'}}>
                    {fmtDateTime(r.appointment_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-white">{r.contact_name}</div>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{color:'#6b7280'}}>
                    {r.contact_email || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {r.status === 'booked' && (
                        <>
                          <button onClick={()=>onUpdateStatus(r.id,'present')}
                            className="px-2 py-1 rounded text-xs font-medium transition-all"
                            style={{background:'rgba(34,197,94,0.15)',color:'#4ade80'}}
                            title="Marquer présent">
                            ✓ Présent
                          </button>
                          <button onClick={()=>onUpdateStatus(r.id,'no-show')}
                            className="px-2 py-1 rounded text-xs font-medium transition-all"
                            style={{background:'rgba(239,68,68,0.15)',color:'#f87171'}}
                            title="No-show">
                            ✗ No-show
                          </button>
                        </>
                      )}
                      <button onClick={()=>onDeleteRdv(r.id)}
                        className="p-1.5 rounded transition-all" style={{color:'#4b5563'}}
                        onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
                        onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}
                        title="Supprimer">
                        <Ico path={IC.trash} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PAGE: DISPONIBILITÉS
══════════════════════════════════════════════ */
function getCalDays(year, month) {
  const firstDow = new Date(year, month, 1).getDay()
  const inMonth  = new Date(year, month+1, 0).getDate()
  const inPrev   = new Date(year, month, 0).getDate()
  const offset   = firstDow===0 ? 6 : firstDow-1
  const days = []
  for (let i=offset-1;i>=0;i--) days.push({day:inPrev-i,cur:false})
  for (let i=1;i<=inMonth;i++)  days.push({day:i,cur:true})
  const rem = 42-days.length
  for (let i=1;i<=rem;i++)      days.push({day:i,cur:false})
  return days
}

function Disponibilites({ month, year, offDays, setOffDays }) {
  const [calM, setCalM] = useState(month)
  const [calY, setCalY] = useState(year)
  const today = new Date()
  const days = useMemo(()=>getCalDays(calY,calM),[calY,calM])

  const prevCal = () => calM===0?(setCalM(11),setCalY(y=>y-1)):setCalM(m=>m-1)
  const nextCal = () => calM===11?(setCalM(0),setCalY(y=>y+1)):setCalM(m=>m+1)

  const isOff = (d) => d.cur && offDays.some(o=>o.year===calY&&o.month===calM&&o.day===d.day)
  const toggle = (d) => {
    if (!d.cur) return
    setOffDays(prev => {
      const exists = prev.some(o=>o.year===calY&&o.month===calM&&o.day===d.day)
      return exists
        ? prev.filter(o=>!(o.year===calY&&o.month===calM&&o.day===d.day))
        : [...prev,{year:calY,month:calM,day:d.day}]
    })
  }
  const monthOffs = offDays.filter(o=>o.year===calY&&o.month===calM).sort((a,b)=>a.day-b.day)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Ico path={IC.calendar} size={22} style={{color:'#22c55e'}} />
          Disponibilités
        </h1>
        <p className="text-sm mt-1" style={{color:'#9ca3af'}}>Indiquez vos jours d'indisponibilité</p>
      </div>
      <div className="flex items-center gap-6 px-4 py-3 rounded-lg text-xs"
        style={{background:'#131824',border:'1px solid #1e2232',color:'#9ca3af'}}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{background:'rgba(239,68,68,0.8)'}} />
          <span>Jour off enregistré</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{border:'2px solid #22c55e'}} />
          <span>Sélection en cours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Ico path={IC.info} size={13} />
          <span>Cliquez sur un jour off pour le supprimer</span>
        </div>
      </div>
      <div className="grid gap-4" style={{gridTemplateColumns:'1fr 300px'}}>
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Ico path={IC.calendar} size={15} style={{color:'#22c55e'}} />
              <h2 className="font-semibold text-white">Calendrier</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prevCal} style={{color:'#9ca3af'}}><Ico path={IC.chevL} size={15} /></button>
              <span className="text-sm" style={{color:'#d1d5db'}}>{MONTHS[calM].toLowerCase()} {calY}</span>
              <button onClick={nextCal} style={{color:'#9ca3af'}}><Ico path={IC.chevR} size={15} /></button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:8}}>
            {DAYS.map(d=><div key={d} className="text-center text-xs py-1" style={{color:'#6b7280'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
            {days.map((d,i)=>{
              const off = isOff(d)
              const isToday = d.cur&&d.day===today.getDate()&&calM===today.getMonth()&&calY===today.getFullYear()
              return (
                <button key={i} onClick={()=>toggle(d)}
                  className="flex items-center justify-center text-sm rounded-lg transition-all"
                  style={{
                    aspectRatio:'1', cursor:d.cur?'pointer':'default',
                    color: !d.cur?'#374151': off?'white': isToday?'white':'#d1d5db',
                    background: off?'rgba(239,68,68,0.8)': isToday?'#22c55e':'transparent',
                    fontWeight: isToday?700:400,
                  }}
                  onMouseEnter={e=>{ if(d.cur&&!off&&!isToday) e.currentTarget.style.background='rgba(255,255,255,0.08)' }}
                  onMouseLeave={e=>{ if(d.cur&&!off&&!isToday) e.currentTarget.style.background='transparent' }}>
                  {d.day}
                </button>
              )
            })}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Ico path={IC.calendar} size={14} style={{color:'#9ca3af'}} />
            <h2 className="text-sm font-semibold text-white">
              Mes jours off — {MONTHS[calM].toLowerCase()} {calY}
            </h2>
          </div>
          {monthOffs.length===0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" style={{color:'#4b5563'}}>
              <Ico path={IC.calendar} size={36} className="mb-3 opacity-30" />
              <p className="text-sm" style={{color:'#6f7280'}}>Aucun jour off</p>
              <p className="text-xs mt-1.5" style={{color:'#4b5563'}}>Cliquez sur le calendrier</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {monthOffs.map(o=>(
                <div key={o.day} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)'}}>
                  <span className="text-sm text-white">{o.day} {MONTHS[calM]}</span>
                  <button onClick={()=>setOffDays(p=>p.filter(x=>!(x.year===calY&&x.month===calM&&x.day===o.day)))}
                    style={{color:'#9ca3af'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
                    onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}>
                    <Ico path={IC.xmark} size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PAGE: MES COMMISSIONS
══════════════════════════════════════════════ */
function MesCommissions({ month, year, onPrev, onNext }) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Commissions</h1>
          <p className="text-sm mt-1" style={{color:'#9ca3af'}}>Mois sélectionné</p>
        </div>
        <MonthNav month={month} year={year} onPrev={onPrev} onNext={onNext} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Commission de base (8-12% HT)" value="0,00 €" icon="trend"
          iconBg="rgba(34,197,94,0.15)" iconColor="#4ade80"
          sub="0 échéance(s) · x1=12% · x2-3=10% · x4+=8%" />
        <StatCard label="Total Commissions" value="0,00 €" icon="calendar"
          iconBg="rgba(59,130,246,0.15)" iconColor="#60a5fa" sub="Ce mois" />
      </div>
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Ico path={IC.zap} size={16} style={{color:'#facc15'}} />
            <h2 className="font-semibold text-white">Prime Cash Rentrant</h2>
          </div>
          <span className="text-lg font-bold text-white">0,00 €</span>
        </div>
        <div className="text-xs mb-1" style={{color:'#6b7280'}}>0 € de cash rentrant (0,00 include€)</div>
        <div className="text-xs text-right mb-4" style={{color:'#fb923c'}}>🔕 Plus que 5000 pour +200,00 ₼</div>
        {BONUS.map(t=>(
          <div key={t.ca} className="flex items-center justify-between py-2.5"
            style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div className="flex items-center gap-2.5">
              <Ico path={IC.lock} size={13} style={{color:'#4b5563'}} />
              <span className="text-sm" style={{color:'#9ca3af'}}>{fmtEur(t.ca)}</span>
            </div>
            <span className="text-sm" style={{color:'#9ca3af'}}>+{fmtEur(t.b)}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Ico path={IC.file} size={15} style={{color:'#22c55e'}} />
          <h2 className="font-semibold text-white">Détail par échéance</h2>
        </div>
        <div className="text-center text-sm py-8" style={{color:'#6f7280'}}>Aucune échéance ce mois</div>
      </Card>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PAGE: RÉGLAGES
══════════════════════════════════════════════ */pondre à un profil existant)'],
    ['setter_email',  '— Email du setter (optionnel)'],
    ['product_name',  '— Nom du produit (créé automatiquement si inexistant)'],
    ['amount_ttc',    '— Montant TTC de la vente'],
    ['installments',  '— Nombre de mensualités (défaut : 1)'],
    ['sale_date',     '— Date de la vente (format YYYY-MM-DD)'],
    ['status',        '— Statut du call (seul "sold" est traité)'],
  ]

  const rdvFields = [
    ['contact_name',      '— Nom du contact / prospect'],
    ['contact_email',     '— Email du contact (optionnel)'],
    ['closer_email',      '— Email du closer (optionnel)'],
    ['appointment_date',  '— Date et heure du RDV (format ISO : YYYY-MM-DDTHH:MM:SS)'],
    ['status',            '— Statut du RDV : booked | present | no-show | cancelled'],
  ]

  const rdvSteps = [
    'Créez un nouveau Zap sur Zapier',
    'Trigger : choisissez iClosed → "Contact Call Booking" ou "Call Status Updated"',
    'Action : choisissez "Webhooks by Zapier" → "POST"',
    `Collez l'URL : ${WEBHOOK_RDV_URL}`,
    'Dans Headers, ajoutez : X-Webhook-Secret avec votre token secret',
    'Dans Body (JSON), mappez les champs iClosed vers le format ci-dessous',
    'Testez le Zap et activez-le !',
  ]

  const salesSteps = [
    'Créez un nouveau Zap sur Zapier',
    'Trigger : choisissez iClosed → évènement pertinent (ex: "Contact Call Booking")',
    'Action : choisissez "Webhooks by Zapier" → "POST"',
    "Collez l'URL du webhook ci-dessus dans le champ URL",
    'Dans Headers, ajoutez : X-Webhook-Secret avec la valeur de votre token secret',
    'Dans Body (JSON), mappez les champs iClosed vers le format attendu (voir ci-dessous)',
    'Testez le Zap et activez-le !',
  ]

  const salesJson = `{
  "client_name": "Jean Dupont",
  "closer_email": "closer@example.com",
  "setter_email": "setter@example.com",
  "product_name": "Bachelor",
  "amount_ttc": 2497,
  "installments": 2,
  "sale_date": "2026-03-05",
  "status": "sold"
}`

  const tabs = [
    { key:'sales', label:'Webhook Ventes', icon:'link' },
    { key:'rdv',   label:'Webhook RDVs',   icon:'webhook' },
  ]

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Réglages</h1>
        <p className="text-sm mt-1" style={{color:'#9ca3af'}}>Configuration des intégrations iClosed via Zapier</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden" style={{background:'#131824',border:'1px solid #1e2232',width:'fit-content'}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all"
            style={activeTab===t.key
              ? {background:'rgba(255,255,255,0.1)',color:'white'}
              : {color:'#9ca3af'}}>
            <Ico path={IC[t.icon]} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: VENTES ── */}
      {activeTab === 'sales' && (
        <>
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Ico path={IC.link} size={18} style={{color:'#22c55e'}} />
              <h2 className="text-lg font-semibold text-white">Webhook iClosed — Ventes</h2>
            </div>
            <p className="text-sm mb-5" style={{color:'#9ca3af'}}>
              Connectez iClosed à votre plateforme via Zapier pour synchroniser automatiquement les ventes.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{color:'#9ca3af'}}>URL du Webhook</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{background:'#0d0f18',border:'1px solid #2a2d3e'}}>
                  <span className="flex-1 text-sm truncate font-mono" style={{color:'#d1d5db'}}>{WEBHOOK_SALES_URL}</span>
                  <CopyBtn text={WEBHOOK_SALES_URL} />
                </div>
              </div>
              <div>
                <label className="text-sm block mb-2" style={{color:'#9ca3af'}}>Header d'authentification</label>
                <div className="px-3 py-2.5 rounded-lg text-sm font-mono" style={{background:'#0d0f18',border:'1px solid #2a2d3e',color:'#9ca3af'}}>
                  X-Webhook-Secret: &lt;votre token secret configuré dans Lovable Cloud&gt;
                </div>
                <p className="text-xs mt-1.5" style={{color:'#6b7280'}}>
                  Le token secret est celui que vous avez configuré lors de la mise en place.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-white mb-1">Guide de configuration Zapier</h2>
            <p className="text-sm mb-5" style={{color:'#9ca3af'}}>Suivez ces étapes pour connecter iClosed à votre plateforme</p>
            <div className="space-y-3">
              {salesSteps.map((s,i)=>(
                <div key={i} className="flex items-start gap-3">
                  <div className="w6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{background:'#22c55e',minWidth:24}}>{i+1}</div>
                  <span className="text-sm" style={{color:'#d1d5db'}}>{s}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-white mb-1">Format JSON attendu</h2>
            <p className="text-sm mb-4" style={{color:'#9ca3af'}}>Mappez les champs iClosed vers ce format dans le body du webhook Zapier</p>
            <div className="relative mb-4">
              <pre className="px-4 py-4 rounded-lg text-sm font-mono overflow-x-auto"
                style={{background:'#0d0f18',border:'1px solid #2a2d3e',color:'#86efac', lineHeight:1.7}}>
                {salesJson}
              </pre>
              <div className="absolute top-3 right-3"><CopyBtn text={salesJson} /></div>
            </div>
            <div className="space-y-2">
              {salesFields.map(([f,d])=>(
                <div key={f} className="text-sm">
                  <span className="font-mono font-semibold" style={{color:'#86efac'}}>{f}</span>
                  <span style={{color:'#9ca3af'}}> {d}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── TAB: RDVs ── */}
      {activeTab === 'rdv' && (
        <>
          {/* Banner nouveau */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)'}}>
            <Ico path={IC.alertCirc} size={16} style={{color:'#22c55e'}} />
            <p className="text-sm" style={{color:'#4ade80'}}>
              <span className="font-semibold">Nouveau !</span> Synchronisez automatiquement les prises de RDVs iClosed vers Seqooia Sales Hub.
            </p>
          </div>

          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Ico path={IC.webhook} size={18} style={{color:'#60a5fa'}} />
              <h2 className="text-lg font-semibold text-white">Webhook iClosed — RDVs</h2>
            </div>
            <p className="text-sm mb-5" style={{color:'#9ca3af'}}>
              Synchronisez automatiquement les prises de rendez-vous iClosed (Contact Call Booking) vers votre espace Mes RDVs.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{color:'#9ca3af'}}>URL du Webhook RDVs</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{background:'#0d0f18',border:'1px solid #2a2d3e'}}>
                  <span className="flex-1 text-sm truncate font-mono" style={{color:'#d1d5db'}}>{WEBHOOK_RDV_URL}</span>
                  <CopyBtn text={WEBHOOK_RDV_URL} />
                </div>
              </div>
              <div>
                <label className="text-sm block mb-2" style={{color:'#9ca3af'}}>Header d'authentification</label>
                <div className="px-3 py-2.5 rounded-lg text-sm font-mono" style={{background:'#0d0f18',border:'1px solid #2a2d3e',color:'#9ca3af'}}>
                  X-Webhook-Secret: &lt;votre token secret configuré dans Lovable Cloud&gt;
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-1">Guide de configuration Zapier — RDVs</h2>
            <p className="text-sm mb-5" style={{color:'#9ca3af'}}>
              Connectez iClosed "Contact Call Booking" pour importer chaque nouveau RDV automatiquement
            </p>
            <div className="space-y-3">
              {rdvSteps.map((s,i)=>(
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{background:'#3b82f6',minWidth:24}}>{i+1}</div>
                  <span className="text-sm" style={{color:'#d1d5db'}}>{s}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-1">Format JSON attendu — RDVs</h2>
            <p className="text-sm mb-4" style={{color:'#9ca3af'}}>Mappez les champs iClosed vers ce format</p>
            <div className="relative mb-4">
              <pre className="px-4 py-4 rounded-lg text-sm font-mono overflow-x-auto"
                style={{background:'#0d0f18',border:'1px solid #2a2d3e',color:'#93c5fd',lineHeight:1.7}}>
                {RDV_JSON_EXAMPLE}
              </pre>
              <div className="absolute top-3 right-3"><CopyBtn text={RDV_JSON_EXAMPLE} /></div>
            </div>
            <div className="space-y-2">
              {rdvFields.map(([f,d])=>(
                <div key={f} className="text-sm">
                  <span className="font-mono font-semibold" style={{color:'#93c5fd'}}>{f}</span>
                  <span style={{color:'#9ca3af'}}> {d}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── SIMULATEUR ── */}
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Ico path={IC.play} size={16} style={{color:'#facc15'}} />
              <h2 className="text-lg font-semibold text-white">Simulateur de webhook</h2>
            </div>
            <p className="text-sm mb-5" style={{color:'#9ca3af'}}>
              Testez l'intégration en simulant la réception d'un payload iClosed. Le RDV sera ajouté en temps réel dans "Mes RDVs".
            </p>

            <div className="space-y-3">
              <label className="text-sm block" style={{color:'#9ca3af'}}>Payload JSON à simuler</label>
              <textarea
                value={jsonInput}
                onChange={e=>setJsonInput(e.target.value)}
                rows={10}
                spellCheck={false}
                className="w-full text-sm font-mono rounded-lg px-4 py-3 outline-none resize-none"
                style={{
                  background:'#0d0f18', border:'1px solid #2a2d3e',
                  color:'#93c5fd', lineHeight:1.7,
                }}
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={simulateWebhook}
                  disabled={simRunning}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: simRunning ? '#14532d' : '#22c55e',
                    color:'white', opacity: simRunning ? 0.7 : 1,
                  }}>
                  <Ico path={IC.play} size={14} stroke="white" />
                  {simRunning ? 'Simulation en cours...' : 'Simuler la réception'}
                </button>
                <button onClick={()=>{ setJsonInput(RDV_JSON_EXAMPLE); setSimResult(null) }}
                  className="px-3 py-2 rounded-lg text-sm transition-all"
                  style={{background:'rgba(255,255,255,0.05)',color:'#9ca3af',border:'1px solid rgba(255,255,255,0.08)'}}>
                  Réinitialiser
                </button>
              </div>

              {simResult && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: simResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${simResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: simResult.ok ? '#4ade80' : '#f87171',
                  }}>
                  <Ico path={simResult.ok ? IC.check : IC.xmark} size={15} style={{flexShrink:0, marginTop:1}} />
                  <span>{simResult.msg}</span>
                </div>
              )}

              {/* Status cheat sheet */}
              <div className="pt-2">
                <p className="text-xs mb-2" style={{color:'#6b7280'}}>Valeurs de statut acceptées :</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(RDV_STATUSES).map(([k,v])=>(
                    <button key={k}
                      onClick={()=>setJsonInput(j=>j.replace(/"status":\s*"[^"]*"/, `"status": "${k}"`))}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{background:v.bg, color:v.color}}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{background:v.dot}} />
                      {k} → {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════ */
export default function App() {
  const [page,    setPage]    = useState('dashboard')
  const [month,   setMonth]   = useState(2)    // Mars = index 2
  const [year,    setYear]    = useState(2026)

  // Persisted state
  const [rdvs,    setRdvs]    = useLocalStorage('seqooia_rdvs', [])
  const [offDays, setOffDays] = useLocalStorage('seqooia_offs', [])

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  const addRdv = (rdv) => setRdvs(prev => [...prev, rdv])
  const updateRdvStatus = (id, status) =>
    setRdvs(prev => prev.map(r => r.id===id ? {...r,status} : r))
  const deleteRdv = (id) =>
    setRdvs(prev => prev.filter(r => r.id!==id))

  const navProps = { month, year, onPrev: prevMonth, onNext: nextMonth }

  return (
    <div style={{
      display:'flex', height:'100vh', overflow:'hidden',
      background:'#0d0f18', color:'white',
      fontFamily:'"Inter","Segoe UI",system-ui,sans-serif',
    }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{flex:1, overflowY:'auto'}}>
        {page==='dashboard'   && <Dashboard     {...navProps} rdvs={rdvs} offDays={offDays} />}
        {page==='ventes'      && <MesVentes      {...navProps} />}
        {page==='rdvs'        && <MesRDVs        {...navProps} rdvs={rdvs}
                                    onUpdateStatus={updateRdvStatus} onDeleteRdv={deleteRdv} />}
        {page==='dispo'       && <Disponibilites month={month} year={year}
                                    offDays={offDays} setOffDays={setOffDays} />}
        {page==='commissions' && <MesCommissions {...navProps} />}
        {page==='reglages'    && <Reglages onAddRdv={addRdv} />}
      </main>
    </div>
  )
}
