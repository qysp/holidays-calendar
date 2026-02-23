import { useLocalStorage } from '@vueuse/core'

export interface StateConfig {
  code: string // full ISO 3166-2 code, e.g. 'DE-BY', 'NL-NH'
  name: string
}

export interface CountryConfig {
  code: string
  name: string
  flag: string
  states: StateConfig[]
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    states: [
      { code: 'DE-BB', name: 'Brandenburg' },
      { code: 'DE-BE', name: 'Berlin' },
      { code: 'DE-BW', name: 'Baden-Württemberg' },
      { code: 'DE-BY', name: 'Bavaria' },
      { code: 'DE-HB', name: 'Bremen' },
      { code: 'DE-HE', name: 'Hesse' },
      { code: 'DE-HH', name: 'Hamburg' },
      { code: 'DE-MV', name: 'Mecklenburg-Vorpommern' },
      { code: 'DE-NI', name: 'Lower Saxony' },
      { code: 'DE-NW', name: 'North Rhine-Westphalia' },
      { code: 'DE-RP', name: 'Rhineland-Palatinate' },
      { code: 'DE-SH', name: 'Schleswig-Holstein' },
      { code: 'DE-SL', name: 'Saarland' },
      { code: 'DE-SN', name: 'Saxony' },
      { code: 'DE-ST', name: 'Saxony-Anhalt' },
      { code: 'DE-TH', name: 'Thuringia' }
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    states: [
      { code: 'NL-DR', name: 'Drenthe' },
      { code: 'NL-FL', name: 'Flevoland' },
      { code: 'NL-FR', name: 'Friesland' },
      { code: 'NL-GE', name: 'Gelderland' },
      { code: 'NL-GR', name: 'Groningen' },
      { code: 'NL-LI', name: 'Limburg' },
      { code: 'NL-NB', name: 'North Brabant' },
      { code: 'NL-NH', name: 'North Holland' },
      { code: 'NL-OV', name: 'Overijssel' },
      { code: 'NL-UT', name: 'Utrecht' },
      { code: 'NL-ZE', name: 'Zeeland' },
      { code: 'NL-ZH', name: 'South Holland' }
    ]
  }
]

const VALID_CODES = new Set(COUNTRIES.flatMap(c => c.states.map(s => s.code)))

export function useFilters() {
  const selected = useLocalStorage<string[]>('filter-selected', [])

  // Sanitize on load: drop any codes that no longer exist (e.g. from old versions)
  if (selected.value.some(c => !VALID_CODES.has(c))) {
    selected.value = selected.value.filter(c => VALID_CODES.has(c))
  }

  const selectedSet = computed(() => new Set(selected.value))

  /** Each selected code is e.g. 'DE-BY' or 'NL-NH'. Country is the part before the first '-'. */
  const activeSelections = computed<Array<{ country: string, state: string }>>(
    () =>
      selected.value.map(code => ({
        country: code.split('-')[0],
        state: code
      }))
  )

  function isCountryFullyChecked(countryCode: string): boolean {
    const c = COUNTRIES.find(c => c.code === countryCode)
    if (!c) return false
    return c.states.every(s => selectedSet.value.has(s.code))
  }

  function isCountryIndeterminate(countryCode: string): boolean {
    const c = COUNTRIES.find(c => c.code === countryCode)
    if (!c) return false
    const checkedCount = c.states.filter(s =>
      selectedSet.value.has(s.code)
    ).length
    return checkedCount > 0 && checkedCount < c.states.length
  }

  function toggleCountry(countryCode: string) {
    const c = COUNTRIES.find(c => c.code === countryCode)!
    const stateCodes = c.states.map(s => s.code)
    if (isCountryFullyChecked(countryCode)) {
      selected.value = selected.value.filter(s => !stateCodes.includes(s))
    } else {
      const existing = new Set(selected.value)
      stateCodes.forEach(k => existing.add(k))
      selected.value = Array.from(existing)
    }
  }

  function toggleState(stateCode: string) {
    const has = selectedSet.value.has(stateCode)
    selected.value = has
      ? selected.value.filter(s => s !== stateCode)
      : [...selected.value, stateCode]
  }

  return {
    COUNTRIES,
    selected,
    selectedSet,
    activeSelections,
    isCountryFullyChecked,
    isCountryIndeterminate,
    toggleCountry,
    toggleState
  }
}
