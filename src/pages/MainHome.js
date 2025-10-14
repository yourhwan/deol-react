import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MainHome.css';
import MainLayout from '../components/MainLayout';
import axios from 'axios';

const MainHome = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState({
        username: 'Guest',
        profileImage: '',
    });
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const albumListRef = useRef(null);
    const artistListRef = useRef(null);
    // 공용 휠 → 좌우 스크롤

    useEffect(() => {
        const fetchPopularArtists = async () => {
            try {
                const response = await axios.get('/api/mainhome/artists');
                setArtists(response.data);
            } catch (error) {
                console.error('Error fetching popular artists:', error);
            }
        };

        const fetchPopularAlbums = async () => {
            try {
                const response = await axios.get('/api/mainhome/albums');
                setAlbums(response.data);
            } catch (error) {
                console.error('Error fetching popular albums:', error);
            }
        };

        fetchPopularArtists();
        fetchPopularAlbums();
    }, []);

    const handleLogin = () => navigate('/login');
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUser({ username: 'Guest', profileImage: '' });
        navigate('/mainhome');
    };

    const handleWheelScroll = (e) => {
        // preventDefault()는 쓰지 마세요 (passive 경고 방지)
        const el = e.currentTarget;            // ← 이벤트가 걸린 그 요소
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; // 트랙패드 대응
        el.scrollLeft += delta;
    };

    const handleAlbumClick = (albumId) => {
        navigate(`/album/${albumId}/details`);
    };

    const handleArtistClick = (artistId) => {
        navigate(`/artists/${artistId}/details`);
    };

    return (
        <MainLayout
            user={isLoggedIn ? user : null}
            onLogin={handleLogin}
            onLogout={handleLogout}
        >
            <div className="main-home-container">
                <section className="popular-artists">
                    <h2>인기 아티스트</h2>
                    <div className="artist-list" ref={artistListRef} onWheel={handleWheelScroll}>
                        {artists.map((artist, index) => (
                            <div key={index} className="artist-card" onClick={() => handleArtistClick(artist.memberArtistSeq)} >
                                <div className="artist-image">
                                    <img
                                        src={artist.profileImageUrl || 'https://via.placeholder.com/100'}
                                        alt={artist.memberArtistName}
                                    />
                                </div>
                                <div className="artist-name">{artist.memberArtistName || artist.memberNickname}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="popular-albums">
                    <h2>인기 앨범</h2>
                    <div className="album-list" ref={albumListRef} onWheel={handleWheelScroll}>
                        {albums.map((album, index) => (
                            <div key={index} className="album-card" onClick={() => handleAlbumClick(album.albumId)}>
                                <div className="album-image">
                                    <img
                                        src={album.coverImage || `https://via.placeholder.com/100`}
                                        alt={album.albumTitle || '앨범'}
                                    />
                                </div>
                                <div className="album-title">{album.albumTitle}</div>
                                <div className="album-artist">{album.albumArtistName}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="recommended-charts">
                    <h2>추천 차트</h2>

                    {/* 수평 스크롤 유지 */}
                    <div className="album-list" onWheel={handleWheelScroll}>
                        {[
                            {
                                key: 'realtime',
                                route: '/chart',
                                title: '실시간 TOP 100',
                                subtitle: '지금 가장 인기 있는 곡 · 최근 24시간 이내 재생',
                                img: require('../assets/deol_logo_circle.png'),
                                alt: '실시간 차트',
                            },
                            {
                                key: 'new-tracks',
                                route: '/chart/new-track',
                                title: '신곡 TOP 100',
                                subtitle: '발매 30일 이내 · 최근 7일 재생',
                                img: require('../assets/deol_logo_circle.png'),
                                alt: '신곡 차트',
                            },
                            // 필요하면 여기에 다른 차트 카드들을 추가하세요.
                            // { key: 'weekly', route: '/chart/weekly', title: '주간 TOP 100', subtitle: '지난 7일 누적', img: ..., alt: '주간 차트' },
                            // { key: 'genre',  route: '/chart/genre',  title: '장르별 TOP',   subtitle: '취향 따라 듣기', img: ..., alt: '장르 차트' },
                        ].map((c) => (
                            <div
                                key={c.key}
                                className="album-card"
                                onClick={() => navigate(c.route)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="album-image">
                                    <img src={c.img} alt={c.alt} />
                                </div>
                                <div className="album-title">{c.title}</div>
                                <div className="album-artist">{c.subtitle}</div>
                            </div>
                        ))}
                    </div>
                </section>


                {/*<section className="following-artists-live">*/}
                {/*    <h2>팔로잉 아티스트 라이브</h2>*/}
                {/*    <div className="live-list">*/}
                {/*        {artists.map((artist, index) => (*/}
                {/*            <div key={index} className="live-card">*/}
                {/*                <div className="live-image">*/}
                {/*                    <img*/}
                {/*                        src={`https://via.placeholder.com/100`}*/}
                {/*                        alt={artist.memberArtistName || '아티스트'}*/}
                {/*                    />*/}
                {/*                </div>*/}
                {/*                <div className="live-name">{artist.memberArtistName}</div>*/}
                {/*            </div>*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*</section>*/}
            </div>
        </MainLayout>
    );
};

export default MainHome;
