# Implementation Plan: User Registration & 4-Digit Email Verification Flow — EquiWage Analytics

## 1. Module Purpose & Architectural Freedom
Implement a complete user registration flow with a 4-digit email verification code for **EquiWage Analytics** within the current Monorepo architecture (`apps/frontend`, `apps/backend`, and `packages/shared`)[cite: 4].

You have total architectural freedom to decide how to structure the files, controllers, services, database tables, hooks, and components, provided you strictly follow the navigation flow, tech stack, and visual design system defined below[cite: 4, 6].

---

## 2. Navigation & User Experience Flow (UX)
1. **Default Entry Point (`/login`):**
   * The application must always open on the **Login** view by default when no active session exists.
   * Include a clear secondary action button or interactive link on the Login card: *"Don't have an account? Sign up"* / *"Create Account"* that navigates to the registration view.
2. **Registration Interface (`/register`):**
   * Must follow the exact same layout and card aesthetics as the Login screen.
   * Required form fields & validations:
     * **First Name & Last Name:** Required text inputs (either two separate inputs in a 2-column row or validated full name fields).
     * **Email Address:** Strict valid email format validation (regex/pattern check and visual error feedback if invalid).
     * **Password:** Secure password input with visibility toggle icon.
     * **Confirm Password:** Real-time matching validation against the Password field before allowing submission.
   * Primary CTA Button: *"Create Account"*.
   * Secondary link to return: *"Already have an account? Sign in"*.
3. **4-Digit Email Verification Step:**
   * Upon filling out valid data and clicking *"Create Account"*, the system must generate and send a **4-digit numeric verification code** to the provided email address.
   * The UI must smoothly transition to a **Verification View / Step** where the user enters the 4-digit code (4 individual digit inputs with auto-focus progression and paste support).
   * Once the 4-digit code is validated against the backend, the user account is officially created/activated, and the user is either logged in or redirected to the Login screen with a success confirmation badge (`#10B981`)[cite: 1, 3, 6].

---

## 3. What to Use in the Backend (`apps/backend`)
* **Runtime & Database:** Node.js with TypeScript, Express.js, and local **SQLite (`better-sqlite3`)** persistence[cite: 4].
* **Database Schema Updates:**
  * Support storing user profiles (First Name, Last Name, Email, Encrypted Password, Verification Status) and temporary 4-digit verification codes with expiration timestamps.
* **Security & Validation:**
  * Password hashing (`bcryptjs` or Node native `crypto`).
  * Server-side validation for valid email format and password confirmation matching.
* **Email Delivery Service:**
  * Use an email transport library such as **`nodemailer`** configured via `.env` environment variables (SMTP host, port, user, pass)[cite: 4].
  * Include a development fallback (e.g., Ethereal Email or clear console output of the 4-digit code if SMTP credentials are not yet configured in `.env`) so local testing never breaks[cite: 4].
  * Send a clean, branded HTML email template featuring the 4-digit verification code.

---

## 4. What to Use in the Shared Package (`packages/shared`)
* **Data Contracts (TypeScript):** Shared interfaces/DTOs for registration payloads (`firstName`, `lastName`, `email`, `password`, `confirmPassword`), 4-digit verification requests (`email`, `code`), and API responses[cite: 4].

---

## 5. What to Use in the Frontend (`apps/frontend`)
* **Routing & State:** `react-router-dom` (ensuring `/login` is the default unauthenticated route and adding `/register` / verification step) and React Context (`AuthContext`)[cite: 4, 6].
* **UI & Motion Libraries:**
  * **`lucide-react`:** Minimalist icons for user, mail, lock, eye/eye-off password toggles, and verification shield/checkmarks[cite: 3, 6].
  * **`framer-motion`:** Smooth transitions between the Login card, Registration form, and the 4-Digit Verification step[cite: 3, 6].
  * **`clsx` & `tailwind-merge`:** Dynamic styling for input focus rings, valid states, and error states[cite: 3, 6].

---

## 6. Design System & Visual Identity (Mandatory)
The Registration and Verification interfaces must strictly match the Login screen and the project's **Warm Enterprise / Soft UI** aesthetic[cite: 1, 3, 6]:

* **Canvas & Card Surfaces:**
  * Light mode background in warm light gray (`bg-background` / `#F9FAFB`) and main form container in a solid pure white card (`bg-surface` / `#FFFFFF`), `24px` border radius (`rounded-xl` / `rounded-[24px]`), and diffuse ambient shadow (`shadow-soft`: `0px 10px 30px rgba(0, 0, 0, 0.04)`)[cite: 1, 3, 6].
  * Full compatibility with the project's **Dark Mode** (dark gray canvas and card surfaces with high-contrast text)[cite: 4].
  * **Strict Rule:** ZERO *glassmorphism*, ZERO transparencies, and ZERO crypto-wallet aesthetics[cite: 1, 3, 6].
* **Brand Colors & Controls:**
  * Primary buttons (*"Create Account"*, *"Verify Code"*) must be pill-shaped (`rounded-pill` / `rounded-full`) using the vibrant corporate orange (`#F97316`) with `#EA580C` on hover[cite: 1, 3, 6].
  * Input fields with clean subtle borders (`#E5E7EB`), focusing with the primary orange ring (`#F97316`).
  * Validation errors (invalid email, mismatched passwords, wrong or expired 4-digit code) must use the semantic danger color (`#EF4444`)[cite: 1, 3, 6].
  * Success states (verified account) must use the semantic success green (`#10B981`)[cite: 1, 3, 6].
* **UX Copywriting Rule:**
  * Never display technical engineering codes (like `"RF-001"` or `"RNF-001"`) in the UI[cite: 3, 6]. Use clear, professional HR terminology[cite: 1, 3, 6].