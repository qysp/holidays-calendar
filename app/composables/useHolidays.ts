import { Holiday } from 'open-holiday-js'
import type { Ref } from 'vue'

export interface HolidayEvent {
  date: string // YYYY-MM-DD
  name: string
  type: 'public' | 'school'
  country: string
  states: string[] // selected regions this holiday applies to
}

/** Raw holiday as returned by the API, before date expansion */
interface RawHoliday {
  startDate: Date
  endDate: Date
  name: string
  type: 'public' | 'school'
  country: string
  /** Subdivision codes this holiday applies to; empty = entire country */
  subdivisions: string[]
}

// Module-level singletons — shared across all composable instances
const api = new Holiday()
// Keyed by `country|type|year` — 1 entry per country per type
const rawCache = new Map<string, RawHoliday[]>()

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Fetches and caches all holidays for a country (no subdivision filter). */
async function fetchCountryHolidays(
  country: string,
  type: 'public' | 'school',
  year: number
): Promise<RawHoliday[]> {
  const key = `${country}|${type}|${year}`
  if (rawCache.has(key)) return rawCache.get(key)!
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const hols
    = type === 'public'
      ? await api.getPublicHolidays(country, start, end, undefined, 'EN')
      : await api.getSchoolHolidays(country, start, end, undefined, 'EN')
  const result: RawHoliday[] = hols.map(h => ({
    startDate: h.startDate,
    endDate: h.endDate,
    name:
      h.name.find(n => n.language === 'EN')?.text
      ?? h.name[0]?.text
      ?? (type === 'public' ? 'Holiday' : 'School holiday'),
    type,
    country,
    subdivisions: h.subdivisions?.map(s => s.code) ?? []
  }))
  rawCache.set(key, result)
  return result
}

export function useHolidays(
  activeSelections: Ref<Array<{ country: string, state: string }>>,
  year: Ref<number>
) {
  const holidaysMap = ref(new Map<string, HolidayEvent[]>())
  const loading = ref(false)
  let fetchId = 0

  async function rebuild() {
    const id = ++fetchId
    loading.value = true
    const selections = [...activeSelections.value]
    const yr = year.value

    try {
      const uniqueCountries = [...new Set(selections.map(s => s.country))]

      // 2 requests per country total (public + school), all in parallel
      const allRaw = await Promise.all(
        uniqueCountries.flatMap(c => [
          fetchCountryHolidays(c, 'public', yr),
          fetchCountryHolidays(c, 'school', yr)
        ])
      )

      if (id !== fetchId) return // stale

      // Index selected states per country for fast lookup
      const statesByCountry = new Map<string, Set<string>>()
      for (const sel of selections) {
        if (!statesByCountry.has(sel.country))
          statesByCountry.set(sel.country, new Set())
        statesByCountry.get(sel.country)!.add(sel.state)
      }

      const groups = new Map<string, HolidayEvent>()
      const msPerDay = 86_400_000

      for (const h of allRaw.flat()) {
        const selectedStates = statesByCountry.get(h.country)
        if (!selectedStates) continue

        // Client-side filter: no subdivisions = nationwide; otherwise intersect with selected
        const applicableStates
          = h.subdivisions.length === 0
            ? [...selectedStates]
            : h.subdivisions.filter(s => selectedStates.has(s))

        if (applicableStates.length === 0) continue

        // Expand each day in the range and group by date
        for (
          let d = new Date(h.startDate);
          d <= h.endDate;
          d = new Date(d.getTime() + msPerDay)
        ) {
          const date = localDateStr(d)
          const groupKey = `${date}|${h.name}|${h.country}|${h.type}`
          const existing = groups.get(groupKey)
          if (existing) {
            for (const s of applicableStates) {
              if (!existing.states.includes(s)) existing.states.push(s)
            }
          } else {
            groups.set(groupKey, {
              date,
              name: h.name,
              type: h.type,
              country: h.country,
              states: [...applicableStates]
            })
          }
        }
      }

      const map = new Map<string, HolidayEvent[]>()
      for (const event of groups.values()) {
        const list = map.get(event.date) ?? []
        list.push(event)
        map.set(event.date, list)
      }

      holidaysMap.value = map
    } catch (err) {
      if (id === fetchId) console.error('Failed to fetch holidays:', err)
    } finally {
      if (id === fetchId) loading.value = false
    }
  }

  watch([activeSelections, year], rebuild, { immediate: true })

  return { holidaysMap, loading }
}
