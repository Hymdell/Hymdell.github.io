<template>
  <div class="dashboard-layout">
    <aside class="sidebar glass-panel">
      <div class="sidebar-header">
        <div class="user-info">
          <div class="avatar">{{ userName.charAt(0).toUpperCase() }}</div>
          <div class="user-details">
            <span class="user-name">{{ userName }}</span>
            <span class="user-email">{{ userEmail }}</span>
          </div>
        </div>
        <button @click="handleLogout" class="btn btn-secondary logout-btn" title="Sair">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      <div class="calendar-widget">
        <div class="widget-header" style="margin-bottom:1rem;">
          <h3 class="widget-title" style="margin:0;">Resumo do Mês</h3>
          <button class="icon-btn small" @click="showCalendar = !showCalendar" title="Ocultar/Mostrar Calendário">
             {{ showCalendar ? '−' : '+' }}
          </button>
        </div>

        <div v-if="!showCalendar" class="today-text" style="font-family:'Share Tech Mono'; color:var(--text-muted); font-size: 0.85rem;">
           <span style="color:var(--primary-color)">[ {{ currentDayStr }} ]</span>
        </div>

        <div v-else class="calendar-grid-container">
           <div class="cal-nav">
             <button class="icon-btn small" @click="changeMonth(-1)">&lt;</button>
             <span class="cal-title">{{ currentMonthName }} {{ currentYearView }}</span>
             <button class="icon-btn small" @click="changeMonth(1)">&gt;</button>
           </div>
           
           <div class="calendar-grid">
             <div class="day-name" v-for="d in ['D','S','T','Q','Q','S','S']" :key="'name'+d">{{d}}</div>
             
             <!-- Padding for first day of month -->
             <div class="day empty" v-for="e in emptyDays" :key="'e'+e"></div>
             
             <!-- Actual days -->
             <div class="day" v-for="d in daysInMonth" :key="'d'+d" 
                  :class="{ active: isToday(d), selected: resolveDateStr(d) === selectedDate }"
                  @click="selectDateAndListEvents(resolveDateStr(d))">
                {{ d }}
                <!-- Event dots indicator -->
                <div class="event-dots-container" v-if="getEventsCountForDay(d) > 0">
                  <span class="edot" v-for="n in Math.min(getEventsCountForDay(d), 3)" :key="n"></span>
                  <span class="edot plus" v-if="getEventsCountForDay(d) > 3">+</span>
                </div>
             </div>
           </div>

           <!-- Daily Events List -->
           <div class="daily-events-panel" v-if="selectedDate">
             <div class="dep-header">
               <span class="dep-title">Dia {{ formattedSelectedDate }}</span>
               <button class="icon-btn small" @click="openNewEventModal" title="Adicionar Lembrete">+</button>
             </div>
             
             <div v-if="selectedDateEvents.length > 0" class="dep-list">
               <div v-for="ev in selectedDateEvents" :key="ev.id" class="ev-card" @click="editEvent(ev)">
                 <div class="ev-text">{{ ev.text }}</div>
                 <div class="ev-time">
                   <span v-if="ev.isAllDay">00:00 - 23:59</span>
                   <span v-else>{{ ev.startTime || '--' }} às {{ ev.endTime || '--' }}</span>
                 </div>
               </div>
             </div>
             <p v-else class="empty-state mt-2" style="font-size:0.6rem; padding: 0.5rem 0;">Sem avisos averbados p/ este dia.</p>
           </div>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <h2>Dashboard</h2>
      </header>

      <div class="content-grid">
        <!-- To-Do List -->
        <section class="glass-panel widget">
          <div class="widget-header">
            <h3>Gerenciador de Tarefas</h3>
          </div>
          <div class="task-input-container">
            <input type="text" v-model="newTaskText" @keyup.enter="addTask" placeholder="Adicionar nova tarefa ou seção..." class="input-field minimal-input">
            <button class="btn btn-secondary btn-small" title="Adicionar como Categoria" @click="addCategory">T</button>
            <button class="btn btn-primary btn-small" title="Adicionar como Tarefa" @click="addTask">+</button>
          </div>
          
          <!-- NO 'handle' specified meaning ANY part is draggable -->
          <draggable v-model="tasks" group="tasks" @end="onTaskDragEnd" item-key="id" class="task-list" filter=".no-drag" :preventOnFilter="false">
             <template #item="{ element }">
                <div class="task-item" :class="[element.color, { 'is-title': element.isTitle, completed: element.done }]">
                   <!-- Delete Button (Top Right) -->
                   <button class="icon-btn tiny delete-absolute hover-show" @click="deleteTask(element.id)">×</button>

                   <!-- If it is a Title (Category) -->
                   <template v-if="element.isTitle">
                      <div style="flex:1;">
                        <input v-model="element.text" class="transparent-input cat-input no-drag" @blur="updateTask(element)"/>
                      </div>
                      <!-- Add colors to title too -->
                      <div class="color-picker hover-show">
                         <span class="cp-dot cp-acid" @click="setTaskColor(element, 'bg-acid')"></span>
                         <span class="cp-dot cp-plasma" @click="setTaskColor(element, 'bg-plasma')"></span>
                         <span class="cp-dot cp-slate" @click="setTaskColor(element, 'bg-slate')"></span>
                         <span class="cp-dot cp-ember" @click="setTaskColor(element, 'bg-ember')"></span>
                         <span class="cp-dot cp-warm" @click="setTaskColor(element, 'bg-warm')"></span>
                         <span class="cp-dot cp-reset" @click="setTaskColor(element, '')"></span>
                      </div>
                   </template>

                   <!-- If it is a normal Task -->
                   <template v-else>
                      <label class="checkbox-container no-drag">
                        <input type="checkbox" v-model="element.done" @change="updateTask(element)">
                        <span class="checkmark"></span>
                      </label>
                      <div style="flex:1;">
                         <input v-model="element.text" class="transparent-input task-input no-drag" @blur="updateTask(element)"/>
                      </div>
                      
                      <!-- Color Picker Hover -->
                      <div class="color-picker hover-show">
                         <span class="cp-dot cp-acid" @click="setTaskColor(element, 'bg-acid')"></span>
                         <span class="cp-dot cp-plasma" @click="setTaskColor(element, 'bg-plasma')"></span>
                         <span class="cp-dot cp-slate" @click="setTaskColor(element, 'bg-slate')"></span>
                         <span class="cp-dot cp-ember" @click="setTaskColor(element, 'bg-ember')"></span>
                         <span class="cp-dot cp-warm" @click="setTaskColor(element, 'bg-warm')"></span>
                         <span class="cp-dot cp-reset" @click="setTaskColor(element, '')"></span>
                      </div>
                   </template>
                </div>
             </template>
          </draggable>
          <div v-if="tasks.length === 0" class="empty-state">Nenhuma anotação aqui.</div>
        </section>

        <!-- Notes -->
        <section class="glass-panel widget notes-widget">
          <div class="widget-header">
            <h3>Bloco de Notas Rápido</h3>
            <button class="icon-btn" @click="addNote">+</button>
          </div>
          
          <draggable v-model="notes" group="notes" @end="onNoteDragEnd" item-key="id" class="notes-grid" filter=".no-drag" :preventOnFilter="false">
             <template #item="{ element }">
                <div class="note-card" :class="[element.color, { pinned: element.pinned }]">
                  <button class="icon-btn tiny pin-btn" title="Fixar Nota" @click="togglePinNote(element)" :class="{ active: element.pinned }">
                     <!-- SVG Pin symbol -->
                     <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 17v5"></path>
                        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a2 2 0 0 1 2-2 2 2 0 0 1 2-2H5a2 2 0 0 1 2 2 2 2 0 0 1 2 2v3.76z"></path>
                     </svg>
                  </button>
                  <button class="icon-btn tiny delete-absolute hover-show" @click="deleteNote(element.id)">×</button>
                  
                  <div class="note-controls">
                    <div class="color-picker-right hover-show" style="margin-left:auto;">
                       <span class="cp-dot cp-acid" @click="setNoteColor(element, 'bg-acid')"></span>
                       <span class="cp-dot cp-plasma" @click="setNoteColor(element, 'bg-plasma')"></span>
                       <span class="cp-dot cp-slate" @click="setNoteColor(element, 'bg-slate')"></span>
                       <span class="cp-dot cp-ember" @click="setNoteColor(element, 'bg-ember')"></span>
                       <span class="cp-dot cp-warm" @click="setNoteColor(element, 'bg-warm')"></span>
                       <span class="cp-dot cp-reset" @click="setNoteColor(element, '')"></span>
                    </div>
                  </div>
                  
                  <textarea class="no-drag fluid-text" v-model="element.text" @input="resizeTextarea" @blur="updateNote(element)" placeholder="Escreva algo..."></textarea>
                </div>
             </template>
          </draggable>
        </section>
      </div>
    </main>
  </div>

  <!-- EVENT MODAL -->
  <div v-if="eventModal.show" class="modal-backdrop">
    <div class="modal-box glass-panel">
      <h3 style="margin-bottom: 1rem; color: var(--primary-color);">
        {{ eventModal.eventId ? 'Editar Lembrete' : 'Novo Lembrete' }}
      </h3>
      <p style="font-family:'Share Tech Mono'; font-size: 0.75rem; margin-bottom: 1rem;">
        Data Alvo: {{ eventModal.dateStr.split('-').reverse().join('/') }}
      </p>
      
      <div class="input-group" style="margin-bottom: 1rem;">
        <input type="text" v-model="eventModal.text" placeholder="Nome do Evento (Ex: Reunião)" class="input-field minimal-input">
      </div>
      
      <div class="input-group" style="margin-bottom: 1rem; display:flex; align-items:center; gap: 0.5rem;">
        <label class="checkbox-container no-drag">
          <input type="checkbox" v-model="eventModal.isAllDay">
          <span class="checkmark"></span>
        </label>
        <span style="font-size:0.8rem; color:var(--text-main);">Dia todo (00:00 - 23:59)</span>
      </div>

      <div class="input-group" v-if="!eventModal.isAllDay" style="display:flex; gap: 1rem; margin-bottom: 1rem;">
        <div style="flex:1;">
          <label style="font-size:0.65rem; color:var(--text-muted);">Início</label>
          <input type="time" v-model="eventModal.startTime" class="input-field minimal-input">
        </div>
        <div style="flex:1;">
          <label style="font-size:0.65rem; color:var(--text-muted);">Fim</label>
          <input type="time" v-model="eventModal.endTime" class="input-field minimal-input">
        </div>
      </div>

      <div class="modal-actions" style="display:flex; gap:0.5rem; justify-content: flex-end; margin-top:1.5rem;">
        <button v-if="eventModal.eventId" class="btn btn-secondary" style="border-color:var(--danger-color); color:var(--danger-color); margin-right:auto;" @click="deleteModalEvent">Excluir</button>
        <button class="btn btn-secondary" @click="closeModal">Cancelar</button>
        <button class="btn btn-primary" @click="saveEvent">Salvar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import draggable from 'vuedraggable'

/* -- CORE -- */
const router = useRouter()
const userName = ref('Usuário')
const userEmail = ref('carregando...')
const userId = ref(null)

const newTaskText = ref('')
const tasks = ref([])
const notes = ref([])
const events = ref([]) // Schema: { userId, dateStr, text, isAllDay, startTime, endTime }

let unsubscribeTasks = null
let unsubscribeNotes = null
let unsubscribeEvents = null

/* -- EVENT MODAL STATE -- */
const eventModal = ref({
  show: false,
  dateStr: '',
  text: '',
  isAllDay: true,
  startTime: '09:00',
  endTime: '10:00',
  eventId: null
})

/* -- CALENDAR LOGIC -- */
const showCalendar = ref(window.innerWidth > 768) // Closed on mobile by default
const theDate = new Date()
const targetMonth = ref(theDate.getMonth())
const targetYear = ref(theDate.getFullYear())
const todayStr = ref(`${theDate.getFullYear()}-${String(theDate.getMonth()+1).padStart(2,'0')}-${String(theDate.getDate()).padStart(2,'0')}`)

const selectedDate = ref(todayStr.value) // defaults selected day to today

const ptBRMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const currentMonthName = computed(() => ptBRMonths[targetMonth.value])
const currentYearView = computed(() => targetYear.value)
const currentDayStr = computed(() => {
  return `${String(theDate.getDate()).padStart(2,'0')}/${String(theDate.getMonth()+1).padStart(2,'0')}/${theDate.getFullYear()}`
})

const daysInMonth = computed(() => {
  return new Date(targetYear.value, targetMonth.value + 1, 0).getDate()
})
const emptyDays = computed(() => {
  return new Date(targetYear.value, targetMonth.value, 1).getDay()
})

const resolveDateStr = (day) => `${targetYear.value}-${String(targetMonth.value+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`

const isToday = (day) => {
  return resolveDateStr(day) === todayStr.value
}

const changeMonth = (val) => {
  targetMonth.value += val
  if (targetMonth.value > 11) { targetMonth.value = 0; targetYear.value++ }
  if (targetMonth.value < 0) { targetMonth.value = 11; targetYear.value-- }
}

const selectDateAndListEvents = (dStr) => {
  selectedDate.value = dStr
}

// Support functions for calendar event indicators
const getEventsCountForDay = (day) => {
  const ds = resolveDateStr(day)
  return events.value.filter(e => e.dateStr === ds).length
}

const selectedDateEvents = computed(() => {
  if (!selectedDate.value) return []
  return events.value.filter(e => e.dateStr === selectedDate.value)
})
const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  return selectedDate.value.split('-').reverse().join('/')
})

/* -- MODAL LOGIC -- */
const openNewEventModal = () => {
  if (!selectedDate.value) return
  eventModal.value = {
    show: true,
    dateStr: selectedDate.value,
    text: '',
    isAllDay: true,
    startTime: '09:00',
    endTime: '10:00',
    eventId: null
  }
}

const editEvent = (ev) => {
  eventModal.value = {
    show: true,
    dateStr: ev.dateStr,
    text: ev.text || '',
    isAllDay: ev.isAllDay !== false,
    startTime: ev.startTime || '09:00',
    endTime: ev.endTime || '10:00',
    eventId: ev.id
  }
}

const closeModal = () => {
  eventModal.value.show = false
}

const saveEvent = async () => {
  if (!userId.value || eventModal.value.text.trim() === '') return
  
  const payload = {
    userId: userId.value,
    dateStr: eventModal.value.dateStr,
    text: eventModal.value.text,
    isAllDay: eventModal.value.isAllDay,
    startTime: eventModal.value.isAllDay ? '-' : eventModal.value.startTime,
    endTime: eventModal.value.isAllDay ? '-' : eventModal.value.endTime
  }

  if (eventModal.value.eventId) {
    await updateDoc(doc(db, 'events', eventModal.value.eventId), payload)
  } else {
    await addDoc(collection(db, 'events'), payload)
  }
  closeModal()
}

const deleteModalEvent = async () => {
  if (!eventModal.value.eventId) return
  await deleteDoc(doc(db, 'events', eventModal.value.eventId))
  closeModal()
}

/* -- TEXTAREA AUTO RESIZE -- */
const resizeTextarea = (e) => {
  e.target.style.height = '1px' // shrink to detect actual scroll height smoothly
  e.target.style.height = e.target.scrollHeight + 'px'
}
// Trigger initial resizes
const reflowTextareas = () => {
  nextTick(() => {
    document.querySelectorAll('.fluid-text').forEach(t => {
      t.style.height = '1px'
      t.style.height = t.scrollHeight + 'px'
    })
  })
}

/* -- INIT FETCH -- */
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userName.value = user.displayName || 'Usuário'
      userEmail.value = user.email || ''
      userId.value = user.uid
      loadData(user.uid)
    } else {
      router.push('/login')
    }
  })
})

onUnmounted(() => {
  if (unsubscribeTasks) unsubscribeTasks()
  if (unsubscribeNotes) unsubscribeNotes()
  if (unsubscribeEvents) unsubscribeEvents()
})

const loadData = (uid) => {
  const qTasks = query(collection(db, 'tasks'), where('userId', '==', uid))
  unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
    let loadedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    loadedTasks.sort((a, b) => (a.order || 0) - (b.order || 0))
    tasks.value = loadedTasks
  })

  const qNotes = query(collection(db, 'notes'), where('userId', '==', uid))
  unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
    let loadedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    loadedNotes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (a.order || 0) - (b.order || 0)
    })
    notes.value = loadedNotes
    reflowTextareas()
  })
  
  const qEvents = query(collection(db, 'events'), where('userId', '==', uid))
  unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
    events.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  })
}

/* -- TASKS API -- */
const addCategory = async () => {
    if (!newTaskText.value.trim() || !userId.value) return
    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTaskText.value,
        isTitle: true,
        userId: userId.value,
        order: tasks.value.length,
        createdAt: serverTimestamp()
      })
      newTaskText.value = ''
    } catch(e) {}
}

const addTask = async () => {
  if (!newTaskText.value.trim() || !userId.value) return
  try {
    await addDoc(collection(db, 'tasks'), {
      text: newTaskText.value,
      done: false,
      isTitle: false,
      color: '',
      order: tasks.value.length,
      userId: userId.value,
      createdAt: serverTimestamp()
    })
    newTaskText.value = ''
  } catch (error) {
    if (error.code === 'permission-denied') {
      alert("Acesso negado nas regras do Firestore.")
    }
  }
}

const updateTask = async (task) => {
  const taskRef = doc(db, 'tasks', task.id)
  await updateDoc(taskRef, { done: task.done, text: task.text, color: task.color || '' })
}

const deleteTask = async (id) => {
  await deleteDoc(doc(db, 'tasks', id))
}

const setTaskColor = (task, cssClass) => {
  task.color = cssClass
  updateTask(task)
}

const onTaskDragEnd = async () => {
  const batch = writeBatch(db)
  tasks.value.forEach((t, i) => {
    t.order = i
    batch.update(doc(db, 'tasks', t.id), { order: i })
  })
  await batch.commit()
}

/* -- NOTES API -- */
const addNote = async () => {
  if (!userId.value) return
  await addDoc(collection(db, 'notes'), {
    text: '',
    color: '',
    pinned: false,
    order: notes.value.length,
    userId: userId.value,
    createdAt: serverTimestamp()
  })
}

const updateNote = async (note) => {
  const noteRef = doc(db, 'notes', note.id)
  await updateDoc(noteRef, { text: note.text, color: note.color || '', pinned: note.pinned || false })
}

const deleteNote = async (id) => {
  await deleteDoc(doc(db, 'notes', id))
}

const togglePinNote = (note) => {
  note.pinned = !note.pinned
  updateNote(note)
}

const setNoteColor = (note, cssClass) => {
  note.color = cssClass
  updateNote(note)
}

const onNoteDragEnd = async () => {
  const batch = writeBatch(db)
  notes.value.forEach((n, i) => {
    n.order = i
    batch.update(doc(db, 'notes', n.id), { order: i })
  })
  await batch.commit()
}

const handleLogout = async () => {
  await signOut(auth)
  router.push('/login')
}
</script>

<style scoped>
.dashboard-layout {
  display: flex; height: 100vh; overflow: hidden;
}

@media (max-width: 768px) {
  .dashboard-layout { flex-direction: column; overflow: auto; }
}

/* Sidebar */
.sidebar {
  width: 320px; border-radius: 0; border: none; border-right: 1px solid var(--surface-border);
  display: flex; flex-direction: column; padding: 1.5rem; flex-shrink: 0; overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--surface-border); }
}

.sidebar-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;
}

.user-info { display: flex; align-items: center; gap: 1rem; }
.avatar {
  width: 40px; height: 40px; border-radius: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Share Tech Mono', monospace; font-size: 1.2rem; font-weight: bold;
  background: rgba(143,186,42,0.1); border: 1px solid var(--primary-color);
  color: var(--primary-color);
}
.user-details { display: flex; flex-direction: column; }
.user-name { font-family: 'Share Tech Mono', monospace; font-size: 0.95rem; color: var(--text-main); }
.user-email { font-size: 0.8rem; color: var(--text-muted); font-family: 'Share Tech Mono', monospace; }

.logout-btn { padding: 0.5rem; display: flex; cursor: pointer; }

/* Calendar */
.cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.cal-title { font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; text-transform: uppercase; color: var(--accent-color); }
.icon-btn {
  background: transparent; border: 1px solid var(--surface-border);
  color: var(--text-muted); width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 0;
}
.icon-btn.small { width: 22px; height: 22px; font-size: 10px; }
.icon-btn:hover { background: rgba(42,184,212,0.1); border-color: var(--accent-color); color: var(--accent-color); }

.calendar-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem; text-align: center; margin-bottom: 1rem;
}
.day-name { font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; color: var(--text-muted); }
.day {
  padding: 0.35rem 0; font-size: 0.8rem; color: var(--text-main); border: 1px solid transparent; 
  cursor: pointer; position: relative; font-family: 'Share Tech Mono', monospace;
  transition: all var(--transition-fast);
}
.day:hover { background: rgba(143,186,42,0.05); border-color: var(--primary-color); }
.day.active { background: rgba(143,186,42,0.2); font-weight: bold; border-bottom: 1px solid var(--primary-color); }
.day.selected { border-color: var(--accent-color); background: rgba(42,184,212, 0.1); }

.event-dots-container {
  display:flex; justify-content:center; gap: 2px; position:absolute; bottom: 2px; width:100%;
}
.edot { width: 4px; height: 4px; background: var(--accent-color); border-radius: 50%; }
.edot.plus { font-size: 7px; color: var(--accent-color); background: transparent; line-height: 4px; font-weight:bold; }

/* Daily Events Panel */
.daily-events-panel {
  border-top: 1px dashed var(--surface-border); padding-top: 1rem;
}
.dep-header { display:flex; justify-content: space-between; align-items:center; margin-bottom: 0.8rem; }
.dep-title { font-family: 'Share Tech Mono', monospace; font-size: 0.65rem; color: var(--primary-color); text-transform: uppercase;}
.dep-list { display: flex; flex-direction: column; gap: 0.5rem; }
.ev-card {
  padding: 0.5rem; background: rgba(42,184,212, 0.05); border-left: 2px solid var(--accent-color);
  font-size: 0.75rem; cursor: pointer; transition: background 0.2s;
}
.ev-card:hover { background: rgba(42,184,212, 0.15); }
.ev-text { color: var(--text-main); margin-bottom: 0.2rem; }
.ev-time { color: var(--text-muted); font-size: 0.65rem; font-family: 'Share Tech Mono', monospace; }

/* Main Content */
.main-content {
  flex: 1; padding: 2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 2rem;
}

.topbar { display: flex; justify-content: space-between; align-items: center; }

.content-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;
}

@media (max-width: 1024px) {
  .content-grid { grid-template-columns: 1fr; }
}

.widget { padding: 1.5rem; display: flex; flex-direction: column; }
.widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

.task-input-container { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.minimal-input {
  box-sizing: border-box; flex: 1; padding: 0.5rem 1rem; border: 1px solid var(--surface-border);
  background: var(--bg); color: var(--text-main); border-radius: 0; outline:none;
}
.minimal-input:focus { border-color: var(--primary-color); }

/* Draggable Overrides */
.task-list { display: flex; flex-direction: column; gap: 0.5rem; }
.task-item {
  display: flex; flex-direction: row; align-items: center; padding: 0.6rem;
  background: var(--panel); border: 1px solid var(--surface-border);
  border-left: 2px solid transparent; transition: all 0.2s; position: relative;
  cursor: grab;
}
.task-item:active { cursor: grabbing; }
.task-item.is-title { border-left-color: var(--primary-color); background: #0b0e14; padding: 0.8rem 0.6rem; }

.task-item .hover-show { opacity: 0; transition: opacity 0.2s; }
.task-item:hover .hover-show { opacity: 1; }

.delete-absolute { 
  position: absolute; top: 0px; right: 0px; 
  border: none; background: transparent; 
  color: var(--text-muted); z-index: 5; 
  font-size: 1.2rem; cursor: pointer; padding: 4px 8px;
}
.delete-absolute:hover { color: var(--danger-color); background: rgba(196,64,32, 0.1); }

.transparent-input {
  background: transparent; border: none; color: var(--text-main); font-family: 'Barlow', sans-serif;
  font-size: 0.95rem; width: 100%; outline: none;
}
.cat-input { font-family: 'Barlow Condensed'; text-transform: uppercase; font-size: 1.1rem; font-weight: 700; color: var(--primary-color); }
.completed .task-input { text-decoration: line-through; color: var(--text-muted); }

/* Color coding UI classes binding for containers */
.task-item.bg-acid, .note-card.bg-acid { border-left-color: var(--color-acid); background-color: rgba(143,186,42,0.08); }
.task-item.bg-plasma, .note-card.bg-plasma { border-left-color: var(--color-plasma); background-color: rgba(42,184,212,0.08); }
.task-item.bg-slate, .note-card.bg-slate { border-left-color: var(--color-slate); background-color: rgba(74,127,160,0.08); }
.task-item.bg-ember, .note-card.bg-ember { border-left-color: var(--color-ember); background-color: rgba(196,64,32,0.08); }
.task-item.bg-warm, .note-card.bg-warm { border-left-color: var(--color-warm); background-color: rgba(184,144,80,0.08); }

/* Apply color to Titles if assigned */
.task-item.is-title.bg-acid .cat-input { color: var(--color-acid); }
.task-item.is-title.bg-plasma .cat-input { color: var(--color-plasma); }
.task-item.is-title.bg-slate .cat-input { color: var(--color-slate); }
.task-item.is-title.bg-ember .cat-input { color: var(--color-ember); }
.task-item.is-title.bg-warm .cat-input { color: var(--color-warm); }

/* Color Pickers */
.color-picker { display: flex; gap: 0.35rem; margin-right: 1.5rem; justify-content: flex-end;}
.color-picker-right { display: flex; gap: 0.35rem; }
.cp-dot { width: 12px; height: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); border-radius: 0; }
.cp-acid { background: var(--color-acid); }
.cp-plasma { background: var(--color-plasma); }
.cp-slate { background: var(--color-slate); }
.cp-ember { background: var(--color-ember); }
.cp-warm { background: var(--color-warm); }
.cp-reset { background: transparent; border: 1px dashed var(--text-muted);}

/* Custom Checkbox */
.checkbox-container { display: block; position: relative; width: 16px; height: 16px; cursor: pointer; margin-right: 0.8rem; }
.checkbox-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
.checkmark { position: absolute; top: 0; left: 0; height: 16px; width: 16px; background-color: var(--bg); border: 1px solid var(--text-muted); }
.checkbox-container input:checked ~ .checkmark { background-color: var(--primary-color); border-color: var(--primary-color); }
.checkmark:after { content: ""; position: absolute; display: none; }
.checkbox-container input:checked ~ .checkmark:after { display: block; left: 5px; top: 1px; width: 4px; height: 8px; border: solid var(--bg); border-width: 0 2px 2px 0; transform: rotate(45deg); }

/* Notes */
.notes-grid { display: flex; flex-direction: column; gap: 1rem; }
.note-card {
  position: relative; background: var(--panel); border: 1px solid var(--surface-border); border-left: 2px solid var(--surface-border);
  padding: 1rem; padding-top: 1.5rem; transition: all 0.2s; cursor: grab; display:flex; flex-direction:column; gap:0.5rem;
}
.note-card:active { cursor: grabbing; }
.note-card.pinned { border-left-color: var(--accent-color); }
.pin-btn { position: absolute; top: 0; left: 0; background:transparent; border:none; z-index:3;}
.pin-btn.active { color: var(--primary-color); }

.note-card .hover-show { opacity: 0; transition: opacity 0.2s; }
.note-card:hover .hover-show { opacity: 1; }

.fluid-text { width: 100%; min-height: 40px; height: auto; background: transparent; border: none; color: var(--text-main); font-family: inherit; font-size: 0.9rem; resize: none; outline: none; overflow: hidden; }

/* Modal */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(8, 11, 15, 0.8); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 999;
}
.modal-box {
  width: 90%; max-width: 400px; padding: 2rem;
  background: var(--panel); border: 1px solid var(--primary-color);
  box-shadow: 0 0 20px rgba(143,186,42,0.1);
}
</style>
