import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoMain from '../assets/deol_logo_write.png';  // 로고 경로
import logoCircle from '../assets/deol_logo_circle.png';  // 로고 경로
import '../css/FindIdPassword.css';  // 스타일 시트

const FindPassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        memberName: '',   // 이름 입력을 위한 상태
        memberId: '',     // 아이디 입력을 위한 상태
        memberEmail: '',  // 이메일 입력을 위한 상태
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        console.log(formData)

        try {
            // Axios를 이용한 POST 요청
            const response = await axios.post('/api/find-password', {
                memberName: formData.memberName,
                memberId: formData.memberId,
                memberEmail: formData.memberEmail
            });

            // 유저가 존재하는 경우 비밀번호 변경 페이지로 이동
            if (response.data === "User found") {
                navigate('/change-password', { state: { memberId: formData.memberId } }); // 비밀번호 변경 페이지로 이동
            }

        } catch (err) {
            setError('존재하지 않는 유저 입니다.');
            console.error(err);
        }
    };

    const handleGoLogin = () => {
        navigate('/login'); // 로그인 페이지로 이동
    };

    const handleGoFindId = () => {
        navigate('/find-id'); // 아이디 찾기 페이지로 이동
    };

    return (
        <div className="container-fluid findPassword-page">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div>
                <div className="col-12 text-center">
                    <div className="logo-container-find">
                        <img src={logoCircle} alt="Circle Logo" className="logo-circle" />
                        <img src={logoMain} alt="Main Logo" className="logo-main" />
                    </div>
                    <form className='find-form' onSubmit={handleSubmit}>
                        <div className="input-container">
                            <label htmlFor="memberName" className='find-form-title'>이름</label>
                            <input
                                type="text"
                                name="memberName"
                                value={formData.memberName}
                                onChange={handleChange}
                                autoComplete="off"
                                required
                                className="find-form-control"
                                placeholder="이름을 입력하세요"
                            />
                            <label htmlFor="memberId" className='find-form-title'>아이디</label>
                            <input
                                type="text"
                                name="memberId"
                                value={formData.memberId}
                                onChange={handleChange}
                                autoComplete="off"
                                required
                                className="find-form-control"
                                placeholder="아이디를 입력하세요"
                            />
                            <label htmlFor="memberEmail" className='find-form-title'>이메일</label>
                            <input
                                type="email"
                                name="memberEmail"
                                value={formData.memberEmail}
                                onChange={handleChange}
                                autoComplete="off"
                                required
                                className="find-form-control"
                                placeholder="이메일 주소"
                            />
                            <div>
                                {<p className="message error-message">{error}</p>}
                            </div>
                        </div>
                        <button className="find-pw-btn" type="submit">비밀번호 찾기</button>
                        <p className="find-options">
                            <span className="btn-go-login" onClick={handleGoLogin}>로그인</span>
                            <span className="btn-go-login" onClick={handleGoFindId}>아이디 찾기</span>
                        </p>
                    </form>
                </div>
                <div className="col-md-4 d-none d-md-block"></div>
            </div>
        </div>
    );
};

export default FindPassword;
