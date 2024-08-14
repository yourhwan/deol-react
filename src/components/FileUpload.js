import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ postId }) => {
    // 파일 상태
    const [file, setFile] = useState(null);
    // 업로드 상태
    const [uploading, setUploading] = useState(false);
    // 삭제 상태
    const [deleting, setDeleting] = useState(false);
    // 에러 상태
    const [error, setError] = useState(null);
    // 이미지 URL 상태
    const [imageUrl, setImageUrl] = useState('');

    // 파일 선택 핸들러
    const handleFileChange = (e) => {
        setFile(e.target.files[0]); // 선택된 파일을 상태에 저장
    };

    // 파일 업로드 핸들러
    const handleUpload = async () => {
        if (!file || !postId) return; // 파일과 게시물 ID가 없으면 함수 종료

        const formData = new FormData();
        formData.append('post', new Blob([JSON.stringify({ id: postId })], { type: 'application/json' }));
        formData.append('file', file); // 폼 데이터에 파일 추가

        setUploading(true);
        setError(null);

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/posts`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setImageUrl(response.data.imageUrl); // 서버로부터 받은 이미지 URL을 상태에 저장
            alert('파일이 성공적으로 업로드되었습니다');
        } catch (error) {
            console.error('파일 업로드 중 오류 발생', error);
            setError('파일 업로드에 실패했습니다');
        } finally {
            setUploading(false);
        }
    };

    // 파일 삭제 핸들러
    const handleDelete = async () => {
        if (!postId || !imageUrl) return; // 게시물 ID와 이미지 URL이 없으면 함수 종료

        // 이미지 URL에서 파일 키 추출
        const fileKey = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

        setDeleting(true);
        setError(null);

        try {
            await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/posts/${postId}/image/${fileKey}`);
            setImageUrl(''); // 이미지 URL 상태 초기화
            alert('파일이 성공적으로 삭제되었습니다');
        } catch (error) {
            console.error('파일 삭제 중 오류 발생', error);
            setError('파일 삭제에 실패했습니다');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            {/* 파일 선택 입력 */}
            <input type="file" onChange={handleFileChange} />
            {/* 업로드 버튼 */}
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? '업로드 중...' : '업로드'}
            </button>
            {/* 이미지 URL과 삭제 버튼 */}
            {imageUrl && (
                <div>
                    <p>이미지 URL: {imageUrl}</p>
                    <button onClick={handleDelete} disabled={deleting}>
                        {deleting ? '삭제 중...' : '이미지 삭제'}
                    </button>
                </div>
            )}
            {/* 에러 메시지 */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default FileUpload;
