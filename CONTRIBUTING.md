# Contributing to LifeLink

Thank you for your interest in contributing to LifeLink! We welcome contributions to improve the coordination of emergency blood donations in Vietnam.

## Code of Conduct
We expect all contributors to adhere to standard respectful behavior when interacting in our repository.

## How to Contribute

1. **Fork the Repository** on GitHub.
2. **Clone your Fork** locally:
   ```bash
   git clone https://github.com/your-username/LifeLink.git
   cd LifeLink
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Firebase configuration parameters.
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-awesome-feature
   ```
6. **Implement Your Changes**:
   Ensure all changes are clean, formatted, and properly linted.
7. **Write and Run Tests**:
   Before submitting, run all unit and rule tests to ensure no regressions:
   ```bash
   npm test
   ```
8. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   git push origin feature/your-awesome-feature
   ```
9. **Submit a Pull Request (PR)**:
   Ensure your description clearly details the motivation, implementation, and verification steps.

## Coding Conventions
- Use standard Vue 3 Composition API with `<script setup>`.
- Style elements using custom CSS or Bootstrap 5 utilities.
- Avoid inline styling where possible.
- Adhere to the established beige and wine red theme for design consistency.
