# 🛡️ ScamShield

ScamShield is a full-stack web application designed to help users identify suspicious messages, URLs, QR codes, and UPI/payment-related content before interacting with them.

The application analyzes user-provided content and generates a risk score, risk level, reasons for detection, and safety recommendations.

## 🚨 Problem Statement

Online scams are becoming increasingly common through fake messages, malicious links, fraudulent QR codes, and payment requests.

ScamShield provides a simple way for users to analyze suspicious content before clicking links, sharing sensitive information, or making payments.

## ✨ Features

- 🔍 Suspicious message detection
- 📱 QR-code scanning
- 💳 UPI/payment QR analysis
- 🌐 Suspicious URL detection
- 🦠 VirusTotal URL analysis
- 📊 Risk score from 0–100
- 🚦 Risk levels:
  - LOW
  - MEDIUM
  - HIGH
  - CRITICAL
- 📝 Detection reasons
- 🛡️ Safety recommendations
- 📜 Scan history
- 📈 Scan statistics
- 🚩 Report suspicious content
- 🗄️ MongoDB database storage
- 🔐 Environment-variable based API key protection
- ⚡ Express rate limiting
- 🔒 Helmet security middleware
- 📱 Responsive frontend

## 🧠 How ScamShield Works

### 1. Message Analysis

The user enters a suspicious message into the scanner.

ScamShield checks for indicators such as:

- Urgent language
- Threats
- OTP requests
- Password/PIN requests
- Bank details
- CVV requests
- Payment requests
- Fake rewards or lottery claims
- Suspicious links
- Shortened URLs
- Suspicious domains
- Excessive capital letters or punctuation

The system calculates a risk score and displays the result.

### 2. QR Code Analysis

The user can scan a QR code using the device camera.

The decoded QR content is sent to the backend for analysis.

Payment-related QR codes such as UPI payment QR codes are handled separately from suspicious or unknown QR content.

### 3. URL Analysis

ScamShield checks URLs for suspicious characteristics such as:

- Suspicious domain extensions
- URL shorteners
- IP-address based URLs
- HTTP instead of HTTPS
- Phishing-related keywords
- Other suspicious URL patterns

VirusTotal can also be used for additional URL analysis.

### 4. Risk Classification

| Risk Score | Risk Level |
|------------|------------|
| 0–29 | LOW |
| 30–59 | MEDIUM |
| 60–79 | HIGH |
| 80–100 | CRITICAL |

## 🏗️ Project Structure

```text
ScamShield/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   └── Scan.js
│   │
│   ├── routes/
│   │   ├── scanRoutes.js
│   │   └── reportRoutes.js
│   │
│   ├── controllers/
│   │   ├── scanController.js
│   │   └── reportController.js
│   │
│   ├── services/
│   │   ├── scamDetector.js
│   │   └── virusTotal.js
│   │
│   └── middleware/
│       ├── validation.js
│       └── errorHandler.js
│
├── .gitignore
└── README.md
```

## 🛠️ Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- HTML5 QR Code Scanner

### Backend

- Node.js
- Express.js
- Mongoose
- MongoDB
- Helmet
- CORS
- Express Rate Limit

### External Services

- VirusTotal API
- MongoDB Atlas

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ScamShield.git
```

Move into the project directory:

```bash
cd ScamShield
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create:

```text
backend/.env
```

Add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
VIRUSTOTAL_API_KEY=your_virustotal_api_key
```

Do not share your `.env` file publicly.

## ▶️ Run the Application

From the backend directory:

```bash
node server.js
```

The application will run at:

```text
http://localhost:5000
```

Open this address in your browser.

### Important

Do not open the frontend using Live Server such as:

```text
http://127.0.0.1:5500
```

For the current project setup, open:

```text
http://localhost:5000
```

The Express backend serves the frontend and API from the same local server.

## 🔌 API Endpoints

### Health Check

```text
GET /api/health
```

Checks whether the ScamShield API is running.

### Scan Content

```text
POST /api/scans
```

Example request:

```json
{
  "input": "Congratulations! You won ₹50,000. Claim your prize immediately.",
  "type": "message"
}
```

### Get Scan History

```text
GET /api/scans
```

### Get Scan Statistics

```text
GET /api/scans/stats
```

### Get Individual Scan

```text
GET /api/scans/:id
```

### Report Suspicious Content

```text
POST /api/reports
```

## 🗄️ Database

ScamShield uses MongoDB to store scan results.

A scan contains information such as:

- Input content
- Content type
- Risk score
- Risk level
- Detection reasons
- Recommendation
- VirusTotal result
- Creation timestamp

Example:

```json
{
  "input": "Suspicious message",
  "type": "message",
  "riskScore": 85,
  "riskLevel": "CRITICAL",
  "reasons": [
    "Urgent language detected",
    "Suspicious payment request"
  ],
  "recommendation": "Do not interact with this content."
}
```

## 🔐 Security

ScamShield follows basic security practices including:

- API keys stored in `.env`
- MongoDB credentials stored in environment variables
- Helmet security headers
- CORS configuration
- Express rate limiting
- Request body size limits
- Backend-side validation
- Error handling
- Sensitive credentials excluded using `.gitignore`

## 🧪 Example Scam Message

```text
Congratulations! You have won ₹50,000 in our lucky draw.
Claim your prize immediately by clicking the link below.
```

ScamShield analyzes the message and identifies suspicious indicators.

## 📱 QR Code Safety

ScamShield is designed to analyze QR content before the user interacts with it.

For payment QR codes, the application can identify UPI payment information such as:

- UPI ID
- Payee name
- Amount
- Currency

Unknown or suspicious QR content can receive a higher risk classification.

## 🎯 Project Objective

The main objective of ScamShield is to provide users with a simple security layer that helps them evaluate suspicious digital content before:

- Clicking a link
- Scanning an unknown QR code
- Sharing OTPs
- Providing banking information
- Making a payment
- Responding to suspicious messages

## 👩‍💻 Developed For

ScamShield was developed as a college/hackathon full-stack project demonstrating:

- Frontend development
- Backend API development
- Database integration
- QR-code processing
- Scam detection logic
- Third-party API integration
- Web application security

## 🚀 Future Improvements

Possible future enhancements include:

- AI-powered scam detection
- More advanced phishing detection
- Browser extension
- Mobile application
- Real-time threat intelligence
- Improved QR-code reputation analysis
- User authentication
- Advanced analytics dashboard
- Multilingual scam detection

## ⚠️ Disclaimer

ScamShield is an educational and demonstration project.

A LOW risk result does not guarantee that content is completely safe. Users should independently verify unexpected payment requests, links, QR codes, and messages before taking action.

## 📄 License

This project is intended for educational and demonstration purposes.