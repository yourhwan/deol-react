import React, { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import { PlayerContext } from '../context/PlayerContext';
import { MdOutlinePlayCircleFilled, MdPauseCircleFilled } from 'react-icons/md';
import { FaPlay, FaPause } from 'react-icons/fa';
import '../css/PlaylistDetailPage.css';
import { IoMdTime } from 'react-icons/io';
import { CustomToast } from '../utils/CustomToast';
import { toast } from 'react-toastify';
import PlaylistModal from '../components/PlaylistCreateModal';

const PlaylistDetailPage = () => {
    const { playlistId } = useParams();
    const navigate = useNavigate();

    const [playlist, setPlaylist] = useState(null);
    const [dropdownState, setDropdownState] = useState(null);
    const [hoveredKey, setHoveredKey] = useState(null);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [playingPlaylistTrackId, setPlayingPlaylistTrackId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const dropdownRefs = useRef({});

    const {
        playQueue,
        isPlaying,
        isAllPlaying,
        playTrack,
        stopPlayback,
        addTrackOnly,
    } = useContext(PlayerContext);

    // 1) 플레이리스트 상세 정보 가져오기
    const fetchPlaylist = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                `/api/playlists/user/0/playlist/${playlistId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPlaylist(response.data);
        } catch (err) {
            console.error('플레이리스트를 불러오지 못했습니다.', err);
        }
    }, [playlistId]);

    // 2) 사용자 플레이리스트 목록 가져오기
    const fetchUserPlaylists = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                `/api/playlists/user/all_playlists`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserPlaylists(response.data);
        } catch (err) {
            console.error('유저 플레이리스트 목록 조회 실패:', err);
            setUserPlaylists([]);
        }
    }, []);

    useEffect(() => {
        fetchPlaylist();
        fetchUserPlaylists();
    }, [playlistId, fetchPlaylist, fetchUserPlaylists]);

    // 3) 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickInside = Object.values(dropdownRefs.current).some(
                (ref) => ref && ref.contains(event.target)
            );
            if (!isClickInside) {
                setDropdownState(null);
                setHoveredKey(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = (key) => {
        setDropdownState((prev) => (prev === key ? null : key));
        setHoveredKey(null);
    };

    // 4) 트랙 삭제
    const handleRemoveTrack = async (playlistTrackId, trackTitle) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.delete(
                `/api/playlists/remove/playlist/track`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    data: {
                        playlistId: parseInt(playlistId),
                        playlistTrackId: playlistTrackId,
                    },
                }
            );
            setPlaylist(response.data);
            setDropdownState(null);
            CustomToast(`'${trackTitle}' 트랙이 삭제 되었습니다.`);
        } catch (err) {
            console.error('트랙 삭제 실패:', err);
        }
    };

    // 5) 다른 플레이리스트에 추가
    const handleAddToOtherPlaylist = async (targetPlaylistId, trackId) => {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `/api/playlists/add/playlist/track`,
                { playlistId: targetPlaylistId, trackId: trackId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            CustomToast('다른 플레이리스트에 추가 되었습니다.');
            setDropdownState(null);
        } catch (err) {
            console.error('다른 플레이리스트에 추가 실패:', err);
        }
    };

    // 6) 플레이리스트 삭제 확인
    const handleDeletePlaylist = async () => {
        toast.dismiss();
        const confirmToastId = toast(
            <div className="toast-confirm-container">
                <div className="toast-confirm-message">
                    정말 이 플레이리스트를 삭제 하시겠습니까?
                </div>
                <div className="toast-confirm-actions">
                    <button
                        className="toast-confirm-button"
                        onClick={async () => {
                            toast.dismiss(confirmToastId);
                            try {
                                const token = localStorage.getItem('accessToken');
                                await axios.delete(
                                    `/api/playlists/delete/playlist/${playlistId}`,
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                                CustomToast(`'${playlist.playlistName}' 플레이리스트가 삭제 되었습니다.`);
                                navigate('/mypage');
                            } catch (err) {
                                console.error('플레이리스트 삭제 실패:', err);
                                CustomToast('플레이리스트 삭제 실패', 'error');
                            }
                        }}
                    >
                        확인
                    </button>
                    <button className="toast-cancel-button" onClick={() => toast.dismiss(confirmToastId)}>
                        취소
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                className: 'toast-confirm-wrapper',
                bodyClassName: 'toast-confirm-body',
            }
        );
    };

    // 7) 개별 트랙 재생/일시정지
    const handlePlayButtonClick = (track, playlistTrackId) => {
        const isCurrent = playingPlaylistTrackId === playlistTrackId && isPlaying;
        if (isCurrent) {
            stopPlayback();
            setPlayingPlaylistTrackId(null);
        } else {
            playTrack(
                {
                    trackId: track.trackId,
                    title: track.trackTitle,
                    trackFile: track.trackFile,
                    cover: track.coverImage,
                    artist: track.artistName,
                    // currentPlaylistTrackId 생략 → 새로운 인스턴스로 생성
                },
                { forceAdd: true }
            );
            setPlayingPlaylistTrackId(playlistTrackId);
        }
    };

    // 8) 플레이리스트 전체 재생: “추가된 트랙부터 순차 재생” + 토스트 알림
    const handlePlayAllInPlaylist = async () => {
        if (!playlist || !Array.isArray(playlist.tracks) || playlist.tracks.length === 0) {
            CustomToast('재생할 트랙이 없습니다.', 'info');
            return;
        }

        const playlistName = playlist.playlistName;

        // (1) 첫 번째 트랙: currentPlaylistTrackId 생략 → 새로운 인스턴스 생성 + 즉시 재생
        const firstTrack = playlist.tracks[0];
        await playTrack(
            {
                trackId: firstTrack.trackId,
                title: firstTrack.trackTitle,
                trackFile: firstTrack.trackFile,
                cover: firstTrack.coverImage,
                artist: firstTrack.artistName,
                // currentPlaylistTrackId 생략
            },
            { forceAdd: true }
        );
        setPlayingPlaylistTrackId(firstTrack.playlistTrackId);

        // (2) 나머지 트랙들도 currentPlaylistTrackId 생략 → 새로운 인스턴스로 큐에 추가만
        for (let i = 1; i < playlist.tracks.length; i++) {
            const t = playlist.tracks[i];
            await addTrackOnly(
                {
                    trackId: t.trackId,
                    title: t.trackTitle,
                    trackFile: t.trackFile,
                    cover: t.coverImage,
                    artist: t.artistName,
                    // currentPlaylistTrackId 생략
                },
                { forceAdd: true }
            );
        }

        // (3) 토스트: 전체 곡이 큐에 추가되었음을 안내
        CustomToast(`현재 재생목록에 "${playlistName}"의 전체 곡이 추가되었습니다.`);
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
                {playlist && (
                    <>
                        <div className="playlist-detail-header">
                            <img
                                src={playlist.playlistCover}
                                alt="cover"
                                className="playlist-detail-cover"
                            />
                            <div className="playlist-detail-info">
                                <h1>{playlist.playlistName}</h1>
                                <p title={playlist.playlistDescription}>
                                    {playlist.playlistDescription || '설명이 없습니다.'}
                                </p>

                                {/* 전체 재생 버튼 */}
                                <button
                                    className="all-play-button"
                                    onClick={async () => {
                                        if (isAllPlaying) {
                                            stopPlayback();
                                            setPlayingPlaylistTrackId(null);
                                        } else {
                                            await handlePlayAllInPlaylist();
                                        }
                                    }}
                                >
                                    {isAllPlaying ? (
                                        <MdPauseCircleFilled size={40} />
                                    ) : (
                                        <MdOutlinePlayCircleFilled size={40} />
                                    )}
                                </button>

                                {/* 플레이리스트 삭제 드롭다운 */}
                                <div className="playlist-delete-dropdown">
                  <span
                      onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown('playlist-delete');
                      }}
                      className="dropdown-trigger-track"
                      ref={(el) => (dropdownRefs.current['trigger-playlist-delete'] = el)}
                  >
                    •••
                  </span>
                                    {dropdownState === 'playlist-delete' && (
                                        <div
                                            className="dropdown-menu-track"
                                            ref={(el) => (dropdownRefs.current['dropdown-playlist-delete'] = el)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="dropdown-menu-item-track" onClick={handleDeletePlaylist}>
                                                플레이리스트 삭제
                                            </div>
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
                                <span>
                  <IoMdTime />
                </span>
                            </div>

                            <ul className="playlist-track-list">
                                {playlist.tracks.map((track, index) => {
                                    const key = `${track.playlistTrackId}-${index}`;
                                    return (
                                        <li key={key} className="playlist-track-item">
                                            <div className="track-col track-info">
                                                <img
                                                    src={track.coverImage}
                                                    alt="cover"
                                                    className="track-cover"
                                                />
                                                <span className="track-title">{track.trackTitle}</span>
                                            </div>
                                            <div className="track-col">{track.artistName}</div>
                                            <div className="track-col">{track.albumTitle}</div>
                                            <div className="track-col track-right">
                        <span className="track-duration-fixed">
                          {track.trackDuration}
                        </span>
                                                <button
                                                    className="track-play-button"
                                                    onClick={() => handlePlayButtonClick(track, track.playlistTrackId)}
                                                >
                                                    {playingPlaylistTrackId === track.playlistTrackId && isPlaying ? (
                                                        <FaPause />
                                                    ) : (
                                                        <FaPlay />
                                                    )}
                                                </button>

                                                <div className="track-dropdown-track">
                          <span
                              className="dropdown-trigger-track"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(key);
                              }}
                              ref={(el) => (dropdownRefs.current[`trigger-${key}`] = el)}
                          >
                            •••
                          </span>

                                                    {dropdownState === key && (
                                                        <div
                                                            className="dropdown-menu-track-bottom"
                                                            ref={(el) => (dropdownRefs.current[`dropdown-${key}`] = el)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div
                                                                className="dropdown-menu-item-track"
                                                                onClick={() =>
                                                                    handleRemoveTrack(track.playlistTrackId, track.trackTitle)
                                                                }
                                                            >
                                                                플레이리스트에서 삭제
                                                            </div>

                                                            <div
                                                                className="dropdown-menu-item-track"
                                                                onMouseEnter={() => setHoveredKey(key)}
                                                                onMouseLeave={() => setHoveredKey(null)}
                                                            >
                                                                ◂ 다른 플레이리스트에 추가
                                                                {hoveredKey === key && (
                                                                    <div className="playlist-submenu-left-bottom">
                                                                        {/* 플레이리스트 생성 버튼 */}
                                                                        <div
                                                                            className="playlist-submenu-item"
                                                                            onMouseDown={() => {
                                                                                setShowCreateModal(true);
                                                                                setDropdownState(null);
                                                                            }}
                                                                        >
                                                                            ＋ 플레이리스트 생성
                                                                        </div>
                                                                        {userPlaylists
                                                                            .filter(
                                                                                (pl) => pl.playlistId !== parseInt(playlistId)
                                                                            )
                                                                            .map((pl) => (
                                                                                <div
                                                                                    key={pl.playlistId}
                                                                                    className="playlist-submenu-item"
                                                                                    onMouseDown={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleAddToOtherPlaylist(
                                                                                            pl.playlistId,
                                                                                            track.trackId
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {pl.playlistName}
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
};

export default PlaylistDetailPage;
