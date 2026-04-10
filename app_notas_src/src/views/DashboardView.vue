<template>
  <div class="dashboard-layout" :class="{ 'sidebar-collapsed': !showSidebar }">
    <!-- SIDEBAR: Calendar -->
    <aside class="sidebar glass-panel" v-if="showSidebar">
      <div class="sidebar-header">
        <div class="user-info">
          <div class="avatar">{{ userName.charAt(0).toUpperCase() }}</div>
          <div class="user-details">
            <span class="user-name">{{ userName }}</span>
            <span class="user-email">{{ userEmail }}</span>
          </div>
        </div>
      </div>

      <div class="calendar-widget">
        <div class="widget-header">
          <h3 class="widget-title">Calendário</h3>
          <button class="btn-icon-cyber" @click="toggleCalendar">{{ showCalendar ? '−' : '+' }}</button>
        </div>

        <div v-if="!showCalendar" class="today-text">
          <span class="date-badge">[ {{ currentDayStr }} ]</span>
        </div>

        <div v-else class="calendar-grid-container">
          <div class="cal-nav">
            <button class="btn-icon-cyber" @click="changeMonth(-1)">&lt;</button>
            <span class="cal-title">{{ currentMonthName }} {{ currentYearView }}</span>
            <button class="btn-icon-cyber" @click="changeMonth(1)">&gt;</button>
          </div>

          <div class="calendar-grid">
            <div class="day-name" v-for="d in ['D','S','T','Q','Q','S','S']" :key="'dn'+d">{{ d }}</div>
            <div class="day empty" v-for="e in emptyDays" :key="'e'+e"></div>
            <div class="day" v-for="d in daysInMonth" :key="'d'+d"
              :class="{ today: isToday(d), selected: resolveDateStr(d) === selectedDate }"
              @click="selectDate(resolveDateStr(d))">
              {{ d }}
              <div class="event-dots-row" v-if="getEventsCountForDay(d) > 0">
                <span class="edot" v-for="n in Math.min(getEventsCountForDay(d), 3)" :key="n"></span>
              </div>
            </div>
          </div>

          <div class="daily-events-panel" v-if="selectedDate">
            <div class="dep-header">
              <span class="dep-title">{{ formattedSelectedDate }}</span>
              <button class="btn-cyber-sm" @click="openNewEventModal">+ Lembrete</button>
            </div>
            <div v-if="selectedDateEvents.length > 0" class="dep-list">
              <div v-for="ev in selectedDateEvents" :key="ev.id" class="ev-card" @click="editEvent(ev)">
                <span class="ev-text">{{ ev.text }}</span>
                <span class="ev-time">{{ ev.isAllDay ? 'Dia todo' : `${ev.startTime} - ${ev.endTime}` }}</span>
              </div>
            </div>
            <p v-else class="empty-state-mini">Nenhum lembrete.</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn-icon-cyber" @click="showSidebar = !showSidebar" title="Menu">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button class="btn-exit-cyber" @click="handleLogout" title="Sair">
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
          <h2 class="topbar-date">{{ formattedSelectedDate }}</h2>
        </div>
        <div class="topbar-actions">
          <button class="btn-cyber-sm" @click="showNotes = !showNotes">
            {{ showNotes ? '↗ Ocultar Notas' : '↙ Notas' }}
          </button>
          <button class="btn-cyber-sm accent" @click="addCategory">+ Coluna</button>
        </div>
      </header>

      <div class="kanban-wrapper">
        <!-- KANBAN BOARD -->
        <div class="kanban-container">
          <!-- General Column -->
          <div class="kanban-column glass-panel">
            <div class="column-header">
              <span class="col-title muted">SEM TÍTULO</span>
              <button class="btn-plus-cyber" @click="addTask('no-category')" title="Nova Tarefa">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor"><path d="M4 0h2v4h4v2H6v4H4V6H0V4h4z"/></svg>
              </button>
            </div>
            <draggable
              v-model="groupedTasks['no-category']"
              group="tasks"
              item-key="id"
              class="column-tasks"
              filter=".no-drag"
              :preventOnFilter="false"
              :animation="250"
              ghost-class="drag-ghost"
              chosen-class="drag-chosen"
              @change="(evt) => onMoveTask(evt, 'no-category')"
            >
              <template #item="{ element }">
                <div class="task-card" :class="[element.color, { completed: element.done }]">
                  <button class="btn-delete-corner no-drag" @click="deleteTask(element.id)">×</button>
                  <div class="task-card-body">
                    <label class="checkbox-container no-drag">
                      <input type="checkbox" v-model="element.done" @change="patchTask(element.id, { done: element.done })">
                      <span class="checkmark"></span>
                    </label>
                    <textarea
                      v-model="element.text"
                      class="fluid-text no-drag"
                      @input="resizeTextarea"
                      @blur="onTaskBlur(element)"
                      placeholder="Descreva a tarefa..."
                    ></textarea>
                  </div>
                  <div class="task-footer">
                    <div class="color-row">
                      <span class="cp-dot cp-acid no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-acid' })"></span>
                      <span class="cp-dot cp-plasma no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-plasma' })"></span>
                      <span class="cp-dot cp-slate no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-slate' })"></span>
                      <span class="cp-dot cp-ember no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-ember' })"></span>
                      <span class="cp-dot cp-warm no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-warm' })"></span>
                      <span class="cp-dot cp-reset no-drag" @mousedown.prevent="patchTask(element.id, { color: '' })"></span>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>

          <!-- Dynamic Columns -->
          <div v-for="col in columns" :key="col.id" class="kanban-column glass-panel" :class="col.color">
            <div class="column-header">
              <button class="btn-delete-corner no-drag" @click="deleteTask(col.id)">×</button>
              <textarea
                v-model="col.text"
                class="cat-input fluid-text no-drag"
                @input="resizeTextarea"
                @blur="patchTask(col.id, { text: col.text })"
                placeholder="Nome da Coluna"
              ></textarea>
            </div>
            <div class="col-subheader">
              <div class="color-row-inline">
                <span class="cp-dot cp-acid no-drag" @mousedown.prevent="patchTask(col.id, { color: 'bg-acid' })"></span>
                <span class="cp-dot cp-plasma no-drag" @mousedown.prevent="patchTask(col.id, { color: 'bg-plasma' })"></span>
                <span class="cp-dot cp-slate no-drag" @mousedown.prevent="patchTask(col.id, { color: 'bg-slate' })"></span>
                <span class="cp-dot cp-ember no-drag" @mousedown.prevent="patchTask(col.id, { color: 'bg-ember' })"></span>
                <span class="cp-dot cp-warm no-drag" @mousedown.prevent="patchTask(col.id, { color: 'bg-warm' })"></span>
                <span class="cp-dot cp-reset no-drag" @mousedown.prevent="patchTask(col.id, { color: '' })"></span>
              </div>
              <button class="btn-plus-cyber no-drag" @click="addTask(col.id)" title="Nova Tarefa">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor"><path d="M4 0h2v4h4v2H6v4H4V6H0V4h4z"/></svg>
              </button>
            </div>

            <draggable
              v-model="groupedTasks[col.id]"
              group="tasks"
              item-key="id"
              class="column-tasks"
              filter=".no-drag"
              :preventOnFilter="false"
              :animation="250"
              ghost-class="drag-ghost"
              chosen-class="drag-chosen"
              @change="(evt) => onMoveTask(evt, col.id)"
            >
              <template #item="{ element }">
                <div class="task-card" :class="[element.color, { completed: element.done }]">
                  <button class="btn-delete-corner no-drag" @click="deleteTask(element.id)">×</button>
                  <div class="task-card-body">
                    <label class="checkbox-container no-drag">
                      <input type="checkbox" v-model="element.done" @change="patchTask(element.id, { done: element.done })">
                      <span class="checkmark"></span>
                    </label>
                    <textarea
                      v-model="element.text"
                      class="fluid-text no-drag"
                      @input="resizeTextarea"
                      @blur="onTaskBlur(element)"
                      placeholder="Descreva a tarefa..."
                    ></textarea>
                  </div>
                  <div class="task-footer">
                    <div class="color-row">
                      <span class="cp-dot cp-acid no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-acid' })"></span>
                      <span class="cp-dot cp-plasma no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-plasma' })"></span>
                      <span class="cp-dot cp-slate no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-slate' })"></span>
                      <span class="cp-dot cp-ember no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-ember' })"></span>
                      <span class="cp-dot cp-warm no-drag" @mousedown.prevent="patchTask(element.id, { color: 'bg-warm' })"></span>
                      <span class="cp-dot cp-reset no-drag" @mousedown.prevent="patchTask(element.id, { color: '' })"></span>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div><!-- /kanban-column dynamic -->
        </div><!-- /kanban-container -->

        <!-- NOTES PANEL -->
        <aside class="notes-section glass-panel" v-if="showNotes">
          <div class="widget-header">
            <h3 class="widget-title">Notas</h3>
            <button class="btn-plus-cyber" @click="addNote" title="Nova Nota">
              <svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor"><path d="M4 0h2v4h4v2H6v4H4V6H0V4h4z"/></svg>
            </button>
          </div>
          <draggable
            v-model="notes"
            group="notes"
            item-key="id"
            class="notes-list"
            :animation="200"
            @end="onNoteDragEnd"
          >
            <template #item="{ element }">
              <div class="note-card" :class="[element.color, { pinned: element.pinned }]">
                <div class="note-top-bar">
                  <button class="btn-pin no-drag" :class="{ active: element.pinned }" @click="patchNote(element.id, { pinned: !element.pinned })" title="Fixar">
                    <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                  </button>
                  <button class="btn-delete-corner no-drag" style="position:relative;top:0;right:0;opacity:1" @click="deleteNote(element.id)">×</button>
                </div>
                <textarea
                  v-model="element.text"
                  class="fluid-text no-drag"
                  @input="resizeTextarea"
                  @blur="patchNote(element.id, { text: element.text })"
                  placeholder="Escreva algo..."
                ></textarea>
                <div class="color-row" style="margin-top:0.5rem">
                  <span class="cp-dot cp-acid no-drag" @mousedown.prevent="patchNote(element.id, { color: 'bg-acid' })"></span>
                  <span class="cp-dot cp-plasma no-drag" @mousedown.prevent="patchNote(element.id, { color: 'bg-plasma' })"></span>
                  <span class="cp-dot cp-slate no-drag" @mousedown.prevent="patchNote(element.id, { color: 'bg-slate' })"></span>
                  <span class="cp-dot cp-ember no-drag" @mousedown.prevent="patchNote(element.id, { color: 'bg-ember' })"></span>
                  <span class="cp-dot cp-warm no-drag" @mousedown.prevent="patchNote(element.id, { color: 'bg-warm' })"></span>
                  <span class="cp-dot cp-reset no-drag" @mousedown.prevent="patchNote(element.id, { color: '' })"></span>
                </div>
              </div>
            </template>
          </draggable>
        </aside>
      </div>
    </main>
  </div>

  <!-- EVENT MODAL -->
  <div v-if="eventModal.show" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-box glass-panel">
      <h3 class="modal-title">{{ eventModal.eventId ? 'Editar Lembrete' : 'Novo Lembrete' }}</h3>
      <input type="text" v-model="eventModal.text" placeholder="Título do evento" class="modal-input">
      <div class="modal-row">
        <label class="checkbox-container no-drag">
          <input type="checkbox" v-model="eventModal.isAllDay">
          <span class="checkmark"></span>
        </label>
        <span class="modal-label">Dia todo</span>
      </div>
      <div class="modal-row" v-if="!eventModal.isAllDay">
        <input type="time" v-model="eventModal.startTime" class="modal-input half">
        <span class="modal-label">até</span>
        <input type="time" v-model="eventModal.endTime" class="modal-input half">
      </div>
      <div class="modal-actions">
        <button v-if="eventModal.eventId" class="btn-cyber-sm danger" @click="deleteModalEvent">Excluir</button>
        <button class="btn-cyber-sm" @click="closeModal">Cancelar</button>
        <button class="btn-cyber-sm accent" @click="saveEvent">Salvar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import draggable from 'vuedraggable'

const router = useRouter()
const userName = ref('Usuário')
const userEmail = ref('')
const userId = ref(null)

const showSidebar = ref(window.innerWidth > 900)
const showCalendar = ref(window.innerWidth > 1100)
const showNotes = ref(window.innerWidth > 900)

const tasks = ref([])
const notes = ref([])
const events = ref([])

let unsubTasks = null
let unsubNotes = null
let unsubEvents = null

/* -- CALENDAR -- */
const theDate = new Date()
const targetMonth = ref(theDate.getMonth())
const targetYear = ref(theDate.getFullYear())
const todayStr = ref(fmtDate(theDate))
const selectedDate = ref(todayStr.value)

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const ptBRMonths = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const currentMonthName = computed(() => ptBRMonths[targetMonth.value])
const currentYearView = computed(() => targetYear.value)
const currentDayStr = computed(() => selectedDate.value.split('-').reverse().join('/'))
const formattedSelectedDate = computed(() => currentDayStr.value)
const daysInMonth = computed(() => new Date(targetYear.value, targetMonth.value + 1, 0).getDate())
const emptyDays = computed(() => new Date(targetYear.value, targetMonth.value, 1).getDay())

const resolveDateStr = (day) => `${targetYear.value}-${String(targetMonth.value+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
const isToday = (day) => resolveDateStr(day) === todayStr.value
const changeMonth = (val) => {
  targetMonth.value += val
  if (targetMonth.value > 11) { targetMonth.value = 0; targetYear.value++ }
  if (targetMonth.value < 0)  { targetMonth.value = 11; targetYear.value-- }
}
const selectDate = (dStr) => { selectedDate.value = dStr }
const toggleCalendar = () => { showCalendar.value = !showCalendar.value }

/* -- KANBAN GROUPING -- */
const columns = computed(() => tasks.value.filter(t => t.isTitle).sort((a,b) => (a.order||0)-(b.order||0)))
const groupedTasks = ref({ 'no-category': [] })

const rebuildGrouped = (allTasks) => {
  const groups = { 'no-category': [] }
  columns.value.forEach(c => { groups[c.id] = [] })
  allTasks.forEach(t => {
    if (!t.isTitle) {
      const pid = t.categoryId || 'no-category'
      if (!groups[pid]) groups[pid] = []
      groups[pid].push(t)
    }
  })
  Object.keys(groups).forEach(k => groups[k].sort((a,b) => (a.order||0)-(b.order||0)))
  groupedTasks.value = groups
}

/* -- LISTENERS -- */
const setupListeners = (uid, date) => {
  if (unsubTasks)  unsubTasks()
  if (unsubNotes)  unsubNotes()
  if (unsubEvents) unsubEvents()

  const qT = query(collection(db, 'tasks'), where('userId', '==', uid), where('dateStr', '==', date))
  unsubTasks = onSnapshot(qT, (snap) => {
    tasks.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    rebuildGrouped(tasks.value)
    reflowTextareas()
  })

  const qN = query(collection(db, 'notes'), where('userId', '==', uid), where('dateStr', '==', date))
  unsubNotes = onSnapshot(qN, (snap) => {
    const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loaded.sort((a,b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (a.order||0) - (b.order||0)
    })
    notes.value = loaded
    reflowTextareas()
  })

  const qE = query(collection(db, 'events'), where('userId', '==', uid))
  unsubEvents = onSnapshot(qE, (snap) => {
    events.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

watch(selectedDate, (newDate) => {
  if (userId.value) setupListeners(userId.value, newDate)
})

/* -- PATCH HELPERS (isolated field updates) -- */
const patchTask = async (id, fields) => {
  try { await updateDoc(doc(db, 'tasks', id), fields) } catch(e) {}
}
const patchNote = async (id, fields) => {
  try { await updateDoc(doc(db, 'notes', id), fields) } catch(e) {}
}

/* -- TASK BLUR: auto-delete if empty -- */
const onTaskBlur = async (task) => {
  if (!task.text?.trim()) {
    await deleteTask(task.id)
  } else {
    await patchTask(task.id, { text: task.text })
  }
}

/* -- ADD -- */
const addTask = async (catId) => {
  if (!userId.value) return
  const ref = await addDoc(collection(db, 'tasks'), {
    userId: userId.value,
    dateStr: selectedDate.value,
    categoryId: catId,
    text: '',
    done: false,
    isTitle: false,
    color: '',
    order: groupedTasks.value[catId]?.length || 0,
    createdAt: serverTimestamp()
  })
  // Focus the new textarea after Vue renders it
  nextTick(() => {
    const areas = document.querySelectorAll('.column-tasks .fluid-text')
    if (areas.length) areas[areas.length - 1].focus()
  })
}

const addCategory = async () => {
  if (!userId.value) return
  await addDoc(collection(db, 'tasks'), {
    userId: userId.value,
    dateStr: selectedDate.value,
    text: 'Nova Coluna',
    isTitle: true,
    color: '',
    order: columns.value.length,
    createdAt: serverTimestamp()
  })
}

const addNote = async () => {
  if (!userId.value) return
  await addDoc(collection(db, 'notes'), {
    userId: userId.value,
    dateStr: selectedDate.value,
    text: '',
    color: '',
    pinned: false,
    order: notes.value.length,
    createdAt: serverTimestamp()
  })
  nextTick(() => {
    const areas = document.querySelectorAll('.notes-list .fluid-text')
    if (areas.length) areas[areas.length - 1].focus()
  })
}

const deleteTask = async (id) => { try { await deleteDoc(doc(db, 'tasks', id)) } catch(e) {} }
const deleteNote = async (id) => { try { await deleteDoc(doc(db, 'notes', id)) } catch(e) {} }

/* -- DRAG -- */
const onMoveTask = (evt, newCatId) => {
  if (evt.added || evt.moved) {
    const list = groupedTasks.value[newCatId] || []
    const batch = writeBatch(db)
    list.forEach((t, i) => {
      batch.update(doc(db, 'tasks', t.id), { order: i, categoryId: newCatId })
    })
    batch.commit()
  }
}
const onNoteDragEnd = () => {
  const batch = writeBatch(db)
  notes.value.forEach((n, i) => batch.update(doc(db, 'notes', n.id), { order: i }))
  batch.commit()
}

/* -- EVENTS -- */
const getEventsCountForDay = (day) => events.value.filter(e => e.dateStr === resolveDateStr(day)).length
const selectedDateEvents = computed(() => events.value.filter(e => e.dateStr === selectedDate.value))

/* -- TEXTAREA UTILS -- */
const resizeTextarea = (e) => {
  e.target.style.height = '1px'
  e.target.style.height = e.target.scrollHeight + 'px'
}
const reflowTextareas = () => {
  nextTick(() => {
    document.querySelectorAll('.fluid-text').forEach(t => {
      t.style.height = '1px'
      t.style.height = t.scrollHeight + 'px'
    })
  })
}

/* -- AUTH & MIGRATION -- */
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userName.value = user.displayName || user.email?.split('@')[0] || 'Usuário'
      userEmail.value = user.email || ''
      userId.value = user.uid

      // Migrate legacy items (no dateStr) to today
      try {
        const qT = query(collection(db, 'tasks'), where('userId', '==', user.uid))
        const snapT = await getDocs(qT)
        snapT.docs.forEach(async (d) => {
          if (!d.data().dateStr) await updateDoc(d.ref, { dateStr: todayStr.value, categoryId: d.data().categoryId || 'no-category' })
        })
        const qN = query(collection(db, 'notes'), where('userId', '==', user.uid))
        const snapN = await getDocs(qN)
        snapN.docs.forEach(async (d) => {
          if (!d.data().dateStr) await updateDoc(d.ref, { dateStr: todayStr.value })
        })
      } catch(e) {}

      setupListeners(user.uid, selectedDate.value)
    } else {
      router.push('/login')
    }
  })
})

onUnmounted(() => {
  if (unsubTasks)  unsubTasks()
  if (unsubNotes)  unsubNotes()
  if (unsubEvents) unsubEvents()
})

/* -- LOGOUT -- */
const handleLogout = async () => {
  if (unsubTasks)  unsubTasks()
  if (unsubNotes)  unsubNotes()
  if (unsubEvents) unsubEvents()
  unsubTasks = unsubNotes = unsubEvents = null
  tasks.value = []
  notes.value = []
  events.value = []
  await signOut(auth)
  router.push('/login')
}

/* -- EVENT MODAL -- */
const eventModal = ref({ show: false, dateStr: '', text: '', isAllDay: true, startTime: '09:00', endTime: '10:00', eventId: null })
const openNewEventModal = () => {
  eventModal.value = { show: true, dateStr: selectedDate.value, text: '', isAllDay: true, startTime: '09:00', endTime: '10:00', eventId: null }
}
const editEvent = (ev) => { eventModal.value = { ...ev, show: true, eventId: ev.id } }
const closeModal = () => { eventModal.value.show = false }
const saveEvent = async () => {
  const p = {
    userId: userId.value,
    dateStr: eventModal.value.dateStr,
    text: eventModal.value.text,
    isAllDay: eventModal.value.isAllDay,
    startTime: eventModal.value.startTime,
    endTime: eventModal.value.endTime
  }
  if (eventModal.value.eventId) await updateDoc(doc(db, 'events', eventModal.value.eventId), p)
  else await addDoc(collection(db, 'events'), p)
  closeModal()
}
const deleteModalEvent = async () => {
  await deleteDoc(doc(db, 'events', eventModal.value.eventId))
  closeModal()
}
</script>

<style scoped>
/* ── Layout ── */
.dashboard-layout {
  display: flex; height: 100vh; background: var(--bg); overflow: hidden;
}
.dashboard-layout.sidebar-collapsed .sidebar { display: none; }

/* ── Sidebar ── */
.sidebar {
  width: 280px; min-width: 280px;
  border-right: 1px solid var(--surface-border);
  display: flex; flex-direction: column;
  padding: 1.2rem; overflow-y: auto;
}
.sidebar-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.5rem; }
.avatar {
  width: 34px; height: 34px; border: 1px solid var(--primary-color);
  color: var(--primary-color); display: flex; align-items: center;
  justify-content: center; font-family: 'Share Tech Mono'; font-size: 1rem; flex-shrink: 0;
}
.user-details { display: flex; flex-direction: column; }
.user-name { font-size: 0.8rem; font-weight: 600; color: var(--text-main); }
.user-email { font-size: 0.68rem; color: var(--text-muted); }

/* ── Calendar ── */
.calendar-widget { flex: 1; }
.widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.widget-title { font-family: 'Share Tech Mono'; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: var(--accent-color); }
.cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
.cal-title { font-family: 'Share Tech Mono'; font-size: 0.68rem; color: var(--accent-color); text-transform: uppercase; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
.day-name { text-align: center; font-size: 0.6rem; color: var(--text-muted); padding: 0.2rem 0; }
.day {
  text-align: center; font-family: 'Share Tech Mono'; font-size: 0.72rem;
  padding: 0.35rem 0.1rem; cursor: pointer; position: relative; transition: all 0.15s;
}
.day:hover { color: var(--accent-color); }
.day.today { color: var(--primary-color); font-weight: bold; border-bottom: 1px solid var(--primary-color); }
.day.selected { background: rgba(42,184,212, 0.12); outline: 1px solid var(--accent-color); }
.event-dots-row { display: flex; justify-content: center; gap: 2px; margin-top: 2px; }
.edot { width: 3px; height: 3px; background: var(--accent-color); border-radius: 50%; }

.daily-events-panel { margin-top: 1rem; border-top: 1px dashed var(--surface-border); padding-top: 0.8rem; }
.dep-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
.dep-title { font-family: 'Share Tech Mono'; font-size: 0.7rem; color: var(--text-muted); }
.ev-card {
  padding: 0.4rem 0.6rem; border-left: 2px solid var(--accent-color);
  background: rgba(42,184,212, 0.04); margin-bottom: 0.4rem; cursor: pointer;
  display: flex; flex-direction: column; gap: 2px;
}
.ev-text { font-size: 0.72rem; color: var(--text-main); }
.ev-time { font-size: 0.62rem; color: var(--text-muted); font-family: 'Share Tech Mono'; }
.empty-state-mini { font-size: 0.68rem; color: var(--text-muted); text-align: center; padding: 0.5rem 0; }

/* ── Topbar ── */
.main-content { flex: 1; display: flex; flex-direction: column; padding: 1.2rem 1.5rem; overflow: hidden; }
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1rem; border-bottom: 1px solid var(--surface-border); padding-bottom: 0.8rem;
}
.topbar-left { display: flex; align-items: center; gap: 0.7rem; }
.topbar-date { font-family: 'Share Tech Mono'; font-size: 0.85rem; color: var(--text-muted); }
.topbar-actions { display: flex; align-items: center; gap: 0.6rem; }

/* ── Cyber Buttons ── */
.btn-icon-cyber {
  background: transparent; border: 1px solid var(--surface-border);
  color: var(--text-muted); cursor: pointer; padding: 0.3rem 0.55rem;
  font-size: 0.8rem; transition: all 0.2s; font-family: 'Share Tech Mono';
}
.btn-icon-cyber:hover { border-color: var(--primary-color); color: var(--primary-color); box-shadow: 0 0 8px rgba(143,186,42,0.2); }

.btn-exit-cyber {
  display: flex; align-items: center; gap: 0.4rem;
  background: transparent; border: 1px solid var(--danger-color, #c44020);
  color: var(--danger-color, #c44020); cursor: pointer;
  padding: 0.3rem 0.7rem; font-size: 0.7rem; font-family: 'Share Tech Mono';
  text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;
}
.btn-exit-cyber:hover { background: rgba(196,64,32, 0.1); box-shadow: 0 0 8px rgba(196,64,32,0.3); }

.btn-cyber-sm {
  background: transparent; border: 1px solid var(--surface-border);
  color: var(--text-muted); cursor: pointer;
  padding: 0.3rem 0.75rem; font-size: 0.72rem;
  font-family: 'Share Tech Mono'; text-transform: uppercase;
  letter-spacing: 1px; transition: all 0.2s;
}
.btn-cyber-sm:hover { border-color: var(--accent-color); color: var(--accent-color); }
.btn-cyber-sm.accent { border-color: var(--primary-color); color: var(--primary-color); }
.btn-cyber-sm.accent:hover { background: rgba(143,186,42,0.08); box-shadow: 0 0 10px rgba(143,186,42,0.2); }
.btn-cyber-sm.danger { border-color: var(--danger-color, #c44020); color: var(--danger-color, #c44020); }
.btn-cyber-sm.danger:hover { background: rgba(196,64,32,0.08); }

.btn-plus-cyber {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--primary-color); background: transparent;
  color: var(--primary-color); cursor: pointer;
  padding: 0; flex-shrink: 0;
  transition: all 0.2s;
}
.btn-plus-cyber svg { display: block; }
.btn-plus-cyber:hover { background: rgba(143,186,42, 0.12); box-shadow: 0 0 8px rgba(143,186,42,0.25); }

.btn-delete-corner {
  position: absolute; top: 2px; right: 2px;
  background: transparent; border: none; color: var(--text-muted);
  cursor: pointer; font-size: 1rem; line-height: 1;
  opacity: 0; transition: opacity 0.15s; padding: 2px 5px;
}
.task-card:hover .btn-delete-corner,
.kanban-column:hover > .column-header .btn-delete-corner,
.note-card:hover .btn-delete-corner { opacity: 1; }
.btn-delete-corner:hover { color: #ff4444; }

/* ── Kanban ── */
.kanban-wrapper { display: flex; gap: 1.5rem; flex: 1; overflow: hidden; min-height: 0; }
.kanban-container {
  flex: 1; display: flex; gap: 1rem;
  overflow-x: auto; padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}
.kanban-container::-webkit-scrollbar { height: 5px; }
.kanban-container::-webkit-scrollbar-track { background: transparent; }
.kanban-container::-webkit-scrollbar-thumb { background: var(--surface-border); }
.kanban-container::-webkit-scrollbar-thumb:hover { background: var(--primary-color); }

.kanban-column {
  min-width: 290px; max-width: 380px; flex-shrink: 0;
  display: flex; flex-direction: column;
  padding: 0.9rem; border: 1px solid var(--surface-border);
  height: 100%; overflow: hidden;
}
.column-header {
  display: flex; align-items: flex-start; gap: 0.5rem;
  margin-bottom: 1rem; position: relative;
  padding-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.col-title {
  font-family: 'Barlow Condensed'; font-weight: 700;
  text-transform: uppercase; font-size: 1rem;
}
.col-title.muted { color: var(--text-muted); }
.col-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0 0.8rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 0.8rem;
}
.col-header-actions { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end; margin-left: auto; flex-shrink: 0; }

.column-tasks {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column;
  gap: 0.6rem; padding-right: 3px;
}
.column-tasks::-webkit-scrollbar { width: 3px; }
.column-tasks::-webkit-scrollbar-thumb { background: var(--surface-border); }

/* ── Task Cards ── */
.task-card {
  position: relative; background: var(--panel);
  border: 1px solid var(--surface-border); border-left: 3px solid transparent;
  padding: 0.75rem 0.75rem 0.5rem;
  cursor: grab; transition: border-color 0.2s, background 0.2s;
  user-select: none;
}
.task-card:active { cursor: grabbing; }
.task-card-body { display: flex; gap: 0.6rem; align-items: flex-start; }
.task-footer { display: flex; justify-content: flex-end; margin-top: 0.4rem; }
.completed { opacity: 0.5; }
.completed .fluid-text { text-decoration: line-through; color: var(--text-muted); }

/* Drag animations */
.drag-ghost { opacity: 0.35; background: rgba(143,186,42,0.06); border: 1px dashed var(--primary-color) !important; }
.drag-chosen { box-shadow: 0 4px 20px rgba(0,0,0,0.4); transform: rotate(0.5deg); }

/* ── Color Pickers ── */
.color-row { display: flex; gap: 5px; align-items: center; }
.color-row-inline { display: flex; gap: 4px; align-items: center; }
.cp-dot {
  width: 11px; height: 11px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; transition: transform 0.15s;
}
.cp-dot:hover { transform: scale(1.4); }
.cp-acid   { background: var(--color-acid, #8fba2a); }
.cp-plasma { background: var(--color-plasma, #2ab8d4); }
.cp-slate  { background: var(--color-slate, #4a7fa0); }
.cp-ember  { background: var(--color-ember, #c44020); }
.cp-warm   { background: var(--color-warm, #b89050); }
.cp-reset  { background: transparent; border: 1px dashed var(--text-muted) !important; }

/* ── Color Themes ── */
.bg-acid   { border-left-color: var(--color-acid, #8fba2a) !important; background: rgba(143,186,42,0.06) !important; }
.bg-plasma { border-left-color: var(--color-plasma, #2ab8d4) !important; background: rgba(42,184,212,0.06) !important; }
.bg-slate  { border-left-color: var(--color-slate, #4a7fa0) !important; background: rgba(74,127,160,0.06) !important; }
.bg-ember  { border-left-color: var(--color-ember, #c44020) !important; background: rgba(196,64,32,0.06) !important; }
.bg-warm   { border-left-color: var(--color-warm, #b89050) !important; background: rgba(184,144,80,0.06) !important; }

/* Column color titles */
.kanban-column.bg-acid   .cat-input { color: var(--color-acid, #8fba2a); }
.kanban-column.bg-plasma .cat-input { color: var(--color-plasma, #2ab8d4); }
.kanban-column.bg-slate  .cat-input { color: var(--color-slate, #4a7fa0); }
.kanban-column.bg-ember  .cat-input { color: var(--color-ember, #c44020); }
.kanban-column.bg-warm   .cat-input { color: var(--color-warm, #b89050); }

/* ── Checkbox ── */
.checkbox-container {
  display: block; position: relative; width: 15px; height: 15px;
  cursor: pointer; margin-top: 3px; flex-shrink: 0;
}
.checkbox-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
.checkmark {
  position: absolute; top: 0; left: 0;
  height: 15px; width: 15px; background: transparent;
  border: 1px solid var(--text-muted);
}
.checkbox-container input:checked ~ .checkmark { background: var(--primary-color); border-color: var(--primary-color); }
.checkmark::after { content: ''; position: absolute; display: none; }
.checkbox-container input:checked ~ .checkmark::after {
  display: block; left: 4px; top: 1px;
  width: 4px; height: 8px;
  border: solid var(--bg); border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* ── Fluid Text ── */
.fluid-text {
  width: 100%; background: transparent; border: none;
  color: var(--text-main); font-family: inherit; resize: none;
  outline: none; overflow: hidden; font-size: 0.88rem; line-height: 1.5;
  white-space: pre-wrap; word-break: break-word;
}
.cat-input {
  font-family: 'Barlow Condensed'; font-weight: 700;
  text-transform: uppercase; font-size: 1rem; flex: 1;
  color: var(--primary-color);
}

/* ── Notes ── */
.notes-section {
  width: 320px; min-width: 320px; display: flex; flex-direction: column;
  padding: 1rem; border-left: 1px solid var(--surface-border); overflow-y: auto;
}
.notes-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem; }
.note-card {
  position: relative;
  background: var(--panel); border: 1px solid var(--surface-border); border-left: 3px solid transparent;
  padding: 0.6rem; cursor: grab;
}
.note-card:active { cursor: grabbing; }
.note-card.pinned { border-left-color: var(--accent-color) !important; }
.note-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }

.btn-pin {
  background: transparent; border: none; cursor: pointer;
  color: var(--text-muted); padding: 2px; transition: color 0.15s;
}
.btn-pin.active { color: var(--accent-color); }
.btn-pin:hover { color: var(--accent-color); }

/* ── Modal ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(8,11,15,0.85); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 999;
}
.modal-box { width: 90%; max-width: 420px; padding: 1.8rem; background: var(--panel); border: 1px solid var(--primary-color); box-shadow: 0 0 30px rgba(143,186,42,0.1); }
.modal-title { font-family: 'Barlow Condensed'; font-weight: 700; text-transform: uppercase; color: var(--primary-color); margin-bottom: 1.2rem; }
.modal-input {
  width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--surface-border);
  color: var(--text-main); font-family: inherit; font-size: 0.9rem;
  padding: 0.4rem 0; outline: none; margin-bottom: 1rem;
}
.modal-input:focus { border-bottom-color: var(--primary-color); }
.modal-input.half { width: auto; flex: 1; }
.modal-row { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; }
.modal-label { font-size: 0.8rem; color: var(--text-muted); }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1.5rem; }

.today-text { text-align: center; margin-top: 0.5rem; }
.date-badge { font-family: 'Share Tech Mono'; font-size: 0.8rem; color: var(--accent-color); }

/* ── Mobile ── */
@media (max-width: 768px) {
  .dashboard-layout { flex-direction: column; height: auto; min-height: 100vh; overflow: auto; }
  .sidebar { width: 100%; min-width: unset; border-right: none; border-bottom: 1px solid var(--surface-border); }
  .main-content { overflow: visible; }
  .kanban-wrapper { flex-direction: column; overflow: visible; }
  .kanban-container { overflow-x: auto; }
  .notes-section { width: 100%; min-width: unset; border-left: none; border-top: 1px solid var(--surface-border); }
}
</style>
