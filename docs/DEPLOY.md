# Deploying cv-game (F-084)

The game runs on [Fly.io](https://fly.io): one Machine in Paris (`cdg`) builds and runs the
`Dockerfile` (F-081). The config is `fly.toml` at the root.

## Why these settings

- **One Machine, always on.** Colyseus keeps the rooms in memory, so two Machines would put
  visitors in separate worlds, and a stopped Machine drops everyone. `fly.toml` turns
  auto-stop off and keeps one Machine running; always deploy with `--ha=false`, or Fly.io
  creates two.
- **HTTPS everywhere.** Fly.io terminates TLS, so the client's WebSocket uses `wss://` on the
  page's own origin (`serverEndpoint`). `force_https` redirects plain HTTP.
- **Health check.** Fly.io polls `GET /health` every 30 s, like the Docker `HEALTHCHECK`.

## First deploy

1. Install `flyctl` (Windows, PowerShell): `iwr https://fly.io/install.ps1 -useb | iex`,
   then open a new terminal so `fly` is on the `PATH`.
2. Create the account, or log in: `fly auth signup` (or `fly auth login`).
3. Create the app. The name is unique across Fly.io; if `cv-game-poignant` is taken, pick
   another and change `app` in `fly.toml`:
   `fly apps create cv-game-poignant`
4. Deploy, from the project root: `fly deploy --ha=false`
5. Check it: `fly status` (one Machine, `started`), then `fly apps open`. Open it in two
   browsers: each visitor should see the other move.

The site is then at `https://<app>.fly.dev`.

## Day to day

| Task                    | Command                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Deploy the current code | `fly deploy --ha=false`                                                                           |
| Read the logs           | `fly logs`                                                                                        |
| See the Machine         | `fly status`                                                                                      |
| Roll back to a release  | `fly deploy --ha=false --image ghcr.io/b-poignant/cv-game:<version>` (the package must be public) |

## Turning it off

| To                                  | Command                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Take the site offline, keep the app | `fly scale count 0` (back with `fly scale count 1` or `fly deploy --ha=false`)  |
| Stop it for a moment                | `fly machine stop <id>` (`fly status` shows the id; the next visit restarts it) |
| Delete everything, name included    | `fly apps destroy cv-game-poignant` (can't be undone)                           |

`fly machine stop` alone doesn't keep it off: `auto_start_machines = true` starts it again on
the next visit.

## The free trial

A new Fly.io account gets a short trial without a credit card: its Machines stop after 5
minutes and the credit lasts 7 days. That's enough to check a deploy works, not to share the
link. Add a card to lift the limits, then redeploy so the Machine stays on.

## Not done yet

- A custom domain (`fly certs add <domain>`, then a DNS record at the registrar).
- Deploying automatically from CI after a release (F-083 publishes the image; a job would run
  `fly deploy` with a `FLY_API_TOKEN` secret).
