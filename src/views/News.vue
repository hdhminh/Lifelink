<template>
  <div class="ll-page-container">
    <section class="mb-4 reveal-header">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 class="ll-text-heading mb-2">Blood Donation News</h1>
          <p class="ll-text-meta mb-0">Updates, campaigns, policy notes, and donor guidance for Vietnam.</p>
        </div>
        <span v-if="loadingLive" class="ll-live-badge">
          <span class="ll-live-dot" aria-hidden="true"></span>
          LIVE UPDATING
        </span>
      </div>
    </section>

    <section class="ll-toolbar reveal-header" data-delay="100ms">
      <div class="ll-form-group mb-2">
        <label for="news-search">Search News</label>
        <div class="ll-search-wrapper">
          <i class="bi bi-search ll-search-icon" aria-hidden="true"></i>
          <input id="news-search" v-model="searchQuery" class="form-control" type="search" placeholder="Search news date, title, content, or category">
        </div>
      </div>
      <p class="ll-text-meta mb-0">Showing {{ paginatedNews.length }} of {{ filteredNews.length }} articles</p>
    </section>

    <section v-if="paginatedNews.length > 0" class="d-grid gap-3">
      <article v-for="item in paginatedNews" :key="item.id" class="ll-card ll-news-card reveal-item">
        <div class="ll-news-meta">
          <span class="ll-news-date">{{ item.date }}</span>
          <span class="ll-badge ll-badge-category">{{ item.category }}</span>
        </div>
        <div class="ll-news-body d-flex flex-column align-items-start w-100">
          <h2>{{ item.title }}</h2>
          <p>{{ truncate(item.content) }}</p>
          <div class="d-flex justify-content-between align-items-center w-100 mt-3 flex-wrap gap-2">
            <a v-if="item.link" :href="item.link" target="_blank" rel="noopener" class="text-wine small d-inline-block fw-bold text-decoration-none">
              Read full article <i class="bi bi-box-arrow-up-right ms-1"></i>
            </a>
            <button
              type="button"
              class="btn btn-sm d-inline-flex align-items-center gap-1 ll-like-btn"
              :class="isLiked(item.id) ? 'll-like-btn--active' : 'll-like-btn--inactive'"
              @click="toggleLike(item.id)"
              :title="isLiked(item.id) ? 'Unlike this article' : 'Like this article'"
            >
              <i class="bi" :class="isLiked(item.id) ? 'bi-heart-fill' : 'bi-heart'"></i>
              <span>{{ getLikesCount(item) }}</span>
            </button>
          </div>
        </div>
      </article>
    </section>

    <div v-else class="ll-empty-state reveal-item">
      <div class="ll-empty-state__icon"><i class="bi bi-newspaper"></i></div>
      <div class="ll-empty-state__title">No news articles match your search.</div>
      <p class="ll-empty-state__body">Try another keyword or clear the search field.</p>
    </div>

    <PaginationControls
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="currentPage = $event"
    />
  </div>
</template>

<script setup>
/**
 * News.vue
 * Local JSON news list with dynamic RSS pre-fetch and live fallback.
 * Integrates dual-mode Social Likes:
 * - LocalStorage for guests
 * - Firestore for logged-in users
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import newsData from '@/data/news.json'
import PaginationControls from '@/components/PaginationControls.vue'
import { useAuth } from '@/composables/useAuth.js'
import { db } from '@/firebase.js'
import { collection, doc, setDoc, deleteDoc, query, onSnapshot } from 'firebase/firestore'

const ITEMS_PER_PAGE = 5
const { user } = useAuth()

// Sort locally cached news by date descending
const sortedLocalNews = [...newsData.news].sort((a, b) => new Date(b.date) - new Date(a.date))
const allNews = ref(sortedLocalNews)
const searchQuery = ref('')
const currentPage = ref(1)
const loadingLive = ref(false)

// Real-time Likes Sync State
const dbLikes = ref({})
const dbUserLikes = ref(new Set())
const guestLikes = ref(new Set())

function cleanHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || doc.body.innerText || ''
}

function parsePubDate(pubDateStr) {
  try {
    const d = new Date(pubDateStr)
    if (isNaN(d.getTime())) throw new Error('Invalid Date')
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (err) {
    return '2026-06-25'
  }
}

async function fetchLiveNews() {
  loadingLive.value = true
  try {
    const rssUrl = 'https://vietnamnews.vn/rss/health.rss'
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`

    const response = await fetch(proxyUrl)
    if (!response.ok) throw new Error('CORS proxy error')

    const xmlText = await response.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    const items = xmlDoc.getElementsByTagName('item')

    if (items.length === 0) throw new Error('No items inside RSS')

    const parsedNews = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const title = item.getElementsByTagName('title')[0]?.textContent || ''
      const description = item.getElementsByTagName('description')[0]?.textContent || ''
      const link = item.getElementsByTagName('link')[0]?.textContent || ''
      const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || ''

      const cleanDesc = cleanHtml(description)
      const formattedDate = parsePubDate(pubDate)

      // Strict topic filter: only include items containing blood donation keywords
      const searchText = (title + ' ' + cleanDesc).toLowerCase()
      const isBloodRelated = searchText.includes('blood') || 
                            searchText.includes('donor') || 
                            searchText.includes('donation') || 
                            searchText.includes('transfusion') || 
                            searchText.includes('hematology') || 
                            searchText.includes('red cross') || 
                            searchText.includes('red-cross')
      
      if (!isBloodRelated) continue

      let category = 'Tips'
      if (searchText.includes('policy') || searchText.includes('regulation') || searchText.includes('ministry')) {
        category = 'Policy'
      } else if (searchText.includes('urgent') || searchText.includes('shortage') || searchText.includes('critical')) {
        category = 'Emergency'
      } else if (searchText.includes('study') || searchText.includes('research') || searchText.includes('science') || searchText.includes('clinical')) {
        category = 'Research'
      } else if (searchText.includes('campaign') || searchText.includes('festival') || searchText.includes('drive')) {
        category = 'Campaign'
      }

      function sanitizeEnglishText(str) {
        if (!str) return ''
        return str
          .replace(/Việt Nam/g, 'Vietnam')
          .replace(/Viet Nam/g, 'Vietnam')
          .replace(/Hà Nội/g, 'Hanoi')
          .replace(/Ha Noi/g, 'Hanoi')
          .replace(/Hải Phòng/g, 'Hai Phong')
          .replace(/Trần Thanh Mẫn/g, 'Tran Thanh Man')
          .replace(/VNĐ/g, 'VND')
          .replace(/Hành trình Đỏ/g, 'Red Journey')
          .replace(/Chủ nhật đỏ/g, 'Red Sunday')
          .replace(/Xuân hồng/g, 'Red Spring')
          .replace(/Tết/g, 'Tet')
      }

      if (title && link.trim()) {
        const cleanTitle = sanitizeEnglishText(title.trim())
        const cleanContent = sanitizeEnglishText(cleanDesc)
        const uniqueId = 'rss_' + cleanTitle.substring(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '_')
        const defaultLikes = (cleanTitle.length % 15) + 3
        parsedNews.push({
          id: uniqueId,
          date: formattedDate,
          title: cleanTitle,
          content: cleanContent,
          link: link.trim(),
          category,
          likes: defaultLikes
        })
      }
    }

    if (parsedNews.length > 0) {
      // Merge RSS news with local verified news, avoiding duplicates by link
      const existingLinks = new Set(sortedLocalNews.map(n => n.link))
      const newItems = parsedNews.filter(n => !existingLinks.has(n.link))
      const combined = [...newItems, ...sortedLocalNews]
      combined.sort((a, b) => new Date(b.date) - new Date(a.date))
      allNews.value = combined
      console.log(`[News] Live fetched ${newItems.length} new blood donation articles. Total: ${combined.length}`)
    } else {
      console.log('[News] No live health articles matched blood donation filter. Using local fallback.')
    }
  } catch (err) {
    console.warn('[News] Live RSS fetch failed. Using news.json fallback.', err)
  } finally {
    loadingLive.value = false
  }
}

// Guest likes localStorage helper functions
function loadGuestLikes() {
  try {
    const saved = localStorage.getItem('likedNewsIds')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        guestLikes.value = new Set(parsed)
      }
    }
  } catch (err) {
    console.error('Failed to load guest likes:', err)
  }
}

function saveGuestLikes() {
  localStorage.setItem('likedNewsIds', JSON.stringify([...guestLikes.value]))
}

// Firestore real-time likes listener
let unsubscribeLikes = null
function setupLikesListener() {
  if (unsubscribeLikes) {
    unsubscribeLikes()
    unsubscribeLikes = null
  }

  const q = query(collection(db, 'newsLikes'))
  unsubscribeLikes = onSnapshot(q, (snapshot) => {
    const counts = {}
    const userLikesSet = new Set()

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      const nId = String(data.newsId)
      counts[nId] = (counts[nId] || 0) + 1

      if (user.value && data.userId === user.value.uid) {
        userLikesSet.add(nId)
      }
    })

    dbLikes.value = counts
    dbUserLikes.value = userLikesSet
  }, (err) => {
    console.error('Firestore newsLikes listener error:', err)
  })
}

// Like check / count helpers
function isLiked(newsId) {
  const idStr = String(newsId)
  if (user.value) {
    return dbUserLikes.value.has(idStr)
  } else {
    return guestLikes.value.has(idStr)
  }
}

function getLikesCount(item) {
  const idStr = String(item.id)
  const baseLikes = item.likes || 0
  const dbLikesCount = dbLikes.value[idStr] || 0
  let extra = 0
  if (!user.value && guestLikes.value.has(idStr)) {
    extra = 1
  }
  return baseLikes + dbLikesCount + extra
}

async function toggleLike(newsId) {
  const idStr = String(newsId)
  if (user.value) {
    const docId = `${user.value.uid}_${idStr}`
    const docRef = doc(db, 'newsLikes', docId)

    if (dbUserLikes.value.has(idStr)) {
      try {
        await deleteDoc(docRef)
      } catch (err) {
        console.error('Failed to delete like from Firestore:', err)
      }
    } else {
      try {
        await setDoc(docRef, {
          userId: user.value.uid,
          newsId: idStr,
          createdAt: new Date().toISOString()
        })
      } catch (err) {
        console.error('Failed to save like to Firestore:', err)
      }
    }
  } else {
    if (guestLikes.value.has(idStr)) {
      guestLikes.value.delete(idStr)
    } else {
      guestLikes.value.add(idStr)
    }
    saveGuestLikes()
  }
}

const filteredNews = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return allNews.value
  return allNews.value.filter(item =>
    item.date.includes(q) ||
    item.title.toLowerCase().includes(q) ||
    item.content.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredNews.value.length / ITEMS_PER_PAGE)))
const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredNews.value.slice(start, start + ITEMS_PER_PAGE)
})

function truncate(text) {
  return text.length > 180 ? `${text.slice(0, 180)}...` : text
}
import { useScrollReveal } from '@/composables/useScrollReveal.js'

const { reveal } = useScrollReveal()

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => {
    reveal('.reveal-item', 60)
  }, 50)
})

watch(user, () => {
  dbUserLikes.value = new Set()
  setupLikesListener()
})

watch([loadingLive, paginatedNews], ([newLoading, newNews]) => {
  if (!newLoading && newNews.length > 0) {
    setTimeout(() => {
      reveal('.reveal-item', 60)
    }, 50)
  }
}, { immediate: true })

onMounted(() => {
  reveal('.reveal-header', 60)
  fetchLiveNews()
  loadGuestLikes()
  setupLikesListener()
})

onUnmounted(() => {
  if (unsubscribeLikes) {
    unsubscribeLikes()
    unsubscribeLikes = null
  }
})
</script>

<style scoped>
.ll-news-card {
  display: grid;
  grid-template-columns: 220px 1fr;
}

.ll-news-meta {
  background: var(--ll-surface-alt);
  border-right: 1px solid var(--ll-slate-200);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.ll-news-date {
  color: var(--ll-wine-red);
  font-weight: 700;
}

.ll-news-body {
  padding: 1.25rem;
}

.ll-news-body h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ll-slate-900);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.ll-news-body p {
  color: var(--ll-slate-700);
  margin-bottom: 0;
}

.text-wine {
  color: var(--ll-wine-red);
}

.text-wine:hover {
  color: var(--ll-wine-dark);
  text-decoration: underline !important;
}

.ll-like-btn {
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: all var(--ll-transition);
  border: 1px solid var(--ll-slate-200);
}

.ll-like-btn--inactive {
  background-color: var(--ll-slate-50);
  color: var(--ll-slate-500);
}

.ll-like-btn--inactive:hover {
  background-color: var(--ll-wine-light);
  color: var(--ll-wine-red);
  border-color: rgba(142, 36, 53, 0.2);
}

.ll-like-btn--active {
  background-color: var(--ll-wine-light);
  color: var(--ll-wine-red);
  border-color: var(--ll-wine-red);
}

.ll-like-btn--active:hover {
  background-color: var(--ll-wine-red);
  color: #ffffff;
  border-color: var(--ll-wine-red);
}

@media (max-width: 767.98px) {
  .ll-news-card {
    grid-template-columns: 1fr;
  }
  .ll-news-meta {
    border-right: none;
    border-bottom: 1px solid var(--ll-slate-200);
  }
}
</style>
