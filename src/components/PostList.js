import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PostList = () => {
    // 상태 훅 설정
    const [posts, setPosts] = useState([]); // 게시물 목록 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [error, setError] = useState(null); // 오류 상태

    // 컴포넌트가 처음 렌더링될 때 게시물 목록을 가져오는 함수
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // API에서 게시물 목록을 가져옴
                const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/posts`);
                setPosts(response.data); // 게시물 상태 업데이트
            } catch (error) {
                console.error('Error fetching posts', error);
                setError('게시물을 가져오는 데 실패했습니다'); // 오류 상태 업데이트
            } finally {
                setLoading(false); // 로딩 완료
            }
        };
        fetchPosts(); // 함수 호출
    }, []);

    // 로딩 중일 때 표시할 메시지
    if (loading) return <p>로딩 중...</p>;
    // 오류가 발생했을 때 표시할 메시지
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // 게시물 목록 렌더링
    return (
        <div>
            <h1>게시물 목록</h1>
            <ul>
                {posts.map(post => (
                    <li key={post.id}>
                        <h2>{post.title}</h2>
                        <p>{post.content}</p>
                        {post.imageUrl && (
                            <img
                                src={post.imageUrl}
                                alt="Post"
                                width="200"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PostList;
