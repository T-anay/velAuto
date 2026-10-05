# velAuto

> AI-Powered Vehicle Appointment & Damage Assessment System
> Yapay Zeka Destekli Araç Randevu ve Hasar Tespit Sistemi

---

## 🇬🇧 English

velAuto is a full-stack web application for managing vehicle service appointments, enhanced with an AI-powered car damage detection module. Users can book service appointments online, and service staff can use the AI tool to automatically detect and assess vehicle damage from photos using computer vision.

### Features

- **Online Appointment Booking** — Users can schedule vehicle service appointments through a clean web interface
- **Appointment Management** — Service staff can view, confirm, and manage incoming appointments
- **AI Damage Detection** — Upload a vehicle photo to automatically identify and locate damage areas using a YOLO object detection model
- **Conversational AI Assistant** — Integrated LLaMA 3 (via Ollama) provides a natural language summary of detected damage
- **REST API Backend** — Structured Java backend exposing well-defined API endpoints

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Java, Spring Boot |
| **AI Service** | Python, FastAPI, YOLO (Ultralytics), Ollama (LLaMA 3) |
| **Database** | PostgreSQL |

### Project Structure

```
velAuto/
├── fe/             # React + Vite frontend
├── be/             # Spring Boot backend
├── ai-service/     # Python AI service (YOLO + Ollama)
│   ├── app/        # FastAPI application
│   └── requirements.txt
└── .env.example
```

### Getting Started

**Prerequisites:** Node.js 20+, Java 21+, Maven 3.9+, Python 3.10+, PostgreSQL, [Ollama](https://ollama.com/) with LLaMA 3

```bash
# Pull the LLaMA 3 model first
ollama pull llama3
```

**1. Clone the repository**
```bash
git clone https://github.com/T-anay/velAuto.git
cd velAuto
```

**2. Start the AI service**
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your YOLO model path and settings
python -m uvicorn app.main:app --reload --port 8001
```

**3. Start the backend**
```bash
cd be
./mvnw spring-boot:run
```
Runs on `http://localhost:8090`.

**4. Start the frontend**
```bash
cd fe
npm install
# Create fe/.env with VITE_API_BASE_URL=http://localhost:8090
npm run dev
```
Available at `http://localhost:5173`.

### Environment Variables

**Frontend (`fe/.env`)**

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL (e.g., `http://localhost:8090`) |

**AI Service (`ai-service/.env`)**

| Variable | Description |
|----------|-------------|
| `YOLO_MODEL_PATH` | Path to the trained YOLO `.pt` weights file |
| `YOLO_CONFIDENCE_THRESHOLD` | Minimum confidence for detections (default: `0.25`) |
| `OLLAMA_BASE_URL` | Ollama server URL (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | LLM model name (default: `llama3`) |
| `REQUEST_TIMEOUT` | Request timeout in seconds |

### How the AI Damage Detection Works

1. User uploads a vehicle photo via the web interface
2. The YOLO model detects and localizes damage areas (dents, scratches, broken parts, etc.)
3. Detection results — bounding boxes, confidence scores, damage categories — are returned
4. LLaMA 3 generates a natural language damage summary report
5. The report is linked to the corresponding service appointment

---

## 🇹🇷 Türkçe

velAuto, araç servis randevularını yönetmek için geliştirilmiş, yapay zeka destekli araç hasar tespit modülüyle güçlendirilmiş bir full-stack web uygulamasıdır. Kullanıcılar servis randevusu alabilir, servis personeli ise bilgisayarlı görü kullanarak araç hasarını fotoğraftan otomatik olarak tespit edip değerlendirebilir.

### Özellikler

- **Online Randevu Alma** — Kullanıcılar temiz bir arayüz üzerinden servis randevusu alabilir
- **Randevu Yönetimi** — Servis personeli gelen randevuları görüntüleyebilir, onaylayabilir ve yönetebilir
- **Yapay Zeka ile Hasar Tespiti** — YOLO nesne tespit modeli kullanarak araç fotoğrafından hasarlı bölgeleri otomatik olarak tespit eder
- **Konuşmacı AI Asistanı** — Entegre LLaMA 3 (Ollama aracılığıyla), tespit edilen hasarın doğal dilde özetini sunar
- **REST API Backend** — İyi tanımlanmış endpoint'ler sunan yapılandırılmış Java backend'i

### Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Java, Spring Boot |
| **AI Servisi** | Python, FastAPI, YOLO (Ultralytics), Ollama (LLaMA 3) |
| **Veritabanı** | PostgreSQL |

### Proje Yapısı

```
velAuto/
├── fe/             # React + Vite frontend
├── be/             # Spring Boot backend
├── ai-service/     # Python AI servisi (YOLO + Ollama)
│   ├── app/        # FastAPI uygulaması
│   └── requirements.txt
└── .env.example
```

### Başlarken

**Gereksinimler:** Node.js 20+, Java 21+, Maven 3.9+, Python 3.10+, PostgreSQL, LLaMA 3 modeliyle [Ollama](https://ollama.com/)

```bash
# Önce LLaMA 3 modelini indirin
ollama pull llama3
```

**1. Repoyu klonlayın**
```bash
git clone https://github.com/T-anay/velAuto.git
cd velAuto
```

**2. AI servisini başlatın**
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# .env dosyasını YOLO model yolu ve ayarlarınızla düzenleyin
python -m uvicorn app.main:app --reload --port 8001
```

**3. Backend'i başlatın**
```bash
cd be
./mvnw spring-boot:run
```
`http://localhost:8090` adresinde çalışır.

**4. Frontend'i başlatın**
```bash
cd fe
npm install
# fe/.env dosyası oluşturun: VITE_API_BASE_URL=http://localhost:8090
npm run dev
```
`http://localhost:5173` adresinde erişilebilir.

### Yapay Zeka Hasar Tespiti Nasıl Çalışır?

1. Kullanıcı web arayüzü üzerinden araç fotoğrafı yükler
2. YOLO modeli hasarlı bölgeleri (çukur, çizik, kırık parça vb.) tespit eder ve konumlandırır
3. Tespit sonuçları — sınırlayıcı kutular, güven skorları, hasar kategorileri — döndürülür
4. LLaMA 3 doğal dilde hasar özet raporu oluşturur
5. Rapor ilgili servis randevusuyla ilişkilendirilir
