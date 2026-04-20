import { useState, useEffect } from 'react'
import Overview from './components/Overview'
import Booths from './components/Booths'
import Search from './components/Search'
import JaatiAnalysis from './components/JaatiAnalysis'
import './index.css'

const TABS = [
  { id: 'overview',  icon: '📊', label: 'Overview' },
  { id: 'booths',    icon: '🏛️', label: 'Booths' },
  { id: 'search',    icon: '🔍', label: 'Search' },
  { id: 'jaati',     icon: '👥', label: 'Jaati Analysis' },
]

export default function App() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [voters, setVoters] = useState(null)
  const [loadingVoters, setLoadingVoters] = useState(false)

  useEffect(() => {
    fetch('/data/voters_summary.json')
      .then(r => r.json())
      .then(setSummary)
      .catch(console.error)
  }, [])

  const loadAllVoters = () => {
    if (voters || loadingVoters) return
    setLoadingVoters(true)
    fetch('/data/voters_data.json')
      .then(r => r.json())
      .then(d => { setVoters(d.voters); setLoadingVoters(false) })
      .catch(e => { console.error(e); setLoadingVoters(false) })
  }

  const handleTab = (id) => {
    setTab(id)
    if (id === 'search' || id === 'jaati') loadAllVoters()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗳️</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                ભાવનગર મહાનગરપાલિકા 2026 — વોર્ડ નં. ૬
              </h1>
              <p className="text-orange-100 text-xs">
                Bhavnagar Municipal Corporation • Ward 6 Voter List
              </p>
            </div>
          </div>
          <button
            onClick={() => exportExcel(summary)}
            className="hidden sm:flex items-center gap-2 bg-white text-orange-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors shadow"
          >
            ⬇️ Excel Export
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {!summary ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mr-3" />
            Loading...
          </div>
        ) : (
          <>
            {tab === 'overview' && <Overview summary={summary} />}
            {tab === 'booths'   && <Booths summary={summary} />}
            {tab === 'search'   && <Search voters={voters} loading={loadingVoters} summary={summary} />}
            {tab === 'jaati'    && <JaatiAnalysis voters={voters} loading={loadingVoters} summary={summary} />}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8 py-3 text-center text-xs text-gray-400">
        ગુજરાત રાજ્ય ચૂંટણી આયોગ • મતદારયાદી 2026 • વોર્ડ ૬
      </footer>
    </div>
  )
}

function exportExcel(summary) {
  if (!summary) return
  const { total_voters, male, female, age_groups, booth_stats } = summary
  let csv = 'Booth,Total,Male,Female,Avg Age\n'
  Object.entries(booth_stats || {})
    .filter(([k]) => k && k !== '?')
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([k, v]) => {
      csv += `${k},${v.total},${v.male},${v.female},${v.avg_age}\n`
    })
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'ward6_booth_summary.csv'
  a.click()
}
