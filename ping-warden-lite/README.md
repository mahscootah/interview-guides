# Ping Warden Lite

A personal, no-frills recreation of [Ping Warden](https://github.com/oliverames/ping-warden)
for macOS. It keeps **AWDL** (`awdl0`, the interface behind AirDrop, AirPlay, Handoff
and Sidecar) down while you game or take calls. AWDL's periodic channel hopping is a
well-known cause of Wi-Fi latency spikes.

What you get versus the full app:

| Ping Warden | Lite |
| --- | --- |
| Privileged helper, event-driven (AF_ROUTE) | `awdl-warden` root daemon, same AF_ROUTE + periodic reconcile approach |
| Menu bar toggle / Control Center | `pingwarden on/off/toggle` CLI, plus an optional SwiftBar plugin |
| 10-minute quick pause | `pingwarden pause [minutes]` |
| Intervention counter | `pingwarden status` |
| Latency / jitter dashboard | `pingwarden ping [host] [count]` |
| Restores AWDL when stopped | Yes, on `off`, pause, daemon stop, and uninstall |
| Game Mode auto-detect, Sparkle updates, licensing | Not included |

## Install

Requires the Xcode Command Line Tools (`xcode-select --install`).

```bash
cd ping-warden-lite
make
sudo make install
```

This installs:

- `/usr/local/libexec/awdl-warden`, the root daemon
- `/usr/local/bin/pingwarden`, the CLI
- `/Library/LaunchDaemons/local.pingwarden.awdl-warden.plist`, which starts the daemon at boot
- `/usr/local/var/ping-warden/`, the state directory, owned by you so toggling needs no `sudo`

Protection starts **off**.

## Use

```bash
pingwarden on          # AWDL stays down
pingwarden status      # mode, awdl0 state, interventions
pingwarden pause 15    # AirDrop/AirPlay back for 15 min, then protection resumes
pingwarden off         # restore AWDL
pingwarden ping        # 50 probes to your gateway: latency, jitter, loss, spikes
pingwarden ping 8.8.8.8 100
pingwarden log         # follow the daemon log
```

`ping` sends one probe per second unless you run it with `sudo`, which allows 200 ms.

### Menu bar (optional)

Install [SwiftBar](https://swiftbar.app) (`brew install swiftbar`) and copy
`pingwarden.10s.sh` into its plugin folder. You get a shield icon with On, Off,
Pause and Ping Test items.

## How it works

`pingwarden` writes `on`, `off` or `pause <epoch>` to `/usr/local/var/ping-warden/state`.
`awdl-warden` runs as root under launchd and re-reads that file every second. While
protection is on, it listens on an `AF_ROUTE` socket for interface-change messages
and also checks every 2 seconds. Whenever it finds `awdl0` up, it clears `IFF_UP`
with `ioctl(SIOCSIFFLAGS)` and counts an intervention. When protection goes off, it
raises `awdl0` again, but only if it was the one that lowered it. A marker file
covers a crash mid-session, so the next run still restores AWDL.

The daemon writes its live state to `/usr/local/var/ping-warden/status`, which the
CLI and SwiftBar plugin read.

## Uninstall

```bash
sudo make uninstall
```

This stops the daemon, brings `awdl0` back up, and removes every installed file.

## Credits

Approach adapted from [oliverames/ping-warden](https://github.com/oliverames/ping-warden)
(MIT, Copyright (c) 2025-2026 Oliver Ames) and
[jamestut/awdlkiller](https://github.com/jamestut/awdlkiller).
