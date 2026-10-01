# Demo Day

**December 1st, 2026.** Live, in front of an audience.

Read this in week one, not week eleven. Several things on it are cheap now and
expensive later.

---

## Assume the worst

The network is bad. The projector is the wrong aspect ratio. Someone asks the one
question nobody prepared for. Your laptop decides to update.

Everything works on the author's machine, on their network, with their cached
state. **The demo runs on none of those.**

---

## Write the script as a file

`docs/demo-script.md`. Minute by minute, with the exact words for the opening and
closing, and the literal inputs you will type.

A demo improvised from a slide deck goes wrong in a way a scripted one does not.

For each beat: what the audience sees, what you say, and what has to be true
beforehand for it to work.

---

## Find what kills it, then fix those things

| Failure | Fix |
| --- | --- |
| A live API call during the demo | Cache the response, or ship a recorded fixture behind a flag. Decide **now** which |
| Needs the network | Make the critical path work offline, or have a fallback you have actually tested offline |
| Cold start slowness | Warm it before you present; or make the slow step show real progress, not a spinner |
| An empty state nobody looked at | Seed realistic demo data, committed and reproducible |
| An error path nobody has seen | Trigger it on purpose. A handled error on stage is fine; a stack trace is not |
| Works on one person's laptop only | Run the setup from a clean checkout on a second machine |

---

## Rehearse the questions

`docs/demo-qa.md`. Write honest answers to the questions that will actually come.

**"How do you know it works?"**
Your eval numbers, with the confidence interval and the sample size. This is why
[the evals stage](Testing-and-Evals) exists. Without it this question ends badly.

**"What happens to our data?"**
Retention, where it is stored, who can see it.

**"What did you build versus what did you use?"**
Be exact. Claiming a library's work is the fastest way to lose an audience's
trust, and the people watching will know.

**"What does it cost to run?"**
A real per-user number.

**"What doesn't it do yet?"**
Your out-of-scope list, said with confidence. **Naming your limits reads as
command of the problem**, not weakness. Hedging reads as not knowing.

**"Why not just use [obvious alternative]?"**
The evidence from `references/evidence.md`. This is where discovery pays off: you
checked in week one, so you have a real answer instead of an opinion.

---

## Do a real dry run

Clean checkout. Clean machine. Run the published setup. Follow the script start
to finish. **Time it.**

Note every place a human had to improvise, and fix those — under pressure nobody
improvises as well as they do in rehearsal.

Then run it once more with something deliberately broken. Unplug the network
mid-demo. Practise the recovery sentence until it is boring.

---

## The week before

- [ ] Demo runs end to end on a machine that is not the author's
- [ ] Every number you will say aloud traces to an eval run or an evidence file
- [ ] `docs/demo-qa.md` written, and someone else has read it
- [ ] Timed against your slot, with slack
- [ ] The most likely failure has a rehearsed recovery
- [ ] Demo data seeded, committed and reproducible
- [ ] Someone other than the builder has run the setup from scratch

---

## On the day

Open with **the problem**, not your architecture. The audience needs to care
before they can be impressed.

Show the thing working. Then show it failing *gracefully*, if you have time —
this impresses technical audiences far more than a flawless happy path, because
everyone in the room knows the happy path was rehearsed.

Close with what you would do next and what you learned. **You are being assessed
on method as much as output**: the evidence file, the glossary, the spec, the
tests, the evals and the rehearsal are the method, and they are all visible in
your repository.

---

## Use the skill

```
$demo-rehearsal
```

It walks all of this, writes the script and the Q&A, and reports what is still
unfixed.
