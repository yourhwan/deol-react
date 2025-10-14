// src/pages/ChartPage.jsx
import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import { PlayerContext } from '../context/PlayerContext';
import { MdOutlinePlayCircleFilled, MdPauseCircleFilled } from "react-icons/md";
import { FaPlay, FaPause } from 'react-icons/fa';
import '../css/PlaylistDetailPage.css';
import '../css/ChartPage.css';
import { IoMdTime } from "react-icons/io";
import { CustomToast } from '../utils/CustomToast';
import PlaylistModal from '../components/PlaylistCreateModal';
import defaultCover from '../assets/deol_logo_circle.png';
import { useNavigate } from 'react-router-dom';

const ChartPage = () => {
    const [tracks, setTracks] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [dropdownState, setDropdownState] = useState(null);
    const [hoveredKey, setHoveredKey] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [playlistDropdownOpen, setPlaylistDropdownOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // ★ 로그인 여부
    const dropdownRefs = useRef({});
    const navigate = useNavigate();

    const {
        currentTrack,
        isPlaying,
        isAllPlaying,
        playTrack,
        playAllTracks,
        stopPlayback,
    } = useContext(PlayerContext);

    useEffect(() => {
        fetchChartTracks();
        fetchUserPlaylists();
    }, []);

    // ★ 로그인 여부 동기화
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('accessToken'));
        const onStorage = () => setIsLoggedIn(!!localStorage.getItem('accessToken'));
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // ★ 실시간 TOP100 (최근 24h)
    const fetchChartTracks = async () => {
        try {
            const res = await axios.get('/api/chart/top/streaming', {
                params: { limit: 100 }
            });
            console.log('[realtime api]', res.status, res.data);
            setTracks(Array.isArray(res.data) ? res.data : (res.data?.content || []));
        } catch (err) {
            console.error('차트 데이터를 불러오지 못했습니다.', err);
            setTracks([]);
        }
    };

    const fetchUserPlaylists = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return; // 비로그인도 차트는 보이므로 조용히 패스
            const response = await axios.get(
                '/api/playlists/user/all_playlists',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserPlaylists(response.data || []);
        } catch (err) {
            console.error("유저 플레이리스트 목록 조회 실패:", err);
        }
    };

    const toggleDropdown = (key) => {
        setDropdownState(prev => (prev === key ? null : key));
        setHoveredKey(null);
    };

    const handleAddToPlaylist = async (targetPlaylistId, trackId) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                CustomToast("로그인 후 이용 가능합니다.", "warning");
                return;
            }
            await axios.post(
                '/api/playlists/add/playlist/track',
                { playlistId: targetPlaylistId, trackId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            CustomToast("플레이리스트에 추가 되었습니다.");
            setDropdownState(null);
        } catch (err) {
            console.error("플레이리스트에 추가 실패:", err);
        }
    };

    const handleAddAllTracksToCurrentPlaylist = async (playlistId) => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                CustomToast("로그인 후 이용 가능합니다.", "warning");
                return;
            }
            const trackIds = tracks.map(track => track.trackId);
            await axios.post(
                `/api/chart/add/playlist/chart`,
                { playlistId, trackIds },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            CustomToast("차트 트랙 전체가 플레이리스트에 추가되었습니다.");
            setPlaylistDropdownOpen(false);
        } catch (error) {
            console.error("전체 트랙 추가 실패", error);
            CustomToast("전체 트랙을 추가하지 못했습니다.", 'error');
        }
    };

    // 외부 클릭으로 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickInside = Object.values(dropdownRefs.current).some(ref => {
                return ref && ref.contains(event.target);
            });

            if (!isClickInside) {
                setDropdownState(null);
                setHoveredKey(null);
                setPlaylistDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 전체 재생
    const handlePlayAll = async () => {
        if (isAllPlaying) {
            stopPlayback();
            return;
        }
        if (!tracks.length) {
            CustomToast('재생할 트랙이 없습니다.', 'info');
            return;
        }

        const formattedTracks = tracks.map(track => ({
            trackId: track.trackId,
            title: track.trackTitle,
            trackFile: track.trackFile,
            cover: track.coverImage,
            artist: track.artistName
        }));
        playAllTracks(formattedTracks);
    };

    // 개별 재생
    const handlePlaySingle = (track) => {
        playTrack({
            trackId: track.trackId,
            title: track.trackTitle,
            trackFile: track.trackFile,
            cover: track.coverImage,
            artist: track.artistName
        });
    };

    // 링크 이동
    const gotoArtist = (artistId) => {
        if (!artistId) return;
        navigate(`/artists/${artistId}/details`);
    };
    const gotoAlbum = (albumId) => {
        if (!albumId) return;
        navigate(`/album/${albumId}/details`);
    };

    return (
        <MainLayout>
            {showCreateModal && (
                <PlaylistModal
                    isOpen={true}
                    onClose={() => {
                        setShowCreateModal(false);
                        fetchUserPlaylists();
                    }}
                />
            )}

            <div className="playlist-detail-page">
                <div className="playlist-detail-header">
                    <img src={defaultCover} alt="cover" className="playlist-detail-cover" />
                    <div className="playlist-detail-info">
                        <h1>실시간 TOP 100</h1>
                        <p><b>24시간</b> 이내<br/> <b>재생 횟수</b> 기반 집계</p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                            <button className="all-play-button" onClick={handlePlayAll}>
                                {isAllPlaying ? <MdPauseCircleFilled size={40} /> : <MdOutlinePlayCircleFilled size={40} />}
                            </button>

                            <button
                                className="playlist-All-add-button"
                                onClick={() => {
                                    setPlaylistDropdownOpen(prev => !prev);
                                    fetchUserPlaylists();
                                }}
                            >
                                •••
                            </button>

                            {playlistDropdownOpen && (
                                <div
                                    className="chart-dropdown-menu-track-top"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isLoggedIn ? (
                                        <div
                                            className="chart-dropdown-menu-item-track"
                                            onMouseEnter={() => setHoveredKey('all')}
                                            onMouseLeave={() => setHoveredKey(null)}
                                        >
                                            플레이리스트에 추가 ▸
                                            {hoveredKey === 'all' && (
                                                <div className="playlist-submenu-left-top">
                                                    <div
                                                        className="chart-playlist-submenu-item-top"
                                                        onMouseDown={() => {
                                                            setShowCreateModal(true);
                                                            setPlaylistDropdownOpen(false);
                                                        }}
                                                    >
                                                        ＋ 플레이리스트 생성
                                                    </div>
                                                    {userPlaylists.map((pl) => (
                                                        <div
                                                            key={pl.playlistId}
                                                            className="playlist-submenu-item"
                                                            onMouseDown={() => handleAddAllTracksToCurrentPlaylist(pl.playlistId)}
                                                        >
                                                            {pl.playlistName}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className="chart-dropdown-menu-item-track"
                                            onMouseDown={() => {
                                                setPlaylistDropdownOpen(false);
                                                navigate('/login');
                                            }}
                                        >
                                            로그인 페이지로 이동
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="playlist-track-table">
                    <div className="playlist-track-header">
                        <span className="playlist-track-name">제목</span>
                        <span>아티스트</span>
                        <span>앨범</span>
                        <span><IoMdTime /></span>
                    </div>

                    <ul className="playlist-track-list">
                        {tracks.map((track, index) => {
                            const key = `chart-${track.trackId}-${index}`;
                            const isCurrent = currentTrack?.trackId === track.trackId && isPlaying;

                            return (
                                <li key={key} className="playlist-track-item">
                                    <div className="track-col track-info">
                                        <span className="track-rank">{index + 1}</span>
                                        <img
                                            src={track.coverImage || defaultCover}
                                            alt="cover"
                                            className="track-cover"
                                        />
                                        <span className="track-title">{track.trackTitle}</span>
                                    </div>

                                    {/* 아티스트: span 링크 스타일 */}
                                    <div className="track-col">
                                        {track.artistName ? (
                                            <span
                                                onClick={() => gotoArtist(track.artistId)}
                                                style={{ cursor: 'pointer'}}
                                                title="아티스트 상세로 이동"
                                            >
                        {track.artistName}
                      </span>
                                        ) : (
                                            <span>Unknown Artist</span>
                                        )}
                                    </div>

                                    {/* 앨범: span 링크 스타일 */}
                                    <div className="track-col">
                                        {track.albumTitle ? (
                                            <span
                                                onClick={() => gotoAlbum(track.albumId)}
                                                style={{ cursor: 'pointer' }}
                                                title="앨범 상세로 이동"
                                            >
                        {track.albumTitle}
                      </span>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>

                                    <div className="track-col track-right">
                                        <span className="track-duration-fixed">{track.trackDuration}</span>

                                        <button
                                            className="track-play-button"
                                            onClick={() => handlePlaySingle(track)}
                                            title="재생"
                                        >
                                            {isCurrent ? <FaPause /> : <FaPlay />}
                                        </button>

                                        <div className="track-dropdown-track">
                      <span
                          className="dropdown-trigger-track"
                          onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(key);
                          }}
                          ref={el => (dropdownRefs.current[`trigger-${key}`] = el)}
                      >
                        •••
                      </span>

                                            {dropdownState === key && (
                                                <div
                                                    className="chart-dropdown-menu-track"
                                                    ref={el => (dropdownRefs.current[`dropdown-${key}`] = el)}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {isLoggedIn ? (
                                                        <div
                                                            className="chart-dropdown-menu-item-track"
                                                            onMouseEnter={() => setHoveredKey(key)}
                                                            onMouseLeave={() => setHoveredKey(null)}
                                                        >
                                                            ◂ 플레이리스트에 추가
                                                            {hoveredKey === key && (
                                                                <div className="chart-playlist-submenu-left">
                                                                    <div
                                                                        className="playlist-submenu-item"
                                                                        onMouseDown={() => {
                                                                            setShowCreateModal(true);
                                                                            setDropdownState(null);
                                                                        }}
                                                                    >
                                                                        ＋ 플레이리스트 생성
                                                                    </div>
                                                                    {userPlaylists.map((pl) => (
                                                                        <div
                                                                            key={pl.playlistId}
                                                                            className="playlist-submenu-item"
                                                                            onMouseDown={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAddToPlaylist(pl.playlistId, track.trackId);
                                                                            }}
                                                                        >
                                                                            {pl.playlistName}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="chart-dropdown-menu-item-track"
                                                            onMouseDown={() => {
                                                                setDropdownState(null);
                                                                navigate('/login');
                                                            }}
                                                        >
                                                            로그인 페이지로 이동
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
};

export default ChartPage;
