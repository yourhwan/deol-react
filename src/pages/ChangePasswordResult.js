import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoMain from '../assets/deol_logo_write.png';  // 로고 경로
import logoCircle from '../assets/deol_logo_circle.png';  // 로고 경로
import '../css/FindIdPwResult.css';  // 스타일 시트 추가
import { FaRegCheckCircle } from "react-icons/fa";  // 체크 아이콘

const ChangePasswordResult = () => {
    const navigate = useNavigate(); // 네비게이션 훅

    const handleGoLogin = () => {
        navigate('/login'); // 로그인 페이지로 이동
    };

    return (
        <div className="container-fluid find-id-result-page">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div>
                <div className="col-12 text-center">
                    <div className="logo-container-find">
                        <img src={logoCircle} alt="Circle Logo" className="logo-circle" />
                        <img src={logoMain} alt="Main Logo" className="logo-main" />
                    </div>
                    <div className="result-id-container">
                        <div className="result-id-content">
                            <FaRegCheckCircle className="signup-success-icon" size={50} color="green" />
                            <p className="find-id-message">비밀번호 변경 완료</p> {/* 비밀번호 변경 완료 메시지 */}
                        </div>
                        <p></p>
                        <div className="find-options">
                            <button className="btn-go-login-result" onClick={handleGoLogin}>로그인</button>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 d-none d-md-block"></div>
            </div>
        </div>
    );
};

export default ChangePasswordResult;
