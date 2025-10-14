import React, { useState, useEffect, useRef } from 'react';
import { HiOutlinePlusSm } from 'react-icons/hi';
import axios from 'axios';
import '../css/PlaylistCreateModal.css';
import defaultCoverImage from '../assets/deol_logo_circle.png';
import { CustomToast } from '../utils/CustomToast';

const PlaylistCreateModal = ({ isOpen, onClose }) => {
    const [playlistName, setPlaylistName] = useState('');
    const [playlistDescription, setPlaylistDescription] = useState('');
    const [playlistCover, setPlaylistCover] = useState(null);
    const [playlistCoverPreview, setPlaylistCoverPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const modalRef = useRef();

    useEffect(() => {
        if (isOpen) {
            setPlaylistName('');
            setPlaylistDescription('');
            setPlaylistCover(null);
            setPlaylistCoverPreview(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleOutsideClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setPlaylistCover(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPlaylistCoverPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        if (!playlistName.trim()) {
            CustomToast('플레이리스트 제목을 입력해주세요.', 'error');
            return false;
        }

        if (playlistName.trim().length > 20) {
            CustomToast('제목은 20자 이하여야 합니다.', 'error');
            return false;
        }

        if (playlistDescription.trim()) {
            if (playlistDescription.trim().length > 50) {
                CustomToast('설명은 50자 이하여야 합니다.', 'error');
                return false;
            }
        } else if (playlistDescription.length > 0) {
            CustomToast('설명은 공백만 입력할 수 없습니다.', 'error');
            return false;
        }

        return true;
    };

    const handleCreatePlaylist = async () => {
        if (isSubmitting) return;
        if (!validateForm()) return;

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append(
            'playlistDto',
            new Blob([JSON.stringify({ playlistName, playlistDescription })], {
                type: 'application/json',
            })
        );

        if (playlistCover) {
            formData.append('playlistCover', playlistCover);
        } else {
            const blob = await fetch(defaultCoverImage).then(res => res.blob());
            const defaultFile = new File([blob], 'deol_logo_circle.png', { type: 'image/png' });
            formData.append('playlistCover', defaultFile);
        }

        try {
            await axios.post(
                '/api/playlists/create/playlist',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            CustomToast('플레이리스트가 성공적으로 생성되었습니다.');
            onClose();
        } catch (err) {
            CustomToast('플레이리스트 생성에 실패했습니다.', 'error');
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="playlistCreate-overlay" onClick={handleOutsideClick}>
            <div className="playlistCreate-container" ref={modalRef}>
                <h2 className="playlistCreate-title">플레이리스트 생성</h2>

                <div
                    className="playlistCreate-cover-upload-box"
                    onClick={() => document.getElementById('playlistCoverInput').click()}
                >
                    {playlistCoverPreview ? (
                        <img
                            src={playlistCoverPreview}
                            alt="커버 미리보기"
                            className="playlistCreate-cover-preview"
                        />
                    ) : (
                        <div className="playlistCreate-upload-placeholder">
                            <HiOutlinePlusSm size={40} />
                            <span>플레이리스트 커버 추가</span>
                        </div>
                    )}
                    <input
                        type="file"
                        id="playlistCoverInput"
                        className="playlistCreate-cover-upload"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>

                <input
                    type="text"
                    className="playlistCreate-input"
                    placeholder="플레이리스트 이름"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                />
                <textarea
                    className="playlistCreate-textarea"
                    placeholder="플레이리스트 설명 (선택)"
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                />

                <div className="playlistCreate-buttons">
                    <button
                        className="playlistCreate-button confirm"
                        onClick={handleCreatePlaylist}
                        disabled={isSubmitting}
                    >
                        완료
                    </button>
                    <button
                        className="playlistCreate-button cancel"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaylistCreateModal;
