import axios from 'axios';

// 백엔드 서버의 API URL
const API_URL = process.env.REACT_APP_API_URL || '/api';

// 일반 회원가입 요청을 보내는 함수
export const signupRegular = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/signup/regular`, data);
        return response.data;
    } catch (error) {
        console.error("회원가입 중 오류가 발생했습니다:", error.response?.data || error.message);
        throw error;
    }
};

// 아티스트 회원가입 요청을 보내는 함수
export const signupArtist = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/signup/artist`, data);
        return response.data;
    } catch (error) {
        console.error("아티스트 회원가입 중 오류가 발생했습니다:", error.response?.data || error.message);
        throw error;
    }
};

// 로그인 요청을 보내는 함수
export const login = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/login`, data);
        return response.data;
    } catch (error) {
        console.error("로그인 중 오류가 발생했습니다:", error.response?.data || error.message);
        throw error;
    }
};

// 아이디 중복 확인 요청을 보내는 함수
export const checkIdAvailability = async (memberId) => {
    try {
        const response = await axios.get(`${API_URL}/check-id`, {
            params: { memberId }
        });
        return response.data;
    } catch (error) {
        console.error("아이디 중복 확인 중 오류가 발생했습니다:", error.response?.data || error.message);
        throw error;
    }
};
