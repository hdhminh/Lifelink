<template>
  <div v-if="!isAdmin" class="ll-support-chat-wrapper">
    <!-- Chat Window -->
    <transition name="chat-slide">
      <div v-if="isChatOpen" class="ll-chat-window">
        <div class="ll-chat-window-header d-flex justify-content-between align-items-center">
          <span class="fw-bold"><i class="bi bi-headset me-2"></i>LifeLink Support</span>
          <button
            type="button"
            class="btn-close btn-close-white chat-style-1"
           
            aria-label="Close chat"
            @click="isChatOpen = false"
          ></button>
        </div>

        <div class="ll-chat-window-body d-flex flex-column">
          <!-- Guest info banner -->
          <div
            v-if="!user"
            class="alert alert-info py-1 px-2 mb-2 text-center chat-style-2"
           
          >
            Guest Session active.
            <RouterLink to="/login" class="text-danger fw-bold" @click="isChatOpen = false"
              >Log in</RouterLink
            >
            to save profile.
          </div>

          <!-- Messages list -->
          <div
            ref="chatScrollContainer"
            class="ll-chat-messages-container flex-grow-1 chat-style-3"
           
          >
            <div
              v-if="displayMessages.length === 0"
              class="text-center py-4 text-slate-400 small"
            >
              Hi! I'm the Support Bot. You can ask about cancelling confirmations, event
              registrations, or donation requirements.
            </div>
            <div
              v-for="msg in displayMessages"
              :key="msg.id"
              class="ll-chat-msg"
              :class="
                msg.senderId === currentUserId ? 'll-chat-msg--sent' : 'll-chat-msg--received'
              "
            >
              <div class="ll-chat-msg-bubble">
                <div class="chat-style-4"
                 
                >
                  {{ msg.senderName }}
                </div>
                {{ msg.text }}
              </div>
            </div>
          </div>

          <!-- Predefined FAQ Buttons -->
          <div class="border-top pt-2 mt-2 chat-style-5">
            <div class="small text-slate-500 mb-1 fw-bold">
              <i class="bi bi-question-circle"></i> Quick Questions:
            </div>
            <div
              class="faq-questions-container d-flex flex-column gap-1 overflow-y-auto chat-style-6"
             
            >
              <button
                v-for="q in faqQuestions"
                :key="q.id"
                type="button"
                class="btn btn-sm btn-light text-start py-2 px-3 border border-slate-100 text-slate-700 d-flex justify-content-between align-items-center chat-style-7"
               
                @click="sendFaqMessage(q)"
              >
                <span
                  ><i class="bi bi-question-circle text-danger me-2"></i>{{ q.question }}</span
                >
                <i class="bi bi-chevron-right text-slate-400 small"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Chat Input Footer (Visible to both guest & user) -->
        <div class="ll-chat-window-footer border-top p-2 chat-style-5">
          <form class="d-flex gap-2 align-items-stretch" @submit.prevent="sendChatMessage">
            <input
              id="global-chat-input"
              v-model="chatInputText"
              type="text"
              class="form-control form-control-sm chat-style-8"
              placeholder="Type your message..."
              aria-label="Type your message"
              autocomplete="off"
             
            />
            <button
              type="submit"
              class="btn btn-sm btn-danger px-3 d-flex align-items-center justify-content-center chat-style-8"
             
              aria-label="Send message"
            >
              <i class="bi bi-send-fill"></i>
            </button>
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
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { useSupportChat } from '@/composables/useSupportChat.js'
import { useToast } from '@/composables/useToast.js'

const { user, userProfile, isAdmin } = useAuth()
const { getGuestSession } = useGuestSession()
const {
  sendParticipantMessage,
  sendSystemMessage,
  listenToThreadMessages,
  markParticipantThreadRead
} = useSupportChat()
const { showToast } = useToast()

const isChatOpen = ref(false)
const chatInputText = ref('')
const messages = ref([])
const chatScrollContainer = ref(null)
let chatUnsubscribe = null

const faqQuestions = [
  {
    id: 1,
    question: 'Accidental confirmation?',
    answer:
      'If you accidentally confirmed availability, please write "cancel confirmation" or wait here. We will notify the hospital coordinator and remove your confirmation immediately.'
  },
  {
    id: 2,
    question: 'How do I register to donate?',
    answer:
      'Click on the "Register" button on the top right, select your blood type and city, and create your account to start receiving alerts.'
  },
  {
    id: 3,
    question: 'What if I accidentally click confirm?',
    answer:
      "Don't worry! Open the Support Chat widget on the bottom right and message us to cancel your confirmation immediately."
  },
  {
    id: 4,
    question: 'Requirements to donate blood?',
    answer:
      'Generally, donors must be in good health, at least 18 years old, weigh at least 45kg, and have not had tattoos or piercings within the last 6 months.'
  },
  {
    id: 5,
    question: 'How often can I donate blood?',
    answer:
      'The minimum interval between whole blood donations is typically 12 weeks for male donors and 16 weeks for female donors.'
  },
  {
    id: 6,
    question: 'Can I change my blood type later?',
    answer:
      'Yes, you can update your blood type, location, and contact information anytime under your Profile settings after logging in.'
  }
]

const currentUserId = computed(() => {
  if (user.value) return user.value.uid
  if (typeof window !== 'undefined') {
    return getGuestSession().guestId
  }
  return ''
})

const systemKeywords = [
  'blood', 'mau', 'hien', 'donor', 'hospital', 'benh vien', 'emergency', 'khan cap',
  'register', 'dang ky', 'gps', 'location', 'vi tri', 'maps', 'ban do', 'cancel',
  'huy', 'nham', 'mistake', 'accident', 'go', 'help', 'tro giup', 'admin', 'chao',
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
  const isInScope = systemKeywords.some((kw) => textLower.includes(kw))

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
    const code = chatId ? chatId.split('_')[1]?.substring(0, 4).toUpperCase() || 'GUEST' : 'GUEST'
    senderName = `Guest #${code}`
    participantEmail = `Guest Session #${code}`
  }

  if (!chatId) return

  if (!isInScope) {
    showToast(
      'Sorry! I can only assist with blood donation system topics (e.g. accidental confirmations, registration, GPS permissions). Please ask a donation-related question.',
      'warning'
    )
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
    const code = chatId ? chatId.split('_')[1]?.substring(0, 4).toUpperCase() || 'GUEST' : 'GUEST'
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
  const code = threadId ? threadId.split('_')[1]?.substring(0, 4).toUpperCase() || 'GUEST' : 'GUEST'
  return {
    participantId: threadId,
    participantType: 'guest',
    participantDisplayName: `Guest #${code}`,
    participantEmail: `Guest Session #${code}`
  }
}

function matchBotReplyText(userText) {
  const textLower = userText.toLowerCase()

  if (['cancel', 'huy', 'nham', 'mistake', 'accident', 'go'].some((kw) => textLower.includes(kw))) {
    return 'If you accidentally confirmed availability, please write "cancel confirmation" or wait here. We will notify the hospital coordinator and remove your confirmation immediately.'
  } else if (['register', 'dang ky', 'signup', 'tai khoan'].some((kw) => textLower.includes(kw))) {
    return 'To register as a donor, click on the "Register" button on the top right, select your blood type and city, and create your account to start receiving alerts.'
  } else if (
    ['requirement', 'yeu cau', 'tuoi', 'can', 'tattoo', 'xam'].some((kw) => textLower.includes(kw))
  ) {
    return 'Donors must be in good health, at least 18 years old, weigh at least 45kg, and have no recent tattoos/piercings (within 6 months).'
  } else if (['often', 'bao lau', 'lan', 'interval'].some((kw) => textLower.includes(kw))) {
    return 'The minimum interval between whole blood donations is 12 weeks for male donors and 16 weeks for female donors.'
  } else if (
    ['change', 'doi', 'sua', 'profile', 'blood type', 'nhom mau'].some((kw) =>
      textLower.includes(kw)
    )
  ) {
    return 'Yes, you can update your blood type, location, and contact information anytime under your Profile settings after logging in.'
  } else {
    return 'Hi! I am the Support Bot. You can ask about: 1. Accidental confirmations, 2. Registration, 3. Donation requirements, 4. Donation intervals. Or type "admin" to connect with our human administrator.'
  }
}

function processBotReply(userText, chatId) {
  const replyText = matchBotReplyText(userText)

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
  const replyText = matchBotReplyText(userText)

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

  chatUnsubscribe = listenToThreadMessages(
    chatId,
    (list) => {
      messages.value = list
    },
    (err) => {
      console.error('Error listening to support messages:', err)
    }
  )
}

watch(
  user,
  () => {
    listenToChat()
  },
  { immediate: true }
)

watch(isChatOpen, async (open) => {
  if (open && currentUserId.value) {
    try {
      await markParticipantThreadRead(currentUserId.value)
    } catch (err) {
      console.warn('Could not mark participant support thread as read:', err)
    }
  }
})

watch(
  displayMessages,
  () => {
    nextTick(() => {
      if (chatScrollContainer.value) {
        chatScrollContainer.value.scrollTop = chatScrollContainer.value.scrollHeight
      }
    })
  },
  { deep: true }
)

onUnmounted(() => {
  if (chatUnsubscribe) chatUnsubscribe()
})
</script>

<style scoped>
.chat-style-1 {
  font-size: 0.8rem;
  box-shadow: none;
}
.chat-style-2 {
  font-size: 0.7rem;
  border-radius: 4px;
  flex-shrink: 0;
}
.chat-style-3 {
  overflow-y: auto;
}
.chat-style-4 {
  font-size: 0.7rem;
  opacity: 0.8;
  font-weight: bold;
  margin-bottom: 2px;
}
.chat-style-5 {
  flex-shrink: 0;
}
.chat-style-6 {
  max-height: 82px;
  scrollbar-width: thin;
}
.chat-style-7 {
  font-size: 0.76rem;
  border-radius: 8px;
  font-weight: 500;
}
.chat-style-8 {
  height: 36px;
}
</style>
