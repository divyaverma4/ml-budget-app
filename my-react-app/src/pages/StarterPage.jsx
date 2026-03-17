import { useNavigate } from 'react-router-dom'
import './StarterPage.css'

export default function StarterPage() {
  const navigate = useNavigate()

  return (
    <div className="starter-wrapper">
      <div className="starter-logo-top">
        <LogoIcon />
      </div>

      <div className="starter-center">
        <LogoIcon />
        <h1 className="starter-brand">
          <span className="bold">Finance</span>Buddy
        </h1>
      </div>

      <div className="starter-actions">
        <button className="btn-create" onClick={() => navigate('/signup')}>
          Create a new account
        </button>
        <button className="btn-login" onClick={() => navigate('/login')}>
          I already have an account
        </button>
      </div>
    </div>
  )
}

function LogoIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="logo-icon">
      <circle cx="22" cy="22" r="22" fill="#c2785a" opacity="0.85" />
      <g transform="translate(22,22)">
        <ellipse cx="0" cy="-9" rx="5" ry="9" fill="#e8b4a0" transform="rotate(0)" />
        <ellipse cx="0" cy="-9" rx="5" ry="9" fill="#d4967a" transform="rotate(90)" />
        <ellipse cx="0" cy="-9" rx="5" ry="9" fill="#e8b4a0" transform="rotate(180)" />
        <ellipse cx="0" cy="-9" rx="5" ry="9" fill="#d4967a" transform="rotate(270)" />
      </g>
      <circle cx="22" cy="22" r="4" fill="#c2785a" />
    </svg>
  )
}
