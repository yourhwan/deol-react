import React, { useContext, useEffect, useState, useRef } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { useLocation, useNavigate } from "react-router-dom";
import { MdVolumeUp, MdVolumeOff } from "react-icons/md";
import { IoPlaySkipBackSharp, IoPlaySkipForward } from "react-icons/io5";
import { FaPlay } from "react-icons/fa";
import { FaPause } from "react-icons/fa6";
import { BiSolidPlaylist } from "react-icons/bi";
import "../css/FooterPlayer.css";
import { CustomToast } from "../utils/CustomToast"; // 토스트 유틸리티

const FooterPlayer = () => {
    const {
        playQueue,
        currentTrack,
        isPlaying,
        togglePlayPause,
        playNextTrack,
        playPrevTrack,
        volume,
        setVolume,
        audioRef,
        currentPlaylistId,
    } = useContext(PlayerContext);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [titleOverflow, setTitleOverflow] = useState(false);
    const [artistOverflow, setArtistOverflow] = useState(false);
    const titleRef = useRef(null);
    const artistRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    const isExcludedRoute = [
        "/signup",
        "/signup/regular",
        "/signup/artist",
        "/signup/home",
        "/signup/result",
        "/login",
        "/find-id",
        "/find-id/result",
        "/find-password",
        "/find-password/result",
        "/change-password",
        "/upload/album",
    ].some((path) => location.pathname.startsWith(path));

    const isLoggedIn = !!localStorage.getItem("accessToken");

    useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        if (isPlaying) audio.play().catch(console.error);
        else audio.pause();

        const onLoaded = () => setDuration(audio.duration || 0);
        const onTime = () => setCurrentTime(audio.currentTime || 0);
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTime);
        return () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTime);
        };
    }, [audioRef, isPlaying]);

    useEffect(() => {
        if (titleRef.current) {
            setTitleOverflow(
                titleRef.current.scrollWidth > titleRef.current.clientWidth
            );
        }
        if (artistRef.current) {
            setArtistOverflow(
                artistRef.current.scrollWidth > artistRef.current.clientWidth
            );
        }
    }, [currentTrack?.title, currentTrack?.artist]);

    const onVolumeChange = (e) => {
        const vol = e.target.value / 100;
        setVolume(vol);
        if (audioRef.current) audioRef.current.volume = vol;
    };

    const onProgressChange = (e) => {
        const time = (e.target.value / 100) * duration;
        if (audioRef.current) audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    if (!isLoggedIn || isExcludedRoute) return null;

    // 현재 재생목록 보기/닫기 버튼 핸들러
    const handlePlaylistToggle = () => {
        if (location.pathname.startsWith("/current-playlist/")) {
            navigate(-1);
        } else {
            navigate(
                `/current-playlist/${currentTrack?.currentPlaylistId || currentPlaylistId}`
            );
        }
    };

    // ▶︎/⏸︎ 버튼 클릭 핸들러: 재생목록이 비어 있으면 토스트만, 그렇지 않으면 기존 토글
    const handlePlayPauseClick = () => {
        if (playQueue.length === 0) {
            CustomToast("재생할 곡이 없습니다.", "info");
            return;
        }
        togglePlayPause();
    };

    return (
        <footer className="footer-player">
            <div className="footer-player-left">
                <img
                    src={currentTrack?.coverImage || "https://via.placeholder.com/50"}
                    alt="Album Cover"
                    className="footer-album-cover"
                />
                <div className="footer-track-info">
                    <div className={`marquee-container ${titleOverflow ? "active" : ""}`}>
            <span ref={titleRef} className="footer-track-title">
              {currentTrack?.title || "No Track Playing"}
            </span>
                    </div>
                    <div className={`marquee-container ${artistOverflow ? "active" : ""}`}>
            <span ref={artistRef} className="footer-track-artist">
              {currentTrack?.artist || "Unknown Artist"}
            </span>
                    </div>
                </div>
                {(currentTrack?.currentPlaylistId || currentPlaylistId) && (
                    <button
                        className="current-playlist-icon-button"
                        onClick={handlePlaylistToggle}
                        title="현재 재생목록 보기/닫기"
                    >
                        <BiSolidPlaylist size={22} />
                    </button>
                )}
            </div>

            <div className="footer-player-center">
                <div className="footer-controls">
                    <button className="footer-control-button" onClick={playPrevTrack}>
                        <IoPlaySkipBackSharp />
                    </button>
                    <button
                        className="footer-control-button"
                        onClick={handlePlayPauseClick}
                    >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button className="footer-control-button" onClick={playNextTrack}>
                        <IoPlaySkipForward />
                    </button>
                </div>
                <div className="footer-progress-bar-container">
                    <span className="time-label">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        className="footer-progress-bar"
                        min="0"
                        max="100"
                        value={(currentTime / duration) * 100 || 0}
                        onChange={onProgressChange}
                    />
                    <span className="time-label">{formatTime(duration)}</span>
                </div>
            </div>

            <div className="footer-player-right">
                <button className="footer-control-button">
                    {volume > 0 ? <MdVolumeUp /> : <MdVolumeOff />}
                </button>
                <input
                    type="range"
                    className="footer-volume-slider"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={onVolumeChange}
                />
            </div>
        </footer>
    );
};

export default FooterPlayer;
