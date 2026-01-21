# 🚀 Guide de déploiement Spotify Tracker

## Architecture

```
┌─────────────────┐         ┌─────────────────────┐
│     Vercel      │ ◄─────► │  PocketBase (CasaOS)│
│   (Frontend +   │  HTTPS  │    (Base de données)│
│   API Routes)   │         │                     │
└─────────────────┘         └─────────────────────┘
         │
         │ OAuth 2.0
         ▼
┌─────────────────┐
│   Spotify API   │
└─────────────────┘
```

---

## 📦 Étape 1 : Configuration de PocketBase sur CasaOS

### 1.1 Installer PocketBase

Dans CasaOS, installe PocketBase depuis l'App Store ou via Docker.

### 1.2 Créer les collections

Accède à l'interface admin de PocketBase : `http://YOUR_CASAOS_IP:8090/_/`

**Crée ces 5 collections :**

#### Collection `spotify_sessions`

| Champ | Type | Options |
|-------|------|---------|
| `user_id` | Text | Required, Unique |
| `access_token` | Text | Required |
| `refresh_token` | Text | Required |
| `expires_at` | Number | Required |
| `display_name` | Text | Required |
| `profile_image` | Text | |

#### Collection `spotify_history`

| Champ | Type | Options |
|-------|------|---------|
| `user_id` | Text | Required |
| `track_id` | Text | Required |
| `track_name` | Text | Required |
| `artist_name` | Text | Required |
| `album_name` | Text | |
| `album_image` | Text | |
| `duration_ms` | Number | Required |
| `played_at` | Text | Required |
| `spotify_url` | Text | |

#### Collection `spotify_stats`

| Champ | Type | Options |
|-------|------|---------|
| `user_id` | Text | Required, Unique |
| `total_listening_time` | Number | |
| `total_tracks` | Number | |
| `unique_tracks` | Number | |
| `unique_artists` | Number | |
| `last_updated` | Text | |

#### Collection `spotify_streaks`

| Champ | Type | Options |
|-------|------|---------|
| `user_id` | Text | Required, Unique |
| `current_streak` | Number | Default: 0 |
| `longest_streak` | Number | Default: 0 |
| `last_listen_date` | Text | |

#### Collection `spotify_achievements`

| Champ | Type | Options |
|-------|------|---------|
| `user_id` | Text | Required, Unique |
| `unlocked_achievements` | JSON | Default: [] |
| `updated_at` | Text | |

### 1.3 Configurer les règles d'accès (API Rules)

Pour chaque collection, va dans **Settings > API Rules** et configure :

```
List/Search: @request.headers.origin != ""
View:        @request.headers.origin != ""
Create:      @request.headers.origin != ""
Update:      @request.headers.origin != ""
Delete:      @request.headers.origin != ""
```

**OU** pour simplifier (moins sécurisé mais fonctionnel) :
- Mets une règle vide pour chaque action (autoriser tout)

### 1.4 Exposer PocketBase sur Internet

Pour que Vercel puisse accéder à ton PocketBase, tu as plusieurs options :

#### Option A : Cloudflare Tunnel (Recommandé) 🌟

1. Crée un compte Cloudflare (gratuit)
2. Ajoute ton domaine ou utilise un sous-domaine Cloudflare
3. Installe `cloudflared` sur ton serveur CasaOS
4. Configure un tunnel :
   ```bash
   cloudflared tunnel create pocketbase
   cloudflared tunnel route dns pocketbase pb.tondomaine.com
   ```
5. Ton URL sera : `https://pb.tondomaine.com`

#### Option B : Reverse Proxy avec Nginx

1. Configure Nginx comme reverse proxy
2. Obtiens un certificat SSL (Let's Encrypt)
3. Redirige vers PocketBase

#### Option C : Port Forwarding (Simple mais moins sécurisé)

1. Configure ton routeur pour rediriger le port 8090
2. Utilise un service DNS dynamique (DuckDNS, No-IP)
3. ⚠️ **Important** : Active HTTPS avec un certificat SSL

---

## 🌐 Étape 2 : Déploiement sur Vercel

### 2.1 Préparer le projet

1. Assure-toi que le code est sur GitHub
2. Mets à jour le `.gitignore` pour exclure `.env.local`

### 2.2 Connecter à Vercel

1. Va sur [vercel.com](https://vercel.com)
2. Importe ton repo GitHub
3. Configure les variables d'environnement :

### 2.3 Variables d'environnement Vercel

```
SPOTIFY_CLIENT_ID=ton_client_id
SPOTIFY_CLIENT_SECRET=ton_client_secret
NEXTAUTH_URL=https://ton-app.vercel.app
NEXTAUTH_SECRET=une_clé_secrète_aléatoire_longue
POCKETBASE_URL=https://pb.tondomaine.com
```

**Génère une clé secrète :**
```bash
openssl rand -base64 32
```

### 2.4 Configurer Spotify Developer

1. Va sur [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Modifie ton app pour ajouter la Redirect URI :
   ```
   https://ton-app.vercel.app/api/auth/callback
   ```

---

## 🔧 Étape 3 : Fichier de configuration

### `.env.local` (développement local)

```env
SPOTIFY_CLIENT_ID=ton_client_id
SPOTIFY_CLIENT_SECRET=ton_client_secret
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=dev_secret_key
POCKETBASE_URL=http://192.168.1.XX:8090
```

### Variables Vercel (production)

```env
SPOTIFY_CLIENT_ID=ton_client_id
SPOTIFY_CLIENT_SECRET=ton_client_secret
NEXTAUTH_URL=https://ton-app.vercel.app
NEXTAUTH_SECRET=production_secret_key_très_longue
POCKETBASE_URL=https://pb.tondomaine.com
```

---

## ✅ Checklist de déploiement

- [ ] PocketBase installé sur CasaOS
- [ ] 3 collections créées (`spotify_sessions`, `spotify_history`, `spotify_stats`)
- [ ] PocketBase accessible via HTTPS (Cloudflare Tunnel ou autre)
- [ ] Code poussé sur GitHub
- [ ] Projet importé dans Vercel
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Redirect URI mise à jour dans Spotify Developer
- [ ] Test de connexion ✅

---

## 🐛 Dépannage

### Erreur "POCKETBASE_URL is not defined"
→ Vérifie que la variable d'environnement est bien configurée dans Vercel

### Erreur "Failed to fetch" depuis Vercel
→ PocketBase n'est pas accessible depuis Internet. Configure un tunnel Cloudflare.

### Erreur CORS
→ Dans PocketBase, va dans **Settings > Application** et ajoute ton domaine Vercel aux origines autorisées.

### Erreur "Invalid redirect URI" sur Spotify
→ Ajoute `https://ton-app.vercel.app/api/auth/callback` dans les Redirect URIs de ton app Spotify.

---

## 📱 Structure des données

### Session utilisateur
```json
{
  "user_id": "spotify_user_id",
  "access_token": "BQxxx...",
  "refresh_token": "AQxxx...",
  "expires_at": 1706000000000,
  "display_name": "John Doe",
  "profile_image": "https://..."
}
```

### Entrée d'historique
```json
{
  "user_id": "spotify_user_id",
  "track_id": "4iV5W9uYEdYUVa79Axb7Rh",
  "track_name": "Never Gonna Give You Up",
  "artist_name": "Rick Astley",
  "album_name": "Whenever You Need Somebody",
  "album_image": "https://i.scdn.co/image/...",
  "duration_ms": 213573,
  "played_at": "2024-01-21T10:30:00Z",
  "spotify_url": "https://open.spotify.com/track/..."
}
```
