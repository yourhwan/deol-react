// src/pages/CurrentPlaylistPage.js

import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";
import "../css/CurrentPlaylistPage.css";
import { PlayerContext } from "../context/PlayerContext";
import { CustomToast } from "../utils/CustomToast";
import PlaylistModal from "../components/PlaylistCreateModal";
import defaultCover from "../assets/deol_logo_circle.png";

const CurrentPlaylistPage = () => {
    const [tracks, setTracks] = useState([]);
    const [memberSeq, setMemberSeq] = useState(null);
    const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [dropdownState, setDropdownState] = useState(null);
    const [hoveredKey, setHoveredKey] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);

    const { currentTrack, playTrack } = useContext(PlayerContext);
    const dropdownRefs = useRef({});
    const headerDropdownRef = useRef(null);
    const isLoggedIn = !!localStorage.getItem("accessToken");

    // ───────────────────────────────────────────────────────────────────────────
    // 현재 재생목록 ID 조회
    // ───────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchCurrentPlaylistId = async () => {
            try {
                const res = await axios.get("/api/playlists/current", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
                });
                setCurrentPlaylistId(res.data.currentPlaylistId);
            } catch (err) {
                console.error("현재 재생목록 ID 조회 실패:", err);
            }
        };
        fetchCurrentPlaylistId();
    }, []);

    // ───────────────────────────────────────────────────────────────────────────
    // 트랙 목록 조회
    // ───────────────────────────────────────────────────────────────────────────
    const fetchTracks = async () => {
        if (!currentPlaylistId) return;
        try {
            const res = await axios.get(
                `/api/playlists/current/${currentPlaylistId}/tracks`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
            );
            const fetchedTracks = res.data.tracks.map((track) => ({
                ...track,
                currentPlaylistTrackId: track.currentPlaylistTrackId || track.playlistTrackId,
            }));
            setTracks(fetchedTracks);
            setMemberSeq(res.data.memberSeq);
        } catch (err) {
            console.error("재생목록 조회 실패:", err);
        }
    };

    useEffect(() => {
        fetchTracks();
    }, [currentPlaylistId]);

    // ───────────────────────────────────────────────────────────────────────────
    // 사용자 플레이리스트 조회
    // ───────────────────────────────────────────────────────────────────────────
    const fetchUserPlaylists = async () => {
        try {
            const res = await axios.get("/api/playlists/user/all_playlists", {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            setUserPlaylists(res.data);
        } catch (err) {
            console.error("플레이리스트 목록 조회 실패:", err);
        }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 개별 트랙 삭제
    // ───────────────────────────────────────────────────────────────────────────
    const handleRemoveFromCurrentPlaylist = async (currentPlaylistTrackId) => {
        try {
            await axios.delete(
                "/api/playlists/remove/current/tracks",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json",
                    },
                    data: {
                        currentPlaylistId,
                        currentPlaylistTrackId,
                    },
                }
            );
            CustomToast("현재 재생목록에서 삭제되었습니다.");
            fetchTracks();
            setDropdownState(null);
        } catch (err) {
            console.error("삭제 실패", err);
        }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 전체 트랙 삭제
    // ───────────────────────────────────────────────────────────────────────────
    const handleClearAll = async () => {
        setHeaderDropdownOpen(false);

        if (!isLoggedIn) {
            CustomToast("로그인 후 이용 가능합니다.", "warning");
            return;
        }
        if (!currentPlaylistId) return;
        if (tracks.length === 0) {
            CustomToast("삭제할 트랙이 없습니다.", "info");
            return;
        }

        try {
            // 모든 트랙 ID를 모아 병렬 삭제 요청
            await Promise.all(
                tracks.map((track) =>
                    axios.delete(
                        "/api/playlists/remove/current/tracks",
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                                "Content-Type": "application/json",
                            },
                            data: {
                                currentPlaylistId,
                                currentPlaylistTrackId: track.currentPlaylistTrackId,
                            },
                        }
                    )
                )
            );
            CustomToast("현재 재생목록의 모든 트랙이 삭제되었습니다.");
            fetchTracks();
            setDropdownState(null);
        } catch (err) {
            console.error("전체 삭제 실패", err);
            CustomToast("전체 삭제에 실패했습니다.", "error");
        }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 개별 트랙을 다른 플레이리스트에 추가
    // ───────────────────────────────────────────────────────────────────────────
    const handleAddToPlaylist = async (playlistId, trackId) => {
        try {
            await axios.post(
                "/api/playlists/add/playlist/track",
                { playlistId, trackId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            CustomToast("플레이리스트에 추가되었습니다.");
            setDropdownState(null);
        } catch (err) {
            console.error("추가 실패", err);
        }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 트랙별 드롭다운 토글
    // ───────────────────────────────────────────────────────────────────────────
    const toggleTrackDropdown = (key) => {
        setDropdownState((prev) => (prev === key ? null : key));
        setHoveredKey(null);
        if (isLoggedIn) fetchUserPlaylists();
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 헤더의 ••• 토글
    // ───────────────────────────────────────────────────────────────────────────
    const toggleHeaderDropdown = () => {
        setHeaderDropdownOpen((prev) => !prev);
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 외부 클릭 시 드롭다운 닫기
    // ───────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isInsideAnyDropdown =
                Object.values(dropdownRefs.current).some(
                    (ref) => ref && ref.contains(event.target)
                ) ||
                (headerDropdownRef.current && headerDropdownRef.current.contains(event.target));

            if (!isInsideAnyDropdown) {
                setDropdownState(null);
                setHoveredKey(null);
                setHeaderDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

            <div className="current-playlist-wrapper">
                <div className="current-playing-info">
                    <img
                        src={currentTrack?.coverImage || defaultCover}
                        alt="album cover"
                        className="current-playing-cover"
                    />
                    <div className="current-playing-title">
                        {currentTrack?.title || "재생 중인 곡 없음"}
                    </div>
                    <div className="current-playing-artist">
                        {currentTrack?.artist || ""}
                    </div>
                    {currentTrack?.trackLyrics && (
                        <div className="current-playing-lyrics">
                            {currentTrack.trackLyrics.split("\n").map((line, idx) => (
                                <p key={idx}>{line}</p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="current-playlist-track-list">
                    <div className="current-playlist-header">
                        <h2>재생목록</h2>

                        {/* 헤더용 ••• 버튼 (트랙 삭제 드롭다운과 동일한 스타일) */}
                        <div className="track-dropdown-wrapper" ref={headerDropdownRef}>
              <span className="dropdown-trigger-track" onClick={toggleHeaderDropdown}>
                •••
              </span>
                            {headerDropdownOpen && (
                                <div className="current-chart-dropdown-menu-track">
                                    <div
                                        className="current-chart-dropdown-menu-item-track"
                                        onClick={handleClearAll}
                                    >
                                        현재 재생목록 전체 삭제
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {tracks.map((track) => {
                        const isPlayingItem =
                            currentTrack?.currentPlaylistTrackId !== undefined &&
                            track.currentPlaylistTrackId === currentTrack.currentPlaylistTrackId;
                        const key = `track-${track.currentPlaylistTrackId}`;

                        return (
                            <div
                                key={key}
                                className={`current-playlist-track-item ${
                                    isPlayingItem ? "playing" : ""
                                }`}
                            >
                                <img
                                    src={track.coverImage || defaultCover}
                                    alt="cover"
                                    className="current-playlist-track-cover"
                                />
                                <div
                                    className="current-playlist-track-info"
                                    onClick={() => playTrack(track)}
                                >
                                    <div className="current-playlist-track-title">
                                        {track.trackTitle}
                                    </div>
                                    <div className="current-playlist-track-artist">
                                        {track.artistName}
                                    </div>
                                </div>
                                <div className="current-playlist-track-duration">
                                    {track.trackDuration}
                                </div>

                                {/* 트랙별 ••• 버튼과 드롭다운 */}
                                <div className="track-dropdown-wrapper">
                  <span
                      className="dropdown-trigger-track"
                      onClick={(e) => {
                          e.stopPropagation();
                          toggleTrackDropdown(key);
                      }}
                      ref={(el) => (dropdownRefs.current[`trigger-${key}`] = el)}
                  >
                    •••
                  </span>

                                    {dropdownState === key && (
                                        <div
                                            className="current-chart-dropdown-menu-track"
                                            ref={(el) => (dropdownRefs.current[`dropdown-${key}`] = el)}
                                        >
                                            {/* 삭제 버튼 */}
                                            <div
                                                className="current-chart-dropdown-menu-item-track"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isLoggedIn) {
                                                        CustomToast("로그인 후 이용 가능합니다.", "warning");
                                                    } else {
                                                        handleRemoveFromCurrentPlaylist(
                                                            track.currentPlaylistTrackId
                                                        );
                                                    }
                                                }}
                                            >
                                                현재 재생목록에서 삭제
                                            </div>

                                            {/* 플레이리스트에 추가 */}
                                            <div
                                                className="current-chart-dropdown-menu-item-track"
                                                onMouseEnter={() => setHoveredKey(key)}
                                                onMouseLeave={() => setHoveredKey(null)}
                                            >
                                                ◂ 플레이리스트에 추가
                                                {hoveredKey === key && (
                                                    <div className="current-playlist-submenu">
                                                        <div
                                                            className="current-playlist-submenu-item"
                                                            onMouseDown={() => {
                                                                if (!isLoggedIn) {
                                                                    CustomToast(
                                                                        "로그인 후 이용 가능합니다.",
                                                                        "warning"
                                                                    );
                                                                } else {
                                                                    setShowCreateModal(true);
                                                                    setDropdownState(null);
                                                                }
                                                            }}
                                                        >
                                                            ＋ 플레이리스트 생성
                                                        </div>
                                                        {isLoggedIn &&
                                                            userPlaylists.map((pl) => (
                                                                <div
                                                                    key={pl.playlistId}
                                                                    className="current-playlist-submenu-item"
                                                                    onMouseDown={() =>
                                                                        handleAddToPlaylist(
                                                                            pl.playlistId,
                                                                            track.trackId
                                                                        )
                                                                    }
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
                        );
                    })}
                </div>
            </div>
        </MainLayout>
    );
};

export default CurrentPlaylistPage;
