# Family Jetlag Planner ✈️

**A personalized jet lag plan for the whole family. Shift sleep gradually before you fly, with reminders at the right moments.**

> 🚧 Working prototype · iOS via Expo Go · Built by a PM with Claude Code

<p align="center">
  <img width="240" alt="Add a trip" src="https://github.com/user-attachments/assets/9f67eb08-8337-4ca3-8f1d-6580de3ff620" />
  <img width="240" alt="Traveler schedules" src="https://github.com/user-attachments/assets/3b13fb5a-b2bc-4948-8fba-106f0460acbd" />
  <img width="240" alt="Reminders" src="https://github.com/user-attachments/assets/028ae4ce-e1fc-481b-bc0b-97e528184cbc" />
</p>
<p align="center"><sub>1. Add a trip &nbsp;·&nbsp; 2. Set each traveler's routine &nbsp;·&nbsp; 3. Get reminders on the right day and time</sub></p>

---

## 💡 The Problem

My family flies between the US and Asia several times a year, and every trip costs days of jet lag.

The apps I tried had three gaps:
- **Built for one business traveler.** They don't account for kids, whose sleep is less flexible.
- **Generic.** The advice ignores when *you* actually sleep and eat.
- **Too aggressive.** Plans that demand big schedule changes don't get followed, especially with children.

## 🎯 The Solution

A planner that starts from each traveler's real routine and shifts it gradually in the days before departure, small enough that a family will actually stick to it.

**How it works**
1. **Add a trip:** name, origin and destination time zones, departure date and time.
2. **Add travelers:** who's going, and their usual bedtime and wake time.
3. **Get a day-by-day plan** tied to real calendar dates, with notifications when it's time to shift.

## 🧭 Key Product Decisions

| Decision | Why |
|---|---|
| **Smaller daily shifts for kids:** about 30 min/day for adults, 20 min/day for children | Children tolerate less disruption, and a plan a child can't follow fails the whole family. |
| **Plan intensity scales with the time difference:** 0–2 hrs means no plan; 3 hrs means light prep; 4–6 hrs means a full 3-day plan; 7+ hrs means a full plan plus an honest note | Avoids over-prescribing for short trips, and sets realistic expectations when 3 days can't close a 10+ hour gap. |
| **3-day pre-trip window** | Long enough to matter, short enough that busy families will commit to it. |
| **No AI or external API for time-zone math.** It uses the built-in `Intl` API, with daylight saving time handled. | Deterministic, offline, free, and correct. AI went into *building* the app, not into parts that need exact answers. |
| **Data stays on the device** (AsyncStorage) | No accounts or backend for a prototype, and family schedules stay private. |

## ✨ Product Principles

- **Personalized:** built around each person's actual sleep schedule.
- **Family-first:** adults and children get different plans.
- **Gradual:** small, manageable changes over unrealistic overhauls.
- **Practical:** if people won't follow it, it isn't a good recommendation.

## 🛠️ Built With

- **React Native + Expo** (Expo Router, TypeScript)
- **Claude Code** for AI-assisted development: I define the product and make the decisions, and Claude Code helps implement them
- `Intl.DateTimeFormat` for DST-aware time-zone math · AsyncStorage for on-device storage · Expo Notifications

## ▶️ Run It Locally

```bash
git clone https://github.com/weiwu1800/Jetlag-planner.git
cd Jetlag-planner
npm install
npx expo start
```
Scan the QR code with **Expo Go** on your iPhone.

## 🗺️ What's Next

- [ ] Meal timing: shift breakfast, lunch, and dinner alongside sleep
- [ ] Refine schedule generation for very large gaps and westward trips
- [ ] Richer family profiles and per-person routines
- [ ] Test with real traveling families and iterate on feedback
- [ ] TestFlight beta for wider distribution

## 👩‍💻 Why I'm Building This

This started as my own family's problem. Instead of settling for existing tools, I built the one I wanted.

I'm a product manager exploring how AI-assisted development changes the job: going from writing specs to discovering the problem, deciding the tradeoffs, and shipping a working product myself.

**Feedback welcome.** Open an issue or reach me on [LinkedIn](https://www.linkedin.com/in/weiwu11).
