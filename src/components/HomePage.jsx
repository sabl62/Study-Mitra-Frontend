import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faArrowRight,
  faSignInAlt,
  faUsers,
  faComments,
  faRobot,
  faStar,
  faLightbulb,
  faUserPlus,
  faSearch,
  faMagic,
  faQuoteLeft,
  faRocket,
  faCheckCircle,
  faHeart,
  faBrain,
  faCertificate,
  faGraduationCap,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faTwitter,
  faLinkedin,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import "./HomePage.css";
// Simple Animation on Scroll Implementation
// Add this to your Home component or create a separate utility file

export const initScrollAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
      }
    });
  }, observerOptions);

  // Observe all elements with data-aos attribute
  document.querySelectorAll('[data-aos]').forEach(element => {
    observer.observe(element);
  });
};

// Call this in your Home component's useEffect:
// useEffect(() => {

// }, []);
const HomePage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    initScrollAnimations();
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="grid-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge" data-aos="fade-down">
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            <span>AI-Powered Learning Platform</span>
          </div>

          <h1 className="hero-title" data-aos="fade-up" data-aos-delay="100">
            Your Study Partner,
            <br />
            <span className="gradient-text">Reimagined</span>
          </h1>

          <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
            Connect with peers, collaborate in real-time, and let AI transform
            your study sessions into comprehensive notes. Study smarter, not
            harder.
          </p>

          <div className="hero-cta" data-aos="fade-up" data-aos-delay="300">
            <Link to="/signup" className="cta-primary">
              <span>Get Started Free</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link to="/login" className="cta-secondary">
              <FontAwesomeIcon icon={faSignInAlt} />
              <span>Sign In</span>
            </Link>
          </div>

          <div className="hero-stats" data-aos="fade-up" data-aos-delay="400">
            <div className="stat-item">
              <FontAwesomeIcon icon={faUsers} />
              <div className="stat-content">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Students</div>
              </div>
            </div>
            <div className="stat-item">
              <FontAwesomeIcon icon={faComments} />
              <div className="stat-content">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Study Sessions</div>
              </div>
            </div>
            <div className="stat-item">
              <FontAwesomeIcon icon={faRobot} />
              <div className="stat-content">
                <div className="stat-number">100K+</div>
                <div className="stat-label">AI Notes Generated</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="scroll-indicator"
          data-aos="fade-in"
          data-aos-delay="500"
        >
          <div className="mouse">
            <div className="wheel"></div>
          </div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">
            <FontAwesomeIcon icon={faStar} />
            Features
          </span>
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <p className="section-subtitle">
            Powerful tools designed for modern collaborative learning
          </p>
        </div>

        <div className="features-grid">
          <div
            className="feature-card large"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>
            </div>
            <h3>Collaborative Study Rooms</h3>
            <p>
              Create or join live study sessions with peers. Real-time chat,
              screen sharing, and synchronized note-taking for maximum
              productivity.
            </p>
            <div className="feature-tags">
              <span className="tag">Real-time</span>
              <span className="tag">Collaborative</span>
            </div>
          </div>

          <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
            <div className="feature-icon-wrapper">
              <div className="feature-icon accent">
                <FontAwesomeIcon icon={faBrain} />
              </div>
            </div>
            <h3>AI Note Generation</h3>
            <p>
              Advanced AI analyzes your study sessions and automatically
              generates comprehensive notes with key concepts and definitions.
            </p>
            <div className="feature-tags">
              <span className="tag">AI-Powered</span>
            </div>
          </div>

          <div className="feature-card" data-aos="fade-up" data-aos-delay="300">
            <div className="feature-icon-wrapper">
              <div className="feature-icon accent">
                <FontAwesomeIcon icon={faCertificate} />
              </div>
            </div>
            <h3>Smart Portfolio</h3>
            <p>
              Upload certificates and let AI extract skills automatically. Build
              a professional portfolio that showcases your achievements.
            </p>
            <div className="feature-tags">
              <span className="tag">Automated</span>
            </div>
          </div>

          <div className="feature-card" data-aos="fade-up" data-aos-delay="400">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>
            </div>
            <h3>Exam Preparation</h3>
            <p>
              Access curated study materials, practice tests, and personalized
              study plans tailored to your learning style.
            </p>
            <div className="feature-tags">
              <span className="tag">Personalized</span>
            </div>
          </div>

          <div className="feature-card" data-aos="fade-up" data-aos-delay="500">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
            </div>
            <h3>Progress Tracking</h3>
            <p>
              Monitor your learning journey with detailed analytics and insights
              into your study habits and performance.
            </p>
            <div className="feature-tags">
              <span className="tag">Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">
            <FontAwesomeIcon icon={faLightbulb} />
            How It Works
          </span>
          <h2 className="section-title">Get Started in Minutes</h2>
        </div>

        <div className="steps-container">
          <div className="step-item" data-aos="fade-right" data-aos-delay="100">
            <div className="step-number">01</div>
            <div className="step-content">
              <div className="step-icon">
                <FontAwesomeIcon icon={faUserPlus} />
              </div>
              <h3>Create Account</h3>
              <p>
                Sign up in seconds with your email. No credit card required.
              </p>
            </div>
          </div>

          <div
            className="step-connector"
            data-aos="fade-in"
            data-aos-delay="200"
          ></div>

          <div className="step-item" data-aos="fade-right" data-aos-delay="300">
            <div className="step-number">02</div>
            <div className="step-content">
              <div className="step-icon">
                <FontAwesomeIcon icon={faSearch} />
              </div>
              <h3>Find or Create</h3>
              <p>
                Browse study sessions or create your own on any topic you want.
              </p>
            </div>
          </div>

          <div
            className="step-connector"
            data-aos="fade-in"
            data-aos-delay="400"
          ></div>

          <div className="step-item" data-aos="fade-right" data-aos-delay="500">
            <div className="step-number">03</div>
            <div className="step-content">
              <div className="step-icon">
                <FontAwesomeIcon icon={faComments} />
              </div>
              <h3>Collaborate</h3>
              <p>
                Join live sessions, chat with peers, and learn together in
                real-time.
              </p>
            </div>
          </div>

          <div
            className="step-connector"
            data-aos="fade-in"
            data-aos-delay="600"
          ></div>

          <div className="step-item" data-aos="fade-right" data-aos-delay="700">
            <div className="step-number">04</div>
            <div className="step-content">
              <div className="step-icon">
                <FontAwesomeIcon icon={faMagic} />
              </div>
              <h3>AI Magic</h3>
              <p>
                Let AI generate comprehensive notes from your study sessions
                instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header" data-aos="fade-up">
          <span className="section-badge">
            <FontAwesomeIcon icon={faQuoteLeft} />
            Testimonials
          </span>
          <h2 className="section-title">Loved by Students Worldwide</h2>
        </div>

        <div className="testimonials-grid">
          <div
            className="testimonial-card"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="testimonial-stars">
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
            </div>
            <p className="testimonial-text">
              "Study Mitra completely transformed how I prepare for exams. The
              AI notes are incredibly accurate and save me hours of work!"
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">SK</div>
              <div className="author-info">
                <div className="author-name">Sarah Kim</div>
                <div className="author-role">Computer Science, MIT</div>
              </div>
            </div>
          </div>

          <div
            className="testimonial-card"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="testimonial-stars">
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
            </div>
            <p className="testimonial-text">
              "The collaborative study rooms are a game-changer. I've made
              friends and study partners from around the world."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">RP</div>
              <div className="author-info">
                <div className="author-name">Raj Patel</div>
                <div className="author-role">Medicine, Stanford</div>
              </div>
            </div>
          </div>

          <div
            className="testimonial-card"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div className="testimonial-stars">
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
              <FontAwesomeIcon icon={faStar} />
            </div>
            <p className="testimonial-text">
              "As someone who struggles with note-taking, the AI summarization
              feature is a lifesaver. My grades have never been better!"
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">EJ</div>
              <div className="author-info">
                <div className="author-name">Emma Johnson</div>
                <div className="author-role">Business, Harvard</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content" data-aos="zoom-in">
          <div className="cta-icon">
            <FontAwesomeIcon icon={faRocket} />
          </div>
          <h2>Ready to Transform Your Learning?</h2>
          <p>
            Join thousands of students who are already studying smarter with
            Study Mitra.
          </p>
          <Link to="/signup" className="cta-button">
            <span>Start Learning Today</span>
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
          <p className="cta-subtext">
            <FontAwesomeIcon icon={faCheckCircle} />
            No credit card required • Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Study Mitra</h3>
            <p>Your AI-powered study companion for academic success.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a href="#" aria-label="Twitter">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" aria-label="LinkedIn">
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a href="#" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">FAQ</a>
              <a href="#">Roadmap</a>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>

            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">Guides</a>
              <a href="#">API</a>
              <a href="#">Community</a>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
              <a href="#">GDPR</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Study Mitra. All rights reserved.</p>
          <p>
            Made with <FontAwesomeIcon icon={faHeart} /> for students worldwide
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
