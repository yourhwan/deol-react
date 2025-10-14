import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialized = useRef(false);

    const [user, setUser] = useState({
        isLoggedIn: false,
        isArtist: false,
        username: '',
        profileImage: '',
    });
    const [loading, setLoading] = useState(true);

    const [myPlaylists, setMyPlaylists] = useState([]);

    const fetchUser = async () => {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setUser({ isLoggedIn: false, isArtist: false, username: '', profileImage: '' });
            setMyPlaylists([]);
            setLoading(false);
            return;
        }
        try {
            const { data } = await axios.get('/api/users/me/type', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser({
                isLoggedIn: true,
                isArtist: data.isArtist || false,
                username: data.username || '사용자',
                profileImage: data.profileImage || 'https://via.placeholder.com/40',
            });
            // 사용자 정보 성공적으로 불러온 경우 플레이리스트도 함께 가져옴
            await fetchMyPlaylists();
        } catch (err) {
            console.error('사용자 정보를 가져오는 중 오류:', err);
            setUser({ isLoggedIn: false, isArtist: false, username: '', profileImage: '' });
            setMyPlaylists([]);
            localStorage.removeItem('accessToken');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyPlaylists = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setMyPlaylists([]);
            return;
        }
        try {
            const res = await axios.get('/api/playlists/user/all_playlists', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMyPlaylists(res.data);
        } catch (err) {
            console.error('플레이리스트 조회 실패:', err);
            setMyPlaylists([]);
        }
    }, []);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            fetchUser();
        }
    }, []);

    useEffect(() => {
        const onStorage = e => {
            if (e.key === 'accessToken') fetchUser();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        if (loading) return;
        const artistOnly = ['/upload/album'];
        if (artistOnly.includes(location.pathname) && (!user.isLoggedIn || !user.isArtist)) {
            alert('아티스트 회원만 접근할 수 있습니다.');
            navigate('/mainhome');
        }
    }, [loading, location.pathname, user, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser({ isLoggedIn: false, isArtist: false, username: '', profileImage: '' });
        setMyPlaylists([]);
        navigate('/mainhome');
    };

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                handleLogout,
                loading,
                myPlaylists,
                fetchMyPlaylists, // ✔ 다른 컴포넌트에서 재사용 가능하게 노출
            }}
        >
            {children}
        </UserContext.Provider>
    );
};
