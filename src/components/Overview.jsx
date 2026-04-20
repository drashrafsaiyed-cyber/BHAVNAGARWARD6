import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts'

const COLORS = { M: '#3b82f6', F: '#ec4899' }
const AGE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

function StatCard({ icon, label, labelEn, value, sub, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
    pink:   'bg-pink-50   border-pink-200   text-pink-700',
    green:  'bg-green-50  border-green-200  text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="font-medium text-sm mt-1">{label}</div>
      <div className="text-xs opacity-70">{labelEn}</div>
      {sub && <div className="text-xs mt-1 opacity-80">{sub}</div>}
    </div>
  )
}

export default function Overview({ summary }) {
  const { total_voters, male, female, age_groups, booth_stats } = summary

  const target55 = Math.ceil(total_voters * 0.55)
  const boothCount = Object.keys(booth_stats || {}).filter(k => k && k !== '?').length

  const genderData = [
    { name: 'પુરુષ (Male)', value: male },
    { name: 'સ્ત્રી (Female)', value: female },
  ]

  const ageData = Object.entries(age_groups || {})
    .filter(([k]) => k !== 'unknown')
    .map(([k, v]) => ({ name: k, count: v }))

  // Booth bar chart data
  const boothData = Object.entries(booth_stats || {})
    .filter(([k]) => k && k !== '?' && k !== '')
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([k, v]) => ({
      name: `B-${k}`,
      Male: v.male,
      Female: v.female,
      Total: v.total,
    }))

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon="👥" label="કુલ મતદારો" labelEn="Total Voters" value={total_voters.toLocaleString('en-IN')} color="orange" />
        <StatCard icon="🎯" label="જીત લક્ષ્ય (55%)" labelEn="Winning Target" value={target55.toLocaleString('en-IN')} color="green" />
        <StatCard icon="🔵" label="પુરુષ" labelEn="Male Voters" value={male.toLocaleString('en-IN')} sub={`${((male/total_voters)*100).toFixed(1)}%`} color="blue" />
        <StatCard icon="🔴" label="સ્ત્રી" labelEn="Female Voters" value={female.toLocaleString('en-IN')} sub={`${((female/total_voters)*100).toFixed(1)}%`} color="pink" />
        <StatCard icon="🏛️" label="કુલ બૂથ" labelEn="Total Booths" value={boothCount || 37} color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender pie */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">
            જાતિ વિભાજન <span className="text-gray-400 text-sm font-normal">(Gender Distribution)</span>
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent*100).toFixed(1)}%`} labelLine={false}>
                <Cell fill={COLORS.M} />
                <Cell fill={COLORS.F} />
              </Pie>
              <Tooltip formatter={(v) => v.toLocaleString('en-IN')} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-sm mt-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Male: {male.toLocaleString('en-IN')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-pink-500 inline-block" /> Female: {female.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Age bar */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">
            વય જૂથ <span className="text-gray-400 text-sm font-normal">(Age Groups)</span>
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => (v/1000).toFixed(0)+'k'} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v.toLocaleString('en-IN')} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booth-wise bar chart */}
      {boothData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">
            બૂથ-વાર મતદારો <span className="text-gray-400 text-sm font-normal">(Booth-wise Voters)</span>
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={boothData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v.toLocaleString('en-IN')} />
              <Legend />
              <Bar dataKey="Male"   fill="#3b82f6" stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="Female" fill="#ec4899" stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
