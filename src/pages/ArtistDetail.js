import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import '../css/ArtistDetail.css';
import PlaylistModal from '../components/PlaylistCreateModal';
import { CustomToast } from '../utils/CustomToast';
import { UserContext } from '../context/UserContext';

const ArtistDetail = () => {
    const { artistSeq } = useParams();
    const navigate = useNavigate();

    const { fetchMyPlaylists } = useContext(UserContext);

    const [artistDetails, setArtistDetails] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [dropdownState, setDropdownState] = useState(null);
    const [hoveredTrackId, setHoveredTrackId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [latestAlbumDropdown, setLatestAlbumDropdown] = useState(false);

    const albumListRef = useRef(null);
    const dropdownRef = useRef(null);

    // 로그인 여부 및 플레이리스트 조회
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        setIsLoggedIn(!!token);
        if (token) {
            fetchUserPlaylists();
        } else {
            setUserPlaylists([]);
        }
    }, [showCreateModal]);

    // 사용자 플레이리스트 가져오기
    const fetchUserPlaylists = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                `/api/playlists/user/all_playlists`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserPlaylists(response.data);
        } catch (err) {
            console.error("유저 플레이리스트 목록 조회 실패:", err);
            setUserPlaylists([]);
        }
    };

    // 아티스트 세부, 앨범, 인기곡, 팔로우 상태 로드
    useEffect(() => {
        const fetchArtistDetails = async () => {
            try {
                const response = await axios.get(
                    `/api/artists/${artistSeq}/details`
                );
                setArtistDetails(response.data);
                setAlbums(response.data.allAlbums || []);
                setTopTracks(response.data.topTracks || []);
            } catch (error) {
                console.error('Error fetching artist details:', error);
            }
        };
        const fetchIsFollowing = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;
                const res = await axios.get(
                    `/api/follow/is_following?artistId=${artistSeq}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setIsFollowing(res.data);
            } catch (error) {
                console.error('팔로우 여부 확인 실패:', error);
            }
        };
        fetchArtistDetails();
        fetchIsFollowing();
    }, [artistSeq]);

    // 바깥 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = event => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownState(null);
                setLatestAlbumDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = trackId => {
        setDropdownState(prev => (prev === trackId ? null : trackId));
    };

    const handleAddToPlaylist = async (playlistId, trackId) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `/api/playlists/add/playlist/track`,
                { playlistId, trackId },
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            CustomToast("트랙이 플레이리스트에 추가되었습니다!");
            setDropdownState(null);
            setLatestAlbumDropdown(false);
        } catch (err) {
            console.error("플레이리스트 추가 실패:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddAlbumToPlaylist = async (playlistId, albumId) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `/api/playlists/add/playlist/album`,
                { playlistId, albumId },
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            CustomToast("앨범의 모든 트랙이 플레이리스트에 추가되었습니다!");
            setLatestAlbumDropdown(false);
        } catch (err) {
            console.error("앨범 전체 트랙 추가 실패:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPlaylistSubmenu = (trackList, albumId = null) => {
        if (!isLoggedIn) {
            return (
                <div className="playlist-submenu-left">
                    <div
                        className="playlist-submenu-item"
                        onMouseDown={e => { e.stopPropagation(); navigate('/login'); setDropdownState(null); setLatestAlbumDropdown(false);} }
                    >
                        로그인 페이지로 이동
                    </div>
                </div>
            );
        }
        if (userPlaylists.length === 0) {
            return (
                <div className="playlist-submenu-left">
                    <div
                        className="playlist-submenu-item"
                        onMouseDown={e => { e.stopPropagation(); setShowCreateModal(true); setDropdownState(null); setLatestAlbumDropdown(false);} }
                    >
                        ＋ 플레이리스트 생성
                    </div>
                </div>
            );
        }
        return (
            <div className="playlist-submenu-left">
                {userPlaylists.map(pl => (
                    <div
                        key={pl.playlistId}
                        className="playlist-submenu-item"
                        onMouseDown={e => { e.stopPropagation();
                            if (albumId !== null) handleAddAlbumToPlaylist(pl.playlistId, albumId);
                            else trackList.forEach(t => handleAddToPlaylist(pl.playlistId, t.trackId));
                        }}
                    >{pl.playlistName}</div>
                ))}
            </div>
        );
    };

    const renderDropdownOptions = track => {
        if (dropdownState !== track.trackId) return null;
        return (
            <div className="dropdown-menu" ref={dropdownRef}>
                { !isLoggedIn ? (
                    <div className="dropdown-menu-list">
                        <div className="playlist-submenu-item" onClick={() => navigate('/login')}>
                            로그인 페이지로 이동
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            className="dropdown-menu-list"
                            onMouseEnter={() => setHoveredTrackId(track.trackId)}
                            onMouseLeave={() => setHoveredTrackId(null)}
                        >
                            ◂ 플레이리스트에 추가
                            { hoveredTrackId === track.trackId && renderPlaylistSubmenu([track]) }
                        </div>
                    </>
                )}
            </div>
        );
    };

    const handleFollowToggle = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) { CustomToast('로그인 후 이용 가능합니다.'); navigate('/login'); return; }
            if (isFollowing) {
                await axios.delete(
                    `/api/follow/remove?artistId=${artistSeq}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setIsFollowing(false);
            } else {
                await axios.post(
                    `/api/follow/add?artistId=${artistSeq}`,
                    null,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setIsFollowing(true);
            }
        } catch (err) {
            console.error("팔로우 토글 실패:", err);
        }
    };

    const handleWheelScroll = e => {
        e.preventDefault();
        if (albumListRef.current) albumListRef.current.scrollLeft += e.deltaY;
    };

    const handleAlbumClick = albumId => navigate(`/album/${albumId}/details`);

    const formatDate = dateString => new Date(dateString).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });

    if (!artistDetails) return <div>Loading...</div>;

    return (
        <MainLayout>
            {showCreateModal && (
                <PlaylistModal
                    isOpen
                    onClose={() => {
                        setShowCreateModal(false);
                        fetchUserPlaylists();
                        fetchMyPlaylists();
                    }}
                />
            )}
            <div className="artist-detail-container">
                <div className="artist-detail-artist-info">
                    <img
                        src={artistDetails.artist.profileImageUrl || 'https://via.placeholder.com/150'}
                        alt={artistDetails.artist.memberArtistName}
                        className="artist-detail-artist-profile-image"
                    />
                    <div className="follow-button-wrapper">
                        <button onClick={handleFollowToggle}>
                            {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    </div>
                    <div className="artist-detail-artist-info-text">
                        <h1 className="artist-detail-artist-info-name">
                            {artistDetails.artist.memberArtistName}
                        </h1>
                    </div>
                </div>

                <div className="artist-detail-top-sections">
                    <div className="artist-detail-latest-album">
                        <h2>신규 발매</h2>
                        {artistDetails.latestAlbum ? (
                            <div className="artist-detail-latest-album-item">
                                <img
                                    src={artistDetails.latestAlbum.coverImage || 'https://via.placeholder.com/150'}
                                    alt={artistDetails.latestAlbum.albumTitle}
                                    className="artist-detail-latest-album-cover-image"
                                />
                                <div className="artist-detail-latest-album-info">
                                    <span>
                                        {formatDate(artistDetails.latestAlbum.releaseDate)}
                                    </span>
                                    <h3>{artistDetails.latestAlbum.albumTitle}</h3>
                                    <span>
                                        노래 {artistDetails.latestAlbum.trackCount}곡
                                    </span>
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            className="add-button"
                                            onClick={() =>
                                                setLatestAlbumDropdown(prev => !prev)
                                            }
                                        >
                                            + 추가
                                        </button>
                                        {latestAlbumDropdown && (
                                            <div
                                                className="dropdown-menu"
                                                style={{ top: '0', left: '70px', position: 'absolute' }}
                                            >
                                                {!isLoggedIn ? (
                                                    <div className="dropdown-menu-list">
                                                        <div
                                                            className="playlist-submenu-item"
                                                            onMouseDown={() => navigate('/login')}
                                                        >
                                                            로그인 페이지로 이동
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div
                                                            className="playlist-submenu-item"
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                setShowCreateModal(true);
                                                                setDropdownState(null);
                                                                setLatestAlbumDropdown(false);
                                                            }}
                                                        >
                                                            ＋ 플레이리스트 생성
                                                        </div>
                                                        <div
                                                            className="dropdown-menu-list"
                                                            onMouseEnter={() =>
                                                                setHoveredTrackId('latest')
                                                            }
                                                            onMouseLeave={() =>
                                                                setHoveredTrackId(null)
                                                            }
                                                        >
                                                            ◂ 플레이리스트에 추가
                                                            {hoveredTrackId === 'latest' &&
                                                                renderPlaylistSubmenu(
                                                                    [],
                                                                    artistDetails.latestAlbum.albumId
                                                                )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p>No latest album available.</p>
                        )}
                    </div>

                    <div className="artist-detail-top-tracks">
                        <h2>인기곡</h2>
                        {Array.isArray(topTracks) && topTracks.length > 0 ? (
                            <div className="artist-detail-top-track-album-list">
                                {topTracks.map((track) => (
                                    <div key={track.trackId} className="top-track-item">
                                        <div className="top-track-image">
                                            <img
                                                src={track.albumCover || 'https://via.placeholder.com/150'}
                                                alt={track.trackTitle}
                                                className="top-track-cover"
                                            />
                                        </div>
                                        <div className="top-track-info">
                                            <h3 className="top-track-title">
                                                {track.trackTitle}
                                            </h3>
                                            <span className="top-track-artist">
                                                {track.albumTitle}
                                            </span>
                                        </div>
                                        <div className="top-track-options" ref={dropdownRef}>
                                            <button
                                                className="top-track-dropdown-button"
                                                onClick={() => toggleDropdown(track.trackId)}
                                            >
                                                ...
                                            </button>
                                            {renderDropdownOptions(track)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No top tracks available.</p>
                        )}
                    </div>
                </div>

                <div className="artist-detail-all-albums">
                    <h2>모든 앨범</h2>
                    <div
                        className="album-list"
                        ref={albumListRef}
                        onWheel={handleWheelScroll}
                    >
                        {Array.isArray(albums) && albums.length > 0 ? (
                            albums.map((album) => (
                                <div
                                    key={album.albumId}
                                    className="album-card"
                                    onClick={() => handleAlbumClick(album.albumId)}
                                >
                                    <div className="album-image">
                                        <img
                                            src={album.coverImage || 'https://via.placeholder.com/150'}
                                            alt={album.albumTitle}
                                        />
                                    </div>
                                    <div className="album-title">{album.albumTitle}</div>
                                    <div className="album-artist">{album.albumArtistName}</div>
                                </div>
                            ))
                        ) : (
                            <p>No albums available.</p>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ArtistDetail;
