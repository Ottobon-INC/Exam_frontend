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
        @click="openCreateModal"
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
        @click="openCreateModal"
        class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
      >
        + Create Exam Now
      </button>
    </div>

    <!-- Exams Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="exam in filteredExams"
        :key="exam.id"
        class="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs"
      >
        <div>
          <!-- Header info -->
          <div class="mb-3 flex items-center justify-between">
            <span class="font-mono text-3xs font-bold text-zinc-500 uppercase tracking-wider">{{ exam.code }}</span>
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-3xs font-bold"
              :class="getStatusBadgeClass(exam.status)"
            >
              {{ exam.status }}
            </span>
          </div>

          <h3 class="font-bold text-zinc-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
            {{ exam.title }}
          </h3>
          <p class="mt-1 text-2xs text-zinc-600 line-clamp-2">
            {{ exam.description || 'No description provided.' }}
          </p>

          <!-- Specifications Stats Box -->
          <div class="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 text-2xs">
            <div>
              <span class="text-zinc-600 block text-3xs">Duration</span>
              <span class="font-bold text-zinc-900">{{ exam.durationMinutes }} minutes</span>
            </div>
            <div>
              <span class="text-zinc-600 block text-3xs">Total Marks</span>
              <span class="font-bold text-zinc-900">{{ exam.totalMarks }} <span class="text-zinc-600 font-normal">({{ exam.passMarks }} pass)</span></span>
            </div>
            <div>
              <span class="text-zinc-600 block text-3xs">Questions</span>
              <span class="font-bold text-zinc-900">{{ exam.questionCount || 0 }} items</span>
            </div>
            <div>
              <span class="text-zinc-600 block text-3xs">Proctoring</span>
              <span class="font-bold text-zinc-900">{{ exam.webcamRequired ? 'Active' : 'Disabled' }}</span>
            </div>
          </div>
        </div>

        <!-- Card Action Footer -->
        <div class="mt-5 flex items-center justify-between pt-3 border-t border-zinc-100 gap-2">
          <div class="flex items-center gap-1">
            <button
              @click="openUnifiedModal(exam, 'questions')"
              class="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Questions ({{ exam.questionCount || 0 }})
            </button>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="openUnifiedModal(exam, 'general')"
              class="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Configure
            </button>
            <button
              @click="deleteExam(exam.id)"
              class="text-zinc-400 hover:text-red-600 p-1 text-xs transition-colors cursor-pointer"
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
                  <label class="mb-1 block font-bold text-zinc-800">Passing Marks</label>
                  <input
                    v-model.number="examForm.passingMarks"
                    type="number"
                    required
                    min="0"
                    class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-600 focus:outline-none"
                  />
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
                  class="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
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
              <div class="flex items-center justify-end gap-2 pt-1">
                <button @click="showAutoSlotForm = false" type="button" class="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer">Cancel</button>
                <button @click="generateAutoSlots" :disabled="generatingAutoSlots" type="button" class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs">
                  {{ generatingAutoSlots ? 'Generating...' : `⚡ Generate ${examForm.durationMinutes}-Min Slots` }}
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
                <button @click="fetchAssignedStudents" class="text-3xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer">
                  🔄 Refresh Roster
                </button>
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
                    <label class="mb-1 block font-bold text-zinc-800">Section Cutoff Marks</label>
                    <input v-model.number="sectionForm.cutoffMarks" type="number" min="0" placeholder="0" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none" />
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
                        Cutoff: <span class="font-bold text-zinc-900">{{ s.cutoffMarks || 0 }} marks</span>
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <label v-if="(s.questionCount || 0) === 0" class="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer shadow-xs">
                        📤 Upload Questions CSV
                        <input type="file" accept=".csv" class="hidden" @change="(e) => handleSectionCsvUpload(e, s.id, s.name)" />
                      </label>

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
            <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div class="flex items-center gap-2">
                <button @click="workbenchSubTab = 'list'" class="rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer" :class="workbenchSubTab === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'">Question List ({{ examQuestions.length }})</button>
                <button @click="workbenchSubTab = 'add'" class="rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer" :class="workbenchSubTab === 'add' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'">+ Add Single Question</button>
              </div>
            </div>

            <!-- Question List -->
            <div v-if="workbenchSubTab === 'list'" class="space-y-2">
              <div v-if="examQuestions.length === 0" class="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-xs text-zinc-600">No questions created yet.</div>
              <div v-else v-for="(q, idx) in examQuestions" :key="q.id" class="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="font-bold text-zinc-900 text-xs">Q{{ idx + 1 }}. {{ q.statement }}</span>
                    <div class="mt-1 flex items-center gap-2 text-3xs text-zinc-600">
                      <span class="rounded bg-zinc-100 px-2 py-0.5 font-bold text-zinc-800">{{ q.points }} pts</span>
                      <span class="rounded bg-zinc-100 px-2 py-0.5 font-bold text-zinc-800">{{ q.difficulty }}</span>
                    </div>
                  </div>
                  <button @click="deleteQuestion(q.id)" class="text-zinc-400 hover:text-red-600 p-1 cursor-pointer">Delete</button>
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
                  <label class="mb-1 block font-bold text-zinc-800">Points / Marks</label>
                  <input v-model.number="singleQuestionForm.points" type="number" min="1" class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none" />
                </div>
              </div>
              <div>
                <label class="mb-1 block font-bold text-zinc-800">Question Statement</label>
                <textarea v-model="singleQuestionForm.statement" rows="2" required placeholder="Enter question..." class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none"></textarea>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" @click="saveSingleQuestion" :disabled="savingQuestion" class="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer">Save Question</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { examService, questionService, sectionService, slotService } from '../../api/services'

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
  statement: '',
  points: 1,
  difficulty: 'MEDIUM',
})

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

const openCreateModal = () => {
  isEditing.value = false
  activeExam.value = null
  examForm.value = {
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
  }
  slots.value = []
  sections.value = []
  examQuestions.value = []
  modalTab.value = 'general'
  showModal.value = true
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
    passingMarks: exam.passingMarks,
    status: exam.status,
    shuffleQuestions: exam.shuffleQuestions ?? true,
    webcamRequired: exam.webcamRequired ?? true,
    tabSwitchDetection: exam.tabSwitchDetection ?? true,
    showImmediateResults: exam.showImmediateResults ?? false,
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
    if (isEditing.value && activeExam.value) {
      await examService.updateExam(activeExam.value.id, examForm.value)
      alert('Exam settings updated successfully!')
    } else {
      const res = await examService.createExam(examForm.value)
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

const deleteExam = async (id) => {
  if (confirm('Are you sure you want to delete this exam?')) {
    try {
      await examService.deleteExam(id)
      await fetchExams()
    } catch (err) {
      alert(err.message || 'Failed to delete exam.')
    }
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
  const headers = 'name,email,phone'
  const row1 = '"Rahul Verma","rahul.verma@example.com","9876543210"'
  const row2 = '"Priya Sharma","priya.sharma@example.com","9876543211"'
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, row1, row2].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `student_roster_template_${activeExam.value?.code || 'sample'}.csv`)
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

      const questions = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        if (cols.length >= 2) {
          const [statement, rawType, opt1, opt2, opt3, opt4, correctAns, points, rawDiff] = cols
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
            points: Number(points) || 1,
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
      statement: singleQuestionForm.value.statement,
      points: singleQuestionForm.value.points,
      difficulty: singleQuestionForm.value.difficulty,
    })
    singleQuestionForm.value.statement = ''
    await fetchExamQuestions()
  await fetchAssignedStudents()
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
</script>
