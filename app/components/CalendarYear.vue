<script setup lang="ts">
import { COUNTRIES } from '~/composables/useFilters'
import type { HolidayEvent } from '~/composables/useHolidays'

const stateNameMap = new Map(
  COUNTRIES.flatMap(c => c.states.map(s => [s.code, s.name]))
)
const stateCountMap = new Map(COUNTRIES.map(c => [c.code, c.states.length]))
const countryFlagMap = new Map(COUNTRIES.map(c => [c.code, c.flag]))

function stateLabel(states: string[], country: string): string {
  const total = stateCountMap.get(country) ?? Infinity
  if (states.length >= total) return 'All states'
  const names = states.map(s => stateNameMap.get(s) ?? s)
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

const props = defineProps<{
  year: number
  holidaysMap: Map<string, HolidayEvent[]>
}>()

const emit = defineEmits<{
  navigateToMonth: [year: number, month: number]
}>()

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const todayStr = new Date().toISOString().slice(0, 10)

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Monday-based start offset for the 1st of the month */
function startOffset(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return (day + 6) % 7
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getCells(month: number) {
  const offset = startOffset(props.year, month)
  const days = daysInMonth(props.year, month)
  const total = Math.ceil((offset + days) / 7) * 7
  return Array.from({ length: total }, (_, i) => {
    const day = i - offset + 1
    return day >= 1 && day <= days ? day : null
  })
}

function getHolidayTypes(month: number, day: number): Set<string> {
  const holidays = props.holidaysMap.get(dateStr(props.year, month, day)) ?? []
  return new Set(holidays.map(h => h.type))
}

function getDayTooltip(month: number, day: number): string {
  const holidays = props.holidaysMap.get(dateStr(props.year, month, day)) ?? []
  return holidays
    .map(h => `${countryFlagMap.get(h.country) ?? ''} ${h.name} · ${stateLabel(h.states, h.country)}`)
    .join(' | ')
}

function isToday(month: number, day: number): boolean {
  return dateStr(props.year, month, day) === todayStr
}

function isWeekend(cellIndex: number): boolean {
  const col = cellIndex % 7
  return col === 5 || col === 6
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
    <div
      v-for="(monthName, idx) in MONTHS"
      :key="monthName"
      class="border border-default rounded-lg overflow-hidden"
    >
      <!-- Mini-month header -->
      <button
        class="w-full px-3 py-2 bg-elevated/50 hover:bg-elevated text-left text-sm font-semibold transition-colors"
        @click="emit('navigateToMonth', year, idx + 1)"
      >
        {{ monthName }}
      </button>

      <!-- Day initials -->
      <div class="grid grid-cols-7 px-1 pt-1">
        <div
          v-for="(initial, i) in DAY_INITIALS"
          :key="i"
          class="text-[9px] font-medium text-center text-muted"
          :class="i >= 5 ? 'text-rose-400/70' : ''"
        >
          {{ initial }}
        </div>
      </div>

      <!-- Day cells -->
      <div class="grid grid-cols-7 gap-px px-1 pb-1">
        <template
          v-for="(day, cellIdx) in getCells(idx + 1)"
          :key="cellIdx"
        >
          <div
            v-if="day === null"
            class="aspect-square"
          />
          <UTooltip
            v-else
            :text="getDayTooltip(idx + 1, day)"
            :delay="200"
          >
            <div
              class="aspect-square flex flex-col items-center justify-center relative cursor-pointer rounded-sm hover:bg-elevated transition-colors"
              :class="[
                isWeekend(cellIdx) ? 'opacity-60' : '',
                getHolidayTypes(idx + 1, day).has('public') && getHolidayTypes(idx + 1, day).has('school')
                  ? 'bg-linear-to-b from-sky-500/20 to-amber-500/20'
                  : getHolidayTypes(idx + 1, day).has('public')
                    ? 'bg-sky-500/20'
                    : getHolidayTypes(idx + 1, day).has('school')
                      ? 'bg-amber-500/20'
                      : ''
              ]"
              @click="emit('navigateToMonth', year, idx + 1)"
            >
              <!-- Day number -->
              <span
                class="text-[9px] leading-none font-medium"
                :class="
                  isToday(idx + 1, day)
                    ? 'flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[8px]'
                    : 'text-default'
                "
              >
                {{ day }}
              </span>

              <!-- Holiday dots -->
              <div
                v-if="getHolidayTypes(idx + 1, day).size > 0"
                class="flex gap-0.5 mt-0.5"
              >
                <div
                  v-if="getHolidayTypes(idx + 1, day).has('public')"
                  class="w-1.5 h-1.5 rounded-full bg-sky-500"
                />
                <div
                  v-if="getHolidayTypes(idx + 1, day).has('school')"
                  class="w-1.5 h-1.5 rounded-full bg-amber-500"
                />
              </div>
            </div>
          </utooltip>
        </template>
      </div>
    </div>
  </div>
</template>
