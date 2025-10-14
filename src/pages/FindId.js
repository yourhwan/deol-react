import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoMain from '../assets/deol_logo_write.png';  // 로고 경로
import logoCircle from '../assets/deol_logo_circle.png';  // 로고 경로
import '../css/FindIdPassword.css';  // 스타일 시트

const FindId = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        memberName: '',  // 이름 입력을 위한 상태
        memberEmail: '', // 이메일 입력을 위한 상태
    });
    const [error, setError] = useState('');

    const emailRegex = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
    const nameRegex = /^[가-힣]{2,4}$/;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 이메일 유효성 검사
        if (!emailRegex.test(formData.memberEmail)) {
            setError('유효한 이메일 주소를 입력해 주세요.'); // 이메일 형식 불일치 에러
            return;
        }

        // 이름 유효성 검사
        if (!nameRegex.test(formData.memberName)) {
            setError('올바른 이름을 입력해 주세요.'); // 이름 형식 불일치 에러
            return;
        }

        try {
            // Axios를 이용한 POST 요청
            const response = await axios.post('/api/find-id', {
                memberName: formData.memberName,
                memberEmail: formData.memberEmail
            });

            // 서버에서 받은 아이디
            const memberId = response.data; // 아이디가 바로 반환되는 구조로 수정

            // 다른 페이지로 이동하면서 userId를 전달
            navigate('/find-id/result', { state: { memberId } });

        } catch (err) {
            setError('존재하지 않는 유저 입니다.');
            console.error(err);
        }
    };

    const handleGoLogin = () => {
        navigate('/login'); // 로그인 페이지로 이동
    };

    function handleGoFindPw() {
        navigate('/find-password') // 비밀번호 찾기 페이지로 이동
    };

    return (
        <div className="container-fluid findId-page">
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
                                placeholder="이름"
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
                                placeholder="이메일"
                            />
                            <div>
                                {error && <p className="message error-message-id">{error}</p>}
                            </div>
                        </div>
                        <button className="find-id-btn" type="submit">아이디 찾기</button>
                        <p className="find-options">
                            <span className="btn-go-login" onClick={handleGoLogin}>로그인</span>
                            <span className="btn-go-login" onClick={handleGoFindPw}>비밀번호 찾기</span>
                        </p>
                    </form>

                </div>
                <div className="col-md-4 d-none d-md-block"></div>
            </div>
        </div>
    );
};

export default FindId;
