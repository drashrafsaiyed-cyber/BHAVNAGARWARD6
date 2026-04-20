import { useState, useMemo } from 'react'

const PAGE_SIZE = 30

export default function Search({ voters, loading, summary }) {
  const [query, setQuery] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterBooth, setFilterBooth] = useState('')
  const [page, setPage] = useState(1)

  const boothOptions = Array.from({ length: 37 }, (_, i) => String(i + 1))

  const results = useMemo(() => {
    if (!voters || !query.trim()) return []
    const q = query.trim().toLowerCase()
    return voters.filter(v => {
      const matchQ =
        (v.name || '').toLowerCase().includes(q) ||
        (v.voter_id || '').toLowerCase().includes(q) ||
        (v.house_no || '').toLowerCase().includes(q) ||
        (v.relative_name || '').toLowerCase().includes(q)
      const matchG = !filterGender || v.gender === filterGender
      const matchB = !filterBooth || v.part_no === filterBooth
      return matchQ && matchG && matchB
    })
  }, [voters, query, filterGender, filterBooth])

  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const paginated = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (val) => {
    setQuery(val)
    setPage(1)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        <div>Loading voter data (11 MB)...</div>
      </div>
    )
  }

  if (!voters) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700">
        Voter data not loaded yet. Please wait...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name, voter ID, or house no..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={query}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <select
            value={filterGender}
            onChange={e => { setFilterGender(e.target.value); setPage(1) }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">All Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <select
            value={filterBooth}
            onChange={e => { setFilterBooth(e.target.value); setPage(1) }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">All Booths</option>
            {boothOptions.map(b => (
              <option key={b} value={b}>Booth {b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>
          {query ? (
            <><strong className="text-gray-800">{results.length.toLocaleString('en-IN')}</strong> results found</>
          ) : (
            <><strong className="text-gray-800">{voters.length.toLocaleString('en-IN')}</strong> total voters — search to filter</>
          )}
        </span>
        {totalPages > 1 && (
          <span>Page {page} / {totalPages}</span>
        )}
      </div>

      {/* Results table */}
      {query && results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50 border-b border-orange-100">
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Sr#</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Voter ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700 hidden sm:table-cell">Relative / Parent</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700 hidden md:table-cell">House No.</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Age</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Gender</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Booth</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((v, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{v.serial || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{v.voter_id || '—'}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{v.name || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{v.relative_name || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{v.house_no || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{v.age || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        v.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {v.gender === 'M' ? 'M' : 'F'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{v.part_no || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
              >← Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
              >Next →</button>
            </div>
          )}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-10 text-center text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <div>No results found for "<strong>{query}</strong>"</div>
        </div>
      )}

      {!query && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-8 text-center text-orange-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-sm font-medium">Type a name, Voter ID or house number above to search</div>
          <div className="text-xs mt-1 text-orange-300">{voters?.length?.toLocaleString('en-IN')} voters loaded — ready to search</div>
        </div>
      )}
    </div>
  )
}
