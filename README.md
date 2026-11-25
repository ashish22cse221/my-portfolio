# Ashish Choudhury — Portfolio

Cyber-brutalist racing theme. Static site, no build step.

```
index.html            page shell
assets/css/style.css  all styling
assets/js/main.js     renders content, animations
content/site.json     ALL text, projects, experience, skills, links
admin/                Decap CMS editor (yoursite/admin)
MEDIA/                images; CMS uploads go to MEDIA/uploads
```

## Edit content
- **Without code:** open `https://<your-site>/admin`, log in with GitHub, edit, hit *Publish*. Netlify redeploys in about a minute.
- **By hand:** edit `content/site.json` and push.

## Run locally
```
python -m http.server 5173
```
Then open http://localhost:5173. The page loads `site.json` with `fetch`, so opening `index.html` directly with `file://` won't show the content.

## One-time setup for /admin (Netlify)
1. Netlify → **Add new site → Import from GitHub** → pick `my-portfolio` (no build command, publish directory `/`).
2. GitHub → Settings → Developer settings → **OAuth Apps → New**
   - Homepage URL: your Netlify URL
   - Callback URL: `https://api.netlify.com/auth/done`
3. Netlify → Site configuration → **Access & security → OAuth → Install provider → GitHub**, paste the Client ID and Secret.
4. Visit `/admin` and log in.

## Resume
Upload it from /admin (Profile → Resume). Use a version **without** your home address, phone numbers, date of birth and family details. Anything uploaded is public.
