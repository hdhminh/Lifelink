<template>
  <Teleport to="body">
    <Transition name="loader-curtain">
      <div v-if="isLoading" class="ll-global-loader-overlay">
        <div class="ll-loader-content">
          <!-- Animated SVG "Draw a Path" Heart & Pulse Emblem -->
          <div class="ll-svg-draw-container mb-3">
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="ll-draw-path-svg"
            >
              <!-- Background subtle glow circle -->
              <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
              
              <!-- Draw a path 1: Heart Outline -->
              <path
                class="ll-path-heart"
                d="M50 82 C20 62, 10 40, 26 24 C36 14, 46 22, 50 28 C54 22, 64 14, 74 24 C90 40, 80 62, 50 82 Z"
                stroke="url(#heartGrad)"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Draw a path 2: ECG Heartbeat Pulse Line through Heart -->
              <path
                class="ll-path-ecg"
                d="M15 50 H36 L42 36 L50 64 L58 32 L64 50 H85"
                stroke="#ffffff"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Gradient Defs -->
              <defs>
                <linearGradient id="heartGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#FF4D6D" />
                  <stop offset="100%" stop-color="#8E2435" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <!-- Staggered Animated Brand Name -->
          <div class="ll-loader-text-wrapper">
            <h3 class="ll-loader-title m-0">
              <span class="ll-letter" style="--i:0">L</span>
              <span class="ll-letter" style="--i:1">i</span>
              <span class="ll-letter" style="--i:2">f</span>
              <span class="ll-letter" style="--i:3">e</span>
              <span class="ll-letter ll-letter--accent" style="--i:4">L</span>
              <span class="ll-letter ll-letter--accent" style="--i:5">i</span>
              <span class="ll-letter ll-letter--accent" style="--i:6">n</span>
              <span class="ll-letter ll-letter--accent" style="--i:7">k</span>
            </h3>
            <p class="ll-loader-subtitle mt-2 mb-0">CONNECTING LIVES • EMERGENCY NETWORK</p>
          </div>

          <!-- Sleek Progress Bar Line -->
          <div class="ll-loader-bar-bg mt-4">
            <div class="ll-loader-bar-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isLoading = ref(true)
const progress = ref(0)

onMounted(() => {
  // Simulate initial SVG Path Drawing progress from 0% to 100%
  const duration = 1400 // 1.4s
  const intervalTime = 20
  const step = (100 / (duration / intervalTime))

  const timer = setInterval(() => {
    progress.value += step
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(timer)
      setTimeout(() => {
        isLoading.value = false
      }, 300)
    }
  }, intervalTime)
})
</script>

<style scoped>
.ll-global-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #120A0C;
  background-image: radial-gradient(circle at 50% 40%, rgba(142, 36, 53, 0.25), transparent 70%);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

.ll-loader-content {
  display: flex;
  flex-column: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

/* SVG "Draw a Path" Keyframe Animations */
.ll-path-heart {
  stroke-dasharray: 280;
  stroke-dashoffset: 280;
  animation: drawHeartPath 1.3s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

.ll-path-ecg {
  stroke-dasharray: 180;
  stroke-dashoffset: 180;
  animation: drawEcgPath 1.2s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards;
}

@keyframes drawHeartPath {
  0% {
    stroke-dashoffset: 280;
    fill: transparent;
  }
  80% {
    stroke-dashoffset: 0;
    fill: transparent;
  }
  100% {
    stroke-dashoffset: 0;
    fill: rgba(142, 36, 53, 0.15);
  }
}

@keyframes drawEcgPath {
  0% {
    stroke-dashoffset: 180;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

/* Animated Letter Stagger */
.ll-loader-title {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 2px;
}

.ll-letter {
  display: inline-block;
  opacity: 0;
  transform: translateY(12px) scale(0.8);
  animation: letterPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(0.1s + var(--i) * 0.06s);
}

.ll-letter--accent {
  color: #FF4D6D;
}

@keyframes letterPop {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ll-loader-subtitle {
  font-size: 0.72rem;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

/* Progress bar fill */
.ll-loader-bar-bg {
  width: 180px;
  height: 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  overflow: hidden;
}

.ll-loader-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8E2435, #FF4D6D);
  border-radius: 4px;
  transition: width 0.05s linear;
  box-shadow: 0 0 10px rgba(255, 77, 109, 0.8);
}

/* Curtain Lift Transition */
.loader-curtain-leave-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.76, 0, 0.24, 1);
}

.loader-curtain-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
