<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-zinc-900">Exam Management</h1>
        <p class="text-xs text-zinc-600 mt-0.5">
          Configure schedules, sections, slots, student assignments, and proctoring rules.
        </p>
      </div>
      <button
        @click="showWizard = true; wizardStep = 1"
        class="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
      >
        <span>+</span> Create New Exam
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
        <button
          v-for="tab in filterTabs"
          :key="tab"
          @click="activeTab = tab"
          class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
          :class="activeTab === tab ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100'"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Search Box -->
      <div class="relative w-full sm:w-64">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by title or exam code..."
          class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none shadow-2xs"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center text-xs text-zinc-600 font-medium">
      Loading exam configurations...
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredExams.length === 0"
      class="rounded-2xl border border-dashed border-zinc-300 p-12 text-center space-y-3 bg-zinc-50/50"
    >
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-bold text-lg">
        📋
      </div>
      <div>
        <h3 class="text-sm font-bold text-zinc-900">No Examinations Found</h3>
        <p class="text-xs text-zinc-600 mt-1">Get started by creating your first exam specification.</p>
      </div>
      <button
        @click="showWizard = true; wizardStep = 1"
        class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
      >
        + Create Exam Now
      </button>
    </div>

    <!-- Exams Grid -->
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="exam in filteredExams"
        :key="exam.id"
        class="group flex flex-col rounded-2xl border bg-white shadow-xs transition-all hover:shadow-md"
        :class="exam.status === 'LIVE' ? 'border-red-200 ring-1 ring-red-100' : exam.status === 'COMPLETED' ? 'border-emerald-200' : 'border-zinc-200'"
      >
        <!-- Card Top: Code + Status Pipeline -->
        <div class="px-5 pt-4 pb-3 border-b border-zinc-100">
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-3xs font-bold text-zinc-400 uppercase tracking-widest">{{ exam.code }}</span>
            <!-- Live pulsing dot -->
            <span v-if="exam.status === 'LIVE'" class="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-3xs font-bold text-red-700">
              <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span></span>
              LIVE
            </span>
            <span v-else-if="exam.status === 'COMPLETED'" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-3xs font-bold text-emerald-700">✓ COMPLETED</span>
            <span v-else-if="exam.status === 'SCHEDULED'" class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-3xs font-bold text-blue-700">⏰ SCHEDULED</span>
            <span v-else class="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-3xs font-bold text-zinc-500">DRAFT</span>
          </div>

          <!-- Lifecycle Pipeline Bar -->
          <div class="flex items-center gap-0.5 text-3xs font-semibold">
            <span class="rounded px-1.5 py-0.5 transition-colors" :class="['DRAFT','SCHEDULED','LIVE','COMPLETED'].includes(exam.status) ? 'bg-zinc-900 text-white' : 'text-zinc-400'">Draft</span>
            <span class="text-zinc-300">→</span>
            <span class="rounded px-1.5 py-0.5 transition-colors" :class="['SCHEDULED','LIVE','COMPLETED'].includes(exam.status) ? 'bg-blue-600 text-white' : 'text-zinc-400'">Scheduled</span>
            <span class="text-zinc-300">→</span>
            <span class="rounded px-1.5 py-0.5 transition-colors" :class="['LIVE','COMPLETED'].includes(exam.status) ? 'bg-red-600 text-white' : 'text-zinc-400'">Live</span>
            <span class="text-zinc-300">→</span>
            <span class="rounded px-1.5 py-0.5 transition-colors" :class="exam.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'text-zinc-400'">Done</span>
          </div>
        </div>

        <!-- Card Body: Title + Stats -->
        <div class="px-5 py-4 flex-1 space-y-3">
          <div>
            <h3 class="font-bold text-zinc-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">{{ exam.title }}</h3>
            <p class="mt-0.5 text-2xs text-zinc-500 line-clamp-1">{{ exam.description || 'No description.' }}</p>
          </div>

          <!-- Quick Stats Row -->
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg bg-zinc-50 border border-zinc-100 p-2">
              <div class="text-xs font-bold text-zinc-900">{{ exam.durationMinutes }}<span class="text-3xs font-normal text-zinc-500">m</span></div>
              <div class="text-3xs text-zinc-400 mt-0.5">Duration</div>
            </div>
            <div class="rounded-lg bg-zinc-50 border border-zinc-100 p-2">
              <div class="text-xs font-bold text-zinc-900">{{ exam.totalMarks }}<span class="text-3xs font-normal text-zinc-500"> pts</span></div>
              <div class="text-3xs text-zinc-400 mt-0.5">Pass: {{ exam.passMarks }}</div>
            </div>
            <div class="rounded-lg bg-zinc-50 border border-zinc-100 p-2">
              <div class="text-xs font-bold text-zinc-900">{{ exam._count?.attempts || 0 }}</div>
              <div class="text-3xs text-zinc-400 mt-0.5">Attempts</div>
            </div>
          </div>

          <!-- Readiness Checklist -->
          <div class="space-y-1.5">
            <p class="text-3xs font-bold text-zinc-400 uppercase tracking-wider">Readiness</p>
            <div class="flex flex-wrap gap-1.5">
              <!-- Questions -->
              <span @click.stop="openWizardForExam(exam, 3)" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                :class="(exam._count?.questions || 0) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                {{ (exam._count?.questions || 0) > 0 ? '✅' : '⚠️' }} {{ exam._count?.questions || 0 }} Questions
              </span>
              <!-- Slots -->
              <span @click.stop="openWizardForExam(exam, 4)" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                :class="(exam._count?.slots || 0) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                {{ (exam._count?.slots || 0) > 0 ? '✅' : '⚠️' }} {{ exam._count?.slots || 0 }} Slots
              </span>
              <!-- Students -->
              <span @click.stop="openWizardForExam(exam, 4)" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                :class="(exam._count?.students || 0) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                {{ (exam._count?.students || 0) > 0 ? '✅' : '⚠️' }} {{ exam._count?.students || 0 }} Students
              </span>
              <!-- Pass Cutoff -->
              <span @click.stop="openWizardForExam(exam, 2)" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                :class="(exam.passMarks || 0) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                {{ (exam.passMarks || 0) > 0 ? '✅' : '⚠️' }} Cutoff: {{ exam.passMarks || 'Not set' }}
              </span>
            </div>
          </div>

          <!-- Results publish status -->
          <div v-if="exam.status === 'COMPLETED' || exam.status === 'LIVE'" class="flex items-center justify-between rounded-lg border px-3 py-2"
            :class="exam.publishedResults ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-zinc-50'">
            <span class="text-3xs font-semibold" :class="exam.publishedResults ? 'text-emerald-700' : 'text-zinc-500'">
              {{ exam.publishedResults ? '📣 Results visible to students' : '🔒 Results hidden from students' }}
            </span>
            <button
              @click="togglePublishCard(exam)"
              class="rounded-full text-3xs font-bold px-2 py-0.5 transition-colors cursor-pointer"
              :class="exam.publishedResults ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-zinc-800 text-white hover:bg-zinc-900'"
            >
              {{ exam.publishedResults ? 'Unpublish' : 'Publish' }}
            </button>
          </div>
        </div>

        <!-- Card Footer: Action Buttons -->
        <div class="px-5 py-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <!-- Go Live (DRAFT or SCHEDULED) -->
            <button
              v-if="exam.status === 'DRAFT' || exam.status === 'SCHEDULED'"
              @click="goLive(exam)"
              class="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
            >
              ▶ Go Live
            </button>
            <!-- Complete Exam (LIVE) -->
            <button
              v-if="exam.status === 'LIVE'"
              @click="completeExam(exam)"
              class="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-900 transition-colors cursor-pointer shadow-xs"
            >
              ⏹ Complete
            </button>
            <!-- Schedule (DRAFT only) -->
            <button
              v-if="exam.status === 'DRAFT'"
              @click="scheduleExam(exam)"
              class="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              ⏰ Schedule
            </button>
          </div>

          <div class="flex items-center gap-1">
            <button
              @click="openLeaderboardModal(exam)"
              class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 cursor-pointer transition-colors shadow-2xs"
            >
              🏆 Leaderboard & Responses
            </button>
            <button
              @click="openWizardForExam(exam, 1)"
              class="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors shadow-2xs"
            >
              ⚙ Configure
            </button>
            <button
              @click="deleteExam(exam.id)"
              class="rounded-lg p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
              title="Delete Exam"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================================= -->
    <!-- UNIFIED MAIN EXAM MODAL (5 TABS)                                              -->
    <!-- ============================================================================= -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div class="w-full max-w-4xl rounded-2xl border border-zinc-300 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <h3 class="text-base font-bold text-zinc-900">
              {{ isEditing ? `Configure: ${activeExam?.title}` : 'Create New Exam Specification' }}
            </h3>
            <p class="text-xs text-zinc-600 mt-0.5">
              Comprehensive exam setup, sections, time slots, student roster, and questions.
            </p>
          </div>
          <button
            @click="showModal = false"
            class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Modal 5 Tab Navigation -->
        <div class="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
          <button
            @click="modalTab = 'general'"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer"
            :class="modalTab === 'general' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100'"
          >
            ⚙️ General & Security
          </button>
          <button
            @click="modalTab = 'slots'"
            :disabled="!isEditing"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
            :class="modalTab === 'slots' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100'"
          >
            ⏰ Time Slots <span v-if="slots.length > 0" class="ml-1 rounded-full bg-zinc-700 px-1.5 py-0.5 text-3xs text-white">{{ slots.length }}</span>
          </button>
          <button
            @click="modalTab = 'students'"
            :disabled="!isEditing"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
            :class="modalTab === 'students' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100'"
          >
            👥 Assign Students
          </button>
          <button
            v-if="examForm.enableSections"
            @click="modalTab = 'sections'"
            :disabled="!isEditing"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
            :class="modalTab === 'sections' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100'"
          >
            📁 Sections <span v-if="sections.length > 0" class="ml-1 rounded-full bg-zinc-700 px-1.5 py-0.5 text-3xs text-white">{{ sections.length }}</span>
          </button>
          <button
            @click="modalTab = 'questions'"
            :disabled="!isEditing"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
            :class="modalTab === 'questions' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100'"
          >
            📋 Questions & CSV
          </button>
        </div>

        <!-- Tab Content Areas -->
        <div class="py-2">
          
          <!-- TAB 1: GENERAL & SECURITY SETTINGS -->
          <div v-if="modalTab === 'general'">
            <form @submit.prevent="saveExam" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Exam Title</label>
                  <input
                    v-model="examForm.title"
                    type="text"
                    required
                    placeholder="e.g. Data Structures Mid-Term"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Exam Code</label>
                  <input
                    v-model="examForm.code"
                    type="text"
                    required
                    placeholder="e.g. CS-201"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="mb-1 block font-bold text-zinc-800">Description</label>
                <textarea
                  v-model="examForm.description"
                  rows="2"
                  placeholder="Instructions for students..."
                  class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Duration (Minutes)</label>
                  <input
                    v-model.number="examForm.durationMinutes"
                    type="number"
                    required
                    min="5"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <div v-if="!examForm.enableSections">
                    <label class="mb-1 block font-bold text-zinc-800">Overall Passing Marks (Cutoff)</label>
                    <input
                      v-model.number="examForm.passingMarks"
                      type="number"
                      min="0"
                      placeholder="e.g. 40"
                      class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                    />
                    <p class="mt-1 text-3xs text-zinc-500">Minimum score required for a candidate to pass this exam.</p>
                  </div>
                  <div v-else class="rounded-lg bg-indigo-50 border border-indigo-200 p-2.5 text-3xs text-indigo-900 font-medium">
                    ⚡ <strong>Sections Enabled:</strong> Passing is strictly determined by individual Section Cutoffs in the <strong>Sections</strong> tab.
                  </div>
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Status</label>
                  <select
                    v-model="examForm.status"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <!-- Question Delivery & Security Settings Card -->
              <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <h4 class="font-bold text-zinc-900 text-xs">Question Delivery & Security Settings</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="examForm.shuffleQuestions" class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-0" />
                    <span class="text-xs font-semibold text-zinc-800">Shuffle Question Order</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="examForm.webcamRequired" class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-0" />
                    <span class="text-xs font-semibold text-zinc-800">Require Live AI Webcam Proctoring</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="examForm.tabSwitchDetection" class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-0" />
                    <span class="text-xs font-semibold text-zinc-800">Detect Tab Switching & Fullscreen Exit</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="examForm.showImmediateResults" class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-0" />
                    <span class="text-xs font-semibold text-zinc-800">Publish Score Immediately on Submit</span>
                  </label>
                </div>

                <div class="pt-2 flex items-start gap-2 border-t border-zinc-200">
                  <input
                    type="checkbox"
                    id="enableSections"
                    v-model="examForm.enableSections"
                    class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <label for="enableSections" class="font-bold text-zinc-900 block cursor-pointer">
                      Enable Sections for this Exam
                    </label>
                    <p class="text-xs text-zinc-600">
                      Organize questions into sections (e.g. Quantitative, Technical) with optional per-section cutoffs and question limit rules.
                    </p>
                  </div>
                </div>
              </div>

              <!-- General Save Action -->
              <div class="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
                <button
                  type="button"
                  @click="showModal = false"
                  class="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="savingExam"
                  class="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {{ savingExam ? 'Saving...' : (isEditing ? 'Update Exam Settings' : 'Create & Proceed') }}
                </button>
              </div>
            </form>
          </div>

          <!-- TAB 2: TIME SLOTS MANAGER -->
          <div v-else-if="modalTab === 'slots'" class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-100 p-4 rounded-xl border border-zinc-200 gap-3">
              <div>
                <h4 class="font-bold text-zinc-900 text-sm">Configure Available Time Slots</h4>
                <p class="text-xs text-zinc-600">
                  Generate slots automatically based on exam duration ({{ examForm.durationMinutes }} mins) or create custom slots.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="showAutoSlotForm = !showAutoSlotForm"
                  class="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
                >
                  ⚡ Auto-Generate Slots
                </button>
                <button
                  @click="showSlotForm = !showSlotForm"
                  class="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
                >
                  {{ showSlotForm ? 'Close Form' : '+ Custom Slot' }}
                </button>
              </div>
            </div>

            <!-- Auto-Generate Hourly Slots Inline Card -->
            <div v-if="showAutoSlotForm" class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h5 class="font-bold text-indigo-900 text-xs">⚡ Auto-Generate Exam Slots ({{ examForm.durationMinutes }}-Minute Intervals)</h5>
                <span class="text-3xs text-indigo-700 font-bold">Exam Duration: {{ examForm.durationMinutes }} Minutes</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="mb-1 block font-bold text-zinc-800 text-2xs">Window Start (Date & Time)</label>
                  <input
                    v-model="autoSlotConfig.windowStart"
                    type="datetime-local"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800 text-2xs">Window End (Date & Time)</label>
                  <input
                    v-model="autoSlotConfig.windowEnd"
                    type="datetime-local"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800 text-2xs">Seats per Slot</label>
                  <input
                    v-model.number="autoSlotConfig.capacity"
                    type="number"
                    min="1"
                    placeholder="30"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button @click="showAutoSlotForm = false" type="button" class="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer shadow-2xs">
                  Cancel
                </button>
                <button @click="generateAutoSlots" :disabled="generatingAutoSlots" type="button" class="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-sm transition-all">
                  {{ generatingAutoSlots ? 'Generating...' : `⚡ Generate ${examForm.durationMinutes || 60}-Min Slots` }}
                </button>
              </div>
            </div>

            <!-- Add Slot Inline Form -->
            <div v-if="showSlotForm" class="rounded-xl border border-zinc-300 bg-zinc-50 p-4 space-y-3">
              <h5 class="font-bold text-zinc-900 text-xs">Create New Exam Slot</h5>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Slot Start Time</label>
                  <input
                    v-model="slotForm.startTime"
                    type="datetime-local"
                    required
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Slot End Time</label>
                  <input
                    v-model="slotForm.endTime"
                    type="datetime-local"
                    required
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Max Seat Capacity</label>
                  <input
                    v-model.number="slotForm.capacity"
                    type="number"
                    min="1"
                    placeholder="30"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  @click="showSlotForm = false"
                  class="rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  @click="saveSlot"
                  :disabled="savingSlot"
                  class="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                >
                  {{ savingSlot ? 'Creating Slot...' : 'Save Slot' }}
                </button>
              </div>
            </div>

            <!-- List of Slots -->
            <div v-if="loadingSlots" class="py-8 text-center text-xs text-zinc-600 font-medium">Loading slots...</div>
            <div v-else-if="slots.length === 0" class="rounded-xl border border-dashed border-zinc-300 py-10 text-center text-xs text-zinc-600 bg-zinc-50">No slots configured yet. Click "+ Add Time Slot" above to define available exam windows.</div>
            <div v-else class="space-y-2">
              <div
                v-for="s in slots"
                :key="s.id"
                class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
              >
                <div>
                  <h5 class="font-bold text-zinc-900 text-xs">
                    📅 {{ new Date(s.startTime).toLocaleString() }} - {{ new Date(s.endTime).toLocaleTimeString() }}
                  </h5>
                  <p class="text-xs text-zinc-600 mt-0.5">
                    Capacity: <span class="font-bold text-zinc-900">{{ s.capacity }} seats</span> • Booked: <span class="font-bold text-emerald-700">{{ s.bookedCount || 0 }} seats</span> • Remaining: <span class="font-bold text-indigo-700">{{ s.remainingSeats }} seats</span>
                  </p>
                </div>
                <button @click="deleteSlot(s.id)" class="text-xs font-semibold text-red-600 hover:text-red-800 p-1.5 cursor-pointer">Delete</button>
              </div>
            </div>
          </div>

          <!-- TAB 3: ASSIGN STUDENTS & BULK CSV ROSTER -->
          <div v-else-if="modalTab === 'students'" class="space-y-5">
            <!-- CSV Bulk Upload Card -->
            <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-zinc-900 text-xs">Bulk Upload Students & Assign to Exam</h4>
                  <p class="text-xs text-zinc-600">Upload CSV with columns: name, email, phone. Accounts and temporary passwords will be generated automatically.</p>
                </div>
                <button @click="downloadStudentCsvTemplate" class="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer">
                  📥 Download CSV Template
                </button>
              </div>
              <div class="pt-2">
                <input type="file" accept=".csv" @change="handleStudentCsvSelected" class="text-xs text-zinc-800 font-medium cursor-pointer" />
              </div>
            </div>

            <!-- CSV Staging Preview Table -->
            <div v-if="parsedStudentCsv.length > 0" class="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-900">Preview: {{ parsedStudentCsv.length }} Students Ready to Commit</span>
                <div class="flex items-center gap-3">
                  <button @click="exportGeneratedCredentialsCsv" class="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer">
                    📥 Download Generated Passwords CSV
                  </button>
                  <button @click="parsedStudentCsv = []" class="text-xs font-bold text-red-600 hover:underline cursor-pointer">Clear Preview</button>
                </div>
              </div>

              <div class="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
                <table class="w-full text-left text-xs text-zinc-800">
                  <thead class="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-200">
                    <tr>
                      <th class="p-2">#</th>
                      <th class="p-2">Name</th>
                      <th class="p-2">Email</th>
                      <th class="p-2">Roll / Phone</th>
                      <th class="p-2">Generated Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(s, idx) in parsedStudentCsv" :key="idx" class="border-t border-zinc-200 hover:bg-zinc-50">
                      <td class="p-2 font-bold">{{ idx + 1 }}</td>
                      <td class="p-2 font-bold text-zinc-900">{{ s.name }}</td>
                      <td class="p-2">{{ s.email }}</td>
                      <td class="p-2 font-mono font-bold text-indigo-700">{{ s.rollNumber }}</td>
                      <td class="p-2 font-mono font-bold text-emerald-700">{{ s.password }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                @click="commitStudentAssignment"
                :disabled="savingStudents"
                class="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {{ savingStudents ? 'Saving to Database...' : `Confirm & Save ${parsedStudentCsv.length} Students to Database` }}
              </button>
            </div>

            <!-- Assigned Students Roster Section -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between border-b border-zinc-200 pb-2">
                <h4 class="font-bold text-zinc-900 text-xs uppercase tracking-wider">
                  👥 Assigned Students Roster ({{ assignedStudents.length }})
                </h4>
                <div class="flex items-center gap-3">
                  <button v-if="assignedStudents.length > 0" @click="exportAssignedStudentsRosterCsv" class="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer">
                    📥 Download Roster CSV
                  </button>
                  <button @click="fetchAssignedStudents" class="text-3xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer">
                    🔄 Refresh Roster
                  </button>
                </div>
              </div>

              <div v-if="loadingAssignedStudents" class="py-6 text-center text-xs text-zinc-500 font-medium">
                Loading assigned roster...
              </div>

              <div v-else-if="assignedStudents.length === 0" class="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-xs text-zinc-500 bg-zinc-50">
                No students currently assigned to this exam. Upload a CSV above to assign candidate roster.
              </div>

              <div v-else class="max-h-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white">
                <table class="w-full text-left text-xs text-zinc-800">
                  <thead class="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-200 sticky top-0">
                    <tr>
                      <th class="p-2.5">#</th>
                      <th class="p-2.5">Student Name</th>
                      <th class="p-2.5">Email</th>
                      <th class="p-2.5">Roll / Phone</th>
                      <th class="p-2.5">Slot Status</th>
                      <th class="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-200">
                    <tr v-for="(student, idx) in assignedStudents" :key="student.candidateId" class="hover:bg-zinc-50 transition-colors">
                      <td class="p-2.5 font-bold text-zinc-500">{{ idx + 1 }}</td>
                      <td class="p-2.5 font-bold text-zinc-900">{{ student.name }}</td>
                      <td class="p-2.5 text-zinc-600">{{ student.email }}</td>
                      <td class="p-2.5 font-mono text-indigo-700 font-bold">{{ student.rollNumber || 'N/A' }}</td>
                      <td class="p-2.5">
                        <span v-if="student.slotStartTime" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-3xs font-bold text-emerald-800">
                          📅 {{ new Date(student.slotStartTime).toLocaleString() }}
                        </span>
                        <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-3xs font-bold text-amber-800">
                          Pending Slot Choice
                        </span>
                      </td>
                      <td class="p-2.5 text-right">
                        <button
                          @click="removeStudentAssignment(student.candidateId)"
                          class="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer p-1"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 4: SECTIONS WORKBENCH -->
          <div v-else-if="modalTab === 'sections'" class="space-y-4">
            <div v-if="!examForm.enableSections" class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-center justify-between">
              <div>
                <span class="font-bold block text-sm">⚠️ Sections are Disabled</span>
                <span class="text-xs text-amber-800">Questions will be served from a single general pool. Check "Enable Sections" in General Settings to enable.</span>
              </div>
              <button
                @click="examForm.enableSections = true"
                class="rounded-lg bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900 transition-colors cursor-pointer"
              >
                Enable Sections Now
              </button>
            </div>

            <div v-else class="space-y-4">
              <div class="flex items-center justify-between bg-zinc-100 p-4 rounded-xl border border-zinc-200">
                <div>
                  <h4 class="font-bold text-zinc-900 text-sm">Manage Exam Sections</h4>
                  <p class="text-xs text-zinc-600">Group questions into distinct sections with custom cutoffs and limits.</p>
                </div>
                <button
                  @click="openAddSectionInline"
                  class="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
                >
                  + Add Section
                </button>
              </div>

              <!-- Add/Edit Section Inline Form -->
              <div v-if="showInlineSectionForm" class="rounded-xl border border-zinc-300 bg-zinc-50 p-4 space-y-3">
                <h5 class="font-bold text-zinc-900 text-xs">{{ editingSectionId ? 'Edit Section' : 'Create New Section' }}</h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="mb-1 block font-bold text-zinc-800">Section Name</label>
                    <input v-model="sectionForm.name" type="text" required placeholder="e.g. Quantitative Aptitude" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1 block font-bold text-zinc-800">Section Cutoff Percentage (%)</label>
                    <input v-model.number="sectionForm.cutoffMarks" type="number" min="0" max="100" placeholder="e.g. 40" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none" />
                    <p class="mt-1 text-3xs text-zinc-500">% of section total marks required to pass (e.g. 40%)</p>
                  </div>
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Description (Optional)</label>
                  <input v-model="sectionForm.description" type="text" placeholder="Brief description..." class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none" />
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Max Questions to Serve <span class="text-zinc-500 font-normal">(Leave blank for all)</span></label>
                  <input v-model.number="sectionForm.maxQuestionsLimit" type="number" min="1" placeholder="e.g. 20" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none" />
                </div>
                <div class="flex items-center justify-end gap-2 pt-2">
                  <button type="button" @click="showInlineSectionForm = false" class="rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer">Cancel</button>
                  <button type="button" @click="saveSection" :disabled="savingSection" class="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer">Save Section</button>
                </div>
              </div>

              <!-- List of Sections -->
              <div v-if="loadingSections" class="py-8 text-center text-xs text-zinc-600 font-medium">Loading sections...</div>
              <div v-else-if="sections.length === 0" class="rounded-xl border border-dashed border-zinc-300 py-10 text-center text-xs text-zinc-600 bg-zinc-50">No sections created yet. Click "+ Add Section" above.</div>
              <div v-else class="space-y-2">
                <div v-for="(s, idx) in sections" :key="s.id" class="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <h5 class="font-bold text-zinc-900 text-xs">{{ s.name }}</h5>
                        <span v-if="(s.questionCount || 0) > 0" class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-3xs font-bold text-emerald-800">
                          ✅ {{ s.questionCount }} Questions Uploaded
                        </span>
                      </div>
                      <p class="text-xs text-zinc-600 mt-0.5">
                        Cutoff: <span class="font-bold text-zinc-900">{{ s.cutoffMarks || 0 }}% of section total</span>
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <template v-if="(s.questionCount || 0) === 0">
                        <label class="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer shadow-xs">
                          📤 Upload Questions CSV
                          <input type="file" accept=".csv" class="hidden" @change="(e) => handleSectionCsvUpload(e, s.id, s.name)" />
                        </label>
                        <button @click="downloadQuestionCsvTemplate(s.name)" class="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer shadow-xs">
                          ⬇ CSV Template
                        </button>
                      </template>

                      <template v-else>
                        <button @click="modalTab = 'questions'" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs">
                          ✏️ View / Edit Questions
                        </button>
                        <label class="text-3xs font-bold text-zinc-500 hover:text-zinc-800 underline cursor-pointer px-1">
                          Re-upload CSV
                          <input type="file" accept=".csv" class="hidden" @change="(e) => handleSectionCsvUpload(e, s.id, s.name)" />
                        </label>
                      </template>

                      <button @click="openEditSectionInline(s)" class="text-xs font-semibold text-zinc-700 hover:text-zinc-900 p-1.5 cursor-pointer">Edit</button>
                      <button @click="deleteSection(s.id)" class="text-xs font-semibold text-red-600 hover:text-red-800 p-1.5 cursor-pointer">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 5: QUESTIONS & CSV WORKBENCH -->
          <div v-else-if="modalTab === 'questions'" class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-3 gap-2">
              <div class="flex items-center gap-2">
                <button @click="workbenchSubTab = 'list'" class="rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer" :class="workbenchSubTab === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'">Question List ({{ examQuestions.length }})</button>
                <button @click="workbenchSubTab = 'add'" class="rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer" :class="workbenchSubTab === 'add' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'">+ Add Single Question</button>
              </div>
              <button
                v-if="workbenchSubTab === 'list' && examQuestions.length > 0"
                @click="showBatchMarksCard = !showBatchMarksCard"
                class="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                ⚡ Batch Apply Marks & Rules
              </button>
            </div>

            <!-- Batch Marking Scheme Card -->
            <div v-if="showBatchMarksCard && workbenchSubTab === 'list'" class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h5 class="font-bold text-indigo-900 text-xs">⚡ Batch Apply Marking Scheme to Questions</h5>
                <span class="text-3xs text-indigo-700 font-bold">Applies to: {{ batchMarksForm.sectionId === 'ALL' ? 'All Questions in Exam' : 'Selected Section' }}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-2xs font-bold text-zinc-800 mb-1">Target Section</label>
                  <select v-model="batchMarksForm.sectionId" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 font-bold focus:outline-none">
                    <option value="ALL">-- ALL Questions in Exam --</option>
                    <option v-for="sec in sections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-2xs font-bold text-zinc-800 mb-1">Positive Marks (+)</label>
                  <input v-model.number="batchMarksForm.points" type="number" min="0" step="0.25" placeholder="e.g. 2" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-2xs font-bold text-zinc-800 mb-1">Negative Penalty (−)</label>
                  <input v-model.number="batchMarksForm.negativePoints" type="number" min="0" step="0.25" placeholder="e.g. 0.5" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none" />
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 pt-1">
                <button @click="showBatchMarksCard = false" type="button" class="rounded-lg border border-zinc-300 bg-white px-3.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer shadow-2xs">Cancel</button>
                <button @click="applyBatchMarks" :disabled="applyingBatchMarks" type="button" class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs">
                  {{ applyingBatchMarks ? 'Updating Marks...' : '⚡ Apply Marks to Matching Questions' }}
                </button>
              </div>
            </div>

            <!-- Question List -->
            <div v-if="workbenchSubTab === 'list'" class="space-y-2">
              <!-- Total Marks Summary Banner -->
              <div v-if="examQuestions.length > 0" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between">
                <div class="flex items-center gap-4 text-xs">
                  <span class="font-bold text-emerald-900">📊 Total Question Marks: <span class="text-emerald-700">{{ examQuestions.reduce((s, q) => s + (Number(q.points) || 0), 0) }}</span></span>
                  <span class="text-emerald-700">Questions: <b>{{ examQuestions.length }}</b></span>
                  <span class="text-emerald-700">With Negative Marking: <b>{{ examQuestions.filter(q => (q.negativePoints || 0) > 0).length }}</b></span>
                </div>
                <span class="text-3xs text-emerald-700">Pass Cutoff is set separately in General Settings →</span>
              </div>
              <div v-if="examQuestions.length === 0" class="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-xs text-zinc-600">No questions created yet.</div>
              <div v-else class="space-y-2">
                <div v-for="(q, idx) in examQuestions" :key="q.id" class="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2">
                  <!-- Normal Card Mode -->
                  <div v-if="editingQuestionId !== q.id" class="flex items-start justify-between">
                    <div class="flex-1 min-w-0 pr-2">
                      <span class="font-bold text-zinc-900 text-xs">Q{{ idx + 1 }}. {{ q.statement }}</span>
                      <div class="mt-1.5 flex items-center flex-wrap gap-2 text-3xs">
                        <!-- Marks badge: +pts / -penalty -->
                        <span class="rounded-full px-2.5 py-0.5 font-bold" :class="(q.negativePoints || 0) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'">
                          +{{ q.points }}{{ (q.negativePoints || 0) > 0 ? ` / −${q.negativePoints}` : '' }} marks
                        </span>
                        <span class="rounded-full bg-zinc-100 px-2.5 py-0.5 font-bold text-zinc-700">{{ q.type || 'MCQ' }}</span>
                        <span class="rounded-full px-2.5 py-0.5 font-bold" :class="q.difficulty === 'EASY' ? 'bg-green-100 text-green-700' : q.difficulty === 'HARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'">{{ q.difficulty }}</span>
                        <span v-if="q.sectionId" class="rounded-full bg-indigo-100 px-2.5 py-0.5 font-bold text-indigo-700">{{ sections.find(s => s.id === q.sectionId)?.name || 'Section' }}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button @click="openEditQuestion(q)" class="text-xs font-bold text-indigo-700 hover:text-indigo-900 p-1 cursor-pointer">✏️ Edit Marks</button>
                      <button @click="deleteQuestion(q.id)" class="text-zinc-400 hover:text-red-600 p-1 cursor-pointer">Delete</button>
                    </div>
                  </div>

                  <!-- Question Inline Editor Mode -->
                  <div v-else class="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <h6 class="font-bold text-indigo-900 text-xs">Edit Question Marks & Details (Q{{ idx + 1 }})</h6>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label class="block text-2xs font-bold text-zinc-800 mb-1">Positive Marks (+)</label>
                        <input v-model.number="editingQuestionForm.points" type="number" min="0" step="0.25" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900" />
                      </div>
                      <div>
                        <label class="block text-2xs font-bold text-zinc-800 mb-1">Negative Penalty (−)</label>
                        <input v-model.number="editingQuestionForm.negativePoints" type="number" min="0" step="0.25" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900" />
                      </div>
                      <div>
                        <label class="block text-2xs font-bold text-zinc-800 mb-1">Section</label>
                        <select v-model="editingQuestionForm.sectionId" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900">
                          <option :value="null">-- General (No Section) --</option>
                          <option v-for="sec in sections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-2xs font-bold text-zinc-800 mb-1">Statement</label>
                      <textarea v-model="editingQuestionForm.statement" rows="2" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 font-medium"></textarea>
                    </div>
                    <div>
                      <label class="block text-2xs font-bold text-zinc-800 mb-1">Correct Answer</label>
                      <input v-model="editingQuestionForm.correctAnswer" type="text" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 font-bold" />
                    </div>
                    <div class="flex items-center justify-end gap-2 pt-1">
                      <button @click="editingQuestionId = null" type="button" class="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer">Cancel</button>
                      <button @click="saveQuestionEdit" :disabled="savingQuestionEdit" type="button" class="rounded-lg bg-zinc-900 px-4 py-1 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs">
                        {{ savingQuestionEdit ? 'Saving...' : 'Save Question' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>


            </div>


            <!-- Add Single Question Form -->
            <div v-else-if="workbenchSubTab === 'add'" class="rounded-xl border border-zinc-300 bg-zinc-50 p-4 space-y-3">
              <h5 class="font-bold text-zinc-900 text-xs">Create Question</h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Assign to Section</label>
                  <select v-model="singleQuestionForm.sectionId" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none">
                    <option :value="null">-- General (No Section) --</option>
                    <option v-for="sec in sections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Question Type</label>
                  <select v-model="singleQuestionForm.type" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none">
                    <option value="MCQ">MCQ (Multiple Choice)</option>
                    <option value="NUMERICAL">Numerical / Integer</option>
                    <option value="SUBJECTIVE">Subjective / Essay</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Positive Marks (+)</label>
                  <input v-model.number="singleQuestionForm.points" type="number" min="0" step="0.25" placeholder="e.g. 2" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none" />
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Negative Marks (−)</label>
                  <input v-model.number="singleQuestionForm.negativePoints" type="number" min="0" step="0.25" placeholder="e.g. 0.25" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none" />
                  <p class="mt-0.5 text-3xs text-zinc-500">0 = no penalty</p>
                </div>
                <div>
                  <label class="mb-1 block font-bold text-zinc-800">Difficulty</label>
                  <select v-model="singleQuestionForm.difficulty" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="mb-1 block font-bold text-zinc-800">Question Statement</label>
                <textarea v-model="singleQuestionForm.statement" rows="2" required placeholder="Enter question..." class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none"></textarea>
              </div>
              <div>
                <label class="mb-1 block font-bold text-zinc-800">Correct Answer</label>
                <input v-model="singleQuestionForm.correctAnswer" type="text" placeholder="e.g. Option A text, or numeric value" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none" />
                <p class="mt-0.5 text-3xs text-zinc-500">For MCQ: type the exact correct option text. For Numerical: type the number.</p>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" @click="workbenchSubTab = 'list'" class="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer">Cancel</button>
                <button type="button" @click="saveSingleQuestion" :disabled="savingQuestion" class="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer">Save Question</button>
              </div>
            </div>
          </div>

        </div>

        <!-- Configure Modal Footer Navigation -->
        <div class="flex items-center justify-between border-t border-zinc-200 pt-4 mt-2">
          <div class="flex items-center gap-2">
            <button
              v-if="modalTab !== 'general'"
              @click="configureModalPrevTab"
              type="button"
              class="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors shadow-2xs"
            >
              ← Previous Tab
            </button>
            <button
              @click="showModal = false"
              type="button"
              class="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="modalTab !== 'questions'"
              @click="configureModalNextTab"
              type="button"
              class="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer transition-colors shadow-xs"
            >
              Next Tab →
            </button>
            <button
              @click="saveExamAndPublish"
              :disabled="savingExam"
              type="button"
              class="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
            >
              {{ savingExam ? 'Saving...' : (modalTab === 'questions' ? '✓ Save & Finalize Exam' : '✓ Save Exam Settings') }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ============================================================================= -->
    <!-- DYNAMIC LIVE LEADERBOARD & CANDIDATE RESPONSE INSPECTOR MODAL                -->
    <!-- ============================================================================= -->
    <div v-if="showLeaderboardModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div class="w-full max-w-5xl rounded-2xl border border-zinc-300 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-3xs font-bold text-amber-800">Live Auto-Ranking</span>
              <h3 class="text-base font-bold text-zinc-900">Leaderboard & Candidate Responses: {{ leaderboardExamTitle }}</h3>
            </div>
            <p class="text-xs text-zinc-600 mt-0.5">
              Self-paced submissions auto-ranked by Highest Score & Fastest Time. Results are hidden from candidates until examiner email dispatch.
            </p>
          </div>
          <button @click="showLeaderboardModal = false" class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer">✕</button>
        </div>

        <!-- Summary Metrics Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <span class="text-3xs font-bold text-zinc-500 uppercase tracking-wider block">Total Candidates</span>
            <span class="text-lg font-extrabold text-zinc-900 mt-0.5 block">{{ leaderboardMetrics.totalAttempts || 0 }}</span>
          </div>
          <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <span class="text-3xs font-bold text-emerald-800 uppercase tracking-wider block">Highest Score</span>
            <span class="text-lg font-extrabold text-emerald-900 mt-0.5 block">{{ leaderboardMetrics.highestScore || 0 }} pts</span>
          </div>
          <div class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5">
            <span class="text-3xs font-bold text-indigo-800 uppercase tracking-wider block">Average Score</span>
            <span class="text-lg font-extrabold text-indigo-900 mt-0.5 block">{{ leaderboardMetrics.averageScore || 0 }} pts</span>
          </div>
          <div class="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5">
            <span class="text-3xs font-bold text-purple-800 uppercase tracking-wider block">Pass Rate</span>
            <span class="text-lg font-extrabold text-purple-900 mt-0.5 block">{{ leaderboardMetrics.passRate || 0 }}%</span>
          </div>
        </div>

        <!-- Leaderboard Data Table -->
        <div v-if="loadingLeaderboard" class="py-12 text-center text-xs font-medium text-zinc-500">
          Loading live candidate rankings...
        </div>

        <div v-else-if="leaderboardRows.length === 0" class="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-xs text-zinc-600">
          No candidates have completed this examination yet. Candidates will appear here automatically upon submission.
        </div>

        <div v-else class="space-y-3">
          <div class="overflow-x-auto rounded-xl border border-zinc-200">
            <table class="w-full text-left text-xs">
              <thead class="bg-zinc-100 text-3xs font-bold uppercase text-zinc-700 tracking-wider">
                <tr>
                  <th class="px-4 py-3">Rank</th>
                  <th class="px-4 py-3">Candidate</th>
                  <th class="px-4 py-3">Score & Marks</th>
                  <th class="px-4 py-3">Percentage</th>
                  <th class="px-4 py-3">Time Taken</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 bg-white font-medium text-zinc-800">
                <tr v-for="row in leaderboardRows" :key="row.attemptId" class="hover:bg-zinc-50/80 transition-colors">
                  <td class="px-4 py-3 font-bold">
                    <span 
                      class="inline-flex h-6 w-6 items-center justify-center rounded-full text-3xs font-extrabold"
                      :class="row.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-2xs' : row.rank === 2 ? 'bg-zinc-300 text-zinc-900' : row.rank === 3 ? 'bg-amber-700 text-white' : 'bg-zinc-100 text-zinc-700'"
                    >
                      #{{ row.rank }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-bold text-zinc-900">{{ row.candidateName }}</div>
                    <div class="text-3xs text-zinc-500 font-mono">{{ row.candidateEmail }} • Roll: {{ row.rollNumber }}</div>
                  </td>
                  <td class="px-4 py-3 font-bold text-zinc-900">
                    {{ row.totalScore }} / {{ row.maxScore }} pts
                  </td>
                  <td class="px-4 py-3 font-bold" :class="row.passed ? 'text-emerald-700' : 'text-red-600'">
                    {{ row.percentage }}%
                  </td>
                  <td class="px-4 py-3 text-zinc-600 font-mono text-3xs">
                    {{ row.durationFormatted }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-3xs font-bold" :class="row.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'">
                      {{ row.passed ? 'PASSED' : 'FAILED' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        @click="inspectCandidateResponses(row.attemptId)"
                        class="rounded-lg bg-zinc-900 px-3 py-1.5 text-3xs font-bold text-white hover:bg-zinc-800 cursor-pointer shadow-2xs"
                      >
                        👁️ View Responses
                      </button>
                      <button
                        @click="dispatchScoreEmail(row.attemptId, row.candidateName, row.candidateEmail)"
                        :disabled="sendingEmailAttemptId === row.attemptId"
                        class="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-3xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 cursor-pointer"
                      >
                        {{ sendingEmailAttemptId === row.attemptId ? 'Sending...' : '📧 Email Score' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Candidate Detailed Itemized Response Inspector Sub-Modal / Drawer -->
        <div v-if="selectedAttemptDetails" class="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-indigo-200 pb-3">
            <div>
              <h4 class="font-bold text-zinc-900 text-xs">
                Candidate Response Inspector: <span class="text-indigo-900">{{ selectedAttemptDetails.candidate?.name }}</span>
              </h4>
              <p class="text-3xs text-zinc-500">
                Email: {{ selectedAttemptDetails.candidate?.email }} | Total Score: <span class="font-bold text-zinc-900">{{ selectedAttemptDetails.totalScore }} pts ({{ selectedAttemptDetails.percentage }}%)</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="dispatchScoreEmail(selectedAttemptDetails.attemptId, selectedAttemptDetails.candidate?.name, selectedAttemptDetails.candidate?.email)"
                class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-2xs cursor-pointer"
              >
                📧 Email Score Report
              </button>
              <button @click="selectedAttemptDetails = null" class="text-zinc-400 hover:text-zinc-800 p-1 cursor-pointer">✕</button>
            </div>
          </div>

          <div v-if="loadingAttemptDetails" class="py-6 text-center text-xs font-medium text-zinc-500">
            Fetching question responses...
          </div>

          <div v-else class="space-y-3 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="(resp, idx) in selectedAttemptDetails.responses"
              :key="resp.questionId || idx"
              class="rounded-xl border bg-white p-3.5 shadow-2xs space-y-2"
              :class="resp.isCorrect ? 'border-emerald-200' : 'border-red-200'"
            >
              <div class="flex items-start justify-between">
                <div class="font-bold text-zinc-900 text-xs pr-2">
                  Q{{ idx + 1 }}. {{ resp.statement }}
                </div>
                <span
                  class="shrink-0 rounded-full px-2.5 py-0.5 text-3xs font-bold"
                  :class="resp.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'"
                >
                  {{ resp.isCorrect ? `+${resp.scoreAwarded} pts (Correct)` : `${resp.scoreAwarded} pts` }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-2.5 text-3xs">
                <div>
                  <span class="text-zinc-500 font-bold block">Candidate Selected Answer:</span>
                  <span class="font-bold text-zinc-900 block" :class="resp.isCorrect ? 'text-emerald-700' : 'text-red-600'">
                    {{ resp.selectedOption }}
                  </span>
                </div>
                <div>
                  <span class="text-zinc-500 font-bold block">Correct Expected Answer:</span>
                  <span class="font-bold text-emerald-800 block">
                    {{ resp.correctAnswer }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button @click="showLeaderboardModal = false" class="rounded-xl border border-zinc-300 bg-white px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer">
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================================= -->
    <!-- EXAM CREATION WIZARD (6-STEP GUIDED DRAWER)                                   -->
    <!-- ============================================================================= -->
    <div v-if="showWizard" class="fixed inset-0 z-50 flex">
      <!-- Backdrop -->
      <div class="flex-1 bg-black/50 backdrop-blur-sm" @click="closeWizardSafe"></div>

      <!-- Drawer Panel -->
      <div class="w-full max-w-5xl bg-white flex flex-col shadow-2xl h-full overflow-hidden">
        <!-- Wizard Header -->
        <div class="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-bold">✦</div>
            <div>
              <h2 class="text-sm font-bold text-zinc-900">New Exam Wizard</h2>
              <p class="text-3xs text-zinc-500">Step {{ wizardStep }} of 5 — {{ wizardStepLabel }}</p>
            </div>
          </div>
          <button @click="closeWizardSafe" class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 transition-colors cursor-pointer text-xs font-bold">✕ Close</button>
        </div>

        <!-- Wizard Body -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Step Sidebar -->
          <div class="w-56 shrink-0 border-r border-zinc-100 bg-zinc-50 py-6 px-4 space-y-1 overflow-y-auto">
            <div
              v-for="(step, idx) in wizardSteps"
              :key="idx"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all"
              :class="wizardStep === idx + 1 ? 'bg-zinc-900 text-white' : wizardStep > idx + 1 ? 'text-emerald-700 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-100'"
              @click="wizardStep > idx + 1 ? (wizardStep = idx + 1) : null"
            >
              <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-3xs font-bold border transition-all"
                :class="wizardStep === idx + 1 ? 'bg-white text-zinc-900 border-white' : wizardStep > idx + 1 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-transparent text-zinc-400 border-zinc-300'">
                <span v-if="wizardStep > idx + 1">✓</span>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <div class="min-w-0">
                <div class="text-3xs font-bold truncate">{{ step.label }}</div>
                <div class="text-3xs opacity-60 truncate">{{ step.sub }}</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-6 px-1">
              <div class="flex justify-between text-3xs text-zinc-400 mb-1">
                <span>Progress</span><span>{{ Math.round(((wizardStep - 1) / 4) * 100) }}%</span>
              </div>
              <div class="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                <div class="h-full rounded-full bg-zinc-900 transition-all duration-500" :style="{ width: `${((wizardStep - 1) / 4) * 100}%` }"></div>
              </div>
            </div>
          </div>

          <!-- Step Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-8 space-y-6 max-w-2xl">

              <!-- ── STEP 1: BASICS ── -->
              <div v-if="wizardStep === 1" class="space-y-5">
                <div>
                  <h3 class="text-base font-bold text-zinc-900">Exam Basics</h3>
                  <p class="text-xs text-zinc-500 mt-0.5">Set the identity of this exam. This creates the exam in the database as a Draft.</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-zinc-800 mb-1">Exam Title <span class="text-red-500">*</span></label>
                    <input v-model="wForm.title" type="text" placeholder="e.g. Data Structures Mid-Term 2025" class="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-zinc-800 mb-1">Exam Code <span class="text-red-500">*</span></label>
                    <input v-model="wForm.code" type="text" placeholder="e.g. CS-201" class="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono text-zinc-900 uppercase focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                    <p class="mt-1 text-3xs text-zinc-400">Unique identifier shown to students</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-zinc-800 mb-1">Subject / Category</label>
                    <input v-model="wForm.subject" type="text" placeholder="e.g. Computer Science" class="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-zinc-800 mb-1">Instructions / Description</label>
                    <textarea v-model="wForm.description" rows="3" placeholder="Instructions visible to students before the exam begins..." class="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"></textarea>
                  </div>
                </div>
                <div class="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-800">
                  💡 After this step, your exam is saved as a <strong>Draft</strong>. You can close and come back anytime — all progress is saved.
                </div>
              </div>

              <!-- ── STEP 2: MARKS & RULES ── -->
              <div v-else-if="wizardStep === 2" class="space-y-5">
                <div>
                  <h3 class="text-base font-bold text-zinc-900">Marks, Duration & Rules</h3>
                  <p class="text-xs text-zinc-500 mt-0.5">Configure scoring, timing, and proctoring settings.</p>
                </div>

                <!-- Duration + Sections Toggle + Cutoff -->
                <div class="space-y-4">
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex items-center justify-between">
                    <div>
                      <label class="font-bold text-zinc-900 text-xs block">Enable Sections for this Exam</label>
                      <p class="text-3xs text-zinc-500">Divide exam into subjects (e.g. Quant, Verbal) with individual section cutoffs.</p>
                    </div>
                    <input v-model="wForm.enableSections" type="checkbox" class="h-5 w-5 rounded border-zinc-300 text-zinc-900 cursor-pointer" />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-zinc-800 mb-1">Duration (minutes) <span class="text-red-500">*</span></label>
                      <input v-model.number="wForm.durationMinutes" type="number" min="5" max="480" placeholder="60" class="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                    </div>
                    <div>
                      <div v-if="!wForm.enableSections">
                        <label class="block text-xs font-bold text-zinc-800 mb-1">Passing Mark Cutoff <span class="text-red-500">*</span></label>
                        <input v-model.number="wForm.passingMarks" type="number" min="0" placeholder="e.g. 40" class="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                        <p class="mt-1 text-3xs text-zinc-500">Minimum score required for a candidate to pass this exam.</p>
                      </div>
                      <div v-else class="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-3xs text-indigo-900 font-medium">
                        ⚡ <strong>Sections Enabled:</strong> Passing is strictly determined by individual Section Cutoffs configured in <strong>Step 3 (Sections)</strong>.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Proctoring & Security -->
                <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-4">
                  <h4 class="text-xs font-bold text-zinc-900 flex items-center gap-2">🔒 Proctoring & Security</h4>
                  <div class="grid grid-cols-1 gap-3">
                    <label class="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 cursor-pointer hover:border-zinc-400 transition-colors">
                      <input type="checkbox" v-model="wForm.webcamRequired" class="mt-0.5 h-4 w-4 rounded border-zinc-300 cursor-pointer" />
                      <div>
                        <div class="text-xs font-bold text-zinc-900">Live Webcam Proctoring</div>
                        <div class="text-3xs text-zinc-500">AI-based face detection monitors candidates throughout the exam</div>
                      </div>
                    </label>
                    <label class="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 cursor-pointer hover:border-zinc-400 transition-colors">
                      <input type="checkbox" v-model="wForm.tabSwitchDetection" class="mt-0.5 h-4 w-4 rounded border-zinc-300 cursor-pointer" />
                      <div>
                        <div class="text-xs font-bold text-zinc-900">Tab Switch & Fullscreen Detection</div>
                        <div class="text-3xs text-zinc-500">Flags candidates who leave the exam window</div>
                      </div>
                    </label>
                    <label class="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 cursor-pointer hover:border-zinc-400 transition-colors">
                      <input type="checkbox" v-model="wForm.shuffleQuestions" class="mt-0.5 h-4 w-4 rounded border-zinc-300 cursor-pointer" />
                      <div>
                        <div class="text-xs font-bold text-zinc-900">Randomize Question Order</div>
                        <div class="text-3xs text-zinc-500">Each candidate sees questions in a different order</div>
                      </div>
                    </label>
                    <label class="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 cursor-pointer hover:border-zinc-400 transition-colors">
                      <input type="checkbox" v-model="wForm.showImmediateResults" class="mt-0.5 h-4 w-4 rounded border-zinc-300 cursor-pointer" />
                      <div>
                        <div class="text-xs font-bold text-zinc-900">Show Score Immediately After Submission</div>
                        <div class="text-3xs text-zinc-500">Candidates see their score right when they submit (before admin review)</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- ── STEP 3: SECTIONS & QUESTIONS ── -->
              <div v-else-if="wizardStep === 3" class="space-y-5">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-base font-bold text-zinc-900">
                      {{ wForm.enableSections ? 'Sections & Questions Workbench' : 'Question Bank Upload' }}
                    </h3>
                    <p class="text-xs text-zinc-500 mt-0.5">
                      {{ wForm.enableSections ? 'Define subject sections (with Cutoff % & random question serving limits) and upload CSV files directly to each section.' : 'Upload questions via CSV or add them to your general exam question bank.' }}
                    </p>
                  </div>
                  <button @click="wizardStep = 4" class="text-xs font-semibold text-zinc-500 hover:text-zinc-800 underline cursor-pointer shrink-0">Skip to Students →</button>
                </div>

                <!-- Case A: Single Flat Exam (General Pool Upload) -->
                <div v-if="!wForm.enableSections" class="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center space-y-3">
                  <div class="text-2xl">📄</div>
                  <div class="text-xs font-bold text-zinc-900">General Question Bank CSV Upload</div>
                  <div class="text-3xs text-zinc-500">Columns: statement, type, option1, option2, option3, option4, correct_answer, points, negative_points, difficulty</div>
                  <div class="flex items-center justify-center gap-3">
                    <label class="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer shadow-xs">
                      📤 Upload Questions CSV
                      <input type="file" accept=".csv" class="hidden" @change="wizardHandleCsvUpload" />
                    </label>
                    <button @click="downloadQuestionCsvTemplate('wizard')" class="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer shadow-2xs">⬇ Template</button>
                  </div>
                  <div v-if="wizardUploadedQuestions > 0" class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    ✅ {{ wizardUploadedQuestions }} questions uploaded
                  </div>
                </div>

                <!-- Case B: Multi-Section Setup & Sectional CSV Upload -->
                <div v-else class="space-y-4">
                  <!-- Add Section Card with Integrated CSV Upload -->
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                    <h5 class="text-xs font-bold text-zinc-800">➕ Define New Section & Upload Question Bank</h5>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-3xs font-bold text-zinc-700 mb-1">Section Name <span class="text-red-500">*</span></label>
                        <input v-model="wSectionForm.name" type="text" placeholder="e.g. LOGICAL REASONING" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none" />
                      </div>
                      <div>
                        <label class="block text-3xs font-bold text-zinc-700 mb-1">Section Cutoff (%) <span class="text-red-500">*</span></label>
                        <input v-model.number="wSectionForm.cutoffMarks" type="number" min="0" max="100" placeholder="e.g. 40" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-zinc-600 focus:outline-none" />
                        <p class="mt-0.5 text-3xs text-zinc-500">% of section total marks required to pass</p>
                      </div>
                      <div>
                        <label class="block text-3xs font-bold text-zinc-700 mb-1">Max Questions to Serve Candidate</label>
                        <input v-model.number="wSectionForm.maxQuestionsLimit" type="number" min="1" placeholder="e.g. 15 (samples 15 out of pool)" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none" />
                        <p class="mt-0.5 text-3xs text-zinc-500">Randomly samples 15 questions from uploaded pool per student</p>
                      </div>
                      <div>
                        <label class="block text-3xs font-bold text-zinc-700 mb-1">Description (Optional)</label>
                        <input v-model="wSectionForm.description" type="text" placeholder="Brief section description..." class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none" />
                      </div>

                      <!-- Integrated Questions CSV Upload Field -->
                      <div class="col-span-2 rounded-xl border border-dashed border-zinc-300 bg-white p-3.5 flex items-center justify-between">
                        <div>
                          <div class="text-xs font-bold text-zinc-900">Upload Questions CSV for this Section (Optional)</div>
                          <div class="text-3xs text-zinc-500">Columns: statement, type, option1, option2, option3, option4, correct_answer, points...</div>
                          <div v-if="wSectionForm.attachedFileName" class="mt-1 font-bold text-emerald-700 text-3xs">
                            📎 Attached File: {{ wSectionForm.attachedFileName }}
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <label class="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer shadow-xs">
                            {{ wSectionForm.attachedFileName ? 'Change CSV' : '📤 Attach CSV' }}
                            <input type="file" accept=".csv" class="hidden" @change="handleSectionFormFileSelect" />
                          </label>
                          <button @click="downloadQuestionCsvTemplate('wizard')" type="button" class="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer">
                            ⬇ Template
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      @click="wizardAddSection"
                      :disabled="!wSectionForm.name || wizardSaving"
                      class="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      {{ wizardSaving ? 'Saving & Uploading...' : (wSectionForm.attachedFile ? '✓ Save Section & Upload Questions' : '+ Save Section') }}
                    </button>
                  </div>

                  <!-- Defined Sections List with Direct Upload Buttons -->
                  <div v-if="wizardSections.length === 0" class="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-xs text-zinc-500">
                    No sections added yet. Add a section above to start uploading questions.
                  </div>

                  <div v-else class="space-y-3">
                    <h5 class="text-xs font-bold text-zinc-900">Defined Sections & Direct Question Uploads</h5>
                    <div v-for="(sec, idx) in wizardSections" :key="idx" class="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2">
                          <h5 class="font-bold text-zinc-900 text-xs">{{ sec.name }}</h5>
                          <span class="rounded-full bg-indigo-100 px-2.5 py-0.5 text-3xs font-bold text-indigo-800">
                            Cutoff: {{ sec.cutoffMarks || 0 }}%
                          </span>
                          <span v-if="sec.maxQuestionsLimit" class="rounded-full bg-purple-100 px-2.5 py-0.5 text-3xs font-bold text-purple-800">
                            🎲 Serves {{ sec.maxQuestionsLimit }} Random Qs
                          </span>
                        </div>
                        <p class="text-3xs text-zinc-500 mt-1">
                          <span v-if="sec.uploadedCount" class="text-emerald-700 font-bold">✅ {{ sec.uploadedCount }} questions uploaded into pool</span>
                          <span v-else class="text-amber-600">⚠ 0 questions uploaded yet</span>
                        </p>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <label class="rounded-lg bg-zinc-900 px-3.5 py-2 text-3xs font-bold text-white hover:bg-zinc-800 cursor-pointer shadow-xs">
                          Upload CSV
                          <input type="file" accept=".csv" class="hidden" @change="(e) => wizardHandleSectionCsvUpload(e, idx)" />
                        </label>
                        <button @click="wizardSections.splice(idx, 1)" class="text-zinc-400 hover:text-red-600 p-1 text-xs cursor-pointer">✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── STEP 4: STUDENTS & SLOTS ── -->
              <div v-else-if="wizardStep === 4" class="space-y-5">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-base font-bold text-zinc-900">Students & Time Slots <span class="text-zinc-400 font-normal text-sm">(Optional)</span></h3>
                    <p class="text-xs text-zinc-500 mt-0.5">Assign students and create time windows. You can do this later too.</p>
                  </div>
                  <button @click="wizardStep = 5" class="text-xs font-semibold text-zinc-500 hover:text-zinc-800 underline cursor-pointer shrink-0">Skip this step →</button>
                </div>

                <!-- Student Upload -->
                <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3">
                  <h5 class="text-xs font-bold text-zinc-900">📋 Assign Students via CSV</h5>
                  <p class="text-3xs text-zinc-500">CSV format: name, email, phone, password (optional). Temporary passwords are generated automatically if left blank.</p>
                  <div class="flex items-center gap-3 flex-wrap">
                    <label class="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer shadow-xs">
                      📤 Upload Roster
                      <input type="file" accept=".csv" class="hidden" @change="wizardHandleStudentCsv" />
                    </label>
                    <button @click="downloadStudentCsvTemplate()" class="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer shadow-2xs">⬇ Template</button>
                    <button
                      v-if="wizardAssignedCredentials.length > 0"
                      @click="exportWizardCredentialsCsv"
                      class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer transition-colors shadow-xs"
                    >
                      📥 Download Credentials CSV (With Passwords)
                    </button>
                    <span v-if="wizardStudentCount > 0" class="text-xs font-bold text-emerald-700">✅ {{ wizardStudentCount }} students assigned</span>
                  </div>

                  <!-- Credentials Live Table Preview -->
                  <div v-if="wizardAssignedCredentials.length > 0" class="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-emerald-900">🔑 Generated Student Credentials ({{ wizardAssignedCredentials.length }} Candidates)</span>
                      <button @click="exportWizardCredentialsCsv" class="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer">
                        Export CSV →
                      </button>
                    </div>
                    <div class="max-h-52 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
                      <table class="w-full text-left text-xs">
                        <thead class="bg-zinc-100 font-bold text-zinc-800 border-b border-zinc-200">
                          <tr>
                            <th class="p-2.5">Candidate Name</th>
                            <th class="p-2.5">Email ID</th>
                            <th class="p-2.5">Roll Number</th>
                            <th class="p-2.5 text-emerald-800">Generated Password</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-100">
                          <tr v-for="(c, idx) in wizardAssignedCredentials" :key="idx" class="hover:bg-zinc-50 transition-colors">
                            <td class="p-2.5 font-bold text-zinc-900">{{ c.name }}</td>
                            <td class="p-2.5 font-mono text-zinc-600 text-3xs">{{ c.email }}</td>
                            <td class="p-2.5 font-mono text-zinc-600 text-3xs">{{ c.rollNumber || c.roll_number || 'STU-AUTO' }}</td>
                            <td class="p-2.5 font-mono font-bold text-emerald-800 text-xs select-all">{{ c.password }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>


                <!-- Time Slot Generator -->
                <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3">
                  <h5 class="text-xs font-bold text-zinc-900">⏰ Create Time Slots</h5>
                  <p class="text-3xs text-zinc-500">Define the exam window. The system will auto-generate slots based on duration ({{ wForm.durationMinutes || 60 }} min each).</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-3xs font-bold text-zinc-700 mb-1">Window Start</label>
                      <input v-model="wSlotForm.windowStart" type="datetime-local" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-3xs font-bold text-zinc-700 mb-1">Window End</label>
                      <input v-model="wSlotForm.windowEnd" type="datetime-local" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-3xs font-bold text-zinc-700 mb-1">Capacity Per Slot</label>
                      <input v-model.number="wSlotForm.capacity" type="number" min="1" placeholder="30" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none" />
                    </div>
                  </div>
                  <button @click="wizardGenerateSlots" :disabled="!wSlotForm.windowStart || !wSlotForm.windowEnd" class="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer">
                    ⚡ Auto-Generate Slots
                  </button>
                  <div v-if="wizardSlotCount > 0" class="text-xs font-bold text-emerald-700">✅ {{ wizardSlotCount }} slot(s) created</div>
                </div>
              </div>

              <!-- ── STEP 5: REVIEW & LAUNCH ── -->
              <div v-else-if="wizardStep === 5" class="space-y-5">
                <div>
                  <h3 class="text-base font-bold text-zinc-900">Review & Launch</h3>
                  <p class="text-xs text-zinc-500 mt-0.5">Everything looks good? Choose how you want to launch this exam.</p>
                </div>

                <!-- Summary Card -->
                <div class="rounded-2xl border-2 border-zinc-200 bg-zinc-50 divide-y divide-zinc-200 overflow-hidden">
                  <div class="px-5 py-4">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="text-sm font-bold text-zinc-900">{{ wForm.title || 'Untitled Exam' }}</h4>
                        <p class="text-3xs font-mono text-zinc-500 mt-0.5">{{ wForm.code }}</p>
                      </div>
                      <span class="rounded-full bg-zinc-200 px-2.5 py-0.5 text-3xs font-bold text-zinc-700">DRAFT</span>
                    </div>
                    <p class="text-xs text-zinc-600 mt-2">{{ wForm.description || 'No description.' }}</p>
                  </div>
                  <div class="grid grid-cols-2 divide-x divide-zinc-200">
                    <div class="px-5 py-3">
                      <div class="text-3xs text-zinc-400">Duration</div>
                      <div class="text-sm font-bold text-zinc-900 mt-0.5">{{ wForm.durationMinutes || 60 }} min</div>
                    </div>
                    <div class="px-5 py-3">
                      <div class="text-3xs text-zinc-400">Pass Cutoff</div>
                      <div class="text-sm font-bold text-zinc-900 mt-0.5">{{ wForm.passingMarks || 0 }} pts</div>
                    </div>
                    <div class="px-5 py-3">
                      <div class="text-3xs text-zinc-400">Sections</div>
                      <div class="text-sm font-bold mt-0.5" :class="wizardSections.length > 0 ? 'text-emerald-700' : 'text-zinc-400'">
                        {{ wizardSections.length > 0 ? `${wizardSections.length} section(s)` : 'None' }}
                      </div>
                    </div>
                    <div class="px-5 py-3">
                      <div class="text-3xs text-zinc-400">Questions</div>
                      <div class="text-sm font-bold mt-0.5" :class="wizardUploadedQuestions > 0 ? 'text-emerald-700' : 'text-amber-600'">
                        {{ wizardUploadedQuestions > 0 ? wizardUploadedQuestions : '⚠ None yet' }}
                      </div>
                    </div>
                    <div class="px-5 py-3">
                      <div class="text-3xs text-zinc-400">Students</div>
                      <div class="text-sm font-bold mt-0.5" :class="wizardStudentCount > 0 ? 'text-emerald-700' : 'text-amber-600'">
                        {{ wizardStudentCount > 0 ? wizardStudentCount : '⚠ None assigned' }}
                      </div>
                    </div>
                    <div class="px-5 py-3">
                      <div class="text-3xs text-zinc-400">Time Slots</div>
                      <div class="text-sm font-bold mt-0.5" :class="wizardSlotCount > 0 ? 'text-emerald-700' : 'text-amber-600'">
                        {{ wizardSlotCount > 0 ? wizardSlotCount : '⚠ None created' }}
                      </div>
                    </div>
                  </div>
                  <div class="px-5 py-3 grid grid-cols-2 gap-2 text-3xs text-zinc-600">
                    <div>{{ wForm.webcamRequired ? '✅ Webcam Proctoring ON' : '○ Webcam Proctoring OFF' }}</div>
                    <div>{{ wForm.tabSwitchDetection ? '✅ Tab Detection ON' : '○ Tab Detection OFF' }}</div>
                    <div>{{ wForm.shuffleQuestions ? '✅ Shuffled Questions' : '○ Fixed Question Order' }}</div>
                    <div>{{ wForm.showImmediateResults ? '✅ Instant Results' : '○ Results Hidden Until Published' }}</div>
                  </div>
                </div>

                <!-- Launch Options -->
                <div class="space-y-3">
                  <h5 class="text-xs font-bold text-zinc-800">Choose Launch Option</h5>
                  <div class="grid grid-cols-3 gap-3">
                    <button @click="wizardFinish('DRAFT')" :disabled="wizardSaving" class="flex flex-col items-center gap-2 rounded-xl border-2 border-zinc-300 bg-white px-4 py-5 hover:border-zinc-500 hover:bg-zinc-50 cursor-pointer transition-all disabled:opacity-50">
                      <span class="text-xl">📁</span>
                      <span class="text-xs font-bold text-zinc-900">Save as Draft</span>
                      <span class="text-3xs text-zinc-500 text-center">Keep private, configure more later</span>
                    </button>
                    <button @click="wizardFinish('SCHEDULED')" :disabled="wizardSaving" class="flex flex-col items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-5 hover:border-blue-400 hover:bg-blue-100 cursor-pointer transition-all disabled:opacity-50">
                      <span class="text-xl">⏰</span>
                      <span class="text-xs font-bold text-blue-900">Schedule</span>
                      <span class="text-3xs text-blue-600 text-center">Mark ready — goes live on slot start time</span>
                    </button>
                    <button @click="wizardFinish('LIVE')" :disabled="wizardSaving" class="flex flex-col items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-5 hover:border-red-400 hover:bg-red-100 cursor-pointer transition-all disabled:opacity-50">
                      <span class="text-xl">▶</span>
                      <span class="text-xs font-bold text-red-900">Go Live Now</span>
                      <span class="text-3xs text-red-600 text-center">Candidates can start immediately</span>
                    </button>
                  </div>
                  <div v-if="wizardSaving" class="text-center text-xs text-zinc-500">Saving exam...</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Wizard Footer Nav -->
        <div class="px-8 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <button
            v-if="wizardStep > 1"
            @click="wizardPrev"
            class="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors"
          >
            ← Back
          </button>
          <div v-else></div>

          <div class="flex items-center gap-3">
            <span class="text-3xs text-zinc-400">Step {{ wizardStep }} / 5</span>
            <button
              v-if="wizardStep < 5"
              @click="wizardNext"
              :disabled="wizardSaving"
              class="rounded-xl bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
            >
              {{ wizardStep === 1 ? (wizardExamId ? 'Saved ✓ — Next →' : 'Save & Continue →') : 'Next Step →' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { examService, questionService, sectionService, slotService, attemptService } from '../../api/services'

const exams = ref([])
const loading = ref(false)
const searchQuery = ref('')
const activeTab = ref('ALL')
const filterTabs = ['ALL', 'LIVE', 'SCHEDULED', 'DRAFT', 'COMPLETED']

// Main Modal State
const showModal = ref(false)
const modalTab = ref('general')
const isEditing = ref(false)
const activeExam = ref(null)
const savingExam = ref(false)

// Exam Form State
const examForm = ref({
  id: null,
  title: '',
  code: '',
  description: '',
  durationMinutes: 60,
  passingMarks: 40,
  status: 'DRAFT',
  shuffleQuestions: true,
  webcamRequired: true,
  tabSwitchDetection: true,
  showImmediateResults: false,
  enableSections: true,
})

// Slots State
const slots = ref([])
const loadingSlots = ref(false)
const showSlotForm = ref(false)
const savingSlot = ref(false)
const slotForm = ref({ startTime: '', endTime: '', capacity: 30 })
const showAutoSlotForm = ref(false)
const generatingAutoSlots = ref(false)
const autoSlotConfig = ref({ windowStart: '', windowEnd: '', capacity: 30 })

const generateAutoSlots = async () => {
  if (!activeExam.value) {
    alert('Please save exam general settings first.')
    return
  }
  if (!autoSlotConfig.value.windowStart || !autoSlotConfig.value.windowEnd) {
    alert('Please select both Window Start and Window End date/time.')
    return
  }

  const start = new Date(autoSlotConfig.value.windowStart)
  const end = new Date(autoSlotConfig.value.windowEnd)
  const durationMs = (Number(examForm.value.durationMinutes) || 60) * 60 * 1000

  if (start >= end) {
    alert('Window End time must be after Window Start time.')
    return
  }

  generatingAutoSlots.value = true
  let count = 0
  let currentStart = new Date(start)

  try {
    while (currentStart.getTime() + durationMs <= end.getTime()) {
      const currentEnd = new Date(currentStart.getTime() + durationMs)
      
      const payload = {
        startTime: currentStart.toISOString().slice(0, 16),
        endTime: currentEnd.toISOString().slice(0, 16),
        capacity: autoSlotConfig.value.capacity || 30,
      }

      await slotService.createSlot(activeExam.value.id, payload)
      count++
      currentStart = currentEnd
    }

    alert(`⚡ Successfully auto-generated ${count} slots of ${examForm.value.durationMinutes} minutes each!`)
    showAutoSlotForm.value = false
    await fetchSlots()
  } catch (err) {
    alert(err.message || 'Failed to auto-generate slots.')
  } finally {
    generatingAutoSlots.value = false
  }
}

// Student CSV Roster State
const parsedStudentCsv = ref([])
const assignedStudents = ref([])
const loadingAssignedStudents = ref(false)

const fetchAssignedStudents = async () => {
  if (!activeExam.value) return
  loadingAssignedStudents.value = true
  try {
    const res = await slotService.getAssignedStudents(activeExam.value.id)
    assignedStudents.value = res.students || []
  } catch (err) {
    console.error('Failed to load assigned students:', err)
  } finally {
    loadingAssignedStudents.value = false
  }
}

const exportAssignedStudentsRosterCsv = () => {
  if (!assignedStudents.value.length) return
  const headers = ['Candidate_Name', 'Email', 'Roll_Phone', 'Slot_Status']
  const rows = assignedStudents.value.map(s => [
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${(s.rollNumber || s.roll_number || '').replace(/"/g, '""')}"`,
    `"${s.slotStartTime ? 'Booked: ' + new Date(s.slotStartTime).toLocaleString() : 'Pending Slot'}"`
  ])
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${activeExam.value?.code || 'exam'}_assigned_roster.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const removeStudentAssignment = async (candidateId) => {
  if (!confirm('Remove this student from the exam?')) return
  try {
    await slotService.removeAssignedCandidate(activeExam.value.id, candidateId)
    await fetchAssignedStudents()
  } catch (err) {
    alert(err.message || 'Failed to remove student.')
  }
}
const savingStudents = ref(false)

// Sections State
const sections = ref([])
const loadingSections = ref(false)
const showInlineSectionForm = ref(false)
const editingSectionId = ref(null)
const savingSection = ref(false)
const sectionForm = ref({ name: '', description: '', cutoffMarks: 0, maxQuestionsLimit: null })

// Questions State
const examQuestions = ref([])
const workbenchSubTab = ref('list')
const savingQuestion = ref(false)
const singleQuestionForm = ref({
  sectionId: null,
  type: 'MCQ',
  statement: '',
  correctAnswer: '',
  points: 1,
  negativePoints: 0,
  difficulty: 'MEDIUM',
})

// Batch Marks & Inline Question Editor State
const showBatchMarksCard = ref(false)
const batchMarksForm = ref({ sectionId: 'ALL', points: 2, negativePoints: 0.5 })
const applyingBatchMarks = ref(false)

const editingQuestionId = ref(null)
const editingQuestionForm = ref({
  points: 1,
  negativePoints: 0,
  sectionId: null,
  statement: '',
  correctAnswer: '',
})
const savingQuestionEdit = ref(false)

// Leaderboard & Response Inspector State
const showLeaderboardModal = ref(false)
const leaderboardExamTitle = ref('')
const leaderboardRows = ref([])
const leaderboardMetrics = ref({})
const loadingLeaderboard = ref(false)

const selectedAttemptDetails = ref(null)
const loadingAttemptDetails = ref(false)
const sendingEmailAttemptId = ref(null)

const openLeaderboardModal = async (exam) => {
  if (!exam || !exam.id) {
    alert('Invalid exam selected.')
    return
  }
  leaderboardExamTitle.value = exam.title || 'Exam Leaderboard'
  showLeaderboardModal.value = true
  loadingLeaderboard.value = true
  selectedAttemptDetails.value = null
  try {
    const res = await attemptService.getLeaderboard(exam.id)
    leaderboardRows.value = res.leaderboard || []
    leaderboardMetrics.value = res.metrics || {}
  } catch (err) {
    console.error('Failed to load exam leaderboard:', err)
    alert(err.message || 'Failed to load leaderboard.')
  } finally {
    loadingLeaderboard.value = false
  }
}

const inspectCandidateResponses = async (attemptId) => {
  loadingAttemptDetails.value = true
  try {
    const res = await attemptService.getAttemptDetails(attemptId)
    selectedAttemptDetails.value = res
  } catch (err) {
    alert(err.message || 'Failed to load candidate response details.')
  } finally {
    loadingAttemptDetails.value = false
  }
}

const dispatchScoreEmail = async (attemptId, name, email) => {
  sendingEmailAttemptId.value = attemptId
  try {
    await attemptService.sendScoreEmail(attemptId, { name, email })
    alert(`📧 Score report successfully emailed to ${name} (${email})!`)
  } catch (err) {
    alert(err.message || 'Failed to dispatch score email.')
  } finally {
    sendingEmailAttemptId.value = null
  }
}

const fetchExams = async () => {
  loading.value = true
  try {
    const res = await examService.getExams()
    exams.value = res.exams || []
  } catch (err) {
    console.error('Failed to load exams:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchExams()
})

const filteredExams = computed(() => {
  return exams.value.filter((exam) => {
    const matchesTab = activeTab.value === 'ALL' || exam.status === activeTab.value
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesTab && matchesSearch
  })
})

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'LIVE':
      return 'bg-red-100 text-red-700 font-bold'
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800 font-bold'
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 font-bold'
    default:
      return 'bg-zinc-100 text-zinc-700 border border-zinc-300'
  }
}

// ─── WIZARD STATE ──────────────────────────────────────────────────────────────
const showWizard = ref(false)
const wizardStep = ref(1)
const wizardExamId = ref(null)   // Set after exam is created in DB at step 1
const wizardSaving = ref(false)
const wizardUploadedQuestions = ref(0)
const wizardStudentCount = ref(0)
const wizardSlotCount = ref(0)
const wizardSections = ref([])   // Locally held until saved to DB at step 3 next

const wForm = ref({
  title: '',
  code: '',
  subject: '',
  description: '',
  durationMinutes: 60,
  passingMarks: 0,
  webcamRequired: true,
  tabSwitchDetection: true,
  shuffleQuestions: true,
  showImmediateResults: false,
})

const wSectionForm = ref({
  name: '',
  cutoffMarks: 0,
  maxQuestionsLimit: null,
  description: '',
  attachedFile: null,
  attachedFileName: '',
})
const wSlotForm = ref({ windowStart: '', windowEnd: '', capacity: 30 })

const handleSectionFormFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    wSectionForm.value.attachedFile = file
    wSectionForm.value.attachedFileName = file.name
  }
}

const parseQuestionCsvFile = (file, sectionId = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split(/\r?\n/).filter((l) => l.trim())
        if (lines.length <= 1) return resolve([])
        const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
        const colIdx = (kws) => rawHeaders.findIndex((h) => kws.some((k) => h.includes(k)))
        const stmtIdx = colIdx(['statement', 'question'])
        const typeIdx = colIdx(['type'])
        const opt1Idx = colIdx(['opt1', 'option1', 'option_1'])
        const opt2Idx = colIdx(['opt2', 'option2', 'option_2'])
        const opt3Idx = colIdx(['opt3', 'option3', 'option_3'])
        const opt4Idx = colIdx(['opt4', 'option4', 'option_4'])
        const ansIdx = colIdx(['correct', 'answer', 'ans'])
        const ptsIdx = colIdx(['points', 'marks', 'pts'])
        const negIdx = colIdx(['negative', 'neg', 'penalty'])
        const diffIdx = colIdx(['diff', 'difficulty', 'level'])

        const questions = []
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
          if (cols.length < 2) continue
          const get = (idx, fallbackIdx) => (idx >= 0 ? cols[idx] : cols[fallbackIdx] || '')
          const opts = [get(opt1Idx, 2), get(opt2Idx, 3), get(opt3Idx, 4), get(opt4Idx, 5)].filter(Boolean)
          let type = (get(typeIdx, 1) || 'MCQ').toUpperCase()
          if (!['MCQ', 'SINGLE_CHOICE', 'NUMERICAL', 'SUBJECTIVE', 'TRUE_FALSE'].includes(type)) type = 'MCQ'
          let diff = (get(diffIdx, 9) || 'MEDIUM').toUpperCase()
          if (!['EASY', 'MEDIUM', 'HARD'].includes(diff)) diff = 'MEDIUM'
          questions.push({
            statement: get(stmtIdx, 0) || 'Question',
            type,
            options: opts.length ? opts : ['A', 'B', 'C', 'D'],
            correctAnswer: get(ansIdx, 6) || opts[0] || '',
            points: 1,
            negativePoints: 0,
            difficulty: diff,
            sectionId,
          })
        }
        resolve(questions)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsText(file)
  })
}

const wizardSteps = computed(() => [
  { label: 'Basics', sub: 'Title, code, description' },
  { label: 'Marks & Rules', sub: 'Duration, cutoff, security' },
  { 
    label: wForm.value.enableSections ? 'Sections & Questions' : 'Question Bank', 
    sub: wForm.value.enableSections ? 'Define sections & upload CSVs' : 'Upload questions CSV' 
  },
  { label: 'Students & Slots', sub: 'Roster and time windows' },
  { label: 'Review & Launch', sub: 'Final check and go!' },
])

const wizardStepLabel = computed(() => wizardSteps.value[wizardStep.value - 1]?.label || '')

const openWizardForExam = async (exam, targetStep = 1) => {
  resetWizard()
  activeExam.value = exam
  wizardStep.value = targetStep
  wizardExamId.value = exam.id
  wizardSaving.value = false
  wizardUploadedQuestions.value = exam._count?.questions || exam.questionCount || 0
  wizardStudentCount.value = exam._count?.students || exam.studentCount || 0
  wizardSlotCount.value = exam._count?.slots || exam.slotCount || 0
  
  // Pre-fill form details
  wForm.value = {
    title: exam.title || '',
    code: exam.code || '',
    subject: exam.subject || '',
    description: exam.description || '',
    durationMinutes: exam.durationMinutes || exam.duration_minutes || 60,
    passingMarks: exam.passMarks || exam.passingMarks || exam.pass_marks || 0,
    enableSections: (exam.sections && exam.sections.length > 0) || false,
    webcamRequired: exam.webcamRequired ?? exam.webcam_required ?? true,
    tabSwitchDetection: exam.tabSwitchDetection ?? exam.tab_switch_detection ?? true,
    shuffleQuestions: exam.shuffleQuestions ?? exam.shuffle_questions ?? true,
    showImmediateResults: exam.showImmediateResults ?? exam.show_immediate_results ?? false,
  }

  // Pre-fetch sections for this exam
  try {
    const secRes = await sectionService.getSections(exam.id)
    const fetchedSections = secRes.sections || secRes || []
    wizardSections.value = fetchedSections.map((s) => ({
      name: s.name,
      description: s.description || '',
      cutoffMarks: s.cutoffMarks || s.cutoff_marks || 0,
      maxQuestionsLimit: s.maxQuestionsLimit || s.max_questions_limit || null,
      uploadedCount: s.questionCount || (s.ex_questions ? s.ex_questions.length : 0),
      _saved: true,
      _id: s.id,
    }))
    if (wizardSections.value.length > 0) {
      wForm.value.enableSections = true
    }
  } catch (err) {
    console.error('Failed to load sections for wizard:', err)
  }

  showWizard.value = true
}

const resetWizard = () => {
  wizardStep.value = 1
  wizardExamId.value = null
  wizardSaving.value = false
  wizardUploadedQuestions.value = 0
  wizardStudentCount.value = 0
  wizardSlotCount.value = 0
  wizardSections.value = []
  wizardAssignedCredentials.value = []
  wForm.value = {
    title: '', code: '', subject: '', description: '',
    durationMinutes: 60, passingMarks: 40, enableSections: false,
    webcamRequired: true, tabSwitchDetection: true,
    shuffleQuestions: true, showImmediateResults: false,
  }
  wSectionForm.value = { name: '', cutoffMarks: 0, maxQuestionsLimit: null, description: '' }
  wSlotForm.value = { windowStart: '', windowEnd: '', capacity: 30 }
}

const closeWizardSafe = () => {
  if (wizardExamId.value) {
    if (!confirm('Close wizard? Your exam is saved as Draft and will appear in the exam list.')) return
  }
  showWizard.value = false
  resetWizard()
  fetchExams()
}

// Step navigation — step 1 creates the exam, step 2 updates settings, step 3 saves sections & questions
const wizardNext = async () => {
  if (wizardStep.value === 1) {
    // Validate
    if (!wForm.value.title.trim() || !wForm.value.code.trim()) {
      alert('Please fill in Exam Title and Exam Code before continuing.')
      return
    }
    if (!wizardExamId.value) {
      // Create exam in DB for first time
      wizardSaving.value = true
      try {
        const res = await examService.createExam({
          title: wForm.value.title.trim(),
          code: wForm.value.code.trim().toUpperCase(),
          description: wForm.value.description,
          status: 'DRAFT',
          durationMinutes: 60,
          passingMarks: 0,
          webcamRequired: wForm.value.webcamRequired,
          shuffleQuestions: wForm.value.shuffleQuestions,
          tabSwitchDetection: wForm.value.tabSwitchDetection,
          showImmediateResults: wForm.value.showImmediateResults,
        })
        wizardExamId.value = (res.exam || res).id
      } catch (err) {
        alert(err.message || 'Failed to create exam. Please check the exam code is unique.')
        wizardSaving.value = false
        return
      } finally {
        wizardSaving.value = false
      }
    }
  } else if (wizardStep.value === 2) {
    // Save marks & rules
    if (!wizardExamId.value) { wizardStep.value++; return }
    wizardSaving.value = true
    try {
      await examService.updateExam(wizardExamId.value, {
        durationMinutes: wForm.value.durationMinutes || 60,
        passingMarks: wForm.value.passingMarks || 0,
        webcamRequired: wForm.value.webcamRequired,
        tabSwitchDetection: wForm.value.tabSwitchDetection,
        shuffleQuestions: wForm.value.shuffleQuestions,
        showImmediateResults: wForm.value.showImmediateResults,
      })
    } catch (err) {
      alert(err.message || 'Failed to save settings.')
      wizardSaving.value = false
      return
    } finally {
      wizardSaving.value = false
    }
  } else if (wizardStep.value === 3) {
    // Persist sections to DB
    if (wizardSections.value.length > 0 && wizardExamId.value) {
      wizardSaving.value = true
      try {
        for (const sec of wizardSections.value) {
          if (!sec._saved) {
            await sectionService.createSection({
              examId: wizardExamId.value,
              name: sec.name,
              description: sec.description || '',
              cutoffMarks: sec.cutoffMarks || 0,
              maxQuestionsLimit: sec.maxQuestionsLimit || null,
            }).then(res => {
              sec._id = res.section?.id || res.id
              sec._saved = true
            })
          }
        }
      } catch (err) {
        alert(err.message || 'Failed to save sections.')
        wizardSaving.value = false
        return
      } finally {
        wizardSaving.value = false
      }
    }
  }

  wizardStep.value++
}

const wizardPrev = () => {
  if (wizardStep.value > 1) {
    wizardStep.value--
  }
}

// Add section and upload CSV questions in 1 unified step
const wizardAddSection = async () => {
  if (!wSectionForm.value.name.trim()) return
  wizardSaving.value = true
  try {
    let secId = null
    if (wizardExamId.value) {
      const res = await sectionService.createSection({
        examId: wizardExamId.value,
        name: wSectionForm.value.name.trim(),
        description: wSectionForm.value.description || '',
        cutoffMarks: wSectionForm.value.cutoffMarks || 0,
        maxQuestionsLimit: wSectionForm.value.maxQuestionsLimit || null,
      })
      secId = res.section?.id || res.id
    }

    let uploadedCount = 0
    if (wSectionForm.value.attachedFile && wizardExamId.value && secId) {
      const questions = await parseQuestionCsvFile(wSectionForm.value.attachedFile, secId)
      if (questions.length > 0) {
        await questionService.bulkCreate(wizardExamId.value, questions, secId)
        uploadedCount = questions.length
        wizardUploadedQuestions.value += uploadedCount
      }
    }

    wizardSections.value.push({
      name: wSectionForm.value.name.trim(),
      description: wSectionForm.value.description || '',
      cutoffMarks: wSectionForm.value.cutoffMarks || 0,
      maxQuestionsLimit: wSectionForm.value.maxQuestionsLimit || null,
      uploadedCount,
      _saved: !!secId,
      _id: secId,
    })

    wSectionForm.value = {
      name: '',
      cutoffMarks: 0,
      maxQuestionsLimit: null,
      description: '',
      attachedFile: null,
      attachedFileName: '',
    }
  } catch (err) {
    alert(err.message || 'Failed to save section and upload questions.')
  } finally {
    wizardSaving.value = false
  }
}

// CSV bulk upload — no section assignment
const wizardHandleCsvUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || !wizardExamId.value) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const text = e.target.result
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length <= 1) return alert('CSV is empty.')
      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
      const colIdx = (kws) => rawHeaders.findIndex(h => kws.some(k => h.includes(k)))
      const stmtIdx = colIdx(['statement', 'question'])
      const typeIdx = colIdx(['type'])
      const opt1Idx = colIdx(['opt1', 'option1', 'option_1'])
      const opt2Idx = colIdx(['opt2', 'option2', 'option_2'])
      const opt3Idx = colIdx(['opt3', 'option3', 'option_3'])
      const opt4Idx = colIdx(['opt4', 'option4', 'option_4'])
      const ansIdx = colIdx(['correct', 'answer', 'ans'])
      const ptsIdx = colIdx(['points', 'marks', 'pts'])
      const negIdx = colIdx(['negative', 'neg', 'penalty'])
      const diffIdx = colIdx(['diff', 'difficulty', 'level'])

      const questions = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        if (cols.length < 2) continue
        const get = (idx, fallbackIdx) => idx >= 0 ? cols[idx] : (cols[fallbackIdx] || '')
        const opts = [get(opt1Idx, 2), get(opt2Idx, 3), get(opt3Idx, 4), get(opt4Idx, 5)].filter(Boolean)
        let type = (get(typeIdx, 1) || 'MCQ').toUpperCase()
        if (!['MCQ','SINGLE_CHOICE','NUMERICAL','SUBJECTIVE','TRUE_FALSE'].includes(type)) type = 'MCQ'
        let diff = (get(diffIdx, 9) || 'MEDIUM').toUpperCase()
        if (!['EASY','MEDIUM','HARD'].includes(diff)) diff = 'MEDIUM'
        questions.push({
          statement: get(stmtIdx, 0) || 'Question',
          type, options: opts.length ? opts : ['A','B','C','D'],
          correctAnswer: get(ansIdx, 6) || (opts[0] || ''),
          points: 1,
          negativePoints: 0,
          difficulty: diff,
        })
      }
      if (!questions.length) return alert('No valid questions found.')
      await questionService.bulkCreate(wizardExamId.value, questions, null)
      wizardUploadedQuestions.value += questions.length
    } catch (err) {
      alert(err.message || 'Failed to upload CSV.')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// Per-section CSV upload inside wizard
const wizardHandleSectionCsvUpload = async (event, sectionIdx) => {
  const file = event.target.files[0]
  const sec = wizardSections.value[sectionIdx]
  if (!file || !wizardExamId.value || !sec) return

  // Ensure section is saved first
  if (!sec._saved || !sec._id) {
    try {
      const res = await sectionService.createSection({
        examId: wizardExamId.value,
        name: sec.name,
        description: sec.description || '',
        cutoffMarks: sec.cutoffMarks || 0,
        maxQuestionsLimit: sec.maxQuestionsLimit || null,
      })
      sec._id = res.section?.id || res.id
      sec._saved = true
    } catch (err) {
      alert('Failed to save section before uploading: ' + err.message); return
    }
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const text = e.target.result
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length <= 1) return
      const cols0 = (s) => s.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const questions = []
      for (let i = 1; i < lines.length; i++) {
        const c = cols0(lines[i])
        if (c.length < 2) continue
        let type = (c[1] || 'MCQ').toUpperCase()
        if (!['MCQ','SINGLE_CHOICE','NUMERICAL','SUBJECTIVE','TRUE_FALSE'].includes(type)) type = 'MCQ'
        let diff = (c[9] || 'MEDIUM').toUpperCase()
        if (!['EASY','MEDIUM','HARD'].includes(diff)) diff = 'MEDIUM'
        const opts = [c[2],c[3],c[4],c[5]].filter(Boolean)
        questions.push({
          statement: c[0] || 'Question', type,
          options: opts.length ? opts : ['A','B','C','D'],
          correctAnswer: c[6] || (opts[0] || ''),
          points: 1,
          negativePoints: 0,
          difficulty: diff,
          sectionId: sec._id,
        })
      }
      if (!questions.length) return
      await questionService.bulkCreate(wizardExamId.value, questions, sec._id)
      sec.uploadedCount = (sec.uploadedCount || 0) + questions.length
      wizardUploadedQuestions.value += questions.length
    } catch (err) {
      alert(err.message || 'Section CSV upload failed.')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// Student CSV upload inside wizard
const wizardAssignedCredentials = ref([])

const exportWizardCredentialsCsv = () => {
  if (!wizardAssignedCredentials.value.length) return
  const headers = ['Name', 'Email', 'Roll_Phone', 'Temporary_Password']
  const rows = wizardAssignedCredentials.value.map(c => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.rollNumber || c.roll_number || '').replace(/"/g, '""')}"`,
    `"${(c.password || '').replace(/"/g, '""')}"`
  ])
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${wForm.value.code || 'exam'}_student_credentials.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const wizardHandleStudentCsv = async (event) => {
  const file = event.target.files[0]
  if (!file || !wizardExamId.value) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const text = e.target.result
      if (!text || !text.trim()) return alert('CSV file is empty.')

      // Split lines cleanly across Windows (\r\n), Mac (\r), and Linux (\n)
      const rawLines = text.split(/\r\n|\r|\n/).filter(l => l.trim())
      if (rawLines.length === 0) return alert('No lines found in CSV.')

      // Check header delimiter
      const headerLine = rawLines[0]
      let sep = ','
      if (headerLine.includes(';') && !headerLine.includes(',')) sep = ';'
      else if (headerLine.includes('\t')) sep = '\t'

      const parseCols = (line) => {
        return line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
      }

      const headers = parseCols(rawLines[0]).map(h => h.toLowerCase())

      // Find column indices by keywords
      let nameIdx = headers.findIndex(h => h.includes('name'))
      let emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'))
      let phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('roll') || h.includes('mobile'))
      let passIdx = headers.findIndex(h => h.includes('pass') || h.includes('temp'))

      const hasHeader = nameIdx >= 0 || emailIdx >= 0
      if (!hasHeader) {
        nameIdx = 0
        emailIdx = 1
        phoneIdx = 2
        passIdx = 3
      }

      const startIndex = hasHeader ? 1 : 0
      const students = []

      for (let i = startIndex; i < rawLines.length; i++) {
        const cols = parseCols(rawLines[i])
        if (cols.length < 2) continue

        const name = cols[nameIdx >= 0 ? nameIdx : 0] || ''
        const email = cols[emailIdx >= 0 ? emailIdx : 1] || ''
        const phone = cols[phoneIdx >= 0 ? phoneIdx : 2] || ''
        const password = cols[passIdx >= 0 ? passIdx : 3] || undefined

        if (name && email && email.includes('@')) {
          students.push({
            name,
            email: email.toLowerCase(),
            rollNumber: phone || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            password: password || undefined
          })
        }
      }

      if (!students.length) return alert('No valid student rows with email addresses found in CSV.')

      const res = await slotService.assignCandidates(wizardExamId.value, students)
      const newCredentials = res.assignedStudents && res.assignedStudents.length > 0
        ? res.assignedStudents
        : students.map(s => ({
            name: s.name,
            email: s.email,
            rollNumber: s.rollNumber,
            password: s.password || 'Pass@1234'
          }))

      // Append credentials so all candidates remain visible in the table and CSV download
      wizardAssignedCredentials.value = [...wizardAssignedCredentials.value, ...newCredentials]
      wizardStudentCount.value = wizardAssignedCredentials.value.length

      alert(`⚡ Successfully assigned ${students.length} students! Total assigned roster: ${wizardAssignedCredentials.value.length} candidates.`)
    } catch (err) {
      alert(err.message || 'Failed to assign students.')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}



// Auto-generate slots inside wizard
const wizardGenerateSlots = async () => {
  if (!wizardExamId.value || !wSlotForm.value.windowStart || !wSlotForm.value.windowEnd) return
  const start = new Date(wSlotForm.value.windowStart)
  const end = new Date(wSlotForm.value.windowEnd)
  const durationMs = (Number(wForm.value.durationMinutes) || 60) * 60 * 1000
  if (start >= end) { alert('Window End must be after Window Start.'); return }
  wizardSaving.value = true
  let count = 0
  let cur = new Date(start)
  try {
    while (cur.getTime() + durationMs <= end.getTime()) {
      const slotEnd = new Date(cur.getTime() + durationMs)
      await slotService.createSlot(wizardExamId.value, {
        startTime: cur.toISOString().slice(0, 16),
        endTime: slotEnd.toISOString().slice(0, 16),
        capacity: wSlotForm.value.capacity || 30,
      })
      count++
      cur = slotEnd
    }
    wizardSlotCount.value += count
    if (count === 0) {
      alert(`No complete ${wForm.value.durationMinutes || 60}-minute slots fit in that window. Try expanding your start/end window.`)
    } else {
      alert(`⚡ Successfully auto-generated ${count} sequential slots of ${wForm.value.durationMinutes || 60} minutes each!`)
    }
  } catch (err) {
    alert(err.message || 'Failed to generate slots.')
  } finally {
    wizardSaving.value = false
  }
}

// Final step: set status and close wizard
const wizardFinish = async (status) => {
  if (!wizardExamId.value) { showWizard.value = false; resetWizard(); return }
  wizardSaving.value = true
  try {
    await examService.updateExam(wizardExamId.value, { status })
    showWizard.value = false
    resetWizard()
    await fetchExams()
  } catch (err) {
    alert(err.message || 'Failed to finalize exam.')
  } finally {
    wizardSaving.value = false
  }
}



const openUnifiedModal = async (exam, targetTab = 'general') => {
  isEditing.value = true
  activeExam.value = exam
  examForm.value = {
    id: exam.id,
    title: exam.title,
    code: exam.code,
    description: exam.description || '',
    durationMinutes: exam.durationMinutes,
    // passMarks from server, also populate passingMarks so the form field shows it
    passingMarks: exam.passMarks ?? exam.passingMarks ?? 0,
    status: exam.status,
    shuffleQuestions: exam.shuffleQuestions ?? true,
    webcamRequired: exam.webcamRequired ?? true,
    tabSwitchDetection: exam.tabSwitchDetection ?? true,
    showImmediateResults: exam.showImmediateResults ?? exam.publishedResults ?? false,
    enableSections: exam.enableSections ?? true,
  }
  modalTab.value = targetTab
  showModal.value = true

  await fetchSlots()
  await fetchSections()
  await fetchExamQuestions()
  await fetchAssignedStudents()
}

const saveExam = async () => {
  savingExam.value = true
  try {
    // Always send passingMarks so the backend can map it to pass_marks
    const payload = {
      ...examForm.value,
      passingMarks: examForm.value.passingMarks ?? 0,
    }
    if (isEditing.value && activeExam.value) {
      await examService.updateExam(activeExam.value.id, payload)
      alert('Exam settings updated successfully!')
    } else {
      const res = await examService.createExam(payload)
      activeExam.value = res.exam || res
      isEditing.value = true
      examForm.value.id = activeExam.value.id
      alert('Exam created successfully! You can now configure slots, assign students, and add questions.')
      modalTab.value = 'slots'
    }
    await fetchExams()
  } catch (err) {
    alert(err.message || 'Failed to save exam settings.')
  } finally {
    savingExam.value = false
  }
}

const modalTabOrder = ['general', 'slots', 'students', 'sections', 'questions']

const configureModalNextTab = () => {
  const currentIndex = modalTabOrder.indexOf(modalTab.value)
  if (currentIndex >= 0 && currentIndex < modalTabOrder.length - 1) {
    modalTab.value = modalTabOrder[currentIndex + 1]
  }
}

const configureModalPrevTab = () => {
  const currentIndex = modalTabOrder.indexOf(modalTab.value)
  if (currentIndex > 0) {
    modalTab.value = modalTabOrder[currentIndex - 1]
  }
}

const saveExamAndPublish = async () => {
  await saveExam()
  showModal.value = false
  await fetchExams()
}

const deleteExam = async (id) => {
  if (confirm('⚠️ Delete this exam permanently? All questions, slots, and results will also be deleted.')) {
    try {
      await examService.deleteExam(id)
      await fetchExams()
    } catch (err) {
      alert(err.message || 'Failed to delete exam.')
    }
  }
}

// Quick lifecycle action methods (inline on card — no modal needed)
const goLive = async (exam) => {
  if (!confirm(`▶ Go Live now with "${exam.title}"?\n\nThis will allow candidates to start the exam immediately.`)) return
  try {
    await examService.updateExam(exam.id, { status: 'LIVE' })
    await fetchExams()
  } catch (err) {
    alert(err.message || 'Failed to go live.')
  }
}

const scheduleExam = async (exam) => {
  if (!confirm(`⏰ Mark "${exam.title}" as SCHEDULED?\n\nThis means the exam is ready and will go live on the scheduled slot start time.`)) return
  try {
    await examService.updateExam(exam.id, { status: 'SCHEDULED' })
    await fetchExams()
  } catch (err) {
    alert(err.message || 'Failed to schedule exam.')
  }
}

const completeExam = async (exam) => {
  if (!confirm(`⏹ Complete "${exam.title}"?\n\nThis closes the exam for new attempts. You can then publish results.`)) return
  try {
    await examService.updateExam(exam.id, { status: 'COMPLETED' })
    await fetchExams()
  } catch (err) {
    alert(err.message || 'Failed to complete exam.')
  }
}

const togglePublishCard = async (exam) => {
  const newState = !exam.publishedResults
  const action = newState ? 'Publish' : 'Unpublish'
  if (!confirm(`${action} results for "${exam.title}"?\n\n${newState ? 'Students will be able to see their scores and rank.' : 'Results will be hidden from students.'}`)) return
  try {
    await examService.togglePublishResults(exam.id, newState)
    await fetchExams()
  } catch (err) {
    alert(err.message || 'Failed to update publish status.')
  }
}

// Slots Methods
const fetchSlots = async () => {
  if (!activeExam.value) return
  loadingSlots.value = true
  try {
    const res = await slotService.getSlots(activeExam.value.id)
    slots.value = res.slots || []
  } catch (err) {
    console.error('Failed to load slots:', err)
  } finally {
    loadingSlots.value = false
  }
}

const saveSlot = async () => {
  if (!activeExam.value) {
    alert('Please save the exam general settings first before adding time slots.')
    return
  }
  if (!slotForm.value.startTime || !slotForm.value.endTime) {
    alert('Please select both Start Time and End Time for the slot.')
    return
  }
  savingSlot.value = true
  try {
    await slotService.createSlot(activeExam.value.id, slotForm.value)
    showSlotForm.value = false
    slotForm.value = { startTime: '', endTime: '', capacity: 30 }
    await fetchSlots()
  } catch (err) {
    alert(err.message || 'Failed to create slot.')
  } finally {
    savingSlot.value = false
  }
}

const deleteSlot = async (slotId) => {
  if (confirm('Delete this time slot?')) {
    try {
      await slotService.deleteSlot(activeExam.value.id, slotId)
      await fetchSlots()
    } catch (err) {
      alert(err.message || 'Failed to delete slot.')
    }
  }
}

// Student CSV Assignment Methods
const downloadStudentCsvTemplate = () => {
  const headers = 'Name,Email,Roll_Phone,Password'
  const row1 = '"Rahul Verma","rahul.verma@example.com","9876543210",""'
  const row2 = '"Priya Sharma","priya.sharma@example.com","9876543211",""'
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, row1, row2].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `student_roster_template_${activeExam.value?.code || 'sample'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const downloadQuestionCsvTemplate = (sectionName = 'section') => {
  const headers = 'statement,type,option1,option2,option3,option4,correct_answer,points,negative_points,difficulty'
  const row1 = '"What is 2 + 2?","MCQ","2","4","6","8","4","1","0.25","EASY"'
  const row2 = '"Which of the following is NOT a programming language?","MCQ","Java","Python","HTML","C++","HTML","2","0.5","MEDIUM"'
  const row3 = '"Write about recursion in your own words.","SUBJECTIVE","","","","","","5","0","HARD"'
  const row4 = '"What is the value of pi to 2 decimal places?","NUMERICAL","","","","","3.14","2","0.5","MEDIUM"'
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, row1, row2, row3, row4].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `question_template_${sectionName.replace(/\s+/g, '_')}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


const handleStudentCsvSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target.result
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length <= 1) return alert('CSV file is empty or contains only headers.')

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''))
      const nameIdx = headers.findIndex((h) => h.includes('name'))
      const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'))
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('roll') || h.includes('num'))
      const passIdx = headers.findIndex((h) => h.includes('pass') || h.includes('pwd'))

      const students = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        if (cols.length >= 2) {
          const name = nameIdx !== -1 ? cols[nameIdx] : cols[0]
          const email = emailIdx !== -1 ? cols[emailIdx] : cols[1]
          const phoneOrRoll = phoneIdx !== -1 ? cols[phoneIdx] : cols[2] || `STU-${Math.floor(1000 + Math.random() * 9000)}`
          const randomPin = Math.floor(1000 + Math.random() * 9000)
          const password = passIdx !== -1 && cols[passIdx] ? cols[passIdx] : `Pass#${randomPin}`

          if (email) {
            students.push({
              name: name || 'Student Candidate',
              email: email.trim().toLowerCase(),
              rollNumber: phoneOrRoll,
              password: password,
            })
          }
        }
      }
      parsedStudentCsv.value = students
      alert(`Parsed ${students.length} students! Generated unique temporary passwords for each candidate.`)
    } catch (err) {
      alert('Error parsing Student CSV file.')
    }
  }
  reader.readAsText(file)
}

const exportGeneratedCredentialsCsv = () => {
  if (parsedStudentCsv.value.length === 0) return
  const headers = 'Name,Email,Roll_Phone,Temporary_Password'
  const rows = parsedStudentCsv.value.map((s) => `"${s.name}","${s.email}","${s.rollNumber}","${s.password}"`)
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `generated_student_logins_${activeExam.value?.code || 'exam'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const commitStudentAssignment = async () => {
  if (!activeExam.value || parsedStudentCsv.value.length === 0) return
  savingStudents.value = true
  try {
    const res = await slotService.assignCandidates(activeExam.value.id, parsedStudentCsv.value)
    alert(res.message || `Successfully assigned ${parsedStudentCsv.value.length} students!`)
    parsedStudentCsv.value = []
    await fetchAssignedStudents()
  } catch (err) {
    alert(err.message || 'Failed to assign students.')
  } finally {
    savingStudents.value = false
  }
}

// Section Methods
const fetchSections = async () => {
  if (!activeExam.value) return
  loadingSections.value = true
  try {
    const res = await sectionService.getSections(activeExam.value.id)
    sections.value = res.sections || []
  } catch (err) {
    console.error('Failed to load sections:', err)
  } finally {
    loadingSections.value = false
  }
}

const openAddSectionInline = () => {
  editingSectionId.value = null
  sectionForm.value = { name: '', description: '', cutoffMarks: 0, maxQuestionsLimit: null }
  showInlineSectionForm.value = true
}

const openEditSectionInline = (sec) => {
  editingSectionId.value = sec.id
  sectionForm.value = {
    name: sec.name,
    description: sec.description || '',
    cutoffMarks: sec.cutoffMarks || 0,
    maxQuestionsLimit: sec.maxQuestionsLimit || null,
  }
  showInlineSectionForm.value = true
}

const saveSection = async () => {
  if (!activeExam.value || !sectionForm.value.name) return
  savingSection.value = true
  try {
    const payload = {
      examId: activeExam.value.id,
      name: sectionForm.value.name,
      description: sectionForm.value.description,
      cutoffMarks: Number(sectionForm.value.cutoffMarks) || 0,
      maxQuestionsLimit: sectionForm.value.maxQuestionsLimit ? Number(sectionForm.value.maxQuestionsLimit) : null,
    }
    if (editingSectionId.value) {
      await sectionService.updateSection(editingSectionId.value, payload)
    } else {
      await sectionService.createSection(payload)
    }
    showInlineSectionForm.value = false
    await fetchSections()
  } catch (err) {
    alert(err.message || 'Failed to save section.')
  } finally {
    savingSection.value = false
  }
}

const deleteSection = async (secId) => {
  if (confirm('Delete this section?')) {
    try {
      await sectionService.deleteSection(secId)
      await fetchSections()
    } catch (err) {
      alert(err.message || 'Failed to delete section.')
    }
  }
}

const handleSectionCsvUpload = (event, sectionId, sectionName) => {
  const file = event.target.files[0]
  if (!file || !activeExam.value) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const text = e.target.result
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length <= 1) return alert('CSV file is empty or contains only headers.')

      // Parse header row to find column indices dynamically
      const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
      const colIdx = (keywords) => rawHeaders.findIndex((h) => keywords.some((k) => h.includes(k)))
      const stmtIdx = colIdx(['statement', 'question'])
      const typeIdx = colIdx(['type'])
      const opt1Idx = colIdx(['opt1', 'option1', 'option_1', 'a'])
      const opt2Idx = colIdx(['opt2', 'option2', 'option_2', 'b'])
      const opt3Idx = colIdx(['opt3', 'option3', 'option_3', 'c'])
      const opt4Idx = colIdx(['opt4', 'option4', 'option_4', 'd'])
      const ansIdx = colIdx(['correct', 'answer', 'ans'])
      const ptsIdx = colIdx(['points', 'marks', 'pts'])
      const negIdx = colIdx(['negative', 'neg', 'penalty'])
      const diffIdx = colIdx(['diff', 'difficulty', 'level'])

      const questions = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        if (cols.length >= 2) {
          // Fallback positional if headers not found
          const statement = stmtIdx >= 0 ? cols[stmtIdx] : cols[0]
          const rawType = typeIdx >= 0 ? cols[typeIdx] : cols[1]
          const opt1 = opt1Idx >= 0 ? cols[opt1Idx] : cols[2]
          const opt2 = opt2Idx >= 0 ? cols[opt2Idx] : cols[3]
          const opt3 = opt3Idx >= 0 ? cols[opt3Idx] : cols[4]
          const opt4 = opt4Idx >= 0 ? cols[opt4Idx] : cols[5]
          const correctAns = ansIdx >= 0 ? cols[ansIdx] : cols[6]
          const rawPts = ptsIdx >= 0 ? cols[ptsIdx] : cols[7]
          const rawNeg = negIdx >= 0 ? cols[negIdx] : cols[8]
          const rawDiff = diffIdx >= 0 ? cols[diffIdx] : cols[9]

          const options = [opt1, opt2, opt3, opt4].filter(Boolean)

          let cleanType = String(rawType || '').trim().toUpperCase()
          if (!['MCQ', 'SINGLE_CHOICE', 'NUMERICAL', 'SUBJECTIVE', 'ESSAY', 'TRUE_FALSE'].includes(cleanType)) {
            cleanType = 'MCQ'
          }

          let cleanDiff = String(rawDiff || '').trim().toUpperCase()
          if (!['EASY', 'MEDIUM', 'HARD'].includes(cleanDiff)) {
            if (cleanDiff.startsWith('EA')) cleanDiff = 'EASY'
            else if (cleanDiff.startsWith('HA')) cleanDiff = 'HARD'
            else cleanDiff = 'MEDIUM'
          }

          questions.push({
            statement: statement || 'Question Statement',
            type: cleanType,
            options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: correctAns || (options[0] || 'Option A'),
            points: 1,
            negativePoints: 0,
            difficulty: cleanDiff,
            sectionId: sectionId,
          })
        }
      }

      if (questions.length === 0) return alert('No valid questions found in CSV.')

      await questionService.bulkCreate(activeExam.value.id, questions, sectionId)
      alert(`✅ Successfully uploaded ${questions.length} questions to "${sectionName}"!\n\nQuestions are now saved in the database and assigned to this section.`)
      await fetchSections()
      await fetchExamQuestions()
      await fetchAssignedStudents()
    } catch (err) {
      alert(err.message || 'Failed to upload questions CSV to section.')
    }
  }
  reader.readAsText(file)
}

// Question Methods
const fetchExamQuestions = async () => {
  if (!activeExam.value) return
  try {
    const res = await questionService.getQuestions({ examId: activeExam.value.id })
    examQuestions.value = res.questions || []
  } catch (err) {
    console.error('Failed to load exam questions:', err)
  }
}

const saveSingleQuestion = async () => {
  if (!activeExam.value || !singleQuestionForm.value.statement) return
  savingQuestion.value = true
  try {
    await questionService.createQuestion({
      examId: activeExam.value.id,
      sectionId: singleQuestionForm.value.sectionId,
      type: singleQuestionForm.value.type || 'MCQ',
      statement: singleQuestionForm.value.statement,
      correctAnswer: singleQuestionForm.value.correctAnswer || '0',
      points: singleQuestionForm.value.points ?? 1,
      negativePoints: singleQuestionForm.value.negativePoints ?? 0,
      difficulty: singleQuestionForm.value.difficulty || 'MEDIUM',
    })
    // Reset form but keep section/type selection for convenience
    singleQuestionForm.value = {
      sectionId: singleQuestionForm.value.sectionId,
      type: singleQuestionForm.value.type,
      statement: '',
      correctAnswer: '',
      points: singleQuestionForm.value.points,
      negativePoints: singleQuestionForm.value.negativePoints,
      difficulty: singleQuestionForm.value.difficulty,
    }
    await fetchExamQuestions()
    await fetchSections()
    workbenchSubTab.value = 'list'
  } catch (err) {
    alert(err.message || 'Failed to create question.')
  } finally {
    savingQuestion.value = false
  }
}

const deleteQuestion = async (qId) => {
  if (confirm('Delete this question?')) {
    try {
      await questionService.deleteQuestion(qId)
      await fetchExamQuestions()
      await fetchAssignedStudents()
      await fetchSections()
    } catch (err) {
      alert(err.message || 'Failed to delete question.')
    }
  }
}

const applyBatchMarks = async () => {
  if (!activeExam.value) return
  applyingBatchMarks.value = true
  try {
    const res = await questionService.batchUpdateMarks(
      activeExam.value.id,
      batchMarksForm.value.sectionId,
      batchMarksForm.value.points,
      batchMarksForm.value.negativePoints
    )
    alert(`⚡ ${res.message || 'Marking scheme updated successfully!'}`)
    showBatchMarksCard.value = false
    await fetchExamQuestions()
    await fetchSections()
    await fetchAssignedStudents()
  } catch (err) {
    alert(err.message || 'Failed to apply batch marks.')
  } finally {
    applyingBatchMarks.value = false
  }
}

const openEditQuestion = (q) => {
  editingQuestionId.value = q.id
  editingQuestionForm.value = {
    points: q.points,
    negativePoints: q.negativePoints || 0,
    sectionId: q.sectionId || null,
    statement: q.statement || '',
    correctAnswer: q.correctAnswer || '',
  }
}

const saveQuestionEdit = async () => {
  if (!editingQuestionId.value) return
  savingQuestionEdit.value = true
  try {
    await questionService.updateQuestion(editingQuestionId.value, editingQuestionForm.value)
    editingQuestionId.value = null
    await fetchExamQuestions()
    await fetchSections()
  } catch (err) {
    alert(err.message || 'Failed to update question.')
  } finally {
    savingQuestionEdit.value = false
  }
}
</script>
