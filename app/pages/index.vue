<script setup lang="ts">
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1) // 1-12
const viewMode = ref<'month' | 'year'>('month')
const sidebarOpen = ref(false)

const { activeSelections } = useFilters()
const { holidaysMap, loading } = useHolidays(activeSelections, currentYear)

function prevYear() {
  currentYear.value--
}
function nextYear() {
  currentYear.value++
}

function onNavigateMonth(year: number, month: number) {
  currentYear.value = year
  currentMonth.value = month
}

function onNavigateToMonth(year: number, month: number) {
  currentYear.value = year
  currentMonth.value = month
  viewMode.value = 'month'
}
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] overflow-hidden">
    <!-- Desktop sidebar -->
    <AppSidebar class="hidden lg:flex" />

    <!-- Mobile sidebar overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-50 lg:hidden flex"
        @click.self="sidebarOpen = false"
      >
        <div
          class="absolute inset-0 bg-black/40"
          @click="sidebarOpen = false"
        />
        <div class="relative z-10 h-full bg-default shadow-xl">
          <AppSidebar />
        </div>
      </div>
    </Transition>

    <!-- Main area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Toolbar -->
      <div
        class="flex items-center justify-between gap-2 px-4 py-3 border-b border-default shrink-0 flex-wrap"
      >
        <!-- Left: mobile menu + year nav -->
        <div class="flex items-center gap-2">
          <!-- Mobile: hamburger -->
          <UButton
            class="lg:hidden"
            icon="i-lucide-sliders-horizontal"
            size="sm"
            color="neutral"
            variant="ghost"
            aria-label="Toggle filters"
            @click="sidebarOpen = true"
          />

          <!-- Year navigation -->
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-chevron-left"
              size="sm"
              color="neutral"
              variant="ghost"
              aria-label="Previous year"
              @click="prevYear"
            />
            <span class="text-sm font-semibold tabular-nums w-12 text-center">{{
              currentYear
            }}</span>
            <UButton
              icon="i-lucide-chevron-right"
              size="sm"
              color="neutral"
              variant="ghost"
              aria-label="Next year"
              @click="nextYear"
            />
          </div>
        </div>

        <!-- Center: legend -->
        <div class="flex items-center gap-3 text-xs">
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span class="text-muted">Public holiday</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span class="text-muted">School holiday</span>
          </div>
        </div>

        <!-- Right: view toggle -->
        <div class="flex items-center">
          <div class="flex rounded-md overflow-hidden border border-default text-sm">
            <button
              class="px-3 py-1 font-medium transition-colors"
              :class="viewMode === 'month' ? 'bg-primary text-white' : 'text-muted hover:text-default hover:bg-elevated'"
              @click="viewMode = 'month'"
            >
              Month
            </button>
            <button
              class="px-3 py-1 font-medium border-l border-default transition-colors"
              :class="viewMode === 'year' ? 'bg-primary text-white' : 'text-muted hover:text-default hover:bg-elevated'"
              @click="viewMode = 'year'"
            >
              Year
            </button>
          </div>
        </div>
      </div>

      <!-- Calendar content -->
      <div class="flex-1 overflow-auto p-4 relative">
        <!-- Loading overlay -->
        <Transition name="fade">
          <div
            v-if="loading"
            class="absolute inset-0 z-10 flex items-center justify-center bg-default/60 backdrop-blur-sm"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="animate-spin size-8 text-primary"
            />
          </div>
        </Transition>
        <ClientOnly>
          <CalendarMonth
            v-if="viewMode === 'month'"
            :year="currentYear"
            :month="currentMonth"
            :holidays-map="holidaysMap"
            @navigate="onNavigateMonth"
          />
          <CalendarYear
            v-else
            :year="currentYear"
            :holidays-map="holidaysMap"
            @navigate-to-month="onNavigateToMonth"
          />
          <template #fallback>
            <div class="flex items-center justify-center h-64 text-muted">
              <UIcon
                name="i-lucide-loader-circle"
                class="animate-spin size-6"
              />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
