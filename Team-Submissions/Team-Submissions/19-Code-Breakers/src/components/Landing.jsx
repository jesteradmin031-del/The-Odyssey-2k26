import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Compass,
  Languages,
  Sparkles,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  LockKeyhole,
  UserRound,
  MapPin,
} from 'lucide-react';
import CityScene from './CityScene.jsx';
import { auth } from '../services/auth.js';
import '../landing.css';

export default function Landing({ initialView = 'welcome', user, onGuest, onAuthenticated }) {
  const [view, setView] = useState(initialView),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [showPassword, setShowPassword] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const register = view === 'register';
  function switchView(next) {
    setView(next);
    setError('');
    setPassword('');
    setConfirm('');
    setShowPassword(false);
  }
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (register && password !== confirm) {
      setError('Your passwords do not match. Please check them.');
      return;
    }
    setBusy(true);
    try {
      const result = await (register
        ? auth.register({ name, email, password })
        : auth.login({ email, password }));
      onAuthenticated(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={`landing ${view === 'welcome' ? '' : 'auth-view'}`}>
      <header className="landing-nav">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            switchView('welcome');
          }}
        >
          <img src="/favicon.svg" alt="" />
          <span>
            Local<span className="brand-light">Route</span>
            <small>FIND YOUR WAY, YOUR WAY.</small>
          </span>
        </a>
        <nav aria-label="Landing navigation">
          <button onClick={onGuest}>
            Explore the map
            <ArrowRight size={14} />
          </button>
          <button className="landing-signin" onClick={() => switchView('login')}>
            Sign in
          </button>
          <button className="primary" onClick={() => switchView('register')}>
            Get started
            <ArrowRight size={15} />
          </button>
        </nav>
      </header>
      <section className="landing-hero">
        <div className="landing-copy" key={view}>
          {view === 'welcome' ? (
            <>
              <div className="landing-eyebrow">
                <span className="status-dot" /> YOUR JOURNEY, WITH LOCAL KNOWLEDGE
              </div>
              <h1>
                Every journey.
                <br />A little more
                <br />
                <em>local.</em>
                <span className="headline-star">✳</span>
              </h1>
              <p className="landing-description">
                Plan a route with a stop worth making.
                <br />
                Read the signs. Adapt when plans change.
                <br />
                Keep your journey and local phrases in your pocket.
              </p>
              <div className="landing-cta">
                <button className="primary" onClick={onGuest}>
                  {user ? 'Back to your map' : 'Explore demo'}
                  <ArrowRight size={18} />
                </button>
                <button className="landing-create" onClick={() => switchView('register')}>
                  Create an account
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="landing-footnote">
                <span className="footnote-avatars">
                  <i>↗</i>
                  <i>✳</i>
                  <i>⌁</i>
                </span>
                <span>
                  Made for explorers.
                  <br />
                  <strong>Ready for your next little adventure.</strong>
                </span>
              </div>
            </>
          ) : (
            <div className="auth-card">
              <button className="back-home" disabled={busy} onClick={() => switchView('welcome')}>
                <ArrowLeft size={14} />
                Back to discovering
              </button>
              <div className="section-eyebrow">
                <MapPin size={14} />
                {register ? 'YOUR NEXT CHAPTER STARTS HERE' : 'GOOD TO SEE YOU AGAIN'}
              </div>
              <h1>
                {register ? (
                  <>
                    The world is
                    <br />
                    better with you.
                  </>
                ) : (
                  <>
                    Welcome back,
                    <br />
                    explorer.
                  </>
                )}
              </h1>
              <p className="auth-intro">
                {register
                  ? 'Create your LocalRoute account and make yourself at home.'
                  : 'Sign in and pick up your next little adventure.'}
              </p>
              <form onSubmit={submit}>
                {register && (
                  <label className="auth-field">
                    Your name
                    <div>
                      <UserRound size={17} />
                      <input
                        autoComplete="name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={60}
                        disabled={busy}
                        placeholder="What should we call you?"
                      />
                    </div>
                  </label>
                )}
                <label className="auth-field">
                  Email address
                  <div>
                    <Mail size={17} />
                    <input
                      type="email"
                      autoComplete="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={254}
                      disabled={busy}
                      placeholder="you@example.com"
                    />
                  </div>
                </label>
                <label className="auth-field">
                  Password
                  <div>
                    <LockKeyhole size={17} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={register ? 'new-password' : 'current-password'}
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={register ? 10 : 1}
                      maxLength={128}
                      disabled={busy}
                      placeholder={register ? 'At least 10 characters' : 'Your password'}
                    />
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                {register && (
                  <label className="auth-field">
                    Confirm password
                    <div>
                      <LockKeyhole size={17} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        name="confirmPassword"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        minLength={10}
                        maxLength={128}
                        disabled={busy}
                        placeholder="One more time"
                      />
                    </div>
                  </label>
                )}
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary full auth-submit" disabled={busy}>
                  {busy ? <LoaderCircle className="spin" size={17} /> : null}
                  {busy ? 'Just a moment…' : register ? 'Create my account' : 'Sign in'}
                  {!busy && <ArrowRight size={17} />}
                </button>
              </form>
              <p className="auth-switch">
                {register ? 'Already part of the journey?' : 'New around here?'}{' '}
                <button disabled={busy} onClick={() => switchView(register ? 'login' : 'register')}>
                  {register ? 'Sign in' : 'Create an account'}
                </button>
              </p>
              <button className="guest-link" disabled={busy} onClick={onGuest}>
                Just looking? Explore the demo
                <ArrowRight size={13} />
              </button>
              <p className="auth-privacy">
                Local demo accounts are stored on this computer. Passwords are hashed; sign-in uses
                an HTTP-only session cookie.
              </p>
            </div>
          )}
        </div>
        <div className="landing-visual">
          <CityScene />
          <span className="visual-coordinates">
            12.9716° N &nbsp; 77.5946° E &nbsp; / &nbsp; BEGIN ANYWHERE
          </span>
        </div>
      </section>
      <section className="landing-features" aria-label="LocalRoute features">
        <div>
          <span className="feature-number">01</span>
          <Compass size={23} />
          <h2>Make a little detour.</h2>
          <p>
            Add a café, a park, or a place of your own.
            <br />
            Your stop becomes part of your route.
          </p>
        </div>
        <div>
          <span className="feature-number">02</span>
          <Languages size={23} />
          <h2>Read. Review. Adapt.</h2>
          <p>
            Scan and translate a travel notice.
            <br />
            Review it before choosing an alternative.
          </p>
        </div>
        <div>
          <span className="feature-number">03</span>
          <Sparkles size={23} />
          <h2>A journey to keep.</h2>
          <p>
            Download directions, phrases and notes.
            <br />
            Read your trip card without a connection.
          </p>
        </div>
      </section>
      <footer className="landing-footer">
        <span>
          LOCALROUTE <b>↗</b> BUILT FOR DISCOVERY
        </span>
        <span>A hackathon idea. A world of possibilities.</span>
        <button onClick={onGuest}>
          Let’s go somewhere
          <ArrowRight size={13} />
        </button>
      </footer>
    </main>
  );
}
