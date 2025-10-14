import React, { useState, useRef } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { signupArtist, checkIdAvailability } from '../services/authService';
import { sendVerificationCode, verifyCode } from '../services/apiService';
import logoMain from '../assets/deol_logo_write.png';
import logoCircle from '../assets/deol_logo_circle.png';
import '../css/Signup.css';
import { useNavigate } from "react-router-dom";

const SignupArtist = () => {
    const [formData, setFormData] = useState({
        memberId: '',
        memberPassword: '',
        memberPasswordConfirm: '',
        memberName: '',
        artistName: '',
        memberEmail: '',
        memberGender: '',
        memberBirthdate: ''
    });

    const [idError, setIdError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordConfirmError, setPasswordConfirmError] = useState(null);
    const [nameError, setNameError] = useState(null);
    const [artistNameError, setArtistNameError] = useState(null);
    const [birthdateError, setBirthdateError] = useState(null);
    const [genderError, setGenderError] = useState(null);
    const [emailError, setEmailError] = useState('');
    const [verificationError, setVerificationError] = useState('');

    const [formSuccess, setFormSuccess] = useState(null);
    const [formError, setFormError] = useState(null);

    const [idAvailabilityMessage, setIdAvailabilityMessage] = useState('');
    const [isIdAvailable, setIsIdAvailable] = useState(true);

    const [isCodeSent, setIsCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [emailSuccessMessage, setEmailSuccessMessage] = useState('');
    const [verificationSuccessMessage, setVerificationSuccessMessage] = useState('');

    const idInputRef = useRef(null);
    const nameInputRef = useRef(null);
    const artistNameInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const passwordConfirmInputRef = useRef(null);
    const birthdateInputRef = useRef(null);
    const genderButtonRef = useRef(null);

    const navigate = useNavigate(); // 회원가입 성공 여부에 따라 적절한 페이지로 이동

    const idRegex = /^[a-zA-Z0-9]{6,20}$/;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    const nameRegex = /^[가-힣]{2,4}$/;
    const artistNicknameRegex = /^[\w가-힣@$!%*?&]{1,20}$/;
    const emailRegex = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;

    const today = new Date();

    const validateBirthdate = (birthdate) => {
        if (birthdate.length !== 8) return false;

        const year = parseInt(birthdate.substring(0, 4), 10);
        const month = parseInt(birthdate.substring(4, 6), 10);
        const day = parseInt(birthdate.substring(6, 8), 10);

        if (month < 1 || month > 12) return false;

        const daysInMonth = [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (day < 1 || day > daysInMonth[month - 1]) return false;

        const birthDateObj = new Date(year, month - 1, day);
        if (birthDateObj.getFullYear() !== year || birthDateObj.getMonth() + 1 !== month || birthDateObj.getDate() !== day) {
            return false;
        }

        const age = today.getFullYear() - year;
        const monthDiff = today.getMonth() - (month - 1);
        const dayDiff = today.getDate() - day;
        const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;

        return actualAge >= 12 && actualAge <= 120; // 최소 12세, 최대 120세 확인
    };

    const isLeapYear = (year) => {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };

    const handleChange = async (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));

        // 아이디 유효성 검사
        if (name === 'memberId') {
            if (value === '') {
                setIdError(null);
                setIdAvailabilityMessage('');
            } else if (!idRegex.test(value)) {
                setIdError('아이디는 6~20자 영문 또는 영문과 숫자 조합이어야 합니다.');
                setIsIdAvailable(true);
                setIdAvailabilityMessage('');
            } else {
                try {
                    const response = await checkIdAvailability(value);
                    if (response === true) {
                        setIsIdAvailable(true);
                        setIdError(null);
                        setIdAvailabilityMessage('사용 가능한 아이디입니다.');
                    } else {
                        setIsIdAvailable(false);
                        setIdError('이미 사용 중인 아이디입니다.');
                        setIdAvailabilityMessage('');
                    }
                } catch (err) {
                    setIdError('아이디 중복 확인 오류');
                    setIdAvailabilityMessage('');
                }
            }
        }

        // 비밀번호 유효성 검사
        if (name === 'memberPassword') {
            if (value === '') {
                setPasswordError(null);
            } else if (!passwordRegex.test(value)) {
                setPasswordError('영문, 숫자, 특수문자를 조합하여 입력해주세요. (8~16자)');
            } else {
                setPasswordError(null);
            }
            if (formData.memberPasswordConfirm && value !== formData.memberPasswordConfirm) {
                setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
            } else {
                setPasswordConfirmError(null);
            }
        }

        // 비밀번호 확인 유효성 검사
        if (name === 'memberPasswordConfirm') {
            if (value === '') {
                setPasswordConfirmError(null);
            } else if (value !== formData.memberPassword) {
                setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
            } else {
                setPasswordConfirmError(null);
            }
        }

        // 이름 유효성 검사
        if (name === 'memberName') {
            if (value === '') {
                setNameError(null);
            } else if (!nameRegex.test(value)) {
                setNameError('이름은 2~4자의 한글이어야 합니다.');
            } else {
                setNameError(null);
            }
        }

        // 아티스트 이름 유효성 검사
        if (name === 'artistName') {
            if (value === '') {
                setArtistNameError(null);
            } else if (!artistNicknameRegex.test(value)) {
                setArtistNameError('아티스트 이름은 1~20자 이내로 입력해 주세요.');
            } else {
                setArtistNameError(null);
            }
        }

        // 이메일 유효성 검사
        if (name === 'memberEmail') {
            if (value === '') {
                setEmailError(null);
            } else if (!emailRegex.test(value)) {
                setEmailError('유효한 이메일 주소를 입력해 주세요.');
            } else {
                setEmailError('');
            }
        }

        // 생년월일 유효성 체크
        if (name === 'memberBirthdate') {
            if (validateBirthdate(value)) {
                setBirthdateError(null);  // 유효하면 에러 제거
            } else {
                setBirthdateError('유효한 생년월일을 입력해 주세요.\n(YYYYMMDD, 최소 12세 이상)');
            }
        }
    };

    const handleGenderSelect = (gender) => {
        setFormData((prevData) => ({
            ...prevData,
            memberGender: gender
        }));
        setGenderError(null);
    };

    const handleSendVerificationCode = async () => {
        if (!emailRegex.test(formData.memberEmail)) {
            setEmailError('유효한 이메일 주소를 입력해 주세요.');
            return;
        }
        try {
            await sendVerificationCode(formData.memberEmail);
            setIsCodeSent(true);
            setEmailError('');
            setEmailSuccessMessage('인증코드가 발송되었습니다.');
        } catch (error) {
            setEmailError('인증 코드 발송 실패');
        }
    };

    const handleVerifyCode = async () => {
        try {
            const result = await verifyCode(formData.memberEmail, verificationCode);
            if (result === '인증 코드가 확인되었습니다.') {
                setIsEmailVerified(true);
                setVerificationError('');
                setEmailError('');
                setVerificationSuccessMessage('인증이 완료되었습니다.');
            }
        } catch (error) {
            setIsEmailVerified(false);
            setVerificationSuccessMessage('');
            setVerificationError('인증 코드가 일치하지 않습니다.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);
        setGenderError(null);

        // 유효성 검사
        if (!formData.memberId) {
            setIdError('아이디를 입력해 주세요.');
            idInputRef.current.focus();
            return;
        }

        if (!idRegex.test(formData.memberId)) {
            setIdError('아이디는 6~20자 영문 또는 영문과 숫자 조합이어야 합니다.');
            idInputRef.current.focus();
            return;
        }

        if (!isIdAvailable) {
            setIdError('이미 사용 중인 아이디 입니다.');
            idInputRef.current.focus();
            return;
        }

        if (formData.memberPassword !== formData.memberPasswordConfirm) {
            setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
            passwordConfirmInputRef.current.focus();
            return;
        }

        if (!passwordRegex.test(formData.memberPassword)) {
            setPasswordError('영문, 숫자, 특수문자를 조합하여 입력해주세요. (8~16자)');
            passwordInputRef.current.focus();
            return;
        }

        if (!formData.memberName) {
            setNameError('이름을 입력해 주세요.');
            nameInputRef.current.focus();
            return;
        }

        if (!nameRegex.test(formData.memberName)) {
            setNameError('이름은 2~4자의 한글이어야 합니다.');
            nameInputRef.current.focus();
            return;
        }

        if (!formData.artistName) {
            setArtistNameError('아티스트 이름을 입력해 주세요.');
            artistNameInputRef.current.focus();
            return;
        }

        if (!artistNicknameRegex.test(formData.artistName)) {
            setArtistNameError('아티스트 이름은 1~20자 이내로 입력해 주세요.');
            artistNameInputRef.current.focus();
            return;
        }

        if (!formData.memberGender) {
            setGenderError('성별을 선택해 주세요.');
            genderButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!formData.memberBirthdate || birthdateError) {
            setBirthdateError('생년월일을 입력해 주세요.');
            birthdateInputRef.current.focus();
            return;
        }

        if (!validateBirthdate(formData.memberBirthdate)) {
            setBirthdateError('유효한 생년월일을 입력해 주세요.');
            birthdateInputRef.current.focus();
            return;
        }

        if (!isEmailVerified) {
            setEmailError('이메일 인증을 완료해 주세요.');
            return;
        }

        if (!verificationCode || verificationError) {
            setVerificationError('올바른 인증 코드를 입력해 주세요.');
            return;
        }

        try {
            await signupArtist(formData);
            setFormSuccess('아티스트 회원가입이 성공적으로 완료되었습니다.');
            navigate('/signup/result', { state: { isSuccess: true } });

            setFormData({
                memberId: '',
                memberPassword: '',
                memberPasswordConfirm: '',
                memberName: '',
                artistName: '',
                memberEmail: '',
                memberGender: '',
                memberBirthdate: ''
            });
            setIsEmailVerified(false);
            setIsCodeSent(false);
            setVerificationCode('');
            setVerificationSuccessMessage('');
        } catch (err) {
            setFormError('회원가입에 실패했습니다.');
            navigate('/signup/result', { state: { isSuccess: false } });
        }
    };

    return (
        <div className="container-fluid">
            <div className="row vh-100 align-items-center">
                <div className="col-md-4 d-none d-md-block"></div>
                <div className="logo-container-signup">
                    <img src={logoCircle} alt="Circle Logo" className="logo-circle" />
                    <img src={logoMain} alt="Main Logo" className="logo-main" />
                </div>
                <form className='signup-form' onSubmit={handleSubmit}>
                    <div className="input-container">
                        {/* 아이디 입력 */}
                        <p className='signupform-title'>아이디</p>
                        <input
                            className="id-input-signup"
                            type="text"
                            name="memberId"
                            value={formData.memberId}
                            onChange={handleChange}
                            autoComplete="off"
                            required
                            ref={idInputRef}
                        />
                        <p className={`message ${idError ? 'error-message' : 'success-message'}`}>
                            {idError || idAvailabilityMessage || ''}
                        </p>

                        {/* 비밀번호 입력 */}
                        <p className='signupform-title'>비밀번호</p>
                        <input
                            className="password-input-signup"
                            type="password"
                            name="memberPassword"
                            value={formData.memberPassword}
                            onChange={handleChange}
                            required
                            ref={passwordInputRef}
                        />
                        <p className={`message ${passwordError ? 'error-message' : ''}`}>
                            {passwordError || ''}
                        </p>

                        {/* 비밀번호 확인 입력 */}
                        <p className='signupform-title'>비밀번호 확인</p>
                        <input
                            className="passwordcheck-input-signup"
                            type="password"
                            name="memberPasswordConfirm"
                            value={formData.memberPasswordConfirm}
                            onChange={handleChange}
                            autoComplete="off"
                            required
                            ref={passwordConfirmInputRef}
                        />
                        <p className={`message ${passwordConfirmError ? 'error-message' : ''}`}>
                            {passwordConfirmError || ''}
                        </p>

                        {/* 이름 입력 */}
                        <p className='signupform-title'>이름</p>
                        <input
                            className="name-input-signup"
                            type="text"
                            name="memberName"
                            value={formData.memberName}
                            onChange={handleChange}
                            autoComplete="off"
                            required
                            ref={nameInputRef}
                        />
                        <p className={`message ${nameError ? 'error-message' : ''}`}>
                            {nameError || ''}
                        </p>

                        {/* 아티스트 이름 입력 */}
                        <p className='signupform-title'>아티스트 이름</p>
                        <input
                            className="artistname-input-signup"
                            type="text"
                            name="artistName"
                            value={formData.artistName}
                            onChange={handleChange}
                            autoComplete="off"
                            required
                            ref={artistNameInputRef}
                        />
                        <p className={`message ${artistNameError ? 'error-message' : ''}`}>
                            {artistNameError || ''}
                        </p>

                        {/* 성별 선택 */}
                        <p className='signupform-title'>성별</p>
                        <div className="gender-options">
                            <button
                                type="button"
                                className={`gender-btn ${formData.memberGender === '남자' ? 'selected' : ''}`}
                                onClick={() => handleGenderSelect('남자')}
                                ref={genderButtonRef}
                            >
                                남자
                            </button>
                            <button
                                type="button"
                                className={`gender-btn ${formData.memberGender === '여자' ? 'selected' : ''}`}
                                onClick={() => handleGenderSelect('여자')}
                            >
                                여자
                            </button>
                        </div>
                        <p className={`message ${genderError ? 'error-message' : ''}`}>
                            {genderError || ''}
                        </p>

                        {/* 생년월일 입력 */}
                        <p className='signupform-title'>생년월일</p>
                        <input
                            className="birth-input-signup"
                            type="text"
                            name="memberBirthdate"
                            value={formData.memberBirthdate}
                            onChange={handleChange}
                            placeholder="YYYYMMDD"
                            maxLength={8}
                            required
                            ref={birthdateInputRef}
                            autoComplete="off"
                        />
                        <p className={`message ${birthdateError ? 'error-message' : ''}`}>
                            {birthdateError || ''}
                        </p>

                        {/* 이메일 입력 및 인증 */}
                        <p className='signupform-title'>이메일</p>
                        <div className="email-container">
                            <input
                                className="mail-input-signup"
                                type="email"
                                name="memberEmail"
                                value={formData.memberEmail}
                                onChange={handleChange}
                                placeholder={'deol@gmail.com'}
                                required
                                disabled={isEmailVerified}
                                style={{ cursor: isEmailVerified ? 'not-allowed' : 'text' }}
                                autoComplete="off"
                            />
                            {!isEmailVerified && (
                                <button
                                    type="button"
                                    className="verify-btn"
                                    onClick={handleSendVerificationCode}
                                >
                                    인증
                                </button>
                            )}
                        </div>
                        <p className={`message ${emailError ? 'error-message' : emailSuccessMessage ? 'success-message' : ''}`}>
                            {emailError || emailSuccessMessage || ''}
                        </p>

                        {/* 인증 코드 입력 */}
                        <p className='signupform-title'>인증 코드</p>
                        <div className="code-container">
                            <input
                                className="verify-input-signup"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                disabled={!isCodeSent || isEmailVerified}
                                autoComplete="off"
                            />
                            {!isEmailVerified && (
                                <button
                                    type="button"
                                    className="verify-btn"
                                    disabled={!isCodeSent}
                                    onClick={handleVerifyCode}
                                >
                                    인증확인
                                </button>
                            )}
                        </div>
                        <p className={`message ${verificationError ? 'error-message' : verificationSuccessMessage ? 'success-message' : ''}`}>
                            {verificationError || verificationSuccessMessage || ''}
                        </p>

                        {/* 회원가입 버튼 */}
                        <button className="signup-btn" type="submit">회원가입</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupArtist;
