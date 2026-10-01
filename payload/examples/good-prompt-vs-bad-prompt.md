# Prompts Bob can finish, and prompts it cannot

The difference is rarely politeness or length. It is whether the prompt names the
finish line, the scope, and the stopping condition.

## Example 1 — a feature

**Weak**

> Add authentication to the app.

Nothing here says which users, which mechanism, what "added" means, or whether
to touch the existing session code. Bob will make all of those choices silently.

**Strong**

> Add email-and-password authentication to the API.
>
> Done means: `POST /auth/register` and `POST /auth/login` exist, passwords are
> hashed with argon2, a successful login returns a 24-hour JWT, every route under
> `/api/private/*` rejects a missing or expired token with 401, and the test suite
> passes with coverage at or above 90%.
>
> Out of scope: password reset, OAuth, email verification.
>
> Stop and ask me only if the existing session code in `src/session.ts` conflicts
> with the token approach.

Three things are doing the work: the whole task in one message, an explicit
finish line, and a named stopping condition.

## Example 2 — research

**Weak**

> What's the best vector database for our project?

"Best" is unanswerable, so the answer will be a generic comparison the team
cannot act on.

**Strong**

> We need vector search over about 40,000 document chunks, queried maybe 50 times
> a day, running on a free or student tier, and it has to be set up by one person
> in an afternoon.
>
> Compare at most four options against exactly those constraints. Use Firecrawl
> for current pricing and limits — do not answer from memory. Give me a table,
> then a one-paragraph recommendation. Mark anything you could not confirm and
> say where you looked.

## Example 3 — debugging

**Weak**

> The tests are failing, fix them.

**Strong**

> `npm test` fails on `test/retrieval.test.ts` with the output below.
>
> Diagnose before you edit: tell me whether the test or the implementation is
> wrong, and why. Then fix that one. Do not change the assertion to make it pass
> unless you can explain why the assertion was wrong.
>
> ```
> <paste the actual output>
> ```

## Example 4 — a big sweep

**Weak**

> Review the whole codebase for problems.

Loads everything into context, and returns generic advice.

**Strong**

> Audit every module under `src/services/` for unhandled promise rejections.
>
> Give each service to its own subagent. When a subagent reports back, check its
> evidence before you accept it — read the line it cites.
>
> Finish with one table: service, affected yes or no, file and line, and the
> evidence. Keep the running list in `TASKS.md`.

## The checklist

- [ ] The whole task is in one message.
- [ ] "Done" is stated in terms someone could check.
- [ ] Out of scope is named.
- [ ] The stopping condition is explicit.
- [ ] Factual claims are routed to Firecrawl rather than memory.
- [ ] Wide work is split across subagents, with evidence verified on return.
- [ ] No "think carefully" — it wastes tokens and delays the first useful output.
