import { createRouter, createWebHistory } from 'vue-router'

// Candidate Portal Views
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import ExamInstructions from '../views/ExamInstructions.vue'
import ExamAttempt from '../views/ExamAttempt.vue'
import Results from '../views/Results.vue'

// Admin Portal Layout & Views
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'

import AdminDashboard from '../views/admin/AdminDashboard.vue'
import ExamManagement from '../views/admin/ExamManagement.vue'
import QuestionBank from '../views/admin/QuestionBank.vue'
import LiveProctoring from '../views/admin/LiveProctoring.vue'
import EvaluationDesk from '../views/admin/EvaluationDesk.vue'
import ResultsAnalytics from '../views/admin/ResultsAnalytics.vue'

const routes = [
  // --- Candidate Routes ---
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/instructions/:id',
    name: 'ExamInstructions',
    component: ExamInstructions,
  },
  {
    path: '/exam/:id',
    name: 'ExamAttempt',
    component: ExamAttempt,
  },
  {
    path: '/results/:id',
    name: 'Results',
    component: Results,
  },

  // --- Admin Routes ---
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
  },
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: 'Overview' },
      },
      {
        path: 'exams',
        name: 'ExamManagement',
        component: ExamManagement,
        meta: { title: 'Exam Management' },
      },
      {
        path: 'questions',
        name: 'QuestionBank',
        component: QuestionBank,
        meta: { title: 'Question Bank' },
      },
      {
        path: 'proctoring',
        name: 'LiveProctoring',
        component: LiveProctoring,
        meta: { title: 'Live Video Proctoring' },
      },
      {
        path: 'evaluation',
        name: 'EvaluationDesk',
        component: EvaluationDesk,
        meta: { title: 'Evaluation Desk' },
      },
      {
        path: 'results',
        name: 'ResultsAnalytics',
        component: ResultsAnalytics,
        meta: { title: 'Results & Analytics' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const pageTitle = to.meta?.title ? `${to.meta.title} • Ottobon Examination Portal` : 'Ottobon Examination Portal'
  document.title = pageTitle
})

export default router
