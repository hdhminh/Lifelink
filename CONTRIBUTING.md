# Contributing to LifeLink 🤝

Thank you for your interest in contributing to LifeLink! We welcome community contributions to help improve emergency blood donor coordination in Vietnam.

---

## 🛠️ Development Workflow

To ensure a smooth collaboration process, please follow these steps:

### 1. Fork and Clone
Fork the repository on GitHub and clone your fork locally:
```bash
git clone https://github.com/your-username/Lifelink.git
cd Lifelink
```

### 2. Environment Configuration
Copy the environment variables template and configure your local settings:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Create a Feature Branch
```bash
git checkout -b feature/your-awesome-feature
```

---

## 🧪 Testing Guidelines

Before committing or submitting a Pull Request, verify that all test suites pass without regressions:

- **Unit & Integration Tests (Vitest)**:
  ```bash
  npm run test:unit
  ```
- **Firestore Security Rules Tests**:
  ```bash
  npm run test:rules
  ```
- **End-to-End Tests (Playwright)**:
  ```bash
  npm run test:e2e
  ```
- **Run All Tests**:
  ```bash
  npm run test:all
  ```

---

## 📏 Coding Standards

To maintain code quality and styling consistency, please ensure your changes adhere to these rules:

- **Component Structure**: Use Vue 3 Composition API with `<script setup>` syntax for all new components.
- **Styling**: Style elements using scoped CSS or standard Bootstrap 5 utility classes. Avoid inline styling.
- **Theme Consistency**: Maintain the application's signature warm beige and deep crimson wine theme.
- **Linting & Formatting**: Clean and format your code using the built-in tooling before pushing:
  ```bash
  npm run lint:fix
  npm run format
  ```

---

## 🚀 Submitting Your Changes

1. **Commit your modifications** with a descriptive commit message:
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   ```
2. **Push to your fork**:
   ```bash
   git push origin feature/your-awesome-feature
   ```
3. **Submit a Pull Request (PR)**: Target the main repository's `main` branch. Provide a clear description detailing your modifications and verification steps.
