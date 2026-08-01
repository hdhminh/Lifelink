# Full Code Reference for Live Coding

Đây là **toàn bộ code hoàn chỉnh** cho các phần bạn sẽ gõ live trong lúc quay video. 
Bạn có thể mở file này ở một bên màn hình để nhìn vào gõ theo.

---

## 📄 File 1: `src/composables/useLiveLocation.js`

```javascript
// 🔴 PHẦN 1: GÕ Ở ĐẦU FILE (Line 1 -> 5)
import { ref } from 'vue'

const userLocation = ref(null)
const locationError = ref(null)
const isLoading = ref(false)

// (Khung hàm dưới đây đã có sẵn shell)
export function useLiveLocation() {
  const requestLocation = () => {

    // 🔴 PHẦN 2: GÕ BÊN TRONG HÀM requestLocation (Line 11 -> 34)
    isLoading.value = true
    locationError.value = null

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
          isLoading.value = false
          resolve(userLocation.value)
        },
        (error) => {
          locationError.value = error.message
          isLoading.value = false
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      )
    })
  }

  return {
    userLocation,
    locationError,
    isLoading,
    requestLocation
  }
}
```

---

## 📄 File 2: `<script setup>` trong `src/views/LiveLocationDemo.vue`

```html
<!-- 🔴 PHẦN 3: GÕ VÀO THẺ <script setup> (Line 1 -> 18) -->
<script setup>
import { useLiveLocation } from '@/composables/useLiveLocation'
import LocationStatusBadge from '@/components/LocationStatusBadge.vue'

const {
  userLocation,
  locationError,
  isLoading,
  requestLocation
} = useLiveLocation()

const handleRequestLocation = async () => {
  try {
    await requestLocation()
  } catch (error) {
    console.error('Location request failed:', error)
  }
}
</script>
```
