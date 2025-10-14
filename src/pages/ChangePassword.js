import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoMain from '../assets/deol_logo_write.png';  // 로고 경로
import logoCircle from '../assets/deol_logo_circle.png';  // 로고 경로
import '../css/FindIdPassword.css';  // 스타일 시트

const ChangePassword = () => {
    const location = useLocation();
    const navigate = useNavigate(); // useNavigate 추가
    const { memberId } = location.state || {}; // 전달받은 memberId
    const [newPassword, setNewPassword] = useState(''); // 새 비밀번호 상태
    const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인 상태
    const [successMessage, setSuccessMessage] = useState(''); // 성공 메시지 상태
    const [error, setError] = useState(''); // 에러 메시지 상태

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/; // 정규식

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.'); // 비밀번호 불일치 에러
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            setError('비밀번호는 8~16자, 최소 하나의\n영문, 숫자, 특수문자를 포함해야 합니다.'); // 정규식 불일치 에러
            return;
        }

        try {
            const response = await axios.put(`/api/change-password`, {
                memberId,
                newPassword
            });

            // 비밀번호 변경 성공 메시지 처리
            if (response.status === 200) {

                // 비밀번호 변경 후 결과 페이지로 이동
                setTimeout(() => {
                    navigate('/find-password/result');
                }, 500); // 0.5초 후에 이동
            }

        } catch (err) {
            // 에러 처리
            setError('비밀번호 변경에 실패했습니다. 다시 시도해 주세요.');
            setSuccessMessage(''); // 성공 메시지 초기화
        }
    };

    const handleGoLogin = () => {
        navigate('/login'); // 로그인 페이지로 이동
    };

    return (
        <div className="container-fluid findId-page">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div>
                <div className="col-12 text-center">
                    <div className="logo-container-find">
                        <img src={logoCircle} alt="Circle Logo" className="logo-circle"/>
                        <img src={logoMain} alt="Main Logo" className="logo-main"/>
                    </div>
                    <div className='change-password-container'>
                        <div className="input-container">
                            <label htmlFor="newPassword" className='find-form-title'>새 비밀번호</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="새 비밀번호"
                                className="find-form-control"
                                required
                            />
                            <label htmlFor="confirmPassword" className='find-form-title'>비밀번호 확인</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호 확인"
                                className="find-form-control"
                                required
                            />
                            {error && <p className="message error-message-pw">{error}</p>}
                            {successMessage && <p className="message success-message-pw">{successMessage}</p>}
                        </div>
                        <button onClick={handleChangePassword} className="chage-password-btn">비밀번호 변경</button>
                    </div>
                </div>
                <div className="col-md-4 d-none d-md-block"></div>
            </div>
        </div>
    );
};

export default ChangePassword;
