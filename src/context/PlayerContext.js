// src/context/PlayerContext.js
import React, { createContext, useState, useRef, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const { user } = useContext(UserContext);

    const [currentTrack, setCurrentTrack] = useState(null);
    const [playQueue, setPlayQueue] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAllPlaying, setIsAllPlaying] = useState(false);
    const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
    const [volume, setVolume] = useState(1);

    const audioRef = useRef(new Audio());
    const getToken = () => localStorage.getItem("accessToken");

    // 최신 값을 이벤트 리스너에서 참조하기 위한 ref들
    const currentTrackRef = useRef(null);
    const playQueueRef = useRef([]);
    const lastPrevClickTimeRef = useRef(0);

    // 같은 트랙에 대해 ended가 두 번 이상 불리는 것 방지
    const lastEndedLoggedCptIdRef = useRef(null);

    // ─────────────────────────────────────────────────────────
    // 공통 유틸
    // ─────────────────────────────────────────────────────────
    const clearQueue = useCallback(() => {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        setPlayQueue([]);
        playQueueRef.current = [];
        setCurrentTrack(null);
        currentTrackRef.current = null;
        setIsPlaying(false);
        setIsAllPlaying(false);
        setCurrentPlaylistId(null);
    }, []);

    const fetchCurrentPlaylistFromDB = async () => {
        try {
            const resCreate = await axios.post(
                `/api/playlists/create/current`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            const playlistId = resCreate.data.currentPlaylistId;
            setCurrentPlaylistId(playlistId);

            const tracksRes = await axios.get(
                `/api/playlists/current/${playlistId}/tracks`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            const { tracks } = tracksRes.data;

            const formattedTracks = tracks.map((t) => ({
                trackId: t.trackId,
                title: t.title || t.trackTitle,
                artist: t.artist || t.artistName,
                coverImage: t.cover || t.coverImage,
                trackFile: t.trackFile,
                currentPlaylistTrackId: t.currentPlaylistTrackId || t.playlistTrackId,
                currentPlaylistId: playlistId,
                trackLyrics: t.trackLyrics,
                trackDuration: t.trackDuration,
                albumTitle: t.albumTitle,
            }));

            setPlayQueue(formattedTracks);
            playQueueRef.current = formattedTracks;

            // 현재 트랙이 큐 밖이면 첫 곡 세팅
            if (formattedTracks.length > 0) {
                if (
                    !currentTrackRef.current ||
                    !formattedTracks.some(
                        (x) =>
                            currentTrackRef.current.currentPlaylistTrackId === x.currentPlaylistTrackId
                    )
                ) {
                    setCurrentTrack(formattedTracks[0]);
                    currentTrackRef.current = formattedTracks[0];
                    const audio = audioRef.current;
                    audio.src = formattedTracks[0].trackFile;
                    setIsPlaying(false);
                }
            } else {
                setCurrentTrack(null);
                currentTrackRef.current = null;
                setIsPlaying(false);
            }

            return formattedTracks;
        } catch (err) {
            console.error("재생목록 불러오기 실패:", err);
            return [];
        }
    };

    const createCurrentPlaylist = async () => {
        const res = await axios.post(
            `/api/playlists/create/current`,
            {},
            { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        setCurrentPlaylistId(res.data.currentPlaylistId);
        return res.data.currentPlaylistId;
    };

    const addTrackOnly = async (track) => {
        try {
            const playlistId = currentPlaylistId || (await createCurrentPlaylist());
            await axios.post(
                `/api/playlists/add/current/track`,
                { currentPlaylistId: playlistId, trackId: track.trackId },
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            await fetchCurrentPlaylistFromDB();
        } catch (err) {
            console.error("플레이리스트에 추가 실패 (addTrackOnly):", err);
        }
    };

    const stopPlayback = () => {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        setIsAllPlaying(false);
        // 사용자 중지/스킵은 미집계(종료 지점 집계 원칙)
    };

    // ─────────────────────────────────────────────────────────
    // 개별 트랙 재생 (집계는 ended에서만)
    // ─────────────────────────────────────────────────────────
    const playTrack = async (track, options = { forceAdd: false }) => {
        try {
            const playlistId = currentPlaylistId || (await createCurrentPlaylist());

            // 같은 인스턴스면 토글
            if (
                currentTrackRef.current &&
                currentTrackRef.current.trackId === track.trackId &&
                currentTrackRef.current.currentPlaylistTrackId ===
                (track.currentPlaylistTrackId || track.playlistTrackId)
            ) {
                const audio = audioRef.current;
                if (audio.paused) {
                    await audio.play().catch((err) => console.error("오디오 재생 오류:", err));
                    setIsPlaying(true);
                } else {
                    audio.pause();
                    setIsPlaying(false);
                }
                return;
            }

            // 큐에 이미 있는지 확인
            const matching = playQueueRef.current.filter(
                (x) =>
                    x.trackId === track.trackId &&
                    x.currentPlaylistTrackId ===
                    (track.currentPlaylistTrackId || track.playlistTrackId)
            );
            const alreadyInQueue = matching.length > 0;

            let chosen = null;

            if (alreadyInQueue && !options.forceAdd) {
                chosen = matching[0];
            } else {
                // 서버에 큐에 추가
                await axios.post(
                    `/api/playlists/add/current/track`,
                    { currentPlaylistId: playlistId, trackId: track.trackId },
                    {
                        headers: {
                            Authorization: `Bearer ${getToken()}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const updatedQueue = await fetchCurrentPlaylistFromDB();
                const updatedMatching = updatedQueue.filter((t) => t.trackId === track.trackId);
                chosen = updatedMatching[updatedMatching.length - 1];
            }

            setCurrentTrack(chosen);
            currentTrackRef.current = chosen;

            const audio = audioRef.current;
            audio.src = chosen.trackFile;
            setIsPlaying(true);

            await audio.play().catch((err) => console.error("오디오 재생 오류:", err));

            // 종료 집계는 ended에서만 수행
            lastEndedLoggedCptIdRef.current = null; // 새 트랙이 시작되면 ended 중복 방지 키 초기화
        } catch (err) {
            console.error("playTrack 오류:", err);
        }
    };

    // ─────────────────────────────────────────────────────────
    // 전체 재생 (집계는 각 곡 ended에서)
    // ─────────────────────────────────────────────────────────
    const playAllTracks = async (tracks) => {
        if (!tracks.length) return;
        try {
            const playlistId = currentPlaylistId || (await createCurrentPlaylist());

            // 추가 전 큐 길이
            const oldQueue = await fetchCurrentPlaylistFromDB();
            const oldLen = oldQueue.length;

            // 서버에 전체 추가
            for (const t of tracks) {
                await axios.post(
                    `/api/playlists/add/current/track`,
                    { currentPlaylistId: playlistId, trackId: t.trackId },
                    {
                        headers: {
                            Authorization: `Bearer ${getToken()}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }

            // 갱신된 큐
            const updatedQueue = await fetchCurrentPlaylistFromDB();

            // 새로 추가된 첫 곡
            if (updatedQueue.length > oldLen) {
                const first = updatedQueue[oldLen];
                setCurrentTrack(first);
                currentTrackRef.current = first;
                const audio = audioRef.current;
                audio.src = first.trackFile;
                setIsPlaying(true);
                setIsAllPlaying(true);

                await audio.play().catch((err) => console.error("오디오 재생 오류:", err));
                lastEndedLoggedCptIdRef.current = null;
            }
        } catch (err) {
            console.error("playAllTracks 오류:", err);
            throw err;
        }
    };

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (audio.paused) {
            audio.play();
            setIsPlaying(true);
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };

    const playNextTrack = () => {
        // 사용자 강제 스킵은 종료 집계 안 함(종료 지점 집계 원칙)
        const pq = playQueueRef.current;
        const idx = pq.findIndex(
            (t) => t.currentPlaylistTrackId === currentTrackRef.current?.currentPlaylistTrackId
        );
        const next = pq[idx + 1];
        if (next) playTrack(next);
        else stopPlayback();
    };

    const playPrevTrack = () => {
        const audio = audioRef.current;
        const pq = playQueueRef.current;
        const idx = pq.findIndex(
            (t) => t.currentPlaylistTrackId === currentTrackRef.current?.currentPlaylistTrackId
        );
        const now = Date.now();

        if (idx === -1) return;
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else {
            const lastClick = lastPrevClickTimeRef.current;
            if (now - lastClick < 1000 && idx > 0) {
                playTrack(pq[idx - 1]);
            } else {
                audio.currentTime = 0;
            }
        }
        lastPrevClickTimeRef.current = now;
    };

    // ─────────────────────────────────────────────────────────
    // 오디오 태그 초기 설정 + ended(한 번만 등록)
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        audio.loop = false;
        audio.preload = "auto";
        audio.volume = volume;

        const onEnded = async () => {
            const finished = currentTrackRef.current;
            const pq = playQueueRef.current;

            // 1) 종료 지점 집계(같은 인스턴스 중복 방지: CptId 기준)
            if (finished?.trackId && finished?.currentPlaylistTrackId) {
                if (lastEndedLoggedCptIdRef.current !== finished.currentPlaylistTrackId) {
                    lastEndedLoggedCptIdRef.current = finished.currentPlaylistTrackId;
                    try {
                        await axios.post(`/api/tracks/${finished.trackId}/play`);
                    } catch (e) {
                        console.warn("재생 종료 로그 적재 실패", e);
                    }
                }
            }

            // 2) 다음 곡 자동 재생
            const idx = pq.findIndex(
                (x) => x.currentPlaylistTrackId === finished?.currentPlaylistTrackId
            );
            const next = pq[idx + 1];
            if (next) {
                // 여기서 직접 다음 곡 세팅/재생(클로저 문제 방지)
                setCurrentTrack(next);
                currentTrackRef.current = next;
                lastEndedLoggedCptIdRef.current = null; // 다음 곡 시작이므로 초기화
                try {
                    audio.src = next.trackFile;
                    setIsPlaying(true);
                    await audio.play();
                } catch (err) {
                    console.error("다음 곡 재생 오류:", err);
                }
            } else {
                stopPlayback();
            }
        };

        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("ended", onEnded);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 한 번만 등록

    // 최신 state → ref 동기화
    useEffect(() => {
        currentTrackRef.current = currentTrack;
    }, [currentTrack]);
    useEffect(() => {
        playQueueRef.current = playQueue;
    }, [playQueue]);
    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    // 로그인 상태 변화에 따른 초기화/로딩
    useEffect(() => {
        if (!user.isLoggedIn) {
            const audio = audioRef.current;
            audio.pause();
            setCurrentTrack(null);
            currentTrackRef.current = null;
            setPlayQueue([]);
            playQueueRef.current = [];
            setCurrentPlaylistId(null);
            setIsPlaying(false);
            setIsAllPlaying(false);
            return;
        }
        fetchCurrentPlaylistFromDB();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.isLoggedIn]);

    // 최초 진입 시 큐 로딩
    useEffect(() => {
        if (user.isLoggedIn) {
            fetchCurrentPlaylistFromDB();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <PlayerContext.Provider
            value={{
                currentTrack,
                playQueue,
                isPlaying,
                isAllPlaying,
                volume,
                setVolume,
                playTrack,
                playAllTracks,
                stopPlayback,
                togglePlayPause,
                playNextTrack,
                playPrevTrack,
                addTrackOnly,
                setIsAllPlaying,
                audioRef,
                currentPlaylistId,
                clearQueue,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};
