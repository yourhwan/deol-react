// src/components/MainLayout.jsx
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [isSearching, setIsSearching] = useState(false);

    // 디바운스 타이머/취소용
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    // ─── 전역 컨텍스트에서 유저 & 플레이리스트 ─────────────────────────
    const {
        user,
        handleLogout,
        loading,
        myPlaylists,
        fetchMyPlaylists,
    } = useContext(UserContext);

    // ─── 닉네임·프로필 불러오기 ───────────────────────────────────────
    useEffect(() => {
        if (!user?.isLoggedIn) {
            setNickname('');
            setProfileImage('');
            return;
        }

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

        fetchMyPlaylists();
    }, [user?.isLoggedIn, fetchMyPlaylists]);

    // ─── 입력 즉시 자동 검색(디바운스 300ms) ───────────────────────────
    useEffect(() => {
        const kw = searchInput.trim();

        // 이전 타이머/요청 취소
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        // 입력이 비면 결과/로딩 초기화
        if (!kw) {
            setIsSearching(false);
            setSearchArtists([]);
            setSearchAlbums([]);
            setSearchTracks([]);
            return;
        }

        // 너무 짧은 검색어는 패스(원하면 1자로 줄여도 됨)
        if (kw.length < 2) {
            setIsSearching(false);
            setSearchArtists([]);
            setSearchAlbums([]);
            setSearchTracks([]);
            return;
        }

        // 디바운스 후 검색 실행
        debounceRef.current = setTimeout(async () => {
            try {
                setIsSearching(true);
                const controller = new AbortController();
                abortRef.current = controller;

                const res = await axios.get('/api/search', {
                    params: { query: kw },
                    signal: controller.signal,
                });

                setSearchArtists(res.data?.artists || []);
                setSearchAlbums(res.data?.albums || []);
                setSearchTracks(res.data?.tracks || []);
            } catch (err) {
                // Abort가 아닌 경우만 로그
                if (err.name !== 'CanceledError' && err.message !== 'canceled') {
                    console.error('검색 실패', err);
                }
                setSearchArtists([]);
                setSearchAlbums([]);
                setSearchTracks([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        // cleanup
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [searchInput]);

    // (엔터로도 검색되게 유지하고 싶으면 남겨둠: 드롭다운은 이미 자동으로 뜸)
    const onSearchSubmit = (e) => {
        e.preventDefault();
        // 엔터 시 굳이 추가 호출 안 하고 현재 결과 유지
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
        // 트랙 클릭 시 앨범 상세로 이동하는 기존 로직 유지
        navigate(`/album/${id}/details`);
        clearSearch();
    };

    // ─── 플레이리스트 생성 ───────────────────────────────────────────
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

            const created = res?.data;
            if (created && created.playlistId) {
                window.dispatchEvent(new CustomEvent('PLAYLIST_CREATED', { detail: created }));
            } else {
                window.dispatchEvent(new Event('PLAYLISTS_UPDATED'));
            }
            await fetchMyPlaylists();

            setIsModalOpen(false);
            CustomToast('플레이리스트가 생성되었습니다.', 'success', { autoClose: 1200 });
        } catch (err) {
            console.error('플레이리스트 생성 오류', err);
            CustomToast('플레이리스트 생성에 실패했습니다.', 'error');
        }
    };

    const showDropdown =
        isSearching ||
        (searchArtists && searchArtists.length) ||
        (searchAlbums && searchAlbums.length) ||
        (searchTracks && searchTracks.length);

    return (
        <div className="main-layout">
            {/* 로딩일 때도 훅은 이미 호출된 상태이므로, UI만 조건부로 표시 */}
            {loading && <div className="loading-overlay">로딩 중...</div>}

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

                    {showDropdown ? (
                        <div className="search-results-dropdown">
                            {isSearching && (
                                <div className="search-section">
                                    <div className="section-header">검색 중…</div>
                                </div>
                            )}

                            {!isSearching && searchArtists.length > 0 && (
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

                            {!isSearching && searchAlbums.length > 0 && (
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

                            {!isSearching && searchTracks.length > 0 && (
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
                    ) : null}
                </div>

                <div className="top-bar-profile">
                    {user?.isLoggedIn && (
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
                    {user?.isLoggedIn && (
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
                                {user?.isLoggedIn ? (
                                    <>
                                        <div className="my-menu-item" onClick={() => navigate('/mypage')}>
                                            마이 페이지
                                        </div>
                                        {user?.isArtist && (
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
                                        <div className="my-menu-item" onClick={() => navigate('/signup/home')}>
                                            회원가입
                                        </div>
                                        <div className="my-menu-item" onClick={() => navigate('/login')}>
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
                    fetchMyPlaylists();
                }}
                onSubmit={handleCreatePlaylist}
            />

            {/* ─── 메인 콘텐츠 ───────────────────────────────────────────── */}
            <main className="main-content">{children}</main>
        </div>
    );
};

export default MainLayout;
