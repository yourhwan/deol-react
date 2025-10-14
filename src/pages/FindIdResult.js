import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import logoMain from '../assets/deol_logo_write.png';  // 로고 경로
import logoCircle from '../assets/deol_logo_circle.png';  // 로고 경로
import '../css/FindIdPwResult.css';
import {FaRegCheckCircle} from "react-icons/fa";  // 스타일 시트 추가

const FindIdResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {memberId} = location.state || {}; // 이전 페이지에서 전달받은 memberId

    const handleGoLogin = () => {
        navigate('/login'); // 로그인 페이지로 이동
    };

    const handleGoFindPassword = () => {
        navigate('/find-password'); // 비밀번호 찾기 페이지로 이동
    };

    return (
        <div className="container-fluid find-id-result-page">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div>
                <div className="col-12 text-center">
                    <div className="logo-container-find">
                        <img src={logoCircle} alt="Circle Logo" className="logo-circle"/>
                        <img src={logoMain} alt="Main Logo" className="logo-main"/>
                    </div>
                    <div className="result-id-container">
                        <div className="result-id-content">
                            <FaRegCheckCircle className="signup-success-icon" size={50} color="green"/>
                            <p className="find-id-message">아이디 찾기 완료</p>
                        </div>
                        <h2 className="found-id">ID : {memberId}</h2> {/* 찾은 아이디 출력 */}
                    <div className="find-options-result">
                        <button className="btn-go-login-result" onClick={handleGoLogin}>로그인</button>
                        <button className="btn-go-login-result" onClick={handleGoFindPassword}>비밀번호 찾기</button>
                    </div>
                    </div>
                </div>
                <div className="col-md-4 d-none d-md-block"></div>
            </div>
        </div>
    );
};

export default FindIdResult;
