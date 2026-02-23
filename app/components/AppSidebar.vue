<script setup lang="ts">
const {
  COUNTRIES,
  selectedSet,
  isCountryFullyChecked,
  isCountryIndeterminate,
  toggleCountry,
  toggleState
} = useFilters()

// Track expanded/collapsed state per country
const expanded = reactive<Record<string, boolean>>(
  Object.fromEntries(COUNTRIES.map(c => [c.code, true]))
)
</script>

<template>
  <aside
    class="w-64 shrink-0 flex flex-col border-r border-default h-full overflow-y-auto"
  >
    <div class="p-4 border-b border-default">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted">
        Filter by Region
      </p>
    </div>

    <div class="p-3 flex flex-col gap-2">
      <div
        v-for="country in COUNTRIES"
        :key="country.code"
        class="flex flex-col"
      >
        <!-- Country row -->
        <div
          class="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-elevated/50"
        >
          <input
            :id="`country-${country.code}`"
            type="checkbox"
            class="rounded border-accented accent-primary size-4 cursor-pointer"
            :checked="isCountryFullyChecked(country.code)"
            :indeterminate="isCountryIndeterminate(country.code)"
            @change="toggleCountry(country.code)"
          >
          <label
            :for="`country-${country.code}`"
            class="flex-1 flex items-center gap-1.5 text-sm font-medium cursor-pointer select-none py-0.5"
          >
            <span>{{ country.flag }}</span>
            <span>{{ country.name }}</span>
          </label>
          <button
            v-if="country.states.length > 0"
            class="text-muted hover:text-default p-0.5 rounded transition-colors"
            :aria-label="expanded[country.code] ? 'Collapse' : 'Expand'"
            @click="expanded[country.code] = !expanded[country.code]"
          >
            <UIcon
              :name="
                expanded[country.code]
                  ? 'i-lucide-chevron-down'
                  : 'i-lucide-chevron-right'
              "
              class="size-3.5"
            />
          </button>
        </div>

        <!-- States list -->
        <div
          v-if="country.states.length > 0 && expanded[country.code]"
          class="ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-default pl-2"
        >
          <div
            v-for="state in country.states"
            :key="state.code"
            class="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-elevated/50"
          >
            <input
              :id="`state-${country.code}-${state.code}`"
              type="checkbox"
              class="rounded border-accented accent-primary size-3.5 cursor-pointer"
              :checked="selectedSet.has(state.code)"
              @change="toggleState(state.code)"
            >
            <label
              :for="`state-${country.code}-${state.code}`"
              class="text-xs text-muted hover:text-default cursor-pointer select-none"
            >
              {{ state.name }}
            </label>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
