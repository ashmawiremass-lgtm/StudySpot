# StudySpot – Study Room Booking (CPIS-358 Assignment 1)

Static website built with HTML, CSS and JavaScript. Theme: deep green + orange.

## Run it
1. Unzip and open the `studyspot` folder in VS Code (File > Open Folder).
2. Install the **Live Server** extension, right-click `index.html`, choose **Open with Live Server**.
   (Or just double-click `index.html`.)

Terminal option: `python3 -m http.server 8000` inside the folder, then open http://localhost:8000

## Pages
- `index.html` – Home: search (step 1), results (step 2), My bookings (step 3), the idea, numbers, room table
- `login.html` – Login
- `signup.html` – Sign Up
- `about.html` – About Us (mission, team, who did what, numbers)

## Demo login
`demo@stu.kau.edu.sa` / `Demo@1234` (or create your own account on the sign-up page).
Accounts and bookings are saved in the browser (localStorage). Availability is simulated.

## Test the booking
Log in, go to Home, choose a room type, duration and date, press **Find space**, tap a start time, confirm.
The booking appears under **My bookings**, where you can cancel it.

## Edit before submitting
- `about.html`: check the roles in the team cards and the "Who did what" table match what each of you really did.
- Pictures: the room images are 3D renders, not photographs. To use REAL photos, download free ones (Unsplash or Pexels,
  search "study room", "library study room", "meeting room", "computer lab"), crop them, and replace these files keeping the same names:
  `images/hero-room.jpg` (landscape, about 1600x1100), `images/room-pod.jpg`, `images/room-study.jpg`, `images/room-meeting.jpg` (about 1200x750).
  No code changes needed. Credit the photographers in the report.

## Features added
- **Saved choices:** your last search (room type, duration, date) is remembered. If you tap a time before logging in,
  the room and time are saved and the confirm window reopens right after login.
- **My bookings** belong to the logged-in account (log out and they are hidden).
- **Reminders:** each booking can remind you 15, 30 or 60 minutes before. A banner shows on every page, a browser
  notification appears if you allow it (while the site is open), and **Calendar** downloads an .ics file with an alarm.
- **Google Maps:** the Home page has a map section and every room card has "Show on map". The pins come from the
  building names in `BUILDINGS` at the top of `js/main.js`; change the `query` text to the exact place if needed.
- **Favicon:** `favicon.ico` in the project root plus `images/brand-icon-*.png`, linked in every page head (`?v=5` forces a fresh download). Tab icons need the site to be served (Live Server or GitHub Pages), not opened from a file.

## GitHub steps
1. Create a repository and upload this folder's contents (or `git init`, `git add .`, `git commit`, `git push`).
2. Both members commit from their own accounts so each contribution calendar shows activity.
3. Settings > Pages > Branch: `main`, folder `/ (root)` > Save. Wait 1–2 minutes for the public URL.
4. Settings > Collaborators > invite `ssbasabain@kau.edu.sa`.
5. Screenshot each member's contribution calendar for the report.

## Rubric checklist
| Requirement | Where |
|---|---|
| Image + image map to About Us | hero picture on every page (`<img usemap>` + `<map>`) |
| Links between pages / internal links | menu, footer, `#search`, `#results`, "Back to top" |
| Lists and tables | `index.html`, `about.html` |
| Forms | `login.html`, `signup.html`, search form, booking modal |
| Inline / internal / external CSS | `style=""` attributes, `<style>` in index and about, `css/style.css` |
| General classes | `.card`, `.btn`, `.badge`, `.time-chip` |
| z-index layering | header, hero chip and overlays, search bar, modal, toast |
| Shadows and borders | cards, buttons, hero picture |
| Master page and menu | same header, menu and footer on all pages |
| JS: dynamic picture/text | room-type picture and text, greeting and open/closed status |
| JS: form validation | `initLogin`, `initSignup` |
| JS: dynamic elements | room cards, time chips, bookings table, toast |
| JS: functions/events | `js/main.js` |
| JS: control statements/loops | if/else, for and while in `main.js` |
| Embedded + external script | inline `<script>` in `index.html`, `js/main.js` |
