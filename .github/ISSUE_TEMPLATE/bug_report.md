---
name: Something went wrong
about: The setup script failed, or Bob is not picking the kit up
title: ''
labels: bug
---

## What happened

## What you expected instead

## Which script you ran

- [ ] `scripts/install-macos-intel.sh`
- [ ] `scripts/install-macos-apple-silicon.sh`
- [ ] `scripts/install-linux.sh`
- [ ] `scripts/install-windows.ps1`

## Your setup

Run these and paste the output:

```
node --version
git --version
uname -a          # macOS and Linux
$PSVersionTable   # Windows
```

## The output

Paste the whole thing, including the lines before the error.

```

```

## What `--verify` says

```
# from inside your project, using your platform's script
./scripts/install-linux.sh --verify
```

```

```

## If Bob is not loading a skill

Bob skips an invalid skill folder silently, so check these before filing:

- [ ] I asked Bob directly which skills it loaded
- [ ] I restarted Bob after installing
- [ ] The folder is trusted (`/permissions`)
- [ ] `/mcp` shows whether `firecrawl` is connected
