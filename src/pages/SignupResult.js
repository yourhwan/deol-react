import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import '../css/SignupResult.css'; // CSS 파일 import
import logoMain from '../assets/deol_logo_write.png'; // 첫 번째 이미지 파일 import
import logoCircle from '../assets/deol_logo_circle.png'; // 두 번째 이미지 파일 import
import { FaRegCheckCircle, FaTimesCircle } from "react-icons/fa"; // 성공/실패 아이콘

function SignupResult() {
    const navigate = useNavigate();
    const location = useLocation();
    const isSuccess = location.state?.isSuccess;  // 성공 여부 확인

    const handleGoLogin = () => {
        navigate('/login');  // 로그인 페이지로 이동
    };

    const handleGoHome = () => {
        navigate('/mainhome');  // 메인 페이지로 이동
    };

    const handleGoRegularSignup = () => {
        navigate('/signup/regular');  // 일반 회원가입 페이지로 이동
    };

    const handleGoArtistSignup = () => {
        navigate('/signup/artist');  // 아티스트 회원가입 페이지로 이동
    };

    return (
        <div className="container-fluid">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div>
                <div className="logo-container">
                    <img src={logoCircle} alt="Circle Logo" className="logo-circle"/>
                    <img src={logoMain} alt="Main Logo" className="logo-main"/>
                </div>

                {/* 성공 여부에 따라 다른 메시지 표시 */}
                <div className="msg-container">
                    {isSuccess ? (
                        <>
                            <FaRegCheckCircle className="signup-success-icon" size={50} color="green" />
                            <h2 className="msg-signup-success">회원가입 완료</h2>
                            <p className="msg-start-info">로그인 후 Deol의 서비스를 즐기세요</p>
                        </>
                    ) : (
                        <>
                            <FaTimesCircle className="signup-failure-icon" size={50} color="red" />
                            <h2 className="msg-signup-failure">회원가입 실패</h2>
                            <p className="msg-start-info">다시 시도해 주세요.</p>
                        </>
                    )}
                </div>

                <div className="btn-container">
                    {isSuccess ? (
                        <>
                            <button onClick={handleGoLogin} className="btn-login mb-2">로그인</button>
                            <button onClick={handleGoHome} className="btn-mainhome mb-2">메인 페이지</button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleGoRegularSignup} className="btn-regular-result mb-2">일반 회원가입</button>
                            <button onClick={handleGoArtistSignup} className="btn-artist-result mb-2">아티스트 회원가입</button>
                        </>
                    )}
                </div>
                <div className="col-md-4 d-none d-md-block"></div>
            </div>
        </div>
    );
}

export default SignupResult;