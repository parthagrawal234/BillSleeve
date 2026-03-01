# 🧾 BillSleeve

**BillSleeve** is a fully offline, zero-API-cost bill and warranty management system. Photograph a receipt, and BillSleeve automatically reads it, stores it securely, and registers your product warranties — all without sending your data to any third-party service.

---

## ✨ What It Does

| Feature | How |
|---------|-----|
| 📷 Scan bills with your phone | Flutter mobile app with camera |
| 🔍 Read text from photos | OpenCV cleans the image → Tesseract OCR reads it |
| 🌍 Works in any language | Tesseract supports 100+ languages out of the box |
| 🔐 Your data stays private | Image is encrypted on your phone **before** upload |
| 🤖 Auto-register warranties | Browser agent navigates any brand's website for you |
| 📊 Track expiry dates | Web dashboard shows what's expiring soon |
| 🧾 Immutable audit logs | Every agent action is logged and tamper-proof |

---

## 🏗️ How It All Fits Together

```
📱 Flutter App (your phone)
    │
    │  1. You take a photo of a bill
    │  2. The app encrypts it on-device (AES-256)
    │  3. Encrypted image is uploaded — server never sees the original
    ▼
⚙️  Python + FastAPI Backend  (port 8080)
    │
    ├──▶ 🔬 Vision Service  (port 5001)
    │        Step 1: OpenCV cleans the image (remove blur, fix angle)
    │        Step 2: Tesseract reads the text (multi-language)
    │        Step 3: Regex extracts: store name, price, date, warranty info
    │        Returns structured JSON to the backend
    │
    ├──▶ 🗄️  PostgreSQL Database
    │        Stores bills, warranties, agent jobs, and audit logs
    │        Sensitive columns are AES-256 encrypted
    │
    └──▶ 🤖 Browser Agent (Playwright)
             Finds the brand's warranty registration page automatically
             Fills in the form using your product data
             Takes a screenshot as proof
             Runs in an isolated Docker container (sandboxed)

🌐 Next.js Dashboard (port 3000)
    View your bills, track warranty expiry, read audit logs
    Decrypts your data client-side using your password
```

---

## 📁 Project Structure

```
BillSleeve/
├── backend/          # Python + FastAPI — the main server
│   ├── main.py       # App entry point — run this to start the server
│   ├── api/          # HTTP endpoints (bills, warranties, vision)
│   ├── services/     # Business logic (save bills, dispatch agents)
│   ├── agents/       # Browser automation scripts (Playwright)
│   └── db/           # Database connection + SQL migrations
├── vision/           # Python OCR microservice
│   ├── preprocessing/  # OpenCV image cleaning
│   ├── ocr/            # Tesseract text extraction
│   └── parser/         # Regex heuristics (price, date, warranty)
├── mobile/           # Flutter app (iOS + Android)
├── web/              # Next.js dashboard
└── docker/           # Docker configs for sandboxed agents
```

---

## 🔐 Security Model

**Zero-Knowledge Architecture** — even if our server were hacked, your bills remain unreadable.

1. **Device-side encryption** — AES-256 encryption happens on your phone using your password as the key. We only ever receive ciphertext.
2. **Sandboxed browser agents** — each Playwright instance runs in its own Docker container with no access to the host or other services.
3. **Immutable audit logs** — every action is stored with a SHA-256 hash chain (like a mini blockchain). Rows can never be edited or deleted.

---

## 🤖 How the Universal Browser Agent Works

The agent uses a **3-tier fallback** to register warranties for any brand:

```
Tier 1 — Known store script
  If we have a tested script for the brand (e.g. Sony, Amazon), use it directly.
  ↓ (if not found)
Tier 2 — Heuristic form finder
  Scan the brand's website for form fields labelled "serial number", "warranty", etc.
  ↓ (if not found)
Tier 3 — Google search fallback
  Search "BrandName warranty registration" → follow the top result → find the form.
```

If Tier 2 or 3 succeeds, the selectors are saved automatically so future runs use Tier 1.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Flutter SDK
- Node.js 20+ (for the web dashboard)
- Docker (for sandboxed agents)

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill in your DB credentials
uvicorn main:app --reload --port 8080
```

Visit **http://localhost:8080/docs** for an interactive API explorer (auto-generated, free!).

### 2. Start the Vision Service

```bash
cd vision
pip install -r requirements.txt
python main.py              # runs on port 5001
```

### 3. Start the Web Dashboard

```bash
cd web
npm install
npm run dev                 # runs on port 3000
```

---

## 🗺️ Build Roadmap

| Step | Component | Status |
|------|-----------|--------|
| 1 | Architecture & project scaffold | ✅ Done |
| 2 | Python + FastAPI backend | ✅ Done |
| 3 | Vision pipeline (OpenCV + Tesseract) | 🔄 Next |
| 4 | Universal browser agent (Playwright) | ⏳ Planned |
| 5 | Flutter mobile app | ⏳ Planned |
| 6 | Next.js web dashboard | ⏳ Planned |
| 7 | Docker + security infrastructure | ⏳ Planned |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Flutter (iOS + Android) |
| Backend | Python + FastAPI |
| OCR | OpenCV + Tesseract (multi-language) |
| Database | PostgreSQL with AES-256 column encryption |
| Browser Automation | Python Playwright |
| Web Dashboard | Next.js (React) |
| Infrastructure | Docker (sandboxed agents) |

---

## 📄 License

MIT — use it, modify it, build on it.
