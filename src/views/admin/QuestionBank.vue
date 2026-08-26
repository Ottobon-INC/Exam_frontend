<template>
  <div class="space-y-6">
    <!-- Top Bar with Header & Add Button -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-ink-gray-9">Question Bank</h1>
        <p class="text-xs text-ink-gray-5">Centralized item repository with Bloom taxonomy, rich tags, difficulty ratings, and multiple question types.</p>
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center gap-1.5 rounded-lg bg-ink-gray-9 px-3.5 py-2 text-xs font-medium text-surface-white hover:opacity-90 transition-opacity"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Question
      </button>
    </div>

    <!-- Filters & Taxonomy Bar -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-4 rounded-xl border border-outline-gray-1 bg-surface-white p-3 shadow-xs">
      <div>
        <label class="mb-1 block text-3xs font-medium text-ink-gray-5 uppercase">Subject Domain</label>
        <select
          v-model="selectedSubject"
          @change="fetchQuestions"
          class="w-full rounded-lg border border-outline-gray-2 bg-surface-gray-1 px-2.5 py-1.5 text-xs text-ink-gray-8 focus:border-outline-gray-5 focus:bg-surface-white focus:outline-none"
        >
          <option value="All">All Subjects</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Machine Learning">Machine Learning</option>
          <option value="Software Engineering">Software Engineering</option>
          <option value="Mathematics">Mathematics</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-3xs font-medium text-ink-gray-5 uppercase">Question Type</label>
        <select
          v-model="selectedType"
          @change="fetchQuestions"
          class="w-full rounded-lg border border-outline-gray-2 bg-surface-gray-1 px-2.5 py-1.5 text-xs text-ink-gray-8 focus:border-outline-gray-5 focus:bg-surface-white focus:outline-none"
        >
          <option value="All">All Types</option>
          <option value="MCQ">Single Choice (MCQ)</option>
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="SUBJECTIVE">Subjective / Essay</option>
          <option value="NUMERICAL">Numerical Value</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-3xs font-medium text-ink-gray-5 uppercase">Difficulty</label>
        <select
          v-model="selectedDifficulty"
          @change="fetchQuestions"
          class="w-full rounded-lg border border-outline-gray-2 bg-surface-gray-1 px-2.5 py-1.5 text-xs text-ink-gray-8 focus:border-outline-gray-5 focus:bg-surface-white focus:outline-none"
        >
          <option value="All">All Levels</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-3xs font-medium text-ink-gray-5 uppercase">Search</label>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter by question text..."
          class="w-full rounded-lg border border-outline-gray-2 bg-surface-gray-1 px-2.5 py-1.5 text-xs text-ink-gray-8 placeholder-ink-gray-4 focus:border-outline-gray-5 focus:bg-surface-white focus:outline-none"
        />
      </div>
    </div>

    <!-- Questions Table View -->
    <div v-if="loading" class="text-center py-12 text-xs text-ink-gray-5">
      Loading questions from database...
    </div>

    <div v-else-if="filteredQuestions.length === 0" class="rounded-xl border border-outline-gray-1 bg-surface-white p-12 text-center text-xs text-ink-gray-5">
      No questions found matching your taxonomy filters.
    </div>

    <div v-else class="rounded-xl border border-outline-gray-1 bg-surface-white shadow-xs overflow-hidden">
      <table class="w-full text-left text-xs">
        <thead class="border-b border-outline-gray-1 bg-surface-gray-1 text-ink-gray-5">
          <tr>
            <th class="py-3 px-4 font-medium">Question Text & Subject</th>
            <th class="py-3 px-4 font-medium">Type</th>
            <th class="py-3 px-4 font-medium">Difficulty</th>
            <th class="py-3 px-4 font-medium">Points</th>
            <th class="py-3 px-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-gray-1">
          <tr v-for="q in filteredQuestions" :key="q.id" class="group hover:bg-surface-gray-1 transition-colors">
            <td class="py-3 px-4">
              <div class="flex flex-col">
                <span class="font-medium text-ink-gray-9 line-clamp-1">{{ q.statement }}</span>
                <div class="mt-1 flex items-center gap-1.5 text-3xs text-ink-gray-5">
                  <span class="font-semibold text-ink-gray-7">{{ q.subject }}</span>
                  <span>•</span>
                  <span class="rounded bg-surface-gray-2 px-1.5 py-0.2 border border-outline-gray-1">{{ q.topic }}</span>
                </div>
              </div>
            </td>
            <td class="py-3 px-4">
              <span class="rounded-md bg-surface-gray-2 px-2 py-0.5 text-3xs font-medium text-ink-gray-7">
                {{ q.type }}
              </span>
            </td>
            <td class="py-3 px-4">
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-medium"
                :class="getDifficultyClass(q.difficulty)"
              >
                {{ q.difficulty }}
              </span>
            </td>
            <td class="py-3 px-4 font-semibold text-ink-gray-8">{{ q.points }} pts</td>
            <td class="py-3 px-4 text-right">
              <button
                @click="editQuestion(q)"
                class="rounded-md border border-outline-gray-2 px-2 py-1 text-3xs font-medium text-ink-gray-7 hover:bg-surface-gray-2 transition-colors"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Question Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-outline-gray-2 bg-surface-white shadow-xl">
        <div class="flex items-center justify-between border-b border-outline-gray-1 px-6 py-4">
          <h2 class="text-base font-semibold text-ink-gray-9">
            {{ isEditing ? 'Edit Question' : 'Compose New Question' }}
          </h2>
          <button @click="showModal = false" class="text-ink-gray-4 hover:text-ink-gray-8">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="saveQuestion" class="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block font-medium text-ink-gray-7">Subject</label>
              <input
                v-model="questionForm.subject"
                required
                type="text"
                class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
                placeholder="e.g. Computer Science"
              />
            </div>
            <div>
              <label class="mb-1 block font-medium text-ink-gray-7">Topic / Sub-topic</label>
              <input
                v-model="questionForm.topic"
                required
                type="text"
                class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
                placeholder="e.g. Binary Search Trees"
              />
            </div>
            <div>
              <label class="mb-1 block font-medium text-ink-gray-7">Question Type</label>
              <select
                v-model="questionForm.type"
                class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
              >
                <option value="MCQ">Single Choice (MCQ)</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="SUBJECTIVE">Subjective / Essay</option>
                <option value="NUMERICAL">Numerical Value</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block font-medium text-ink-gray-7">Question Statement</label>
            <textarea
              v-model="questionForm.statement"
              required
              rows="3"
              class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
              placeholder="Type the full question prompt here..."
            ></textarea>
          </div>

          <!-- Options Builder (For MCQ) -->
          <div v-if="questionForm.type === 'MCQ' || questionForm.type === 'MULTIPLE_CHOICE'" class="space-y-2 rounded-xl border border-outline-gray-1 bg-surface-gray-1 p-3">
            <div class="flex items-center justify-between">
              <label class="font-semibold text-ink-gray-9 text-xs">Answer Options</label>
              <button
                type="button"
                @click="addOption"
                class="text-3xs text-ink-blue-3 font-semibold hover:underline"
              >
                + Add Option
              </button>
            </div>

            <div v-for="(opt, idx) in questionForm.options" :key="idx" class="flex items-center gap-2">
              <input
                type="radio"
                name="correctOption"
                :checked="String(questionForm.correctAnswer) === String(idx)"
                @change="questionForm.correctAnswer = String(idx)"
                title="Mark as correct"
              />
              <input
                v-model="questionForm.options[idx]"
                type="text"
                required
                class="flex-1 rounded-lg border border-outline-gray-2 bg-surface-white px-2.5 py-1.5 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
                :placeholder="'Option ' + String.fromCharCode(65 + idx)"
              />
              <button
                v-if="questionForm.options.length > 2"
                type="button"
                @click="removeOption(idx)"
                class="text-ink-gray-4 hover:text-ink-red-3"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block font-medium text-ink-gray-7">Difficulty Level</label>
              <select
                v-model="questionForm.difficulty"
                class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block font-medium text-ink-gray-7">Points / Weightage</label>
              <input
                v-model.number="questionForm.points"
                type="number"
                min="1"
                class="w-full rounded-lg border border-outline-gray-2 bg-surface-white px-3 py-2 text-xs text-ink-gray-9 focus:border-outline-gray-5 focus:outline-none"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 border-t border-outline-gray-1 pt-4">
            <button
              type="button"
              @click="showModal = false"
              class="rounded-lg border border-outline-gray-2 bg-surface-white px-3.5 py-2 text-xs font-medium text-ink-gray-7 hover:bg-surface-gray-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="rounded-lg bg-ink-gray-9 px-4 py-2 text-xs font-medium text-surface-white hover:opacity-90 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Question' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { questionService } from '../../api/services'

const selectedSubject = ref('All')
const selectedType = ref('All')
const selectedDifficulty = ref('All')
const searchQuery = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const loading = ref(true)
const saving = ref(false)
const questions = ref([])

const questionForm = ref({
  subject: 'Computer Science',
  topic: 'General',
  type: 'MCQ',
  statement: '',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: '0',
  difficulty: 'MEDIUM',
  points: 2,
})

const fetchQuestions = async () => {
  loading.value = true
  try {
    const filters = {}
    if (selectedSubject.value !== 'All') filters.subject = selectedSubject.value
    if (selectedType.value !== 'All') filters.type = selectedType.value
    if (selectedDifficulty.value !== 'All') filters.difficulty = selectedDifficulty.value

    const res = await questionService.getQuestions(filters)
    questions.value = res.questions || []
  } catch (err) {
    console.error('Failed to load questions:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchQuestions()
})

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case 'EASY':
      return 'bg-surface-green-2 text-ink-green-3'
    case 'MEDIUM':
      return 'bg-surface-amber-2 text-ink-amber-3'
    case 'HARD':
      return 'bg-surface-red-2 text-ink-red-3'
    default:
      return 'bg-surface-gray-2 text-ink-gray-6'
  }
}

const filteredQuestions = computed(() => {
  return questions.value.filter((q) => {
    return (
      q.statement.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
})

const openCreateModal = () => {
  isEditing.value = false
  questionForm.value = {
    subject: 'Computer Science',
    topic: 'General',
    type: 'MCQ',
    statement: '',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: '0',
    difficulty: 'MEDIUM',
    points: 2,
  }
  showModal.value = true
}

const editQuestion = (q) => {
  isEditing.value = true
  questionForm.value = {
    ...q,
    options: q.options || ['Option A', 'Option B'],
  }
  showModal.value = true
}

const addOption = () => {
  questionForm.value.options.push(`Option ${String.fromCharCode(65 + questionForm.value.options.length)}`)
}

const removeOption = (idx) => {
  questionForm.value.options.splice(idx, 1)
}

const saveQuestion = async () => {
  saving.value = true
  try {
    if (isEditing.value) {
      await questionService.updateQuestion(questionForm.value.id, questionForm.value)
    } else {
      await questionService.createQuestion(questionForm.value)
    }
    await fetchQuestions()
    showModal.value = false
  } catch (err) {
    alert(err.message || 'Failed to save question.')
  } finally {
    saving.value = false
  }
}
</script>
