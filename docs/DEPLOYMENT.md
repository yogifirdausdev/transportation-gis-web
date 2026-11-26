# Deploying next to WordPress on Nginx

This guide installs the app at `https://<your-domain>/peta-perlengkapan-jalan/` on a server that already serves WordPress with Nginx. WordPress keeps working unchanged.

```
Browser ──HTTPS──▶ Nginx
                    ├── /                          → WordPress (unchanged)
                    └── /peta-perlengkapan-jalan/  → 127.0.0.1:3000 → app (Docker) → PostGIS (Docker, private)
```

**You need:** root SSH access, Docker with the Compose plugin, at least 2 GB RAM and about 5 GB free disk.

## 1. Check the server

```bash
sudo ss -ltnp | grep -E ':3000|:5432'
```

Nothing should be listening on port 3000. Port 5432 being in use is fine, because the database container doesn't publish it. If 3000 is taken, change `127.0.0.1:3000:3000` in `docker-compose.yml` and the `proxy_pass` port in the Nginx snippet to match.

## 2. Get the code

If the GitHub repo is private, create a read-only deploy key first:

```bash
sudo ssh-keygen -t ed25519 -f /root/.ssh/peta_deploy -N "" -C "peta deploy key"
sudo cat /root/.ssh/peta_deploy.pub
```

Add the printed key in GitHub under **Repo → Settings → Deploy keys → Add deploy key**. Leave **Allow write access** off. Then:

```bash
sudo git -c core.sshCommand="ssh -i /root/.ssh/peta_deploy" clone git@github.com:<owner>/<repo>.git /opt/peta-perlengkapan-jalan
cd /opt/peta-perlengkapan-jalan
sudo git config core.sshCommand "ssh -i /root/.ssh/peta_deploy"
sudo git switch fix/production-deployment   # until this is merged into main
```

For a public repo, use the `https://github.com/<owner>/<repo>.git` URL and skip the key.

## 3. Configure

```bash
cd /opt/peta-perlengkapan-jalan
sudo cp .env.example .env
sudo chmod 600 .env
openssl rand -hex 32   # session secret
openssl rand -hex 24   # database password
```

Edit `.env` (`sudo nano .env`):

| Variable | Value |
| --- | --- |
| `NUXT_APP_BASE_URL` | `/peta-perlengkapan-jalan/` (keep both slashes) |
| `NUXT_SESSION_SECRET` | the 64-character value from above |
| `NUXT_ADMIN_EMAIL` | your email, used for the first Admin account |
| `NUXT_ADMIN_PASSWORD` | a strong password for that account |
| `POSTGRES_PASSWORD` | the 48-character value from above. Use letters and numbers only |

Leave `POSTGRES_DB`, `POSTGRES_USER` and `NUXT_STORAGE_DIR` as they are.

## 4. Start the app

```bash
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs --tail=50 app
curl -sI http://127.0.0.1:3000/peta-perlengkapan-jalan/ | head -1
```

Both containers should show `running` (the database as `healthy`), and `curl` should print `HTTP/1.1 200 OK`. The first build takes a few minutes.

## 5. Connect Nginx

Copy the two config files:

```bash
sudo mkdir -p /etc/nginx/snippets
sudo cp deploy/nginx/peta-ratelimit.conf /etc/nginx/conf.d/
sudo cp deploy/nginx/peta-perlengkapan-jalan.locations.conf /etc/nginx/snippets/
```

Find the WordPress site's HTTPS server block. It's the one with `listen 443` and your domain in `server_name`:

```bash
sudo grep -lE "listen .*443" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf
```

Open that file and add this line inside the `server { ... }` block, **above** `location / {`:

```nginx
    include /etc/nginx/snippets/peta-perlengkapan-jalan.locations.conf;
```

Then test the config and reload. A reload doesn't interrupt WordPress:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Open `https://<your-domain>/peta-perlengkapan-jalan/` for the map, and `.../peta-perlengkapan-jalan/admin` to sign in with the Admin account from step 3.

## 6. Turn on backups

```bash
cd /opt/peta-perlengkapan-jalan
sudo ./scripts/backup.sh
sudo crontab -e
```

Add this line to run it every night at 02:30:

```
30 2 * * * cd /opt/peta-perlengkapan-jalan && ./scripts/backup.sh >> /var/log/peta-backup.log 2>&1
```

Backups go to `/var/backups/peta-perlengkapan-jalan` and are kept for 14 days. They sit on the same disk as the app, so copy them somewhere else regularly too, for example with `rsync` to another machine or your hosting provider's snapshots.

**Restore** (this replaces the current data):

```bash
cd /opt/peta-perlengkapan-jalan
sudo docker compose exec -T db pg_restore -U gis -d gis --clean --if-exists < /var/backups/peta-perlengkapan-jalan/db-<stamp>.dump
sudo docker compose exec -T app tar -C /app/storage -xzf - < /var/backups/peta-perlengkapan-jalan/uploads-<stamp>.tar.gz
```

## 7. Update to a new version

```bash
cd /opt/peta-perlengkapan-jalan
sudo ./scripts/backup.sh
sudo git pull
sudo docker compose up -d --build
```

The database schema updates itself on start.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `502 Bad Gateway` | The app isn't running. Check `sudo docker compose ps` and `sudo docker compose logs app` |
| Page loads without styling, or with 404s for `/_nuxt/...` | `NUXT_APP_BASE_URL` is wrong (needs both slashes), or the `include` line is missing or sits below a rule that catches the path. Fix, then `sudo docker compose up -d` |
| WordPress shows its own 404 page at the GIS address | The `include` line isn't in the HTTPS server block, or Nginx wasn't reloaded |
| `NUXT_DATABASE_URL is not configured` in the logs | Start with `docker compose`, not `docker run`. Compose builds this value from `POSTGRES_*` |
| `413 Request Entity Too Large` on import | The file is over 32 MB. Split the Excel file |
| Login says too many requests (429) | More than 10 attempts in a minute from one IP. Wait a minute |
| Every visitor hits the login limit at once | The site is behind Cloudflare, so all requests come from Cloudflare IPs. Set up Nginx's `real_ip` module with Cloudflare's IP ranges |
