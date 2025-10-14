import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import EditProfileModal from '../components/EditProfileModal';
import '../css/MyPage.css';
import defaultProfileImage from '../assets/deol_logo_circle.png';
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
    const [profileImage, setProfileImage] = useState(null);
    const [nickname, setNickname] = useState('');
    const [following, setFollowing] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ★ 이미지 캐시 무효화를 위한 버전 키
    const [profileVersion, setProfileVersion] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
        fetchNickname();
        fetchFollowing();
        fetchPlaylists();
        fetchAlbums();
    }, []);

    const authHeader = () => ({
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });

    const fetchNickname = async () => {
        try {
            const res = await axios.get('/api/mypage/nickname', {
                headers: authHeader(),
            });
            setNickname(res.data.nickname);
        } catch (err) {
            console.error('닉네임 불러오기 실패:', err);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/mypage/profile', {
                headers: authHeader(),
            });
            setProfileImage(res.data.profileImageUrl || '');
        } catch (err) {
            console.error('프로필 이미지 불러오기 실패', err);
        }
    };

    const fetchFollowing = async () => {
        try {
            const res = await axios.get('/api/mypage/following', {
                headers: authHeader(),
            });
            setFollowing(res.data);
        } catch (err) {
            console.error('팔로잉 목록 실패', err);
        }
    };

    const fetchPlaylists = async () => {
        try {
            const res = await axios.get('/api/mypage/uploaded/playlists', {
                headers: authHeader(),
            });
            setPlaylists(res.data);
        } catch (err) {
            console.error('플레이리스트 목록 실패', err);
        }
    };

    const fetchAlbums = async () => {
        try {
            const res = await axios.get('/api/mypage/uploaded/albums', {
                headers: authHeader(),
            });
            setAlbums(res.data);
        } catch (err) {
            console.error('업로드 앨범 목록 실패', err);
        }
    };

    // ★ 모달에서 저장 완료되면 즉시 반영 + 캐시 버스터 증가 + 재조회(선택)
    const handleProfileUpdated = (newUrl) => {
        setProfileImage(newUrl || '');
        setProfileVersion((v) => v + 1); // 캐시 무효화
        fetchProfile(); // 서버값 동기화(선택)
    };

    // 기본 이미지/실제 이미지 결정 + 캐시버스터 쿼리
    const baseImg =
        profileImage && profileImage !== 'null' && profileImage !== ''
            ? profileImage
            : defaultProfileImage;

    const cacheBustedImg =
        baseImg + (baseImg.includes('?') ? '&' : '?') + 'v=' + profileVersion;

    // 공용 가로 스크롤(휠 → 좌우 이동). preventDefault 사용 안 함(패시브 경고 회피)
    const onWheelHorizontal = (e) => {
        e.currentTarget.scrollLeft += e.deltaY;
    };

    return (
        <MainLayout>
            <div className="mypage-container">
                <div className="mypage-header">
                    <div className="mypage-header-left">
                        <img
                            src={cacheBustedImg}
                            alt="프로필"
                            className="mypage-profile-img"
                        />
                    </div>
                    <div className="mypage-header-right">
                        <h1 className="mypage-nickname">{nickname || '닉네임'}</h1>
                        <button className="mypage-edit-button" onClick={() => setIsModalOpen(true)}>
                            프로필 편집
                        </button>
                    </div>
                </div>

                {/* 팔로잉 */}
                <div className="mypage-section">
                    <h2>팔로잉</h2>
                    <div
                        className="mypage-horizontal-scroll no-scrollbar"
                        onWheel={onWheelHorizontal}
                    >
                        {following.map((artist, idx) => (
                            <div
                                key={idx}
                                className="mypage-circle-avatar"
                                onClick={() => navigate(`/artists/${artist.artistId}/details`)}
                            >
                                <img
                                    src={artist.profileImage || defaultProfileImage}
                                    alt={artist.artistName}
                                />
                                <span>{artist.artistName}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 나의 플레이리스트 */}
                <div className="mypage-section">
                    <h2>나의 플레이리스트</h2>
                    <div
                        className="mypage-horizontal-scroll no-scrollbar"
                        onWheel={onWheelHorizontal}
                    >
                        {playlists.map((pl, idx) => (
                            <div
                                key={idx}
                                className="mypage-album-card"
                                onClick={() => navigate(`/playlist/${pl.playlistId}`)}
                            >
                                <img
                                    src={pl.playlistCover || defaultProfileImage}
                                    alt={pl.playlistName}
                                />
                                <div>{pl.playlistName}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 발매한 음원 */}
                <div className="mypage-section">
                    <h2>발매한 음원</h2>
                    <div
                        className="mypage-horizontal-scroll no-scrollbar"
                        onWheel={onWheelHorizontal}
                    >
                        {albums.map((al, idx) => (
                            <div
                                key={idx}
                                className="mypage-album-card"
                                onClick={() => navigate(`/album/${al.albumId}/details`)}
                            >
                                <img
                                    src={al.coverImage || defaultProfileImage}
                                    alt={al.albumTitle}
                                />
                                <div>{al.albumTitle}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <EditProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentImage={profileImage}
                onProfileUpdated={handleProfileUpdated} // ★ 즉시 반영 + 캐시버스터
            />
        </MainLayout>
    );
};

export default MyPage;
