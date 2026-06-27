# FarmShare: Direct-to-Community Surplus Food Distribution
## Presentation Pitch Script & Slide-by-Slide Guide
**Team Name:** Core4  
**Presented by:** Team Core4  

---

### **Slide 1: Title & Vision**
* **Title:** FarmShare
* **Subtitle:** Direct-to-Community Surplus Food Distribution
* **Visual Asset:** Logo Banner (`img/farmshare_banner.jpg`)
* **Slide Content:** Team Name (Core4), Problem Statement, and Objective.

#### **🎤 Presenter Speech:**
> "Good evening, everyone. We are Team Core4, and today we are excited to present **FarmShare**—a platform designed to build a direct bridge connecting farmers with surplus produce directly to local food banks and NGOs. 
> 
> Our core **Problem Statement** addresses a massive inefficiency: tons of fresh food are wasted at the farm level due to overproduction or minor cosmetic flaws while millions of people go hungry. 
> 
> Our **Objective** is simple: to develop a sustainable, highly optimized, and multilingual platform that helps farmers distribute this surplus produce to organizations in need, reducing agricultural waste and fighting hunger simultaneously."

---

### **Slide 2: The Food Waste Gap**
* **Title:** The Food Waste Gap
* **Subtitle:** Agricultural Excess vs. Nutrition Insecurity
* **Visual Asset:** Simpler Dark Flow Chart (`img/flow_chart_dark.png`)
* **Slide Content:** The Surplus, The Friction, The Need, and The Flow.

#### **🎤 Presenter Speech:**
> "Let's talk about the gap. Today, agricultural excess exists in parallel with nutrition insecurity. The problem isn't a lack of food; it's a lack of connection. 
> 
> Farmers lack a direct, rapid channel to find organizations that can collect food before it spoils. Meanwhile, NGOs lack real-time visibility into local farm surpluses. 
> 
> As you can see in our streamlined **Surplus Food Delivery Flow Chart**, FarmShare solves this by creating a direct coordination network that automates the entire loop in 6 simple steps: from listing upload, to AI matching, radius notifications, NGO claiming, scheduling, and finally, verified handoff."

---

### **Slide 3: Registration & Verification Flow**
* **Title:** Registration & Verification Flow
* **Subtitle:** Secure User Onboarding & Email Verification
* **Visual Asset:** Registration Sequence Diagram (`img/otp_flow_bw.png`)
* **Slide Content:** User Form, OTP Dispatch, State Control, and JWT Session Verification.

#### **🎤 Presenter Speech:**
> "Security and coordinate-based tracking are vital from day one. When a farmer or NGO registers, they fill out their profile and provide location permissions. 
> 
> Our backend immediately generates a secure 6-digit OTP code and dispatches it via SMTP email. To ensure reliability, the user is created in an unverified state in our Neon PostgreSQL database. 
> 
> Only when they enter the correct OTP code, does the backend verify the account, return a JWT session token, and redirect them to their respective dashboard."

---

### **Slide 4: HarvestLink Multilingual Voice AI Flow**
* **Title:** HarvestLink Voice AI Flow
* **Subtitle:** Dynamic Farmer Surplus Listing Workflow
* **Visual Asset:** Listing Flow Sequence Diagram (`img/listing_flow_bw.png`)
* **Slide Content:** Browser Web Speech API, AWS Bedrock Multimodal Input, Autofill Processing, and Manual Fallbacks.

#### **🎤 Presenter Speech:**
> "One of FarmShare's most unique features is **HarvestLink Voice AI**. We know that farmers in the field face language and digital barriers. 
> 
> With HarvestLink, a farmer can simply tap a microphone button and speak in their local language—supporting English, Hindi, Marathi, Telugu, and Kannada. The app captures this speech via the browser Web Speech API, and forwards it to our FastAPI backend.
> 
> Our backend calls AWS Bedrock's Amazon Nova Pro model, which dynamically extracts the crop name, translates it to English (e.g. converting 'प्याज' or 'कांदा' directly to 'Onion'), parses the quantity, resolves relative dates like 'today', and automatically fills out the listing form in seconds."

---

### **Slide 5: Detailed Backend Architecture Map**
* **Title:** Backend Architecture Map
* **Subtitle:** Secure & Scalable FastAPI Ecosystem (No Redis)
* **Visual Asset:** System Architecture Blueprint (`img/system_architecture.png`)
* **Slide Content:** API Gateway (Nginx), Logic Layer (JWT / Proximity calculations / Background tasks), and Infrastructure Services.

#### **🎤 Presenter Speech:**
> "To support these features, we built a highly robust, clean, and scalable FastAPI ecosystem. 
> 
> At Layer 1, Nginx serves as our reverse proxy gateway, routing API calls to specific modular routers. 
> 
> Layer 2 handles JWT validation, Geospatial coordinate logic, and handles asynchronous email alert dispatches. 
> 
> At the persistence layer, we use serverless Neon PostgreSQL, AWS Bedrock for AI processing, Cloudinary for image hosting, and SMTP for transactional notifications. Note that we designed this with a lean footprint, avoiding external caching queues like Redis to maintain high speed and simple maintenance."

---

### **Slide 6: Database Schema & Models**
* **Title:** Database Schema & Models
* **Subtitle:** Entity Relationship (ER) PostgreSQL Blueprint
* **Visual Asset:** Database Schema ER Diagram (`img/database_schema_bw.png`)
* **Slide Content:** Users Table, Produce Table, Pickup Requests Table, and Relationship cardinality.

#### **🎤 Presenter Speech:**
> "Let's take a quick look at the database architecture. Our relational schema is designed for speed and consistency. 
> 
> We have three core tables: `users` which tracks profile roles and GPS coordinates; `produce` which logs listings, quantities, and status; and `pickup_requests` which manages NGO claims. 
> 
> A user can list multiple produce items (one-to-many), and each produce item can receive multiple NGO claims, which are strictly managed to avoid double-allocation."

---

### **Slide 7: Smart Match Proximity Engine Flow**
* **Title:** Smart Match Engine Workflow
* **Subtitle:** Distance & Freshness Scoring Pipeline
* **Visual Asset:** Smart Match Sequence Diagram (`img/matching_flow_bw.png`)
* **Slide Content:** Proximity calculations, Haversine formula, Weighted parameters, and Sorted feeds.

#### **🎤 Presenter Speech:**
> "How does matching work? When an NGO opens their feed, our system fetches active listings within their region. 
> 
> The **Smart Match Engine** calculates a dynamic compatibility score from 0 to 100% using the Haversine formula to compute exact distance. 
> 
> We weigh Proximity at 40%, Crop Freshness at 35%, Quantity at 15%, and availability window at 10%. The system then returns a sorted feed, placing the absolute best-matched produce at the top of the NGO's list."

---

### **Slide 8: Farmer Approval & Delivery Flow**
* **Title:** Pickup & Delivery Workflow
* **Subtitle:** Closed-Loop Request Acceptance & Handoff State Machine
* **Visual Asset:** Delivery Sequence Diagram (`img/delivery_flow_bw.png`)
* **Slide Content:** Request Review, Acceptance & auto-rejection, Driver Handoff, and Live stats update.

#### **🎤 Presenter Speech:**
> "The final loop is closed-loop delivery. When a farmer reviews incoming NGO requests, accepting one claim automatically updates the listing state and rejects all competing claims to prevent double-booking. 
> 
> The NGO collects the produce from the farm. Once the handoff is complete, the NGO marks it as 'delivered' in their app, which instantly increments the total kilograms of food rescued on our global analytics dashboard. 
> 
> This closes the cycle from field to family. FarmShare is currently live at `core-4.razadev.online` with API docs available at `api.razadev.online/docs`. Thank you, and we welcome any questions."
