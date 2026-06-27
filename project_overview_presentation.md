# 🌾 FarmShare: Simplified Presentation Guide

This guide describes the core features of **FarmShare** in simple, non-technical words, along with an explanation of how the **FastAPI Backend** makes them work behind the scenes.

---

## 💡 Platform Models & Terminology (In Simple Words)

When presenting, you can explain the core technical concepts of the system using these plain-English definitions:

| Technical Term | What it is (in Simple Words) | Why we need it |
| :--- | :--- | :--- |
| **User (`users` database)** | A profile representing a participant on the platform. Can be a **Farmer** (food donor) or an **NGO / Food Bank** (food recipient). | To know who is giving food, who is receiving food, and where they are physically located. |
| **Email Verification (`otp_code`)** | A security check that sends a temporary 6-digit code to the user's email inbox during sign-up. | To verify that the email address is real and belongs to a real person, preventing fake accounts and spam. |
| **Surplus Listing (`produce` database)** | A digital entry representing a batch of excess food a farmer wants to give away (e.g., *"200 kg of fresh potatoes"*). | To show what food is available, its harvest date (freshness), location, and whether it has already been claimed. |
| **Pickup Request (`pickup_requests`)** | A digital "hand-raise" ticket created when an NGO clicks *"Request Pickup"* to claim a farmer's food listing. | To coordinate matching. It allows farmers to see which NGOs want the food, choose one to schedule, and ignore duplicates. |
| **Smart Match Score** | A matching rating from 0% to 100% calculated automatically by the backend. | It highlights the best listings for an NGO: higher percentage means the food is closer to their location, fresher, and available in larger quantities. |
| **Haversine Distance Engine** | A built-in calculator that computes the straight-line distance in kilometers between two sets of GPS coordinates. | To filter notifications and lists (e.g., only email NGOs within a 100 km radius of a new farm listing to prevent long-distance logistics issues). |

---

## 🚀 5 Core Features Explained Simply

Here is a breakdown of the platform's features, written in plain English, explaining how the **FastAPI Backend** powers them:

### 1. Multi-Lingual AI Assistant (HarvestLink AI)
* **In Simple Words:** An AI chatbot helper that speaks 5 local languages: **English**, **Hindi (हिंदी)**, **Marathi (मराठी)**, **Telugu (తెలుగు)**, and **Kannada (ಕನ್ನಡ)**. A farmer can press a button, say what surplus food they have (e.g., *"I have 200 kg of fresh onions harvested today in Pune"*), and the AI automatically fills out the upload form for them. It also answers questions about food storage, shelf life, and donation rules.
* **How FastAPI Backend Works:** 
  1. The browser records the farmer's voice using the built-in Web Speech API and turns it into text.
  2. The text is sent to the FastAPI backend (`/ai/voice-listing` endpoint).
  3. The backend sends the text to **AWS Bedrock (Amazon Nova Pro LLM)**.
  4. The AI translates regional food names (e.g., "कांदा" to "Onion"), changes relative dates like "today" to a calendar date (e.g., `2026-06-27`), and returns a small structured text packet.
  5. FastAPI returns this clean data back to the frontend, which instantly fills the input fields on the screen and flashes green to show it was successful.

### 2. Smart Match Logistics Engine
* **In Simple Words:** Instead of showing lists of food in random order, the platform automatically ranks listings for NGOs using a matching score from **0% to 100%**. A high percentage score means the food is very close to the NGO, fresh, and available in a large quantity.
* **How FastAPI Backend Works:**
  1. When an NGO opens the app, the frontend grabs their GPS location and sends it to the FastAPI backend (`/match/smart` endpoint).
  2. The backend looks up all active food listings in the database.
  3. It runs a quick Python math formula (**Haversine formula**) using the GPS coordinates to calculate the exact distance in kilometers between the NGO and each farm.
  4. It combines **Distance (40% weight)**, **Food Age (35% weight)**, and **Quantity (15% weight)** to calculate a combined rating.
  5. The backend sorts the results so the highest matching listing is shown first, accompanied by clear descriptions (e.g. *"Just 2.3 km away — very close"*).

### 3. Immediate Alerts (Geospatial Notifications)
* **In Simple Words:** When a farmer lists new food on the platform, the system immediately finds all verified, active NGOs registered within **100 kilometers** of that farm and sends them a designed alert email. This allows NGOs to claim the fresh food before it spoils.
* **How FastAPI Backend Works:**
  1. When a farmer submits a new listing, the FastAPI backend receives the request.
  2. Before finishing, the backend spawns a **background task** (a separate background process so the farmer's screen doesn't lag).
  3. The background task fetches all verified NGOs from the database.
  4. It filters the NGOs list, keeping only those within 100 kilometers using their GPS coordinates.
  5. It builds a beautiful HTML email and sends it out to each nearby NGO using a Gmail SMTP service connection.

### 4. Interactive Geolocation Map View
* **In Simple Words:** A map that shows where everyone is. Farmers with active food are shown as green pins (with details on food name, quantity, and status in a pop-up), and NGOs are shown as blue pins.
* **How FastAPI Backend Works:**
  1. The FastAPI backend has a simple endpoint (`/map/data`).
  2. When called, it executes a database query that joins the `produce` and `users` tables to fetch the GPS coordinates and names of active listings and verified NGOs.
  3. It returns this list of coordinates.
  4. The web dashboard and mobile app parse this coordinate list and render them as icons on an interactive **Leaflet.js / OpenStreetMap** map widget.

### 5. Automated Pick-up Lifecycle Tracker
* **In Simple Words:** A digital coordinator that guides a donation from start to finish through four clear stages:
  1. **Available:** Farmer posts surplus food.
  2. **Requested:** An NGO clicks *"Request Pickup"* to claim it.
  3. **Pickup Scheduled:** The farmer reviews the request and clicks *"Accept"*. The system automatically rejects other pending requests for that item.
  4. **Delivered:** The NGO picks up the food and marks it as completed.
* **How FastAPI Backend Works:**
  1. The backend tracks the status of listings and requests in the database using the `/requests` router.
  2. When an NGO requests a listing, FastAPI changes the produce state from `'available'` to `'requested'`.
  3. When a farmer accepts, FastAPI updates the request state to `'accepted'`, changes the produce state to `'pickup_scheduled'`, and automatically runs a query to update other competing pending requests for that produce item to `'rejected'`.
  4. When the NGO marks it as received, FastAPI updates the states to `'delivered'` and automatically updates the analytics engine (adding the weight of the produce to the farmer's total donated kilograms and the NGO's received kilograms).

---

## 🔄 End-to-End System Workflows

Here is the complete step-by-step operational lifecycle of the FarmShare platform, from onboarding to donation completion:

### 1. Registration & Email Verification (OTP Flow)
```mermaid
sequenceDiagram
    actor User as Farmer / NGO
    participant FE as Frontend (Web/Mobile)
    participant BE as FastAPI Backend
    participant DB as Neon PostgreSQL
    participant Email as SMTP Email Server

    User->>FE: Fill Registration Form (Name, Email, Role, Detect Location)
    FE->>BE: POST /auth/register (payload with Lat/Lng)
    BE->>BE: Generate Hash & 6-digit OTP code
    BE->>DB: INSERT INTO users (is_verified = FALSE, otp_code, otp_expires_at)
    BE->>Email: Send OTP Verification Email
    BE-->>FE: Return "OTP sent" response
    FE-->>User: Show OTP input screen
    User->>FE: Input 6-digit OTP code
    FE->>BE: POST /auth/verify-otp (email, otp_code)
    BE->>DB: SELECT user where otp_code matches & not expired
    DB-->>BE: User found
    BE->>DB: UPDATE users SET is_verified = TRUE, otp_code = NULL
    BE-->>FE: Return JWT Token & User Profile
    FE-->>User: Redirect to Dashboard (Farmer or NGO)
```

---

### 2. Farmer Surplus Listing Flow (Manual & AI-Voice)
```mermaid
sequenceDiagram
    actor Farmer
    participant FE as Frontend (Web/Mobile)
    participant AI as HarvestLink AI (Bedrock)
    participant BE as FastAPI Backend
    participant Cloud as Cloudinary Storage
    participant DB as Neon PostgreSQL
    participant Email as SMTP Email Server

    alt Option A: AI Voice Listing
        Farmer->>FE: Press "Speak" button & speak details
        FE->>BE: POST /ai/voice-listing (speech transcript)
        BE->>AI: Send prompt to Amazon Nova Pro
        AI-->>BE: Return JSON autofill block (produce name, qty, resolved harvest date)
        BE-->>FE: Return AI response
        FE->>FE: Parse JSON & autofill produce form (Flash green shadow)
    else Option B: Manual Input
        Farmer->>FE: Type produce details in form fields
    end

    opt Optional Image Upload
        Farmer->>FE: Select produce image
        FE->>BE: POST /upload/image (MultipartFile)
        BE->>Cloud: Upload image file
        Cloud-->>BE: Return secure URL
        BE-->>FE: Return image URL
    end

    Farmer->>FE: Submit Listing
    FE->>BE: POST /produce (ProduceCreate payload + JWT)
    BE->>DB: INSERT INTO produce (status = 'available')
    DB-->>BE: Return produce record
    BE-->>FE: Return ProduceOut (Confirm listing uploaded)
    
    Note over BE, Email: Background notification triggers
    BE->>DB: SELECT active, verified NGOs
    DB-->>BE: List of NGOs
    BE->>BE: Filter NGOs within 100km using Haversine formula
    BE->>Email: Send stylized HTML notification emails in background thread
```

---

### 3. Smart Matching & Pickup Request Flow
```mermaid
sequenceDiagram
    actor NGO
    participant FE as Frontend (Web/Mobile)
    participant BE as FastAPI Backend
    participant DB as Neon PostgreSQL

    NGO->>FE: Open Browse Feed (Map/List)
    FE->>FE: Request current GPS location
    FE->>BE: GET /match/smart (lat, lng, limit=100)
    BE->>DB: SELECT produce JOIN farmers where status != 'delivered'
    DB-->>BE: Return raw active listings
    BE->>BE: Compute Smart Match Scores & reasons for listings
    BE-->>FE: Return list sorted by score (with match details)
    FE->>FE: Render "Best Match Hero" (top-ranked item)
    FE-->>NGO: Display sorted feed & reasons
    NGO->>FE: Click "Request Pickup"
    FE->>BE: POST /requests/{produce_id}
    BE->>DB: Verify produce status is 'available'
    BE->>DB: INSERT INTO pickup_requests (status = 'pending')
    BE->>DB: UPDATE produce SET status = 'requested'
    BE-->>FE: Return PickupRequestOut
    FE-->>NGO: Show "Request Submitted" toast alert
```

---

### 4. Farmer Approval & Delivery Closing Flow
```mermaid
sequenceDiagram
    actor Farmer
    actor NGO
    participant FE as Frontend (Web/Mobile)
    participant BE as FastAPI Backend
    participant DB as Neon PostgreSQL

    Farmer->>FE: Open "Requests" tab
    FE->>BE: GET /requests/incoming
    BE->>DB: SELECT requests for Farmer's active produce
    DB-->>BE: Return active requests
    BE-->>FE: Display request list
    
    alt Accept Request
        Farmer->>FE: Click "Accept Request"
        FE->>BE: PUT /requests/{request_id}/accept
        BE->>DB: UPDATE pickup_requests SET status = 'accepted' where id = request_id
        BE->>DB: UPDATE produce SET status = 'pickup_scheduled'
        BE->>DB: UPDATE other pending requests for produce SET status = 'rejected'
        BE-->>FE: Return updated request details
        FE-->>Farmer: Show "Pickup Scheduled" status
        
        Note over NGO, Farmer: Offline Logistics: NGO travels to farm, collects produce
        
        NGO->>FE: Click "Mark Delivered" on Mobile/Web
        FE->>BE: PUT /requests/{request_id}/delivered
        BE->>DB: UPDATE pickup_requests SET status = 'delivered'
        BE->>DB: UPDATE produce SET status = 'delivered'
        BE-->>FE: Return completed status
        FE-->>NGO: Show "Delivery Completed" confirmation
        FE->>FE: Real-time update in Analytics (Total kg transferred)
    else Reject Request
        Farmer->>FE: Click "Reject Request"
        FE->>BE: PUT /requests/{request_id}/reject
        BE->>DB: UPDATE pickup_requests SET status = 'rejected'
        BE->>DB: Check if other requests exist, if none: UPDATE produce SET status = 'available'
        BE-->>FE: Return rejected status
    end
```

---

## 🗄️ Database Schema & Data Models

The database consists of three core tables managed inside **PostgreSQL**:

```mermaid
erDiagram
    users {
        uuid id
        varchar name
        varchar email
        varchar password_hash
        varchar role
        boolean is_verified
        varchar otp_code
        timestamp otp_expires_at
        float latitude
        float longitude
        timestamp created_at
    }

    produce {
        uuid id
        uuid farmer_id
        varchar produce_name
        float quantity
        date harvest_date
        varchar location
        varchar image_url
        varchar status
        float latitude
        float longitude
        timestamp created_at
    }

    pickup_requests {
        uuid id
        uuid produce_id
        uuid ngo_id
        uuid farmer_id
        varchar status
        timestamp requested_at
        timestamp updated_at
    }

    users ||--o{ produce : "uploads"
    users ||--o{ pickup_requests : "requests"
    produce ||--o{ pickup_requests : "receives"
```

---

## 🚀 Live Services & Deployment

* **Backend Production API:** Hosted on AWS EC2 at `http://13.234.42.87:8000` (Swagger docs available at `/docs`).
* **Database Platform:** Neon Serverless PostgreSQL.
* **AI Runtime:** AWS Bedrock proxy service.
* **Storage Provider:** Cloudinary.
