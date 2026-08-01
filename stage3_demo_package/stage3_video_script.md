# Stage 3 Video Script — Huynh Doan Hoang Minh (Bản Lời Thoại Thuần)

**Mục đích:** File này CHỈ CHỨA LỜI THOẠI VÀ HÀNH ĐỘNG để bạn nhìn đọc khi quay. 
*(Nếu muốn xem code mẫu đầy đủ để gõ theo, mở file stage3_full_code.md)*.

---

## 🎬 KỊCH BẢN NÓI & HÀNH ĐỘNG

### Phase 1 — Giới thiệu (0:00 – 1:00)

🗣️ **Nói:**
> "Hello everyone, my name is Huynh Doan Hoang Minh. For Stage 3, I will demonstrate a Vue 3 Composition API technique called module-scoped shared reactive state."
>
> "LifeLink uses browser location in its donor tracking experience. Instead of placing geolocation logic directly inside a component, I will create a reusable composable."
>
> "The composable will request the current location, store it reactively, and allow two separate Vue components to read the same state."

*👉 Chuyển ngay sang VS Code.*

---

### Phase 2 — Live-code Shared Reactive State (1:00 – 2:30)

*👉 Mở file `useLiveLocation.js`. Đặt con trỏ ở đầu file và gõ `import { ref }...` và 3 biến `ref`:*

🗣️ **Nói & Gõ (`import { ref } from 'vue'`...):**
> "I am declaring these reactive refs at module scope, outside the composable function. Because an ES module is evaluated once for each module instance, any component importing this file receives the exact same reactive references."

---

### Phase 3 — Live-code Promise Wrapper (2:30 – 7:00)

*👉 Đưa con trỏ vào bên trong hàm `requestLocation()` trong file `useLiveLocation.js` và gõ từng bước:*

#### Bước 1: Khởi tạo state
🗣️ **Nói & Gõ (`isLoading.value = true...`):**
> "When the location request starts, I set isLoading to true and clear any previous error."

#### Bước 2: Bọc Promise
🗣️ **Nói & Gõ (`return new Promise(...)`):**
> "The browser Geolocation API uses callbacks. I will wrap it in a Promise so components can use async and await."

#### Bước 3: Gọi API vị trí
🗣️ **Nói & Gõ (`navigator.geolocation.getCurrentPosition(...)`):**
> "Now I call navigator.geolocation.getCurrentPosition to request the current coordinates."

#### Bước 4: Xử lý thành công
🗣️ **Nói & Gõ (Phần success callback `position => ...`):**
> "When it succeeds, I store latitude, longitude, and accuracy in the shared userLocation ref, set isLoading to false, and resolve the Promise."

#### Bước 5: Xử lý thất bại
🗣️ **Nói & Gõ (Phần error callback `error => ...`):**
> "If the user denies permission or the lookup fails, I update locationError and reject the Promise."

#### Bước 6: Truyền Options
🗣️ **Nói & Gõ (Phần options `{ enableHighAccuracy: true... }`):**
> "Finally, I pass geolocation options for high accuracy and a twenty-second timeout."

🗣️ **Nói chốt:**
> "The browser API logic is now cleanly isolated and exposed through a single Promise-based function."

---

### Phase 4 — Independent Component (7:00 – 7:45)

*👉 Mở file `LocationStatusBadge.vue`. Chỉ chuột bôi đen 2 dòng import và phần template.*

🗣️ **Nói:**
> "This badge component imports the composable independently. It receives no location through props, yet its template automatically displays the location when our shared userLocation ref updates."

---

### Phase 5 — Live-code Main View Script (7:45 – 10:15)

*👉 Mở file `LiveLocationDemo.vue`. Đặt con trỏ vào thẻ `<script setup>` và gõ phần script:*

🗣️ **Nói & Gõ (`import` & destructure `useLiveLocation`):**
> "The main view imports the same composable and the independent badge component."

🗣️ **Nói & Gõ (`const handleRequestLocation = async () => ...`):**
> "Because requestLocation returns a Promise, handleRequestLocation uses async and await with a try/catch block to handle errors gracefully."

*👉 Chỉ chuột vào template HTML đã chuẩn bị sẵn ở dưới (`@click`, `:disabled`, `v-if="userLocation"`):*

🗣️ **Nói:**
> "The template reacts to the loading, success, and error states. The badge below reads the same state independently."

---

### Phase 6 — Browser Demonstration (10:15 – 11:45)

*👉 Mở Tab Ẩn Danh, truy cập `http://localhost:5173/#/stage3-demo`.*

🗣️ **Nói:**
> "Initially, neither component has a location."

*👉 Bấm nút "Request Location".*

🗣️ **Nói:**
> "Clicking the button activates the loading state."

*👉 Chờ 1s -> Bấm Allow.*

🗣️ **Nói:**
> "Once permission is granted, the composable updates our single shared reactive ref."

*👉 Chỉ chuột tọa độ ở Main Component -> Chỉ tọa độ ở Badge bên dưới:*

🗣️ **Nói:**
> "Both the main view and the independent badge update simultaneously from the exact same state, without props or emitted events."

---

### Phase 7 — Liên hệ với LifeLink (11:45 – 12:30)

*👉 Chuyển sang Tab trình duyệt thứ 2 đang mở trang Live Map thật của LifeLink.*

🗣️ **Nói:**
> "LifeLink applies this exact composable approach to keep browser location logic separate from the map interface. In the full application, temporary donor location supports the responder marker, distance, ETA, and tracking status."

*👉 Chỉ nhanh vào: Marker -> Responder panel -> Distance / ETA.*

---

### Phase 8 — Conclusion (12:30 – 13:00)

🗣️ **Nói:**
> "In this demonstration, I created a reusable geolocation composable, wrapped a callback-based browser API in a Promise, and shared reactive state across two independent Vue components."
>
> "This keeps browser logic outside the interface and makes the feature easier to reuse and maintain. Thank you for watching."
