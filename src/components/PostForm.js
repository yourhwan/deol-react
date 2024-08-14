import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PostForm = ({ post, onSave }) => {
    // 상태 초기화
    const [title, setTitle] = useState(''); // 게시물 제목 상태
    const [content, setContent] = useState(''); // 게시물 내용 상태
    const [file, setFile] = useState(null); // 파일 상태
    const [error, setError] = useState(null); // 오류 메시지 상태
    const [success, setSuccess] = useState(null); // 성공 메시지 상태

    // post가 주어졌을 경우 상태 업데이트
    useEffect(() => {
        if (post) {
            setTitle(post.title); // 기존 게시물 제목 설정
            setContent(post.content); // 기존 게시물 내용 설정
        }
    }, [post]);

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault(); // 기본 폼 제출 동작 방지
        setError(null); // 오류 상태 초기화
        setSuccess(null); // 성공 상태 초기화

        const formData = new FormData();
        formData.append('post', new Blob([JSON.stringify({ title, content })], { type: 'application/json' }));
        if (file) {
            formData.append('file', file); // 파일이 있는 경우 추가
        }

        try {
            if (post) {
                // 게시물 수정 요청
                await axios.put(`${process.env.REACT_APP_API_BASE_URL}/posts/${post.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                setSuccess('게시물이 성공적으로 업데이트되었습니다.');
            } else {
                // 새로운 게시물 생성 요청
                await axios.post(`${process.env.REACT_APP_API_BASE_URL}/posts`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                setSuccess('게시물이 성공적으로 생성되었습니다.');
            }
            onSave(); // 성공 후 onSave 호출
            // 폼 초기화
            setTitle('');
            setContent('');
            setFile(null);
        } catch (error) {
            console.error('Error saving post', error);
            setError('게시물 저장에 실패했습니다.'); // 오류 메시지 설정
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                required
            />
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용"
                required
            />
            <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
            />
            <button type="submit">저장</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </form>
    );
};

export default PostForm;
