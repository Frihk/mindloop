# Roadmap & Feature Requests

## 1. Focus Soundscapes (Brown Noise Generator)
**Type:** Feature  
**Priority:** High  
**Context:** ADHD brains often struggle with absolute silence or irregular background noise. "Brown Noise" is effective for calming the mind.
**Description:** 
Add a "Soundscape" toggle in the Focus Session page (`web/templates/focus.html`).
*   **Implementation:** Use the Web Audio API to generate Brown, Pink, and White noise directly in the browser.
*   **Benefits:** No external assets needed, helps mask distractions.

## 2. Gamified Feedback (Confetti & XP)
**Type:** Enhancement  
**Priority:** Medium  
**Context:** Immediate positive feedback is crucial for maintaining motivation (dopamine reinforcement).
**Description:** 
Trigger a visual "Confetti" explosion when a user successfully completes a Habit or finishes a Focus Session.
*   **Implementation:** Add a lightweight JavaScript particle system to `web/templates/habits.html` and `focus.html`.

## 3. "Quick Capture" Widget
**Type:** Feature  
**Priority:** Medium  
**Context:** "Out of sight, out of mind." Users need to log thoughts instantly without navigating menus.
**Description:** 
Add a simple text input on the Dashboard (`home.html`) that instantly saves a "Quick Note" to the Journal.
*   **Implementation:** A form on the home page that POSTs to `/journal/quick`.
