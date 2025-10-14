// src/pages/MyPlaylistsPage.js
import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MyPlaylistsPage.css';
import MainLayout from '../components/MainLayout';
import { UserContext } from '../context/UserContext';

const MyPlaylistsPage = () => {
    const navigate = useNavigate();

    // ✅ 전역 상태 사용: 사이드바와 동일한 소스
    const { myPlaylists, fetchMyPlaylists } = useContext(UserContext);

    useEffect(() => {
        // 페이지 진입 시 한 번 보정
        fetchMyPlaylists();

        // 생성/갱신 이벤트가 오면 즉시 동기화
        const onCreated = () => fetchMyPlaylists();
        const onUpdated = () => fetchMyPlaylists();

        window.addEventListener('PLAYLIST_CREATED', onCreated);
        window.addEventListener('PLAYLISTS_UPDATED', onUpdated);

        // 탭 포커스 복귀 시에도 보정(선택)
        const onFocus = () => fetchMyPlaylists();
        window.addEventListener('focus', onFocus);

        return () => {
            window.removeEventListener('PLAYLIST_CREATED', onCreated);
            window.removeEventListener('PLAYLISTS_UPDATED', onUpdated);
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchMyPlaylists]);

    return (
        <MainLayout>
            <div className="my-playlists-page">
                <h1 className="my-playlists-title">내 플레이리스트</h1>

                <div className="playlist-grid">
                    {myPlaylists.map((playlist) => (
                        <div
                            key={playlist.playlistId}
                            className="playlist-card"
                            onClick={() => navigate(`/playlist/${playlist.playlistId}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={playlist.playlistCover}
                                alt={playlist.playlistName}
                                className="playlist-cover"
                            />
                            <div className="playlist-info">
                                <h3>{playlist.playlistName}</h3>
                                <p>{playlist.playlistDescription}</p>
                            </div>
                        </div>
                    ))}

                    {/* 빈 상태 안내 (선택) */}
                    {myPlaylists.length === 0 && (
                        <div className="playlist-empty-state">
                            <p>생성한 플레이리스트가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default MyPlaylistsPage;
