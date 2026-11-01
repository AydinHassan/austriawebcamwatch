<script setup>
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-icons/vue'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
} from 'radix-vue'

const navButton = cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7')
</script>

<template>
  <!-- Props and v-model fall through to CalendarRoot -->
  <CalendarRoot v-slot="{ grid, weekDays }" class="text-foreground">
    <CalendarHeader class="mb-2 flex items-center justify-between">
      <CalendarPrev :class="navButton">
        <ChevronLeftIcon />
      </CalendarPrev>
      <CalendarHeading class="text-sm font-medium" />
      <CalendarNext :class="navButton">
        <ChevronRightIcon />
      </CalendarNext>
    </CalendarHeader>
    <CalendarGrid
      v-for="month in grid"
      :key="month.value.toString()"
      class="w-full border-collapse"
    >
      <CalendarGridHead>
        <CalendarGridRow class="grid grid-cols-7">
          <CalendarHeadCell
            v-for="day in weekDays"
            :key="day"
            class="pb-1 text-center text-xs font-normal text-muted-foreground"
          >
            {{ day.slice(0, 2) }}
          </CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow v-for="(week, index) in month.rows" :key="index" class="grid grid-cols-7">
          <CalendarCell v-for="date in week" :key="date.toString()" :date="date" class="p-0.5">
            <CalendarCellTrigger
              :day="date"
              :month="month.value"
              :class="
                cn(
                  buttonVariants({ variant: 'ghost' }),
                  'h-8 w-full p-0 text-sm font-normal tabular-nums',
                  'data-[today]:ring-1 data-[today]:ring-border',
                  'data-[outside-view]:text-muted-foreground/50',
                  'data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground/30',
                  'data-[selected]:bg-foreground data-[selected]:text-background data-[selected]:hover:bg-foreground data-[selected]:hover:text-background',
                )
              "
            />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>
