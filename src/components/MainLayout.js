// src/components/MainLayout.jsx
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/MainLayout.css';
import { IoSearchSharp, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { IoIosArrowDropleft, IoIosArrowDropright } from 'react-icons/io';
import { BiSolidPlaylist } from 'react-icons/bi';
import { VscLibrary } from 'react-icons/vsc';
import logoMain from '../assets/deol_logo_write.png';
import logoCircle from '../assets/deol_logo_circle.png';
import defaultProfileImage from '../assets/deol_logo_circle.png';
import { UserContext } from '../context/UserContext';
import PlaylistModal from '../components/PlaylistCreateModal';
import axios from 'axios';
import { CustomToast } from '../utils/CustomToast';

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // ─── 모달 / 메뉴 토글 상태 ─────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
    const [isMyMenuOpen, setIsMyMenuOpen] = useState(true);

    // ─── 프로필 / 검색 상태 ─────────────────────────────────────────
    const [nickname, setNickname] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchArtists, setSearchArtists] = useState([]);
    const [searchAlbums, setSearchAlbums] = useState([]);
    const [searchTracks, setSearchTracks] = useState([]);

    // ─── 전역 컨텍스트에서 유저 & 플레이리스트 ─────────────────────────
    const {
        user,
        handleLogout,
        loading,
        myPlaylists,      // 전역 플레이리스트
        fetchMyPlaylists, // 전역 갱신 함수
    } = useContext(UserContext);

    // ─── 닉네임·프로필 불러오기 ───────────────────────────────────────
    useEffect(() => {
        if (!user.isLoggedIn) {
            setNickname('');
            setProfileImage('');
            return;
        }
        // 병렬 호출
        Promise.all([
            axios.get('/api/mypage/nickname', {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
            }),
            axios.get('/api/mypage/profile', {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
            }),
        ])
            .then(([n, p]) => {
                setNickname(n.data.nickname);
                setProfileImage(p.data.profileImageUrl);
            })
            .catch((err) => console.error('프로필 로드 실패', err));

        fetchMyPlaylists(); // 로그인되면 사이드바 갱신
    }, [user.isLoggedIn, fetchMyPlaylists]);

    if (loading) return <div>로딩 중...</div>;

    const handleLogin = () => navigate('/login');
    const handleSignup = () => navigate('/signup/home');

    // ─── 검색 핸들러 ────────────────────────────────────────────────
    const onSearchSubmit = async (e) => {
        e.preventDefault();
        const kw = searchInput.trim();
        if (!kw) {
            setSearchArtists([]);
            setSearchAlbums([]);
            setSearchTracks([]);
            return;
        }
        try {
            const res = await axios.get('h/api/search', { params: { query: kw } });
            setSearchArtists(res.data.artists || []);
            setSearchAlbums(res.data.albums || []);
            setSearchTracks(res.data.tracks || []);
        } catch (err) {
            console.error('검색 실패', err);
            setSearchArtists([]);
            setSearchAlbums([]);
            setSearchTracks([]);
        }
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchArtists([]);
        setSearchAlbums([]);
        setSearchTracks([]);
    };

    // ─── 검색결과 클릭 핸들러 ────────────────────────────────────────
    const onArtistClick = (seq) => {
        navigate(`/artists/${seq}/details`);
        clearSearch();
    };
    const onAlbumClick = (id) => {
        navigate(`/album/${id}/details`);
        clearSearch();
    };
    const onTrackClick = (id) => {
        navigate(`/album/${id}/details`);
        clearSearch();
    };

    // ─── 플레이리스트 생성 후: 전역 이벤트 브로드캐스트 + 사이드바 갱신 ─────
    const handleCreatePlaylist = async ({ playlistName, playlistDescription, playlistCover }) => {
        const formData = new FormData();
        formData.append(
            'playlistDto',
            new Blob([JSON.stringify({ playlistName, playlistDescription })], { type: 'application/json' })
        );
        formData.append('playlistCover', playlistCover);

        try {
            const res = await axios.post('/api/playlists/create/playlist', formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            // 서버에서 방금 생성된 객체를 돌려준다고 가정
            const created = res?.data;

            // 1) 생성 성공 직후 전역 이벤트 브로드캐스트
            //    MyPlaylistsPage에서 이 이벤트를 받아 즉시 목록에 prepend 합니다.
            if (created && created.playlistId) {
                window.dispatchEvent(new CustomEvent('PLAYLIST_CREATED', { detail: created }));
            } else {
                // 혹시 생성 객체를 안 주면, 최소한 목록 갱신 신호라도 쏘기
                window.dispatchEvent(new Event('PLAYLISTS_UPDATED'));
            }

            // 2) 사이드바(내 플레이리스트)도 즉시 갱신
            await fetchMyPlaylists();

            setIsModalOpen(false);
            CustomToast('플레이리스트가 생성되었습니다.', 'success', { autoClose: 1200 });
        } catch (err) {
            console.error('플레이리스트 생성 오류', err);
            CustomToast('플레이리스트 생성에 실패했습니다.', 'error');
        }
    };

    return (
        <div className="main-layout">
            {/* ─── 상단바 ──────────────────────────────────────────────── */}
            <header className="main-top-bar">
                <div className="main-top-bar-buttons">
                    <button onClick={() => navigate(-1)}>
                        <IoIosArrowDropleft />
                    </button>
                    <button onClick={() => navigate(1)}>
                        <IoIosArrowDropright />
                    </button>
                </div>

                <div className="main-search-container">
                    <form className="main-search-bar" onSubmit={onSearchSubmit}>
                        <IoSearchSharp className="search-icon" />
                        <input
                            className="search-input"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="어떤 콘텐츠를 감상하고 싶으세요?"
                            autoComplete="off"
                        />
                    </form>
                    {(searchArtists.length || searchAlbums.length || searchTracks.length) > 0 && (
                        <div className="search-results-dropdown">
                            {searchArtists.length > 0 && (
                                <div className="search-section">
                                    <div className="section-header">아티스트</div>
                                    {searchArtists.map((a) => (
                                        <div
                                            key={a.artistSeq}
                                            className="search-results-item artist-item"
                                            onClick={() => onArtistClick(a.artistSeq)}
                                        >
                                            <img
                                                src={a.profileImageUrl || defaultProfileImage}
                                                alt={a.artistName}
                                                className="search-artist-thumb"
                                            />
                                            <span className="search-artist-name">{a.artistName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchAlbums.length > 0 && (
                                <div className="search-section">
                                    <div className="section-header">앨범</div>
                                    {searchAlbums.map((al) => (
                                        <div
                                            key={al.albumId}
                                            className="search-results-item album-item"
                                            onClick={() => onAlbumClick(al.albumId)}
                                        >
                                            <img src={al.coverImage} alt={al.albumTitle} className="search-album-thumb" />
                                            <span className="search-album-title">{al.albumTitle}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchTracks.length > 0 && (
                                <div className="search-section">
                                    <div className="section-header">트랙</div>
                                    {searchTracks.map((tr) => (
                                        <div
                                            key={tr.trackId}
                                            className="search-results-item track-item"
                                            onClick={() => onTrackClick(tr.albumId)}
                                        >
                                            <span className="search-track-title">{tr.trackTitle}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="top-bar-profile">
                    {user.isLoggedIn && (
                        <div className="main-user-section" onClick={() => navigate('/mypage')}>
                            <img src={profileImage || defaultProfileImage} alt="프로필" className="profile-image" />
                            <span className="username">{nickname || '사용자'}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* ─── 사이드바 ─────────────────────────────────────────────── */}
            <aside className="main-sidebar">
                <div className="logo-container-side" onClick={() => navigate('/mainhome')} style={{ cursor: 'pointer' }}>
                    <img src={logoCircle} alt="Circle Logo" className="logo-circle-side" />
                    <img src={logoMain} alt="Main Logo" className="logo-main-side" />
                </div>
                <div className="main-inner-sidebar">
                    <div className="side-menu-name-sector">
                        <VscLibrary /> <p className="side-menu-name">나의 라이브러리</p>
                    </div>
                    {user.isLoggedIn && (
                        <div className="my-playlist-section">
                            <p className="my-playlist-title">나의 플레이리스트</p>
                            <div className="my-playlist-box">
                                {myPlaylists.length === 0 ? (
                                    <div className="my-menu-item" onClick={() => setIsModalOpen(true)}>
                                        ＋ 플레이리스트 생성
                                    </div>
                                ) : (
                                    myPlaylists.slice(0, isPlaylistOpen ? myPlaylists.length : 5).map((pl) => (
                                        <div
                                            key={pl.playlistId}
                                            className="playlist-item"
                                            onClick={() => navigate(`/playlist/${pl.playlistId}`)}
                                        >
                                            <BiSolidPlaylist style={{ marginRight: '8px' }} />
                                            {pl.playlistName}
                                        </div>
                                    ))
                                )}
                                {myPlaylists.length > 5 && (
                                    <div className="playlist-toggle" onClick={() => setIsPlaylistOpen((p) => !p)}>
                                        {isPlaylistOpen ? <IoChevronUp /> : <IoChevronDown />}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="my-menu-section">
                        <div className="my-menu-header" onClick={() => setIsMyMenuOpen((p) => !p)}>
                            <span className="my-menu-title">마이 메뉴</span>
                            <span className="my-menu-toggle">{isMyMenuOpen ? <IoChevronUp /> : <IoChevronDown />}</span>
                        </div>
                        {isMyMenuOpen && (
                            <div className="my-menu-items">
                                {user.isLoggedIn ? (
                                    <>
                                        <div className="my-menu-item" onClick={() => navigate('/mypage')}>
                                            마이 페이지
                                        </div>
                                        {user.isArtist && (
                                            <div className="my-menu-item" onClick={() => navigate('/upload/album')}>
                                                앨범 업로드
                                            </div>
                                        )}
                                        <div className="my-menu-item" onClick={() => setIsModalOpen(true)}>
                                            플레이리스트 생성
                                        </div>
                                        <div className="my-menu-item" onClick={() => navigate('/user/all_playlists')}>
                                            플레이리스트 목록
                                        </div>
                                        <div className="my-menu-item" onClick={handleLogout}>
                                            로그아웃
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="my-menu-item" onClick={handleSignup}>
                                            회원가입
                                        </div>
                                        <div className="my-menu-item" onClick={handleLogin}>
                                            로그인
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ─── 플레이리스트 생성 모달 ──────────────────────────────────── */}
            <PlaylistModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchMyPlaylists(); // 혹시 모달 내부에서 상태가 바뀌었으면 사이드바 동기화
                }}
                onSubmit={handleCreatePlaylist}
            />

            {/* ─── 메인 콘텐츠 ───────────────────────────────────────────── */}
            <main className="main-content">{children}</main>
        </div>
    );
};

export default MainLayout;
