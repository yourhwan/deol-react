import React, { useState, useEffect, useRef } from 'react';
import { HiOutlinePlusSm } from 'react-icons/hi';
import axios from 'axios';
import '../css/PlaylistCreateModal.css'; // 기존 스타일 재사용
import defaultProfileImage from '../assets/deol_logo_circle.png';
import { CustomToast } from '../utils/CustomToast';

const EditProfileModal = ({ isOpen, onClose, currentImage, onProfileUpdated }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef();

    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setPreview(currentImage || defaultProfileImage);
            setIsSubmitting(false);
        }
    }, [isOpen, currentImage]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
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
        setSelectedFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUploadProfile = async () => {
        if (!selectedFile) {
            CustomToast("이미지를 선택해주세요.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.post(
                "/api/mypage/upload/profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            CustomToast("프로필 이미지가 변경되었습니다.");
            onProfileUpdated(response.data.imageUrl); // 상위 컴포넌트에 반영
            onClose();
        } catch (error) {
            console.error("프로필 업로드 실패:", error);
            CustomToast("프로필 업로드에 실패했습니다.", "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="playlistCreate-overlay" onClick={handleOutsideClick}>
            <div className="playlistCreate-container" ref={modalRef}>
                <h2 className="playlistCreate-title">프로필 사진 변경</h2>
                <div
                    className="playlistCreate-cover-upload-box"
                    onClick={() => document.getElementById('profileInput').click()}
                >
                    {preview ? (
                        <img src={preview} alt="미리보기" className="playlistCreate-cover-preview" />
                    ) : (
                        <div className="playlistCreate-upload-placeholder">
                            <HiOutlinePlusSm size={40} />
                            <span>프로필 사진 선택</span>
                        </div>
                    )}
                    <input
                        type="file"
                        id="profileInput"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>

                <div className="playlistCreate-buttons">
                    <button
                        className="playlistCreate-button confirm"
                        onClick={handleUploadProfile}
                        disabled={isSubmitting}
                    >
                        저장
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

export default EditProfileModal;
