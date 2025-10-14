import React, { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import '../css/AlbumDetail.css';
import { MdOutlinePlayCircleFilled, MdPauseCircleFilled } from 'react-icons/md';
import { FaPause } from 'react-icons/fa6';
import { FaPlay } from 'react-icons/fa';
import { PlayerContext } from '../context/PlayerContext';
import PlaylistModal from '../components/PlaylistCreateModal';
import { CustomToast } from '../utils/CustomToast';
import { ConfirmAddToast } from '../utils/ConfirmAddToast';
import { UserContext } from '../context/UserContext';

const AlbumDetail = () => {
    const { albumId } = useParams();
    const navigate = useNavigate();

    // 상태 정의
    const [albumDetail, setAlbumDetail] = useState(null);
    const [otherAlbums, setOtherAlbums] = useState([]);

    // 드롭다운 상태
    const [dropdownState, setDropdownState] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [playlistList, setPlaylistList] = useState([]);
    const [hoverPlaylists, setHoverPlaylists] = useState(null);

    // 플레이리스트 생성 모달 상태
    const [showCreateModal, setShowCreateModal] = useState(false);

    // 앨범 전체 재생 플래그
    const [albumAdded, setAlbumAdded] = useState(false);

    // 앨범 전체 드롭다운 상태
    const [playlistDropdownOpen, setPlaylistDropdownOpen] = useState(false);
    const [hoveredPlaylistDropdown, setHoveredPlaylistDropdown] = useState(false);

    const otherAlbumListRef = useRef(null);
    const trackDropdownRef = useRef(null);
    const albumDropdownRef = useRef(null);

    const {
        currentTrack,
        isPlaying,
        isAllPlaying,
        playTrack,
        playAllTracks,
        stopPlayback,
        playQueue,
        addTrackOnly,
        setIsAllPlaying,
        clearQueue,
    } = useContext(PlayerContext);

    const { fetchMyPlaylists } = useContext(UserContext);
    const isLoggedIn = !!localStorage.getItem('accessToken');

    // 앨범 상세 + 동일 아티스트 다른 앨범 조회
    useEffect(() => {
        const fetchAlbumDetails = async () => {
            try {
                const response = await axios.get(
                    `/api/albums/${albumId}/details`
                );
                setAlbumDetail(response.data);

                if (response.data.albumArtistId) {
                    const otherAlbumsResponse = await axios.get(
                        `/api/albums/artist/${response.data.albumArtistId}/others`,
                        { params: { excludeAlbumId: albumId } }
                    );
                    setOtherAlbums(otherAlbumsResponse.data);
                }
                setAlbumAdded(false);
            } catch (error) {
                console.error('앨범 상세 정보를 가져오는 중 오류 발생:', error);
                CustomToast('앨범 정보를 불러오는 데 실패했습니다.', 'error');
            }
        };
        fetchAlbumDetails();
    }, [albumId]);

    // 사용자 플레이리스트 목록 조회 (로그인 시)
    const fetchUserPlaylists = async () => {
        if (!isLoggedIn) return;
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                `/api/playlists/user/all_playlists`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPlaylistList(response.data);
        } catch (err) {
            console.error('플레이리스트 목록 불러오기 실패', err);
        }
    };

    // 개별 트랙 재생/정지
    const handlePlayClick = (track) => {
        if (!isLoggedIn) {
            CustomToast('로그인 후 이용 가능합니다.', 'info');
            return;
        }
        const matching = playQueue.filter(item => item.trackId === track.trackId);
        if (matching.length) {
            const first = matching[0];
            const isCurrent =
                currentTrack &&
                currentTrack.currentPlaylistTrackId === first.currentPlaylistTrackId;
            if (isCurrent) {
                stopPlayback();
                setIsAllPlaying(false);
            } else {
                playTrack({ ...first });
            }
            return;
        }
        playTrack({
            trackId: track.trackId,
            title: track.trackTitle,
            artist: albumDetail.artistName,
            coverImage: albumDetail.coverImage,
            trackFile: track.trackFile,
            currentPlaylistTrackId: track.currentPlaylistTrackId,
        });
    };

    // 개별 트랙 현재 재생목록에 추가
    const handleAddToCurrentQueue = (track) => {
        const exists = playQueue.some(
            t => t.trackId === track.trackId && t.currentPlaylistTrackId === track.currentPlaylistTrackId
        );
        if (exists) {
            ConfirmAddToast(track.trackTitle, () => {
                addTrackOnly(track);
                CustomToast(`'${track.trackTitle}' 중복 추가되었습니다.`, 'success');
            });
        } else {
            addTrackOnly(track);
            CustomToast(`'${track.trackTitle}' 추가되었습니다.`, 'success');
        }
        setDropdownState(null);
    };

    // 앨범 전체 재생
    const handleAllPlayClick = async () => {
        if (!isLoggedIn) {
            CustomToast('로그인 후 이용 가능합니다.', 'info');
            return;
        }
        if (
            (albumAdded && playQueue.length === 0) ||
            (albumAdded && albumDetail && !playQueue.some(i => i.trackId === albumDetail.tracks[0].trackId))
        ) {
            clearQueue();
            setAlbumAdded(false);
            setIsAllPlaying(false);
        }
        if (isAllPlaying) {
            stopPlayback();
            setIsAllPlaying(false);
            return;
        }
        if (albumDetail) {
            try {
                await playAllTracks(albumDetail.tracks);
                CustomToast('앨범 전체 트랙이 추가되었습니다.');
                setAlbumAdded(true);
                setIsAllPlaying(true);
            } catch {
                CustomToast('전체 재생 실패', 'error');
            }
        }
    };

    // 앨범 전체 플레이리스트에 추가
    const handleAddAllTracksToPlaylist = async (playlistId) => {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `/api/playlists/add/playlist/album`,
                { playlistId, albumId: albumDetail.albumId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            CustomToast('앨범 트랙 모두 추가되었습니다.');
            setPlaylistDropdownOpen(false);
        } catch {
            CustomToast('추가 실패', 'error');
        }
    };

    // 렌더링: 앨범 전체 드롭다운
    const renderAlbumDropdown = () => {
        if (!playlistDropdownOpen) return null;
        return (
            <div className="dropdown-menu album-dropdown" ref={albumDropdownRef}>
                {isLoggedIn ? (
                    <div
                        className="dropdown-menu-list"
                        onMouseEnter={() => setHoveredPlaylistDropdown(true)}
                        onMouseLeave={() => setHoveredPlaylistDropdown(false)}
                    >
                        플레이리스트에 추가 ▸
                        {hoveredPlaylistDropdown && (
                            <div className="playlist-submenu playlist-submenu-right">
                                <div
                                    className="playlist-submenu-item"
                                    onMouseDown={() => {
                                        setShowCreateModal(true);
                                        setPlaylistDropdownOpen(false);
                                    }}
                                >
                                    ＋ 플레이리스트 생성
                                </div>
                                {playlistList.map(pl => (
                                    <div
                                        key={pl.playlistId}
                                        className="playlist-submenu-item"
                                        onMouseDown={() => handleAddAllTracksToPlaylist(pl.playlistId)}
                                    >
                                        {pl.playlistName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="dropdown-menu-list">
                        <div className="playlist-submenu-item" onClick={() => navigate('/login')}>
                            로그인 페이지로 이동
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 개별 트랙 드롭다운 렌더링
    const renderDropdownOptions = track => {
        if (dropdownState !== track.trackId) return null;
        return (
            <div className="dropdown-menu" ref={trackDropdownRef}>
                {isLoggedIn ? (
                    <>
                        <div className="dropdown-menu-list">
                            <div className="playlist-submenu-item" onClick={() => handleAddToCurrentQueue(track)}>
                                현재 재생목록에 추가
                            </div>
                        </div>
                        <div
                            className="dropdown-menu-list with-submenu"
                            onMouseEnter={() => setHoverPlaylists(track.trackId)}
                            onMouseLeave={() => setHoverPlaylists(null)}
                        >
                            ◂ 플레이리스트에 추가
                            {hoverPlaylists === track.trackId && (
                                <div className="playlist-submenu">
                                    <div
                                        className="playlist-submenu-item"
                                        onMouseDown={() => {
                                            setShowCreateModal(true);
                                            setPlaylistDropdownOpen(false);
                                        }}
                                    >
                                        ＋ 플레이리스트 생성
                                    </div>
                                    {playlistList.length === 0 ? (
                                        <div className="playlist-submenu-item">플레이리스트 없음</div>
                                    ) : (
                                        playlistList.map(pl => (
                                            <div
                                                key={pl.playlistId}
                                                className="playlist-submenu-item"
                                                onClick={() => handleAddToPlaylist(pl.playlistId)}
                                            >
                                                {pl.playlistName}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="dropdown-menu-list">
                        <div className="playlist-submenu-item" onClick={() => navigate('/login')}>
                            로그인 페이지로 이동
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const toggleDropdown = track => {
        if (dropdownState === track.trackId) {
            setDropdownState(null);
            setSelectedTrack(null);
        } else {
            setDropdownState(track.trackId);
            setSelectedTrack(track);
            if (isLoggedIn) fetchUserPlaylists();
        }
    };

    const handleAddToPlaylist = async playlistId => {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `/api/playlists/add/playlist/track`,
                { playlistId, trackId: selectedTrack.trackId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            CustomToast(`'${selectedTrack.trackTitle}' 추가되었습니다.`);
            setDropdownState(null);
            setSelectedTrack(null);
        } catch {
            CustomToast('추가 실패', 'error');
        }
    };

    useEffect(() => {
        const handleClickOutside = event => {
            if (trackDropdownRef.current && !trackDropdownRef.current.contains(event.target)) {
                setDropdownState(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <MainLayout>
            {showCreateModal && (
                <PlaylistModal
                    isOpen
                    onClose={() => {
                        setShowCreateModal(false);
                        fetchUserPlaylists(); // 서브 메뉴 갱신
                        fetchMyPlaylists();   // MainLayout 사이드바 갱신
                    }}
                />
            )}
            <div className="album-details-container">
                {albumDetail && (
                    <>
                        {/* ─── 앨범 헤더 ────────────────────────────────────── */}
                        <div className="album-header">
                            <img
                                src={albumDetail.coverImage}
                                alt={albumDetail.albumTitle}
                                className="album-cover"
                            />
                            <div className="album-info">
                                <h1>{albumDetail.albumTitle}</h1>
                                <p>
                                    <span
                                        onClick={() =>
                                            navigate(`/artists/${albumDetail.albumArtistId}/details`)
                                        }
                                        style={{ cursor: 'pointer', color: '#1db954' }}
                                    >
                                        아티스트: {albumDetail.artistName}
                                    </span>
                                </p>
                                <p>장르: {albumDetail.albumGenre}</p>
                                <p>발매일: {albumDetail.releaseDate}</p>
                                <p>{albumDetail.albumDescription}</p>
                            </div>
                        </div>

                        {/* ─── 앨범 내 트랙 섹션 ────────────────────────────── */}
                        <div className="album-details-tracks-section">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    position: 'relative',
                                }}
                            >
                                {/* 앨범 전체 ▶︎/⏸︎ 버튼 */}
                                <button
                                    className="all-play-button"
                                    onClick={handleAllPlayClick}
                                >
                                    {isAllPlaying
                                        ? <MdPauseCircleFilled />
                                        : <MdOutlinePlayCircleFilled />}
                                </button>

                                {/* 앨범 전체 “•••” 드롭다운 */}
                                <button
                                    className="playlist-All-add-button"
                                    onClick={() => {
                                        setPlaylistDropdownOpen((prev) => !prev);
                                        if (isLoggedIn) fetchUserPlaylists();
                                    }}
                                >
                                    •••
                                </button>
                                {renderAlbumDropdown()}
                            </div>

                            <ol className="album-details-tracks-list">
                                {albumDetail.tracks.map((track) => (
                                    <li
                                        className="track-item"
                                        key={`${track.trackId}-${track.trackFile}`}
                                        style={{ position: 'relative' }}
                                    >
                                        <span className="track-info">
                                            {/* 트랙 제목 */}
                                            <span className="track-title">
                                                <p className="track-info-p">{track.trackTitle}</p>
                                            </span>

                                            {/* 아티스트 이름 */}
                                            <span className="track-artist">
                                                <p
                                                    className="track-info-p"
                                                    onClick={() =>
                                                        navigate(`/artists/${albumDetail.albumArtistId}/details`)
                                                    }
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {albumDetail.artistName}
                                                </p>
                                            </span>

                                            {/* 트랙 길이 */}
                                            <span className="track-duration">
                                                <p className="track-info-p">{track.trackDuration}</p>
                                            </span>

                                            {/* 개별 트랙 ▶︎/⏸︎ 버튼 */}
                                            <button
                                                className="play-button"
                                                onClick={() =>
                                                    handlePlayClick({
                                                        trackId: track.trackId,
                                                        trackTitle: track.trackTitle,
                                                        artistName: albumDetail.artistName,
                                                        coverImage: albumDetail.coverImage,
                                                        trackFile: track.trackFile,
                                                        currentPlaylistTrackId: track.currentPlaylistTrackId,
                                                    })
                                                }
                                            >
                                                {currentTrack &&
                                                currentTrack.trackId === track.trackId &&
                                                isPlaying
                                                    ? <FaPause />
                                                    : <FaPlay />}
                                            </button>

                                            {/* 개별 트랙 “•••” 드롭다운 */}
                                            <div
                                                className="dropdown-trigger"
                                                onClick={() =>
                                                    toggleDropdown({
                                                        trackId: track.trackId,
                                                        trackTitle: track.trackTitle,
                                                        artistName: albumDetail.artistName,
                                                        cover: albumDetail.coverImage,
                                                        trackFile: track.trackFile,
                                                        currentPlaylistTrackId: track.currentPlaylistTrackId,
                                                    })
                                                }
                                            >
                                                •••
                                                {renderDropdownOptions({
                                                    trackId: track.trackId,
                                                    trackTitle: track.trackTitle,
                                                    artistName: albumDetail.artistName,
                                                    coverImage: albumDetail.coverImage,
                                                    trackFile: track.trackFile,
                                                    currentPlaylistTrackId: track.currentPlaylistTrackId,
                                                })}
                                            </div>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* ─── 디스코그래피 (동일 아티스트 다른 앨범) ───────────── */}
                        <div className="discography">
                            <h2>디스코그래피</h2>
                            <div
                                className="other-album-list"
                                ref={otherAlbumListRef}
                                onWheel={(e) => {
                                    e.preventDefault();
                                    if (otherAlbumListRef.current) {
                                        otherAlbumListRef.current.scrollLeft += e.deltaY;
                                    }
                                }}
                            >
                                {otherAlbums.length > 0 ? (
                                    otherAlbums.map((album) => (
                                        <div
                                            key={album.albumId}
                                            className="album-card"
                                            onClick={() => navigate(`/album/${album.albumId}/details`)}
                                        >
                                            <img
                                                src={
                                                    album.coverImage ||
                                                    `https://via.placeholder.com/100`
                                                }
                                                alt={album.albumTitle}
                                                className="other-album-cover"
                                            />
                                            <p className="other-album-title">
                                                {album.albumTitle}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p>디스코그래피 정보가 없습니다.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
};

export default AlbumDetail;
