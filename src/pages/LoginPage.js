// LoginPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { UserContext } from '../context/UserContext';
import { CustomToast } from '../utils/CustomToast'; // 토스트 유틸 임포트
import logoMain from '../assets/deol_logo_write.png';
import logoCircle from '../assets/deol_logo_circle.png';
import '../css/Login.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);
    const [formData, setFormData] = useState({
        memberId: '',
        memberPassword: '',
    });
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        // 이전에 저장된 아이디 불러오기
        const saved = localStorage.getItem('rememberedId');
        if (saved) {
            setFormData(f => ({ ...f, memberId: saved }));
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        // 이미 로그인된 상태면 메인으로
        if (localStorage.getItem('accessToken')) {
            navigate('/mainhome');
        }
    }, [navigate]);

    const handleToggleRememberMe = () => {
        setRememberMe(r => !r);
    };

    const handleChange = e => {
        setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleFindId = () => navigate('/find-id');
    const handleFindPassword = () => navigate('/find-password');
    const handleGoSignup = () => navigate('/signup/home');

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            const { accessToken, refreshToken } = await login(formData);

            // 1) 토큰 로컬에 저장
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            if (rememberMe) {
                localStorage.setItem('rememberedId', formData.memberId);
            } else {
                localStorage.removeItem('rememberedId');
            }

            // 2) Context 갱신
            setUser(u => ({ ...u, isLoggedIn: true }));

            // 3) storage 이벤트 트리거 (같은 탭에서도 감지)
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'accessToken',
                newValue: accessToken,
            }));

            // 4) 로그인 성공 토스트
            CustomToast('로그인에 성공했습니다.', 'success');

            // 5) 리다이렉트
            navigate('/mainhome');
        } catch (err) {
            // 서버에서 받은 에러 메시지 혹은 기본 메시지
            const errorMsg = err.response?.data?.errorMessage || '로그인 중 오류가 발생했습니다.';
            CustomToast(errorMsg, 'error');
        }
    };

    return (
        <div className="container-fluid login-page">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div>
                <div className="col-12 text-center">
                    <div className="logo-container-login">
                        <img src={logoCircle} alt="Circle Logo" className="logo-circle" />
                        <img src={logoMain} alt="Main Logo" className="logo-main" />
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-container">
                            <p className="login-form-title">아이디</p>
                            <input
                                type="text"
                                name="memberId"
                                value={formData.memberId}
                                onChange={handleChange}
                                autoComplete="off"
                                required
                                className="login-form-control"
                                placeholder="아이디"
                            />

                            <p className="login-form-title">비밀번호</p>
                            <input
                                type="password"
                                name="memberPassword"
                                value={formData.memberPassword}
                                onChange={handleChange}
                                required
                                className="login-form-control"
                                placeholder="비밀번호"
                            />

                            <div className="options-container">
                                <div className="toggle-container" onClick={handleToggleRememberMe}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={handleToggleRememberMe}
                                        className="toggle-checkbox"
                                        id="rememberMe"
                                    />
                                    <span className="toggle-slider"></span>
                                </div>
                                <span className="toggle-label">내 정보 기억하기</span>
                            </div>

                            <button className="login-btn" type="submit">
                                로그인
                            </button>
                        </div>

                        <p className="find-container">
              <span className="forgot-id" onClick={handleFindId}>
                아이디 찾기
              </span>
                            <span className="forgot-password" onClick={handleFindPassword}>
                비밀번호 찾기
              </span>
                        </p>

                        <p className="login-options">
                            계정이 없으신가요?{' '}
                            <span className="btn-gosignup" onClick={handleGoSignup}>
                회원가입
              </span>
                        </p>
                    </form>
                </div>
                <div className="col-md-4 d-none d-md-block"></div>
            </div>
        </div>
    );
};

export default LoginPage;
