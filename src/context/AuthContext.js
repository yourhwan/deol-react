import React, { createContext, useState, useContext } from 'react';

// 인증 정보를 저장할 Context 생성
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
    });

    // 로그인 처리 함수
    const login = (tokens) => {
        setAuth(tokens); // 상태 업데이트
        localStorage.setItem('accessToken', tokens.accessToken); // 액세스 토큰 저장
        localStorage.setItem('refreshToken', tokens.refreshToken); // 리프레시 토큰 저장
    };

    // 로그아웃 처리 함수
    const logout = () => {
        setAuth({}); // 상태 초기화
        localStorage.removeItem('accessToken'); // 액세스 토큰 삭제
        localStorage.removeItem('refreshToken'); // 리프레시 토큰 삭제
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children} {/* Context.Provider를 사용하여 하위 컴포넌트에 Context 제공 */}
        </AuthContext.Provider>
    );
};

// Context를 사용하는 훅
export const useAuth = () => useContext(AuthContext);
