import axios from 'axios';

// 백엔드 서버의 API URL
const API_URL = process.env.REACT_APP_API_URL || '/api';

// 이메일 인증 코드 전송
export const sendVerificationCode = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/email/check-email`, null, {
            params: { memberEmail: email },
        });
        console.log('인증 코드가 발송 되었습니다.');
        return response.data; // 성공 메시지 반환
    } catch (error) {
        console.error('인증 코드 전송 실패:', error.response?.data || error.message);
        throw error; // 에러 처리를 위해 throw 추가
    }
};

// 인증 코드 검증
export const verifyCode = async (email, code) => {
    try {
        const response = await axios.post(`${API_URL}/email/verify`, null, {
            params: { memberEmail: email, code },
        });
        return response.data; // 성공 메시지 반환
    } catch (error) {
        // 서버의 오류 응답을 확인하여 특정 메시지 던지기
        if (error.response && error.response.status === 400) {
            throw new Error('INVALID_CODE'); // 인증 코드 유효하지 않음
        } else {
            throw new Error('TECHNICAL_ERROR'); // 기술적 오류
        }
    }
};
