# CLO.EAST

CLO.EAST adalah aplikasi web berbasis **React + Vite** yang dikembangkan untuk kebutuhan CLO.EAST.

## 🚀 Live Demo

https://cloeastt-a11y.github.io/clo-east/

## 🛠️ Tech Stack

* **React** — Frontend
* **Vite** — Build tool & development server
* **Tailwind CSS** — Styling
* **Firebase** — Authentication & backend services
* **GitHub Pages** — Deployment

## 📁 Project Structure

```text
clo-east/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
├── src/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 💻 Running Locally

### 1. Clone repository

```bash
git clone https://github.com/cloeastt-a11y/clo-east.git
cd clo-east
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Aplikasi akan tersedia pada alamat yang ditampilkan oleh Vite, biasanya:

```text
http://localhost:5173
```

## 🔨 Build Production

Untuk membuat production build:

```bash
npm run build
```

Hasil build akan berada di:

```text
dist/
```

Untuk melakukan preview hasil production build:

```bash
npm run preview
```

## 🔥 Firebase

CLO.EAST menggunakan Firebase untuk kebutuhan autentikasi dan layanan backend.

Pastikan konfigurasi Firebase pada project telah sesuai dengan environment yang digunakan.

Untuk deployment GitHub Pages, domain berikut harus terdaftar sebagai **Authorized Domain** pada Firebase Authentication:

```text
cloeastt-a11y.github.io
```

> Jangan menyimpan password, private key, service account key, atau credential sensitif di repository.

## 🌐 GitHub Pages Deployment

Deployment dilakukan secara otomatis menggunakan **GitHub Actions**.

Setiap kali perubahan di-push ke branch:

```text
main
```

workflow akan:

```text
Push to main
     ↓
Checkout repository
     ↓
Setup Node.js
     ↓
Install dependencies
     ↓
Build Vite application
     ↓
Configure GitHub Pages
     ↓
Upload build artifact
     ↓
Deploy to GitHub Pages
```

Workflow deployment berada di:

```text
.github/workflows/deploy.yml
```

Vite menggunakan base path repository agar asset dapat dimuat dengan benar pada GitHub Pages:

```text
/clo-east/
```

## 📜 Available Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm install`     | Install project dependencies   |
| `npm run dev`     | Menjalankan development server |
| `npm run build`   | Membuat production build       |
| `npm run preview` | Preview production build       |

## 📌 Deployment URL

Production:

**https://cloeastt-a11y.github.io/clo-east/**

## 👨‍💻 Development

Project ini dikembangkan dan dikelola oleh **CLO.EAST**.

---

© 2026 CLO.EAST. All rights reserved.
