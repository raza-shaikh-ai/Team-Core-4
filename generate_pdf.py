import os
import sys

def main():
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import Paragraph
        from reportlab.lib.styles import ParagraphStyle
    except ImportError:
        print("reportlab is not installed. Installing it now...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import Paragraph
        from reportlab.lib.styles import ParagraphStyle

    # Widescreen 16:9 format (960pt x 540pt)
    width = 960
    height = 540

    c = canvas.Canvas("FarmShare_Presentation_Deck.pdf", pagesize=(width, height))

    DARK_BG = HexColor("#0A0F0C")
    EMERALD = HexColor("#10B981")
    WHITE = HexColor("#F9FAFB")
    GRAY = HexColor("#9CA3AF")

    # Paragraph styles
    style_title = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=28, textColor=EMERALD, leading=34)
    style_subtitle = ParagraphStyle('Subtitle', fontName='Helvetica-Oblique', fontSize=15, textColor=GRAY, leading=19)
    style_bullet = ParagraphStyle('Bullet', fontName='Helvetica', fontSize=12, textColor=WHITE, leading=16)
    style_label = ParagraphStyle('Label', fontName='Helvetica-Bold', fontSize=14, textColor=WHITE, leading=17)
    style_desc = ParagraphStyle('Desc', fontName='Helvetica', fontSize=11, textColor=GRAY, leading=14)

    def draw_background():
        c.setFillColor(DARK_BG)
        c.rect(0, 0, width, height, fill=1, stroke=0)

    def add_standard_slide(title, subtitle, bullets, img_filename):
        draw_background()

        # Title
        p_title = Paragraph(title, style_title)
        p_title.wrap(440, 100)
        p_title.drawOn(c, 45, 455)

        # Subtitle
        y_curr = 425
        if subtitle:
            p_sub = Paragraph(subtitle, style_subtitle)
            p_sub.wrap(440, 50)
            p_sub.drawOn(c, 45, y_curr)
            y_curr -= 35

        # Bullets
        y_bullet = y_curr - 10
        for bullet in bullets:
            p_bullet = Paragraph(f"&bull;&nbsp;&nbsp;{bullet}", style_bullet)
            p_bullet_width = 440
            p_bullet_height = p_bullet.wrap(p_bullet_width, 150)[1]
            y_bullet -= (p_bullet_height + 15)
            p_bullet.drawOn(c, 45, y_bullet)

        # Image on Right (Centered 410x410 block)
        img_path = os.path.join("img", img_filename)
        if os.path.exists(img_path):
            c.drawImage(img_path, 505, 65, width=410, height=410, preserveAspectRatio=True)
        else:
            print(f"Warning: Image file not found at {img_path}")

        c.showPage()

    # =========================================================================
    # SLIDE 1: Title Slide (with Team Name, PS, and Objective)
    # =========================================================================
    draw_background()
    p_title = Paragraph("FarmShare", ParagraphStyle('TitleLarge', fontName='Helvetica-Bold', fontSize=44, textColor=EMERALD, leading=50))
    p_title.wrap(440, 100)
    p_title.drawOn(c, 45, 440)

    p_sub = Paragraph("Direct-to-Community Surplus Food Distribution", style_subtitle)
    p_sub.wrap(440, 50)
    p_sub.drawOn(c, 45, 410)

    p_team = Paragraph("Team Name: Core4", style_title)
    p_team.wrap(440, 50)
    p_team.drawOn(c, 45, 335)

    # Problem Statement
    p_ps_lbl = Paragraph("Problem Statement", style_label)
    p_ps_lbl.wrap(440, 20)
    p_ps_lbl.drawOn(c, 45, 280)

    p_ps_txt = Paragraph("Build a platform connecting farmers with surplus produce directly to food banks and NGOs to reduce food waste.", style_desc)
    p_ps_txt.wrap(440, 80)
    p_ps_txt.drawOn(c, 45, 225)

    # Objective
    p_obj_lbl = Paragraph("Objective", style_label)
    p_obj_lbl.wrap(440, 20)
    p_obj_lbl.drawOn(c, 45, 175)

    p_obj_txt = Paragraph("Develop a sustainable platform that helps farmers donate or distribute surplus produce to food banks and NGOs, reducing food waste while ensuring excess food reaches people in need.", style_desc)
    p_obj_txt.wrap(440, 100)
    p_obj_txt.drawOn(c, 45, 95)

    img_path1 = os.path.join("img", "farmshare_banner.jpg")
    if os.path.exists(img_path1):
        c.drawImage(img_path1, 505, 65, width=410, height=410, preserveAspectRatio=True)
    c.showPage()

    # =========================================================================
    # SLIDE 2: The Food Waste Gap (Flow Chart)
    # =========================================================================
    add_standard_slide(
        "The Food Waste Gap",
        "Agricultural Excess vs. Nutrition Insecurity",
        [
            "The Surplus: Tons of fresh, edible farm produce go to waste due to overproduction or cosmetic flaws.",
            "The Friction: Farmers lack a direct, rapid channel to find organizations that can collect food before it spoils.",
            "The Need: NGOs and food banks lack real-time visibility into local farm surpluses.",
            "The Flow: Connects farmers directly to nearby NGOs to claim surplus in 6 clear steps: list, parse, alert, claim, accept, and deliver."
        ],
        "flow_chart_dark.png"
    )

    # =========================================================================
    # SLIDE 3: HarvestLink AI Voice Assistant
    # =========================================================================
    add_standard_slide(
        "HarvestLink Voice AI",
        "Voice-Activated Form Autofill",
        [
            "Multilingual Support: Speaks English, Hindi (हिंदी), Marathi (मराठी), Telugu (తెలుగు), and Kannada (కನ್ನಡ).",
            "Voice-to-Text: Captures farmer speech in the field using standard browser Web Speech API.",
            "AWS Bedrock Nova Pro: Processes audio transcriptions to parse crop name, quantity, and harvest dates.",
            "Context Resolution: Translates regional crops to English and resolves words like 'today' to standard dates."
        ],
        "ai_voice_assistant.jpg"
    )

    # =========================================================================
    # SLIDE 4: Smart Proximity Logistics
    # =========================================================================
    add_standard_slide(
        "Smart Proximity Logistics",
        "Optimized Routing & Instant Alerts",
        [
            "Intelligent Matching: Our engine calculates logistics scores based on straight-line distance and crop freshness.",
            "100km Notification Radius: Local NGOs receive immediate email alerts with a one-click claim button the moment food is listed."
        ],
        "smart_match_routing.jpg"
    )

    # =========================================================================
    # SLIDE 5: Closed-Loop Delivery
    # =========================================================================
    add_standard_slide(
        "Closed-Loop Delivery",
        "Full Transparency from Field to Family",
        [
            "Strict State Control: A clear 4-step pipeline ensures no double claiming. Accepting one NGO auto-rejects competitors.",
            "Verified Handoffs: Operations are finalized only when transport drivers mark the food as physically collected on-site."
        ],
        "delivery_flow.png"
    )

    # =========================================================================
    # SLIDE 6: Measuring Impact
    # =========================================================================
    add_standard_slide(
        "Measuring Impact",
        "Dashboard Statistics & Real-Time Analytics",
        [
            "Live Aggregation: Every successful delivery updates global metrics, tracking exact kilograms of food rescued.",
            "Join The Network: FarmShare is fully scalable and ready to empower your community's agricultural logistics."
        ],
        "impact_stats.jpg"
    )

    # =========================================================================
    # SLIDE 7: Detailed Backend Architecture
    # =========================================================================
    add_standard_slide(
        "Backend Architecture Map",
        "Secure & Scalable FastAPI Ecosystem (No Redis)",
        [
            "Layer 1 (API Gateway): Nginx reverse proxy routes traffic to FastAPI application routers (Auth, Produce, Requests, Stats).",
            "Layer 2 (Logic Layer): Manages JWT validation, Smart Match distance score logic, and background email alert tasks.",
            "Layer 3 (Services): Neon serverless database, AWS Bedrock AI inference, Cloudinary media storage, and SMTP alerts."
        ],
        "system_architecture.png"
    )

    # =========================================================================
    # SLIDE 8: Tech Stack & Tools
    # =========================================================================
    add_standard_slide(
        "Tech Stack & Frameworks",
        "Lightweight, High-Performance Infrastructure",
        [
            "Backend System: FastAPI, Python 3.10+, Neon Serverless PostgreSQL, raw psycopg2 query pool.",
            "Frontend Stack: HTML5, CSS Glassmorphism, Leaflet.js, OpenStreetMap.",
            "Mobile App: React Native (Expo framework), React Navigation, WebViews for identical maps rendering.",
            "API Services: AWS Bedrock, Cloudinary Image Storage, SMTP Mail dispatcher."
        ],
        "tech_stack.png"
    )

    c.save()
    print("Success! Saved presentation deck to FarmShare_Presentation_Deck.pdf")

if __name__ == "__main__":
    main()
