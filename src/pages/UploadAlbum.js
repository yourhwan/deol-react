// src/pages/UploadAlbum.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import '../css/UploadAlbum.css';
import { HiOutlinePlusSm } from 'react-icons/hi';
import { CustomToast } from '../utils/CustomToast';

const UploadAlbum = () => {
    const navigate = useNavigate();

    const [albumTitle, setAlbumTitle] = useState('');
    const [albumCover, setAlbumCover] = useState(null);
    const [albumCoverPreview, setAlbumCoverPreview] = useState(null);
    const [albumGenre, setAlbumGenre] = useState('');
    const [albumDescription, setAlbumDescription] = useState('');
    const [tracks, setTracks] = useState([{ trackTitle: '', trackFile: null }]);
    const [error, setError] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false); // ★ 중복 제출 방지

    const titleRef = useRef(null);
    const genreRef = useRef(null);
    const trackTitleRefs = useRef([]); // 트랙 제목 인풋들 참조 배열

    const handleAlbumTitleChange = (e) => {
        const value = e.target.value.slice(0, 50);
        setAlbumTitle(value);
        if (value) setError((prev) => ({ ...prev, albumTitle: '' }));
    };

    const handleAlbumDescriptionChange = (e) => {
        const value = e.target.value;
        if (value.length <= 100) setAlbumDescription(value);
    };

    const handleAlbumCoverChange = (e) => {
        const file = e.target.files[0];
        setAlbumCover(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAlbumCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleAddTrack = () => {
        if (isSubmitting) return;
        setTracks((prev) => [...prev, { trackTitle: '', trackFile: null }]);
    };

    const handleTrackChange = (index, field, value) => {
        const updated = tracks.map((track, i) =>
            i === index ? { ...track, [field]: value } : track
        );
        setTracks(updated);
        if ((field === 'trackTitle' || field === 'trackFile') && value) {
            setError((prev) => ({ ...prev, tracks: '' }));
        }
    };

    const handleRemoveTrack = (index) => {
        if (isSubmitting) return;
        const updated = tracks.filter((_, i) => i !== index);
        setTracks(updated);
    };

    const focusSafely = (ref) =>
        ref?.current && typeof ref.current.focus === 'function' && ref.current.focus();

    const validateForm = () => {
        const errors = {};

        if (!albumTitle.trim()) {
            errors.albumTitle = '앨범 이름을 입력해주세요';
            setError(errors);
            focusSafely(titleRef);
            return false;
        }

        if (!albumGenre) {
            errors.albumGenre = '장르를 선택해주세요';
            setError(errors);
            focusSafely(genreRef);
            return false;
        }

        if (tracks.length === 0) {
            errors.tracks = '최소 1곡 이상 추가해주세요';
            setError(errors);
            CustomToast('최소 1곡 이상 추가해주세요', 'error');
            trackTitleRefs.current?.[0]?.focus?.();
            return false;
        }

        const invalidIndex = tracks.findIndex(
            (t) => !t.trackTitle?.trim() || !t.trackFile
        );
        if (invalidIndex !== -1) {
            errors.tracks = `트랙 ${invalidIndex + 1}의 제목과 파일을 모두 추가해주세요`;
            setError(errors);
            CustomToast(`트랙 ${invalidIndex + 1}: 제목과 파일을 모두 추가해주세요`, 'error');
            trackTitleRefs.current?.[invalidIndex]?.focus?.();
            return false;
        }

        setError(errors);
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ★ 이미 제출 중이면 무시
        if (isSubmitting) return;

        if (!validateForm()) return;

        try {
            setIsSubmitting(true); // ★ 첫 클릭 시 락

            const formData = new FormData();

            // 백엔드가 발매일을 자동으로 현재일로 설정 -> releaseDate는 보내지 않음
            const albumDto = {
                albumTitle,
                albumGenre,
                albumDescription,
            };
            formData.append('albumDto', new Blob([JSON.stringify(albumDto)], { type: 'application/json' }));
            formData.append('coverImage', albumCover);

            const trackInfoArray = tracks.map((track) => ({
                trackTitle: track.trackTitle,
            }));
            formData.append('trackInfo', new Blob([JSON.stringify(trackInfoArray)], { type: 'application/json' }));

            tracks.forEach((track) => {
                formData.append('trackFiles', track.trackFile);
            });

            await axios.post('/api/albums/upload/album', formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            // 성공: 버튼은 계속 disabled 유지 → 이중 처리 방지
            CustomToast('앨범 업로드가 완료되었습니다.', 'success', {
                autoClose: 2500,
                onClose: () => navigate('/mainhome'),
            });
        } catch (err) {
            console.error('앨범 업로드 중 오류:', err.response ? err.response.data : err.message);
            setError({ tracks: '앨범 업로드 중 오류가 발생했습니다.' });
            CustomToast('앨범 업로드 중 오류가 발생했습니다.', 'error');
            setIsSubmitting(false); // 실패 시에만 다시 제출 가능하게 해제
        }
    };

    return (
        <MainLayout>
            <div className="album-upload-container">
                <form onSubmit={handleSubmit} className="upload-form">
                    <h1>앨범 업로드</h1>
                    <div className="upload-content">
                        <div className="upload-left-section" aria-disabled={isSubmitting}>
                            <div className="form-group">
                                <label htmlFor="albumTitle">앨범 이름</label>
                                <input
                                    type="text"
                                    id="albumTitle"
                                    value={albumTitle}
                                    onChange={handleAlbumTitleChange}
                                    placeholder="앨범 이름을 입력하세요"
                                    autoComplete="off"
                                    ref={titleRef}
                                    maxLength={50}
                                    disabled={isSubmitting}
                                />
                                {error.albumTitle && <div className="error-message">{error.albumTitle}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="albumGenre">장르</label>
                                <select
                                    id="albumGenre"
                                    value={albumGenre}
                                    onChange={(e) => {
                                        if (isSubmitting) return;
                                        setAlbumGenre(e.target.value);
                                        if (e.target.value) setError((prev) => ({ ...prev, albumGenre: '' }));
                                    }}
                                    autoComplete="off"
                                    className="styled-select"
                                    ref={genreRef}
                                    disabled={isSubmitting}
                                >
                                    <option value="">장르를 선택하세요</option>
                                    <option value="댄스">댄스</option>
                                    <option value="힙합">힙합</option>
                                    <option value="알앤비">알앤비</option>
                                    <option value="락">락</option>
                                </select>
                                {error.albumGenre && <div className="error-message">{error.albumGenre}</div>}
                            </div>

                            {/* 발매일 입력칸 제거(백엔드가 자동 설정) */}

                            <div className="form-group">
                                <label htmlFor="albumDescription">앨범 설명</label>
                                <textarea
                                    id="albumDescription"
                                    value={albumDescription}
                                    onChange={handleAlbumDescriptionChange}
                                    placeholder="앨범 설명을 입력하세요"
                                    className="styled-textarea"
                                    disabled={isSubmitting}
                                />
                                <div className="char-counter">{`${albumDescription.length}/100`}</div>
                            </div>

                            <div className="tracks-section">
                                <h2>트랙 추가</h2>
                                {tracks.map((track, index) => (
                                    <div key={index} className="track-item">
                                        <input
                                            type="text"
                                            placeholder={`트랙 ${index + 1} 제목`}
                                            value={track.trackTitle}
                                            onChange={(e) => {
                                                if (isSubmitting) return;
                                                handleTrackChange(index, 'trackTitle', e.target.value);
                                                if (e.target.value) setError((prev) => ({ ...prev, tracks: '' }));
                                            }}
                                            autoComplete="off"
                                            ref={(el) => (trackTitleRefs.current[index] = el)}
                                            disabled={isSubmitting}
                                        />
                                        <div className="track-file-wrapper">
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                onChange={(e) => {
                                                    if (isSubmitting) return;
                                                    handleTrackChange(index, 'trackFile', e.target.files[0]);
                                                    if (e.target.files[0]) setError((prev) => ({ ...prev, tracks: '' }));
                                                }}
                                                autoComplete="off"
                                                disabled={isSubmitting}
                                            />
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove-track"
                                                    onClick={() => handleRemoveTrack(index)}
                                                    disabled={isSubmitting}
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    className="btn-plus-track"
                                    type="button"
                                    onClick={handleAddTrack}
                                    disabled={isSubmitting}
                                >
                                    + 트랙 추가
                                </button>
                                {error.tracks && <div className="error-message">{error.tracks}</div>}
                            </div>
                        </div>

                        <div className="upload-right-section">
                            <div
                                className={`album-cover-upload-box ${isSubmitting ? 'disabled' : ''}`}
                                onClick={() => {
                                    if (isSubmitting) return;
                                    document.getElementById('albumCover').click();
                                }}
                                aria-disabled={isSubmitting}
                            >
                                {albumCoverPreview ? (
                                    <img src={albumCoverPreview} alt="앨범 커버 미리보기" className="album-cover-preview" />
                                ) : (
                                    <div className="upload-placeholder">
                                        <span><HiOutlinePlusSm /></span>
                                        <span>앨범 커버 추가</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="albumCover"
                                    style={{ display: 'none' }}
                                    onChange={handleAlbumCoverChange}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <button
                                className="btn-upload"
                                type="submit"
                                disabled={isSubmitting}
                                aria-busy={isSubmitting}
                            >
                                {isSubmitting ? '업로드 중…' : '업로드'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
};

export default UploadAlbum;
