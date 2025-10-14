import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SignupHome.css'; // CSS 파일 import
import logoMain from '../assets/deol_logo_write.png'; // 첫 번째 이미지 파일 import
import logoCircle from '../assets/deol_logo_circle.png'; // 두 번째 이미지 파일 import

function SignupHome() {
    const navigate = useNavigate();

    const handleRegularSignup = () => {
        navigate('/signup/regular'); // 일반회원 가입 페이지로 이동
    };

    const handleArtistSignup = () => {
        navigate('/signup/artist'); // 아티스트회원 가입 페이지로 이동
    };
    
    const handleLogin = () => {
      navigate('/login'); // 로그인 페이지로 이동
    }

    return (
        <div className="container-fluid">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div> {/* 좌측 4열 (medium 이상에서 보이도록 설정) */}
                <div className="logo-container">
                    <img src={logoCircle} alt="Circle Logo" className="logo-circle" />
                    <img src={logoMain} alt="Main Logo" className="logo-main" />
                </div>
                <div className="signupbutton-container mt-4">
                    <button onClick={handleRegularSignup} className="btn-regular mb-2">일반 회원가입</button>
                    <button onClick={handleArtistSignup} className="btn-artist">아티스트 회원가입</button>
                </div>
                <div className="gologin-container">
                    <p className="inline-text">이미 계정이 있으신가요?</p>
                    <p onClick={handleLogin} className="login-text mt-3">로그인</p>
                </div>
                <div className="col-md-4 d-none d-md-block"></div> {/* 우측 4열 (medium 이상에서 보이도록 설정) */}
            </div>
        </div>
    );
}

export default SignupHome;
