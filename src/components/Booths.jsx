import { useState, useEffect } from 'react'

const GENDER_LABEL = { M: 'પુ', F: 'સ્ત્રી' }

function useBoothVoters(partNo) {
  const [voters, setVoters] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!partNo) return
    setVoters(null)
    setLoading(true)
    fetch(`/data/booths/booth_${partNo}.json`)
      .then(r => r.json())
      .then(d => { setVoters(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [partNo])
  return { voters, loading }
}

export default function Booths({ summary }) {
  const { booth_stats = {}, booth_index = [], booth_areas = {} } = summary
  const [selected, setSelected] = useState('1')
  const { voters, loading } = useBoothVoters(selected)
  const [voterPage, setVoterPage] = useState(1)
  const PAGE = 50

  // Build booth list
  const booths = Array.from({ length: 36 }, (_, i) => {
    const pn = String(i + 1)
    const stats = booth_stats[pn] || { total: 0, male: 0, female: 0 }
    const locs = booth_index.filter(b => b.part_no === pn)
    // Prefer the richer booth_areas list (aggregated from all voters); fallback to booth_index sub-row locations
    const areas = (booth_areas[pn] && booth_areas[pn].length)
      ? booth_areas[pn]
      : locs.map(l => l.location).filter(Boolean)
    const areaText = areas.join('; ')
    return { part_no: pn, ...stats, locs, areas, areaText }
  })

  const current = booths.find(b => b.part_no === selected)
  const totalPages = voters ? Math.ceil(voters.length / PAGE) : 0
  const pageVoters = voters ? voters.slice((voterPage - 1) * PAGE, voterPage * PAGE) : []

  const handleSelect = (pn) => {
    setSelected(pn)
    setVoterPage(1)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-120px)]">
      {/* Left sidebar */}
      <div className="w-full lg:w-72 lg:shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-y-auto max-h-96 lg:max-h-full">
        <div className="sticky top-0 bg-blue-900 text-white px-4 py-2.5 font-semibold text-sm rounded-t-xl">
          🏛️ ભાવનગર — વોર્ડ ૬ (36 Booths)
        </div>
        <div className="divide-y divide-gray-100">
          {booths.map(b => (
            <button
              key={b.part_no}
              onClick={() => handleSelect(b.part_no)}
              className={`w-full text-left px-3 py-3 transition-colors ${
                selected === b.part_no
                  ? 'bg-orange-50 border-l-4 border-orange-500'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`font-semibold text-sm ${selected === b.part_no ? 'text-orange-600' : 'text-gray-800'}`}>
                    Booth {b.part_no}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-tight">
                    {b.areas && b.areas.length > 0
                      ? `${b.areas.length} area${b.areas.length > 1 ? 's' : ''}: ${b.areas[0]}${b.areas.length > 1 ? '…' : ''}`
                      : (b.areaText || 'Loading...')}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-gray-800 text-sm">{(b.total || 0).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-blue-500">{(b.male||0)}M</div>
                  <div className="text-xs text-pink-500">{(b.female||0)}F</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
        {current && (
          <>
            {/* Booth header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-800">
                    Booth {current.part_no} — Ward 6
                  </h2>
                  {current.areas && current.areas.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        📍 Areas Covered ({current.areas.length})
                      </p>
                      <ul className="text-sm text-gray-600 space-y-0.5 max-h-44 overflow-y-auto pr-2 list-disc list-inside">
                        {current.areas.map((a, i) => (
                          <li key={i} className="leading-snug">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-3xl font-bold text-gray-900">{(current.total||0).toLocaleString('en-IN')}</div>
                  <div className="flex gap-3 text-sm mt-1 justify-end">
                    <span className="text-blue-600 font-medium">{(current.male||0).toLocaleString('en-IN')} Male</span>
                    <span className="text-pink-500 font-medium">{(current.female||0).toLocaleString('en-IN')} Female</span>
                  </div>
                </div>
              </div>

              {/* Gender bar */}
              {current.total > 0 && (
                <div className="mt-3 flex h-3 rounded-full overflow-hidden bg-pink-200">
                  <div
                    className="bg-blue-400 h-full transition-all"
                    style={{ width: `${((current.male||0)/current.total*100).toFixed(1)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Voter table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="font-semibold text-gray-700 text-sm">
                  Voter List
                  {voters && <span className="ml-2 text-gray-400 font-normal">{voters.length.toLocaleString('en-IN')} voters</span>}
                </div>
                {voters && (
                  <button
                    onClick={() => downloadBoothCSV(current, voters)}
                    className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1"
                  >⬇️ Download CSV</button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <div className="w-7 h-7 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Loading voters...
                </div>
              ) : voters ? (
                <>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-900 text-white text-xs">
                          <th className="text-left px-3 py-2.5">#</th>
                          <th className="text-left px-3 py-2.5">EPIC</th>
                          <th className="text-left px-3 py-2.5">Name</th>
                          <th className="text-left px-3 py-2.5 hidden sm:table-cell">Relative / Parent</th>
                          <th className="text-left px-3 py-2.5 hidden md:table-cell">House No.</th>
                          <th className="text-left px-3 py-2.5">Age</th>
                          <th className="text-left px-3 py-2.5">Gender</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageVoters.map((v, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-orange-50 transition-colors">
                            <td className="px-3 py-2 text-gray-400 font-mono text-xs">{v.serial || (voterPage-1)*PAGE+i+1}</td>
                            <td className="px-3 py-2 font-mono text-xs text-blue-600">{v.voter_id || '—'}</td>
                            <td className="px-3 py-2 font-medium text-gray-800">{v.name || '—'}</td>
                            <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{v.relative_name || '—'}</td>
                            <td className="px-3 py-2 text-gray-400 hidden md:table-cell text-xs">{v.house_no || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{v.age || '—'}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                v.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-600'
                              }`}>
                                {v.gender === 'M' ? 'M' : 'F'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <button onClick={() => setVoterPage(1)} disabled={voterPage===1} className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-100">«</button>
                      <button onClick={() => setVoterPage(p => Math.max(1,p-1))} disabled={voterPage===1} className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
                      <span className="text-xs text-gray-500 px-2">Page {voterPage} / {totalPages}</span>
                      <button onClick={() => setVoterPage(p => Math.min(totalPages,p+1))} disabled={voterPage===totalPages} className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-100">Next ›</button>
                      <button onClick={() => setVoterPage(totalPages)} disabled={voterPage===totalPages} className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-100">»</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-300">Select a booth to view voters</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function downloadBoothCSV(booth, voters) {
  let csv = '#,EPIC,Name,Relative Name,House No,Age,Gender\n'
  voters.forEach(v => {
    csv += `${v.serial || ''},${v.voter_id || ''},${v.name || ''},${v.relative_name || ''},${(v.house_no||'').replace(/,/g,' ')},${v.age || ''},${v.gender === 'M' ? 'Male' : 'Female'}\n`
  })
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `booth_${booth.part_no}_voters.csv`
  a.click()
}
