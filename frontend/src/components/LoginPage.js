import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        authService.login(email, password).then(
            () => {
                navigate('/scheduler');
                window.location.reload();
            },
            (error) => {
                const resMessage =
                    (error.response &&
                     error.response.data &&
                     error.response.data.message) ||
                    error.message ||
                    error.toString();
                
                setLoading(false);
                setMessage(resMessage);
            }
        );
    };

    return (
        <div className="login-container">
            {/* Animated Background */}
            <div className="background-animation">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
                <div className="floating-shape shape-4"></div>
                <div className="floating-shape shape-5"></div>
            </div>

            {/* Main Login Card */}
            <div className="login-card">
                <div className="login-header">
                    <div className="brand-logo">
                        <span className="logo-icon">📚</span>
                        <h1 className="brand-title">ETASHA</h1>
                    </div>
                    <p className="brand-subtitle">Admin Dashboard</p>
                    <div className="welcome-text">
                        <h2>Welcome Back</h2>
                        <p>Sign in to manage your training sessions</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <div className="input-wrapper">
                            <span className="input-icon">✉️</span>
                            <input 
                                type="email" 
                                name="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder=" "
                                required 
                                className="form-input"
                            />
                            <label className="floating-label">Email Address</label>
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder=" "
                                required 
                                className="form-input"
                            />
                            <label className="floating-label">Password</label>
                            <button 
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? (
                            <>
                                <div className="button-spinner"></div>
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <span className="button-icon">→</span>
                            </>
                        )}
                    </button>

                    {message && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {message}
                        </div>
                    )}
                </form>

                <div className="login-footer">
                    <p>Secure access to ETASHA training management system</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;