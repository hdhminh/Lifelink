<template>
  <div id="app" class="ll-app-shell">
    <AppLoader />
    <div class="ll-ambient-blob ll-ambient-blob-1" aria-hidden="true"></div>
    <div class="ll-ambient-blob ll-ambient-blob-2" aria-hidden="true"></div>
    <AppNavbar />

    <main class="ll-main" role="main">
      <RouterView v-slot="{ Component, route }">
        <transition name="page-fade" mode="out-in">
          <keep-alive>
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </transition>
      </RouterView>
    </main>
    <AppFooter />

    <!-- Global Toast Notifications Stack -->
    <div class="ll-toast-container" aria-live="polite">
      <transition-group name="toast">
        <div
          v-for="(toast, idx) in toasts"
          :key="toast.id"
          :class="['ll-alert', `ll-alert--${toast.type}`]"
          role="alert"
          :style="{ transitionDelay: idx > 0 ? `${idx * 0.05}s` : '0s' }"
        >
          <span class="d-flex align-items-center gap-2">
            <i :class="getAlertIcon(toast.type)" aria-hidden="true"></i>
            <span>{{ toast.message }}</span>
          </span>
          <button
            class="ll-alert__close"
            type="button"
            aria-label="Close notification"
            @click="removeToast(toast.id)"
          >
            x
          </button>
        </div>
      </transition-group>
    </div>

    <!-- Floating Support Chat Bubble & Window -->
    <div class="ll-support-chat-wrapper" v-if="!isAdmin">
      <!-- Chat Window -->
      <transition name="chat-slide">
        <div class="ll-chat-window" v-if="isChatOpen">
          <div class="ll-chat-window-header d-flex justify-content-between align-items-center">
            <span class="fw-bold"><i class="bi bi-headset me-2"></i>LifeLink Support</span>
            <button 
              type="button" 
              class="btn-close btn-close-white" 
              style="font-size: 0.8rem; box-shadow: none;" 
              @click="isChatOpen = false"
              aria-label="Close chat"
            ></button>
          </div>

          <div class="ll-chat-window-body d-flex flex-column">
            <!-- Guest info banner -->
            <div v-if="!user" class="alert alert-info py-1 px-2 mb-2 text-center" style="font-size: 0.7rem; border-radius: 4px; flex-shrink: 0;">
              Guest Session active. <RouterLink to="/login" class="text-danger fw-bold" @click="isChatOpen = false">Log in</RouterLink> to save profile.
            </div>

            <!-- Messages list -->
            <div class="ll-chat-messages-container flex-grow-1" ref="chatScrollContainer" style="overflow-y: auto;">
              <div v-if="displayMessages.length === 0" class="text-center py-4 text-slate-400 small">
                Hi! I'm the Support Bot. You can ask about cancelling confirmations, event registrations, or donation requirements.
              </div>
              <div 
                v-for="msg in displayMessages" 
                :key="msg.id" 
                class="ll-chat-msg" 
                :class="msg.senderId === currentUserId ? 'll-chat-msg--sent' : 'll-chat-msg--received'"
              >
                <div class="ll-chat-msg-bubble">
                  <div style="font-size: 0.7rem; opacity: 0.8; font-weight: bold; margin-bottom: 2px;">{{ msg.senderName }}</div>
                  {{ msg.text }}
                </div>
              </div>
            </div>

            <!-- Predefined FAQ Buttons -->
            <div class="border-top pt-2 mt-2" style="flex-shrink: 0;">
              <div class="small text-slate-500 mb-1 fw-bold"><i class="bi bi-question-circle"></i> Quick Questions:</div>
              <div class="faq-questions-container d-flex flex-column gap-1 overflow-y-auto" style="max-height: 82px; scrollbar-width: thin;">
                <button 
                  v-for="q in faqQuestions" 
                  :key="q.id" 
                  type="button" 
                  class="btn btn-sm btn-light text-start py-2 px-3 border border-slate-100 text-slate-700 d-flex justify-content-between align-items-center" 
                  style="font-size: 0.76rem; border-radius: 8px; font-weight: 500;" 
                  @click="sendFaqMessage(q)"
                >
                  <span><i class="bi bi-question-circle text-danger me-2"></i>{{ q.question }}</span>
                  <i class="bi bi-chevron-right text-slate-400 small"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Chat Input Footer (Visible to both guest & user) -->
          <div class="ll-chat-window-footer border-top p-2" style="flex-shrink: 0;">
            <form @submit.prevent="sendChatMessage" class="d-flex gap-2 align-items-stretch">
              <input 
                id="global-chat-input"
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Type your message..." 
                v-model="chatInputText"
                aria-label="Type your message"
                autocomplete="off"
                style="height: 36px;"
              />
              <button type="submit" class="btn btn-sm btn-danger px-3 d-flex align-items-center justify-content-center" style="height: 36px;"><i class="bi bi-send-fill"></i></button>
            </form>
          </div>
        </div>
      </transition>

      <button 
        class="ll-chat-trigger" 
        type="button" 
        :title="isChatOpen ? 'Close Live Chat Support' : 'Open Live Chat Support'"
        :aria-label="isChatOpen ? 'Close live chat support' : 'Open live chat support'"
        @click="toggleChat"
      >
        <i :class="isChatOpen ? 'bi bi-x-lg' : 'bi bi-chat-dots-fill'"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * App.vue
 * Root component. Renders global navbar, router view, and global footer.
 */
import { ref, watch, onUnmounted, nextTick, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { useSupportChat } from '@/composables/useSupportChat.js'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useToast } from '@/composables/useToast.js'

import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import { useEligibility } from '@/composables/useEligibility.js'

const { toasts, removeToast, showToast } = useToast()
const { user, userProfile, isAdmin } = useAuth()
const { requestLocation } = useGeolocation()
const { getGuestSession } = useGuestSession()
const {
  sendParticipantMessage,
  sendSystemMessage,
  listenToThreadMessages,
  markParticipantThreadRead
} = useSupportChat()

const isChatOpen = ref(false)
const chatInputText = ref('')
const messages = ref([])
const chatScrollContainer = ref(null)
let chatUnsubscribe = null

const faqQuestions = [
  { id: 1, question: 'Accidental confirmation?', answer: 'If you accidentally confirmed availability, please write "cancel confirmation" or wait here. We will notify the hospital coordinator and remove your confirmation immediately.' },
  { id: 2, question: 'How do I register to donate?', answer: 'Click on the "Register" button on the top right, select your blood type and city, and create your account to start receiving alerts.' },
  { id: 3, question: 'What if I accidentally click confirm?', answer: 'Don\'t worry! Open the Support Chat widget on the bottom right and message us to cancel your confirmation immediately.' },
  { id: 4, question: 'Requirements to donate blood?', answer: 'Generally, donors must be in good health, at least 18 years old, weigh at least 45kg, and have not had tattoos or piercings within the last 6 months.' },
  { id: 5, question: 'How often can I donate blood?', answer: 'The minimum interval between whole blood donations is typically 12 weeks for male donors and 16 weeks for female donors.' },
  { id: 6, question: 'Can I change my blood type later?', answer: 'Yes, you can update your blood type, location, and contact information anytime under your Profile settings after logging in.' }
]

const currentUserId = computed(() => {
  if (user.value) return user.value.uid
  if (typeof window !== 'undefined') {
    return getGuestSession().guestId
  }
  return ''
})

const systemKeywords = [
  'blood', 'mau', 'hien', 'donor', 'hospital', 'benh vien',
  'emergency', 'khan cap', 'register', 'dang ky', 'gps', 'location',
  'vi tri', 'maps', 'ban do', 'cancel', 'huy', 'nham',
  'mistake', 'accident', 'go', 'help', 'tro giup', 'admin', 'chao',
  'hello', 'hi', 'xin chao'
]

const localMessages = ref([])

const displayMessages = computed(() => {
  const merged = [...messages.value, ...localMessages.value]
  const unique = []
  const seenKeys = new Set()
  for (const m of merged) {
    const key = m.id || `${m.senderId}-${m.text}-${m.createdAt}`
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      unique.push(m)
    }
  }
  return unique.sort((a, b) => {
    const tA = a.createdAt?.seconds || a.createdAt || 0
    const tB = b.createdAt?.seconds || b.createdAt || 0
    return tA - tB
  })
})

async function sendChatMessage() {
  if (!chatInputText.value || !chatInputText.value.trim()) return
  const text = chatInputText.value.trim()
  chatInputText.value = ''

  // Scope validation
  const textLower = text.toLowerCase()
  const isInScope = systemKeywords.some(kw => textLower.includes(kw))

  let chatId = null
  let senderName = 'Guest User'
  let participantEmail = 'Guest Session'
  let participantType = 'guest'
  if (user.value) {
    chatId = user.value.uid
    senderName = userProfile.value?.displayName || 'User'
    participantEmail = user.value.email || ''
    participantType = 'user'
  } else {
    chatId = getGuestSession().guestId
    const code = chatId ? (chatId.split('_')[1]?.substring(0, 4).toUpperCase() || 'GUEST') : 'GUEST'
    senderName = `Guest #${code}`
    participantEmail = `Guest Session #${code}`
  }

  if (!chatId) return

  if (!isInScope) {
    showToast('Sorry! I can only assist with blood donation system topics (e.g. accidental confirmations, registration, GPS permissions). Please ask a donation-related question.', 'warning')
    return
  }

  try {
    await sendParticipantMessage({
      threadId: chatId,
      participantId: chatId,
      participantType,
      participantDisplayName: senderName,
      participantEmail,
      senderName,
      text
    })
    processBotReply(text, chatId)
  } catch (err) {
    console.warn('Firestore write failed, using local simulation:', err)
    localMessages.value.push({
      id: `local-u-${Date.now()}`,
      chatId,
      senderId: chatId,
      senderName,
      receiverId: 'admin',
      text,
      createdAt: Date.now() / 1000
    })
    processLocalBotReply(text, chatId)
  }
}

const isSendingFaq = ref(false)

async function sendFaqMessage(q) {
  if (isSendingFaq.value) return
  isSendingFaq.value = true

  let chatId = null
  let senderName = 'Guest User'
  let participantEmail = 'Guest Session'
  let participantType = 'guest'
  if (user.value) {
    chatId = user.value.uid
    senderName = userProfile.value?.displayName || 'User'
    participantEmail = user.value.email || ''
    participantType = 'user'
  } else {
    chatId = getGuestSession().guestId
    const code = chatId ? (chatId.split('_')[1]?.substring(0, 4).toUpperCase() || 'GUEST') : 'GUEST'
    senderName = `Guest #${code}`
    participantEmail = `Guest Session #${code}`
  }

  if (!chatId) {
    isSendingFaq.value = false
    return
  }

  try {
    await sendParticipantMessage({
      threadId: chatId,
      participantId: chatId,
      participantType,
      participantDisplayName: senderName,
      participantEmail,
      senderName,
      text: q.question
    })
    await sendSystemMessage({
      threadId: chatId,
      participantId: chatId,
      participantType,
      participantDisplayName: senderName,
      participantEmail,
      text: q.answer
    })
  } catch (err) {
    console.warn('Firestore write failed, using local simulation:', err)
    localMessages.value.push({
      id: `local-q-${Date.now()}`,
      chatId,
      senderId: chatId,
      senderName,
      receiverId: 'admin',
      text: q.question,
      createdAt: Date.now() / 1000
    })
    setTimeout(() => {
      localMessages.value.push({
        id: `local-a-${Date.now()}`,
        chatId,
        senderId: 'support_bot',
        senderName: 'Support Bot',
        receiverId: chatId,
        text: q.answer,
        createdAt: Date.now() / 1000
      })
    }, 400)
  } finally {
    setTimeout(() => {
      isSendingFaq.value = false
    }, 600)
  }
}

function resolveParticipantContext(threadId) {
  if (user.value) {
    return {
      participantId: threadId,
      participantType: 'user',
      participantDisplayName: userProfile.value?.displayName || 'User',
      participantEmail: user.value.email || ''
    }
  }
  const code = threadId ? (threadId.split('_')[1]?.substring(0, 4).toUpperCase() || 'GUEST') : 'GUEST'
  return {
    participantId: threadId,
    participantType: 'guest',
    participantDisplayName: `Guest #${code}`,
    participantEmail: `Guest Session #${code}`
  }
}

function processBotReply(userText, chatId) {
  const textLower = userText.toLowerCase()
  let replyText = ''

  if (['cancel', 'huy', 'nham', 'mistake', 'accident', 'go'].some(kw => textLower.includes(kw))) {
    replyText = 'If you accidentally confirmed availability, please write "cancel confirmation" or wait here. We will notify the hospital coordinator and remove your confirmation immediately.'
  } else if (['register', 'dang ky', 'signup', 'tai khoan'].some(kw => textLower.includes(kw))) {
    replyText = 'To register as a donor, click on the "Register" button on the top right, select your blood type and city, and create your account to start receiving alerts.'
  } else if (['requirement', 'yeu cau', 'tuoi', 'can', 'tattoo', 'xam'].some(kw => textLower.includes(kw))) {
    replyText = 'Donors must be in good health, at least 18 years old, weigh at least 45kg, and have no recent tattoos/piercings (within 6 months).'
  } else if (['often', 'bao lau', 'lan', 'interval'].some(kw => textLower.includes(kw))) {
    replyText = 'The minimum interval between whole blood donations is 12 weeks for male donors and 16 weeks for female donors.'
  } else if (['change', 'doi', 'sua', 'profile', 'blood type', 'nhom mau'].some(kw => textLower.includes(kw))) {
    replyText = 'Yes, you can update your blood type, location, and contact information anytime under your Profile settings after logging in.'
  } else {
    replyText = 'Hi! I am the Support Bot. You can ask about: 1. Accidental confirmations, 2. Registration, 3. Donation requirements, 4. Donation intervals. Or type "admin" to connect with our human administrator.'
  }

  setTimeout(async () => {
    try {
      await sendSystemMessage({
        threadId: chatId,
        ...resolveParticipantContext(chatId),
        text: replyText
      })
    } catch (err) {
      console.error('Error writing bot reply:', err)
    }
  }, 400)
}

function processLocalBotReply(userText, chatId) {
  const textLower = userText.toLowerCase()
  let replyText = ''

  if (['cancel', 'huy', 'nham', 'mistake', 'accident', 'go'].some(kw => textLower.includes(kw))) {
    replyText = 'If you accidentally confirmed availability, please write "cancel confirmation" or wait here. We will notify the hospital coordinator and remove your confirmation immediately.'
  } else if (['register', 'dang ky', 'signup', 'tai khoan'].some(kw => textLower.includes(kw))) {
    replyText = 'To register as a donor, click on the "Register" button on the top right, select your blood type and city, and create your account to start receiving alerts.'
  } else if (['requirement', 'yeu cau', 'tuoi', 'can', 'tattoo', 'xam'].some(kw => textLower.includes(kw))) {
    replyText = 'Donors must be in good health, at least 18 years old, weigh at least 45kg, and have no recent tattoos/piercings (within 6 months).'
  } else if (['often', 'bao lau', 'lan', 'interval'].some(kw => textLower.includes(kw))) {
    replyText = 'The minimum interval between whole blood donations is 12 weeks for male donors and 16 weeks for female donors.'
  } else if (['change', 'doi', 'sua', 'profile', 'blood type', 'nhom mau'].some(kw => textLower.includes(kw))) {
    replyText = 'Yes, you can update your blood type, location, and contact information anytime under your Profile settings after logging in.'
  } else {
    replyText = 'Hi! I am the Support Bot. You can ask about: 1. Accidental confirmations, 2. Registration, 3. Donation requirements, 4. Donation intervals. Or type "admin" to connect with our human administrator.'
  }

  setTimeout(() => {
    localMessages.value.push({
      id: `local-bot-${Date.now()}`,
      chatId,
      senderId: 'support_bot',
      senderName: 'Support Bot',
      receiverId: chatId,
      text: replyText,
      createdAt: Date.now() / 1000
    })
  }, 400)
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const geoPrompted = localStorage.getItem('ll_geo_prompted')
    const geoGranted = localStorage.getItem('ll_geo_granted')
    if (!geoPrompted && geoGranted !== 'true') {
      localStorage.setItem('ll_geo_prompted', 'true')
      try {
        await requestLocation()
      } catch (e) {
        console.warn('Geolocation initial request denied:', e)
      }
    }
  }
})

function toggleChat() {
  isChatOpen.value = !isChatOpen.value
}

function listenToChat() {
  if (chatUnsubscribe) {
    chatUnsubscribe()
    chatUnsubscribe = null
  }
  
  if (isAdmin.value) {
    messages.value = []
    return
  }

  const chatId = currentUserId.value
  if (!chatId) {
    messages.value = []
    return
  }

  chatUnsubscribe = listenToThreadMessages(chatId, (list) => {
    messages.value = list
  }, (err) => {
    console.error('Error listening to support messages:', err)
  })
}

watch(user, () => {
  listenToChat()
}, { immediate: true })

watch(isChatOpen, async (open) => {
  if (open && currentUserId.value) {
    try {
      await markParticipantThreadRead(currentUserId.value)
    } catch (err) {
      console.warn('Could not mark participant support thread as read:', err)
    }
  }
})

watch(displayMessages, () => {
  nextTick(() => {
    if (chatScrollContainer.value) {
      chatScrollContainer.value.scrollTop = chatScrollContainer.value.scrollHeight
    }
  })
}, { deep: true })

// Global new requests listener for matching blood type notification
let requestsUnsubscribe = null
const { isEligible } = useEligibility()

function listenToNewRequests() {
  if (requestsUnsubscribe) {
    requestsUnsubscribe()
    requestsUnsubscribe = null
  }
  
  const q = query(
    collection(db, 'emergencyRequests'),
    where('status', '==', 'active')
  )
  
  let isInitialLoad = true
  
  requestsUnsubscribe = onSnapshot(q, (snapshot) => {
    if (isInitialLoad) {
      isInitialLoad = false
      return
    }
    
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const newReq = { id: change.doc.id, ...change.doc.data() }
        
        // Match blood compatibility and eligibility
        if (user.value && userProfile.value && !isAdmin.value) {
          const eligible = isEligible(userProfile.value.lastDonationDate)
          const compatible = canDonateTo(userProfile.value.bloodType, newReq.bloodType)
          
          if (eligible && compatible) {
            showToast(`🚨 Compatible emergency: ${newReq.bloodType} needed at ${newReq.hospitalName}!`, 'warning')
          }
        }
      }
    })
  }, (err) => {
    console.error('[App.vue] Error listening to new emergency requests:', err)
  })
}

// Watch user session to trigger or stop request listener
watch(user, (newUser) => {
  if (newUser && userProfile.value && !isAdmin.value) {
    listenToNewRequests()
  } else {
    if (requestsUnsubscribe) {
      requestsUnsubscribe()
      requestsUnsubscribe = null
    }
  }
}, { immediate: true })

watch(userProfile, (newProfile) => {
  if (newProfile && user.value && !isAdmin.value && !requestsUnsubscribe) {
    listenToNewRequests()
  }
})

onUnmounted(() => {
  if (chatUnsubscribe) chatUnsubscribe()
  if (requestsUnsubscribe) requestsUnsubscribe()
})

function getAlertIcon(type) {
  switch (type) {
    case 'success':
      return 'bi bi-check-circle-fill'
    case 'danger':
      return 'bi bi-exclamation-octagon-fill'
    case 'warning':
      return 'bi bi-exclamation-triangle-fill'
    case 'info':
    default:
      return 'bi bi-info-circle-fill'
  }
}
</script>

<style>
:root {
  --ll-wine-red:        #8E2435;
  --ll-wine-dark:       #5C121E;
  --ll-wine-light:      #FDF4F5;
  --ll-wine-xlight:     #FFF9F9;
  --ll-page-gradient-top:    #FAF5EF;
  --ll-page-gradient-mid:    #FBF4EC;
  --ll-page-gradient-bottom: #F6EAE0;
  
  --ll-beige:           #FAF5EF;
  --ll-cream:           #FFFDFB;
  --ll-espresso:        #2B2225;
  
  --ll-slate-900:       #1E1618;
  --ll-slate-700:       #3D3336;
  --ll-slate-500:       #4F4346;
  --ll-slate-400:       #6B5B60;
  --ll-slate-300:       #CBD5E1;
  --ll-slate-200:       #EAE2DF;
  --ll-slate-100:       #F5EFEF;
  --ll-slate-50:        #FDFBFB;
  
  --ll-bg:              #FAF5EF;
  --ll-surface:         #FFFFFF;
  --ll-surface-alt:     #FFFDFB;
  
  --ll-critical-border: #8E2435;
  --ll-critical-bg:     #FDF4F5;
  --ll-critical-text:   #8E2435;
  
  --ll-urgent-border:   #B45309;
  --ll-urgent-bg:       #FFFBEB;
  --ll-urgent-text:     #92400E;
  
  --ll-moderate-border: #547A6B;
  --ll-moderate-bg:     #F6FAF8;
  --ll-moderate-text:   #2E594A;
  
  --ll-success:         #2E7D63;
  --ll-success-bg:      #F3FAF7;
  --ll-success-text:    #1C4E3D;
  
  --ll-error:           #8E2435;
  --ll-error-bg:        #FDF4F5;
  --ll-error-text:      #5C121E;
  
  --ll-warning:         #D99B26;
  --ll-warning-bg:      #FFFDF8;
  
  --ll-info:            #2D6B8C;
  --ll-info-bg:         #F3FAFD;
  
  --ll-shadow-xs:      0 1px 2px rgba(37, 30, 33, 0.04);
  --ll-shadow-sm:      0 2px 8px rgba(37, 30, 33, 0.06);
  --ll-shadow-md:      0 8px 20px rgba(37, 30, 33, 0.08);
  --ll-shadow-lg:      0 16px 36px rgba(142, 36, 53, 0.08), 0 4px 12px rgba(37, 30, 33, 0.03);
  
  --ll-radius-xs:      4px;
  --ll-radius-sm:      6px;
  --ll-radius-md:      10px;
  --ll-radius-lg:      16px;
  
  --ease-out:           cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out:        cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer:        cubic-bezier(0.32, 0.72, 0, 1);

  --ll-transition-fast: 0.12s var(--ease-out);
  --ll-transition:      0.2s var(--ease-out);
  --ll-transition-slow: 0.35s var(--ease-out);
}

* {
  box-sizing: border-box;
}

button,
[type="button"],
[type="reset"],
[type="submit"],
.btn,
.ll-btn-primary,
.ll-btn-secondary,
.ll-chip,
.ll-card-clickable,
.list-group-item-action,
.nav-link,
.dropdown-item,
label[for],
.ll-chooser-card,
.faq-questions-container button,
.ll-role-label {
  cursor: pointer !important;
  user-select: none;
}

html {
  overflow-y: scroll;
}

html,
body {
  height: 100%;
  margin: 0;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ll-slate-700);
  background-color: var(--ll-bg);
  background-image: 
    linear-gradient(rgba(33, 26, 28, 0.02) 1px, transparent 1px),
    linear-gradient(
      180deg,
      rgba(250, 245, 239, 0.88) 0%,
      rgba(251, 244, 236, 0.88) 48%,
      rgba(246, 234, 224, 0.88) 100%
    ),
    url('/images/bg-pattern.png');
  background-size: 100% 36px, 100% 100%, 570px auto;
  background-repeat: repeat, no-repeat, repeat;
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', system-ui, sans-serif;
  color: var(--ll-slate-900);
  font-weight: 600;
}

button,
input,
select,
textarea {
  font-family: inherit;
}

.ll-app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.ll-ambient-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  z-index: -1;
  pointer-events: none;
  opacity: 0.25;
  transition: all var(--ll-transition-slow);
}
.ll-ambient-blob-1 {
  top: -10%;
  right: -5%;
  width: 450px;
  height: 450px;
  background-color: rgba(249, 235, 225, 0.88);
}
.ll-ambient-blob-2 {
  bottom: -10%;
  left: -5%;
  width: 500px;
  height: 500px;
  background-color: rgba(250, 245, 239, 0.92);
}

.ll-main {
  flex: 1 0 auto;
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 280px);
}

.ll-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem;
}

@media (min-width: 768px) {
  .ll-page-container {
    padding: 3.5rem 2rem;
  }
}

.ll-text-meta { font-size: 0.85rem; color: var(--ll-slate-500); }
.ll-text-label { font-size: 0.9rem; color: var(--ll-slate-700); font-weight: 500; }
.ll-text-heading { font-size: 1.75rem; color: var(--ll-slate-900); font-weight: 700; }
.text-slate-700 { color: var(--ll-slate-700) !important; }
.text-slate-500 { color: var(--ll-slate-500) !important; }

/* Sticky Navbar Glassmorphism */
.ll-navbar {
  background-color: rgba(43, 34, 37, 0.96) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 64px;
  box-shadow: var(--ll-shadow-sm);
  z-index: 1000;
  transition: background-color var(--ll-transition);
}

.ll-navbar .nav-link {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 0.925rem;
  font-weight: 500;
  padding: 0.5rem 1rem !important;
  border-radius: var(--ll-radius-sm);
  transition: all var(--ll-transition-fast);
  position: relative;
}

.ll-navbar .nav-link:hover {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.06);
}

.ll-navbar .nav-link.router-link-active {
  color: #ffffff !important;
  font-weight: 600;
}

.ll-navbar .nav-link::after {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 1rem;
  right: 1rem;
  height: 3px;
  background-color: var(--ll-wine-red);
  border-radius: 99px;
  box-shadow: 0 0 8px var(--ll-wine-red);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.2s var(--ease-out);
}

.ll-navbar .nav-link:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

.ll-navbar .nav-link.router-link-active::after {
  transform: scaleX(1);
}

.ll-navbar-brand {
  font-family: 'Outfit', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff !important;
  letter-spacing: -0.03em;
}

.ll-navbar .btn-nav-primary {
  background-color: var(--ll-wine-red);
  border: none;
  color: #fff !important;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1.25rem !important;
  border-radius: var(--ll-radius-sm);
  box-shadow: 0 4px 12px rgba(142, 36, 53, 0.3);
  transition: all var(--ll-transition-fast);
}

.ll-navbar .btn-nav-primary:hover {
  background-color: var(--ll-wine-dark);
  box-shadow: 0 4px 16px rgba(142, 36, 53, 0.5);
  transform: translateY(-1px);
}

.ll-navbar .btn-nav-primary:active,
.ll-navbar .btn-nav-ghost:active {
  transform: scale(0.97);
}

.ll-navbar .btn-nav-ghost {
  background-color: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.4rem 1.15rem !important;
  border-radius: var(--ll-radius-sm);
  transition: all var(--ll-transition-fast);
}

.ll-navbar .btn-nav-ghost:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff !important;
  background-color: rgba(255, 255, 255, 0.04);
}

/* Premium Buttons */
.ll-btn-primary,
.ll-btn-secondary,
.ll-btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  text-decoration: none;
  font-family: 'Outfit', sans-serif;
  border-radius: var(--ll-radius-md);
  padding: 0.6rem 1.5rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--ll-transition);
}

.ll-btn-primary {
  background-color: var(--ll-wine-red);
  border: none;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(142, 36, 53, 0.25);
}

.ll-btn-primary:hover {
  background-color: var(--ll-wine-dark);
  box-shadow: 0 6px 18px rgba(142, 36, 53, 0.4);
  transform: translateY(-2px);
}

.ll-btn-primary:active {
  transform: scale(0.97);
}

.ll-btn-primary:disabled {
  background-color: var(--ll-slate-300);
  color: var(--ll-slate-500);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.ll-btn-secondary {
  background-color: #ffffff;
  border: 1px solid var(--ll-slate-200);
  color: var(--ll-slate-700);
  font-weight: 500;
  box-shadow: var(--ll-shadow-xs);
}

.ll-btn-secondary:hover {
  border-color: var(--ll-slate-300);
  background-color: var(--ll-slate-50);
  color: var(--ll-slate-900);
  transform: translateY(-2px);
  box-shadow: var(--ll-shadow-sm);
}

.ll-btn-secondary:active {
  transform: scale(0.97);
}

.ll-btn-danger {
  background-color: transparent;
  border: 1.5px solid var(--ll-error);
  color: var(--ll-error);
  font-weight: 600;
}

.ll-btn-danger:hover {
  background-color: var(--ll-error-bg);
  color: var(--ll-error-text);
  transform: translateY(-2px);
}

.ll-btn-danger:active {
  transform: scale(0.97);
}

.ll-btn-sm { padding: 0.4rem 1rem; font-size: 0.85rem; border-radius: var(--ll-radius-sm); }
.ll-btn-lg { padding: 0.8rem 2rem; font-size: 1.05rem; }
.ll-btn-block { width: 100%; text-align: center; display: flex; }

/* Minimalist Glass Card Overhaul */
.ll-card {
  background-color: var(--ll-surface);
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-lg);
  box-shadow: var(--ll-shadow-sm);
  overflow: hidden;
  transition: all var(--ll-transition);
  position: relative;
}

.ll-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--ll-radius-lg);
  border: 1px solid transparent;
  pointer-events: none;
  transition: border-color var(--ll-transition);
}

.ll-card:hover {
  box-shadow: var(--ll-shadow-lg);
  transform: translateY(-4px);
}

.ll-card:hover::after {
  border-color: rgba(142, 36, 53, 0.15);
}

.ll-card__body { padding: 1.5rem; }
.ll-card__header {
  padding: 1.15rem 1.5rem;
  background-color: var(--ll-surface-alt);
  border-bottom: 1px solid var(--ll-slate-200);
}
.ll-card__footer {
  padding: 1.15rem 1.5rem;
  background-color: var(--ll-surface-alt);
  border-top: 1px solid var(--ll-slate-200);
}

/* Request Cards with Colored Accents (No thick left borders) */
.ll-request-card {
  border-top: 4px solid transparent !important;
}
.ll-request-card--critical { border-top-color: var(--ll-critical-border) !important; }
.ll-request-card--urgent { border-top-color: var(--ll-urgent-border) !important; }
.ll-request-card--moderate { border-top-color: var(--ll-moderate-border) !important; }

/* Soft Pill Badges */
.ll-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.3rem 0.75rem;
  border-radius: 99px;
  font-size: 0.775rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}

.ll-badge-blood {
  background-color: var(--ll-wine-red);
  color: #fff;
  font-size: 0.85rem;
  border-radius: 8px;
  padding: 0.3rem 0.8rem;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(142, 36, 53, 0.2);
}

.ll-badge-active { background: var(--ll-success-bg); color: var(--ll-success-text); border: 1px solid rgba(46, 125, 99, 0.2); }
.ll-badge-fulfilled { background: var(--ll-slate-100); color: var(--ll-slate-700); border: 1px solid var(--ll-slate-200); }
.ll-badge-cancelled { background: var(--ll-error-bg); color: var(--ll-error-text); border: 1px solid rgba(142, 36, 53, 0.2); }
.ll-badge-category { background-color: var(--ll-info-bg); color: var(--ll-info); border: 1px solid rgba(45, 107, 140, 0.2); }

.ll-urgency-critical { background-color: var(--ll-critical-bg) !important; color: var(--ll-critical-text) !important; border: 1px solid rgba(142, 36, 53, 0.2); }
.ll-urgency-urgent { background-color: var(--ll-urgent-bg) !important; color: var(--ll-urgent-text) !important; border: 1px solid rgba(217, 155, 38, 0.2); }
.ll-urgency-moderate { background-color: var(--ll-moderate-bg) !important; color: var(--ll-moderate-text) !important; border: 1px solid rgba(84, 122, 107, 0.2); }

/* Form Fields */
.ll-form-group { margin-bottom: 1.5rem; }
.ll-form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ll-slate-900);
  margin-bottom: 0.5rem;
}

.form-control,
.form-select {
  border: 1px solid var(--ll-slate-200) !important;
  border-radius: var(--ll-radius-md) !important;
  color: var(--ll-slate-900) !important;
  font-size: 0.95rem !important;
  padding: 0.65rem 1rem !important;
  background-color: var(--ll-surface) !important;
  transition: all var(--ll-transition-fast) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02) !important;
}

.form-control:focus,
.form-select:focus {
  border-color: var(--ll-wine-red) !important;
  box-shadow: 0 0 0 4px rgba(142, 36, 53, 0.08) !important;
  outline: none !important;
}

.form-control::placeholder { color: var(--ll-slate-400) !important; }
.form-control.is-invalid,
.form-select.is-invalid {
  border-color: var(--ll-error) !important;
  box-shadow: 0 0 0 4px rgba(142, 36, 53, 0.06) !important;
}

.invalid-feedback {
  color: var(--ll-error) !important;
  font-size: 0.825rem !important;
  font-weight: 500;
  margin-top: 0.35rem;
}

.ll-search-wrapper { position: relative; }
.ll-search-wrapper .ll-search-icon {
  position: absolute;
  left: 0.95rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ll-slate-400);
  pointer-events: none;
}
.ll-search-wrapper input { padding-left: 2.5rem !important; }

/* Live status pulse badge */
.ll-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--ll-wine-red);
  color: #fff;
  font-size: 0.775rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(142, 36, 53, 0.25);
}
.ll-live-dot {
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 50%;
  animation: ll-pulse-dot 1.5s ease-in-out infinite;
}
@keyframes ll-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

.ll-progress {
  height: 8px;
  background-color: var(--ll-slate-100);
  border-radius: 99px;
  overflow: hidden;
}
.ll-progress-bar {
  height: 100%;
  background-color: var(--ll-success);
  border-radius: 99px;
  transition: width 0.8s var(--ease-out);
}
.ll-progress-bar--critical { background-color: var(--ll-critical-border); }

/* Layout grids & toolbars */
.ll-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.ll-section-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--ll-slate-900);
  margin: 0;
  line-height: 1.2;
}
.ll-toolbar {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-lg);
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--ll-shadow-xs);
}
.ll-empty-state {
  text-align: center;
  padding: 5rem 2rem;
  color: var(--ll-slate-500);
}
.ll-empty-state__icon { font-size: 3.5rem; margin-bottom: 1.25rem; color: var(--ll-wine-red); opacity: 0.45; }
.ll-empty-state__title { font-size: 1.25rem; font-weight: 700; color: var(--ll-slate-900); }
.ll-empty-state__body { font-size: 0.95rem; margin-top: 0.5rem; }

/* Premium Auth Pages */
.ll-auth-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}
.ll-auth-card {
  width: 100%;
  max-width: 450px;
  background: var(--ll-surface);
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-lg);
  padding: 3rem 2.5rem;
  box-shadow: var(--ll-shadow-lg);
}
.ll-auth-card__logo { text-align: center; margin-bottom: 2rem; }
.ll-auth-card__logo h2 { font-size: 1.75rem; font-weight: 800; color: var(--ll-wine-red); letter-spacing: -0.03em; }

.ll-form-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  overflow-y: auto;
  background-color: rgba(37, 30, 33, 0.45);
  backdrop-filter: blur(4px);
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ll-toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.ll-toast-container .ll-alert {
  pointer-events: auto;
  min-width: 320px;
  max-width: 420px;
  border-radius: var(--ll-radius-md);
  border: 1px solid var(--ll-slate-200);
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  gap: 1.25rem;
  align-items: center;
  font-size: 0.925rem;
  box-shadow: var(--ll-shadow-md);
}

.ll-alert--success { background: var(--ll-success-bg); color: var(--ll-success-text); border-color: rgba(46, 125, 99, 0.2); }
.ll-alert--danger { background: var(--ll-error-bg); color: var(--ll-error-text); border-color: rgba(142, 36, 53, 0.2); }
.ll-alert--warning { background: var(--ll-warning-bg); color: #8A6D15; border-color: rgba(217, 155, 38, 0.2); }
.ll-alert--info { background: var(--ll-info-bg); color: #1C5470; border-color: rgba(45, 107, 140, 0.2); }

.ll-alert__close {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-size: 1.15rem;
  line-height: 1;
  color: currentColor;
  opacity: 0.65;
  transition: opacity 0.15s ease;
  cursor: pointer;
  outline: none;
}
.ll-alert__close:hover {
  opacity: 1;
}

.ll-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 575.98px) {
  .ll-btn-primary,
  .ll-btn-secondary,
  .ll-btn-danger {
    width: 100%;
  }
  .ll-auth-card {
    padding: 2rem 1.5rem;
  }
}

/* Page transitions - slide-up style */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Toast transitions */
.toast-enter-active {
  transition: transform 0.2s var(--ease-out), opacity 0.2s var(--ease-out);
}

.toast-leave-active {
  transition: transform 0.15s var(--ease-out), opacity 0.15s var(--ease-out);
}

.toast-enter-from {
  transform: translateY(12px) scale(0.97);
  opacity: 0;
}

.toast-leave-to {
  transform: scale(0.97);
  opacity: 0;
}

/* Floating Support Chat Widget Styles */
.ll-support-chat-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.9rem;
}

.ll-chat-trigger {
  position: relative;
  z-index: 1061;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--ll-wine-red);
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 16px rgba(142, 36, 53, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all var(--ll-transition);
}

.ll-chat-trigger:hover {
  transform: scale(1.08) translateY(-2px);
  background-color: var(--ll-wine-dark);
}


.ll-chat-window {
  position: relative;
  z-index: 1060;
  width: 380px;
  height: 520px;
  background-color: var(--ll-surface);
  border: 1px solid var(--ll-slate-200);
  border-radius: 1.35rem;
  box-shadow: var(--ll-shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ll-chat-window-header {
  background-color: var(--ll-wine-red);
  color: #ffffff;
  padding: 0.9rem 1.1rem;
}

.ll-chat-window-footer {
  padding: 0.85rem !important;
  background-color: #ffffff;
}

.ll-chat-window-footer .form-control {
  min-height: 50px;
  border-radius: 1rem;
  border: 1px solid rgba(142, 36, 53, 0.28);
  padding-inline: 1rem;
  box-shadow: none;
}

.ll-chat-window-footer .form-control:focus {
  border-color: rgba(142, 36, 53, 0.5);
  box-shadow: 0 0 0 0.2rem rgba(142, 36, 53, 0.12);
}

.ll-chat-window-footer .btn {
  min-width: 54px;
  border-radius: 0.7rem;
}

.ll-chat-window-body {
  flex-grow: 1;
  overflow: hidden;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background-color: var(--ll-slate-50);
}

.ll-chat-messages-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex-grow: 1;
  scroll-behavior: smooth;
}

.ll-chat-msg {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.ll-chat-msg--sent {
  align-self: flex-end;
  align-items: flex-end;
}

.ll-chat-msg--received {
  align-self: flex-start;
  align-items: flex-start;
}

.ll-chat-msg-bubble {
  padding: 0.5rem 0.8rem;
  border-radius: var(--ll-radius-sm);
  font-size: 0.85rem;
  line-height: 1.4;
  word-break: break-word;
}

.ll-chat-msg--sent .ll-chat-msg-bubble {
  background-color: var(--ll-wine-red);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.ll-chat-msg--received .ll-chat-msg-bubble {
  background-color: #ffffff;
  color: var(--ll-slate-900);
  border: 1px solid var(--ll-slate-200);
  border-bottom-left-radius: 2px;
}

/* Chat Transitions */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all var(--ll-transition);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}

/* Geolocation Banner Styles */
.ll-geo-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(253, 244, 245, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--ll-slate-200);
  z-index: 100;
  position: relative;
}

.ll-geo-banner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--ll-wine-red);
}

.ll-geo-banner-actions {
  display: flex;
  gap: 0.5rem;
}

.animate-pulse {
  animation: pulse-geo 2s infinite;
}

@keyframes pulse-geo {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
}

/* Chat tab selector styles */
.ll-chat-tabs {
  background-color: var(--ll-slate-50);
}
.ll-chat-tab-btn {
  background: none;
  border: none;
  color: var(--ll-slate-500);
  font-size: 0.8rem;
  transition: all var(--ll-transition);
  outline: none;
  border-bottom: 2px solid transparent;
}
.ll-chat-tab-btn:hover {
  color: var(--ll-wine-red);
}
.ll-chat-tab-btn.active {
  color: var(--ll-wine-red);
  border-bottom: 2px solid var(--ll-wine-red);
  background-color: #ffffff;
}

/* Scroll Reveal Styles */
.reveal-item {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s var(--ease-out), transform 0.4s var(--ease-out);
  transition-delay: var(--reveal-delay, 0ms);
  will-change: transform, opacity;
}

.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

.reveal-instant {
  opacity: 1 !important;
  transform: none !important;
  transition: none !important;
}

/* Optimized Page Route Transitions (GPU Accelerated, No Flickering) */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  will-change: opacity, transform;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translate3d(0, 6px, 0);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translate3d(0, -4px, 0);
}

/* Global Prefers Reduced Motion settings */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
