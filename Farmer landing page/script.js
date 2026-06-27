// ===================================================
// FarmShare Landing Page — Script
// No loading screen · Video pauses on last frame
// ===================================================

document.addEventListener('DOMContentLoaded', function () {

    // -------------------------------------------------
    // Mobile Navigation
    // -------------------------------------------------
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Inject mobile menu + hamburger animation styles
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
        .hamburger.active .bar:nth-child(2) { opacity: 0; }
        .hamburger.active .bar:nth-child(1) { transform: translateY(8px) rotate(45deg); }
        .hamburger.active .bar:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }
        
        @media (max-width: 768px) {
            .nav-menu {
                position: fixed;
                left: -100%;
                top: 60px;
                flex-direction: column;
                background: rgba(255,255,255,0.97);
                backdrop-filter: blur(20px);
                width: 100%;
                text-align: center;
                transition: 0.3s;
                padding: 2rem 0;
                border-top: 1px solid #e2ece2;
                box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            }
            .nav-menu.active { left: 0; }
            .nav-menu li { margin: 0.75rem 0; }
        }
    `;
    document.head.appendChild(mobileStyle);

    // -------------------------------------------------
    // Navbar scroll effect
    // -------------------------------------------------
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // -------------------------------------------------
    // Smooth scrolling
    // -------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // -------------------------------------------------
    // Video: pause at 12 seconds and stay as background
    // -------------------------------------------------
    const video = document.getElementById('hero-video');
    if (video) {
        let videoPausedAt12 = false;

        // Pause the video at exactly 12 seconds
        video.addEventListener('timeupdate', function () {
            if (!videoPausedAt12 && video.currentTime >= 12) {
                video.pause();
                videoPausedAt12 = true;
                // Video stays frozen on the 12-second frame as the hero background
            }
        });

        // Fallback: if video is shorter than 12s, freeze on last frame
        video.addEventListener('ended', function () {
            if (!videoPausedAt12) {
                video.pause();
                videoPausedAt12 = true;
            }
        });
    }

    // -------------------------------------------------
    // Intersection Observer — fadeInUp for sections
    // -------------------------------------------------
    const fadeStyle = document.createElement('style');
    fadeStyle.textContent = `
        @keyframes fadeInUp {
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(fadeStyle);

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.7s ease-out forwards';
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe section cards
    document.querySelectorAll('.step-card, .feature-card, .about-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        observer.observe(el);
    });
});