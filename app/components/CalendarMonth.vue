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

function stateTooltip(states: string[], country: string): string {
  const total = stateCountMap.get(country) ?? Infinity
  if (states.length >= total) return 'All states'
  return states.map(s => stateNameMap.get(s) ?? s).join(', ')
}

const props = defineProps<{
  year: number
  month: number // 1-12
  holidaysMap: Map<string, HolidayEvent[]>
}>()

const emit = defineEmits<{
  navigate: [year: number, month: number]
}>()

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(props.year, props.month - 1, 1)
  )
)

const daysInMonth = computed(() =>
  new Date(props.year, props.month, 0).getDate()
)

/** Monday-based start offset (0 = Mon, 6 = Sun) */
const startOffset = computed(() => {
  const day = new Date(props.year, props.month - 1, 1).getDay()
  return (day + 6) % 7
})

const totalCells = computed(() => {
  const filled = startOffset.value + daysInMonth.value
  return Math.ceil(filled / 7) * 7
})

const todayStr = new Date().toISOString().slice(0, 10)

function dateStr(day: number): string {
  return `${props.year}-${String(props.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isToday(day: number): boolean {
  return dateStr(day) === todayStr
}

function getHolidays(day: number): HolidayEvent[] {
  return props.holidaysMap.get(dateStr(day)) ?? []
}

function isWeekend(cellIndex: number): boolean {
  const col = cellIndex % 7 // 0=Mon..5=Sat,6=Sun
  return col === 5 || col === 6
}

function prevMonth() {
  let m = props.month - 1
  let y = props.year
  if (m < 1) {
    m = 12
    y--
  }
  emit('navigate', y, m)
}

function nextMonth() {
  let m = props.month + 1
  let y = props.year
  if (m > 12) {
    m = 1
    y++
  }
  emit('navigate', y, m)
}

const BADGE_COLORS: Record<string, string> = {
  public: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/20',
  school:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/20'
}

function badgeClass(type: string): string {
  return (
    BADGE_COLORS[type]
    ?? 'bg-gray-500/15 text-gray-700 dark:text-gray-300 ring-gray-500/20'
  )
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Month navigation header -->
    <div class="flex items-center justify-between">
      <UButton
        icon="i-lucide-chevron-left"
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label="Previous month"
        @click="prevMonth"
      />
      <h2 class="text-base font-semibold tabular-nums">
        {{ monthLabel }}
      </h2>
      <UButton
        icon="i-lucide-chevron-right"
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label="Next month"
        @click="nextMonth"
      />
    </div>

    <!-- Day-of-week header -->
    <div class="grid grid-cols-7 text-center">
      <div
        v-for="name in DAY_NAMES"
        :key="name"
        class="text-xs font-medium text-muted py-1"
        :class="name === 'Sa' || name === 'Su' ? 'text-rose-500/70' : ''"
      >
        {{ name }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div
      class="grid grid-cols-7 gap-px bg-default rounded-lg overflow-hidden border border-default"
    >
      <template
        v-for="i in totalCells"
        :key="i"
      >
        <div
          v-if="i <= startOffset || i > startOffset + daysInMonth"
          class="bg-elevated/30 min-h-[90px]"
        />
        <div
          v-else
          class="bg-default min-h-[90px] p-1.5 flex flex-col gap-1"
          :class="isWeekend(i - 1) ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''"
        >
          <!-- Day number -->
          <span
            class="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0 t-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0"
            :class="
              isToday(i - startOffset)
                ? 'bg-primary text-white dark:text-white'
                : 'text-default'
            "
          >
            {{ i - startOffset }}
          </span>

          <!-- Holiday badges -->
          <div class="flex flex-col gap-0.5">
            <UTooltip
              v-for="h in getHolidays(i - startOffset)"
              :key="`${h.name}-${h.country}`"
              :text="`${h.name} · ${stateTooltip(h.states, h.country)}`"
            >
              <div
                class="text-[10px] leading-tight px-1.5 py-0.5 rounded ring-1 cursor-default"
                :class="badgeClass(h.type)"
              >
                <div class="truncate font-medium">
                  {{ countryFlagMap.get(h.country) }} {{ h.name }}
                </div>
                <div class="truncate opacity-60">
                  {{ stateLabel(h.states, h.country) }}
                </div>
              </div>
            </UTooltip>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
