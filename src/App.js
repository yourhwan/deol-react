import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [posts, setPosts] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/posts`);
            setPosts(response.data);
        } catch (error) {
            console.error('게시물 가져오기 오류:', error);
            setError('게시물 가져오기 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!title || !content) {
            alert('제목과 내용을 입력해 주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('post', new Blob([JSON.stringify({ title, content })], { type: 'application/json' }));
        if (file) {
            formData.append('file', file);
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_BASE_URL}/posts`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setTitle('');
            setContent('');
            setFile(null);
            fetchPosts(); // 게시물 목록을 다시 가져옵니다.
        } catch (error) {
            console.error('게시물 생성 오류:', error);
            setError('게시물 생성 실패');
        }
    };

    const handleDeletePost = async (id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/posts/${id}`);
            fetchPosts(); // 게시물 목록을 다시 가져옵니다.
        } catch (error) {
            console.error('게시물 삭제 오류:', error);
            setError('게시물 삭제 실패');
        }
    };

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="App">
            <h1>게시물 목록</h1>
            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="제목"
            />
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="내용"
            ></textarea>
            <input
                type="file"
                onChange={e => setFile(e.target.files[0])}
            />
            <button onClick={handleCreatePost}>게시물 생성</button>

            <ul>
                {posts.map(post => (
                    <li key={post.id}>
                        <h2>{post.title}</h2>
                        <p>{post.content}</p>
                        {post.imageUrl && (
                            <img
                                src={post.imageUrl}
                                alt="게시물 이미지"
                                width="200"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        )}
                        <button onClick={() => handleDeletePost(post.id)}>삭제</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
