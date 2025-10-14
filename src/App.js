import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'; // 리액트 라우터를 사용하여 페이지 이동을 처리합니다.
import LoginPage from './pages/LoginPage'; // 로그인 페이지 컴포넌트
import SignupHome from "./pages/SignupHome";
import SignupArtist from "./pages/SignupArtist";
import SignupRegular from "./pages/SignupRegular";
import MainHome from "./pages/MainHome";
import SignupResult from "./pages/SignupResult";
import UploadAlbum from "./pages/UploadAlbum";
import FindId from "./pages/FindId";
import FindPassword from "./pages/FindPassword";
import FindIdResult from "./pages/FindIdResult";
import ChangePassword from "./pages/ChangePassword";
import ChangePasswordResult from "./pages/ChangePasswordResult";
import AlbumDetail from "./pages/AlbumDetail";
import {UserProvider} from "./context/UserContext"; // 홈 페이지 컴포넌트 (추가할 수 있는 기본 페이지)
import {PlayerProvider} from "./context/PlayerContext";
import FooterPlayer from "./components/FooterPlayer";
import ArtistDetail from "./pages/ArtistDetail";
import MyPlaylistsPage from "./pages/MyPlaylistsPage";
import PlaylistDetailPage from "./pages/PlaylistDetailPage";
import {ToastContainer} from "react-toastify";
import ChartPage from "./pages/ChartPage";
import MyPage from "./pages/MyPage";
import CurrentPlaylistPage from "./pages/CurrentPlaylistPage";
import ChartNewTrackPage from "./pages/ChartNewTrackPage";


function App() {

    return (
        <Router> {/* 브라우저 라우터를 사용하여 페이지 내비게이션을 설정합니다. */}
            <UserProvider>
                <PlayerProvider>

                    <Routes> {/* 라우트 목록을 정의합니다. */}
                        <Route path="/login" element={<LoginPage/>}/> {/* 로그인 페이지 */}
                        <Route path="/signup/regular" element={<SignupRegular/>}/>
                        <Route path="/signup/artist" element={<SignupArtist/>}/>
                        <Route path="/signup/home" element={<SignupHome/>}/>
                        <Route path="/signup/result" element={<SignupResult/>}/>
                        <Route path="/find-id" element={<FindId/>}/>
                        <Route path="/find-id/result" element={<FindIdResult/>}/>
                        <Route path="/find-password" element={<FindPassword/>}/>
                        <Route path="/find-password/result" element={<ChangePasswordResult/>}/>
                        <Route path="/change-password" element={<ChangePassword/>}/>
                        <Route path="/upload/album" element={<UploadAlbum/>}/>
                        <Route path="/album/:albumId/details" element={<AlbumDetail/>}/> {/* 앨범 상세 페이지 */}
                        <Route path="/album/:albumId/details/otherAlbums" element={<AlbumDetail/>}/>
                        <Route path="/artists/:artistSeq/details" element={<ArtistDetail/>}/> {/* 아티스트 상세 페이지 */}
                        <Route path="/user/all_playlists" element={<MyPlaylistsPage/>}/> {/* 생성한 플레이리스트 목록 페이지 */}
                        <Route path="/playlist/:playlistId" element={<PlaylistDetailPage/>}/> {/* 플레이리스트 상세 페이지 */}
                        <Route path="/chart/streaming" element={<ChartPage />} />  {/*100차트 페이지*/}
                        <Route path="/chart/new-track" element={<ChartNewTrackPage />} /> {/*30일 이내 신곡 7일간 재생횟수 기반 100차트 페이지*/}
                        <Route path="/chart" element={<ChartPage />} />
                        <Route path="/mypage" element={<MyPage />} /> {/* 마이페이지 */}
                        <Route path="/current-playlist/:currentPlaylistId" element={<CurrentPlaylistPage />} />


                        <Route path="/mainhome" element={<MainHome/>}/>

                        {/* 기본적으로 제공하는 404 페이지 */}
                        <Route path="*" element={<div>404 Not Found</div>}/> {/* 페이지를 찾을 수 없는 경우 */}
                    </Routes>
                    <FooterPlayer/>
                    <ToastContainer />
                </PlayerProvider>
            </UserProvider>
        </Router>
    );


    // const [posts, setPosts] = useState([]);
    // const [title, setTitle] = useState('');
    // const [content, setContent] = useState('');
    // const [file, setFile] = useState(null);
    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);
    //
    // useEffect(() => {
    //     fetchPosts();
    // }, []);
    //
    // const fetchPosts = async () => {
    //     setLoading(true);
    //     try {
    //         const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/posts`);
    //         setPosts(response.data);
    //     } catch (error) {
    //         console.error('게시물 가져오기 오류:', error);
    //         setError('게시물 가져오기 실패');
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    //
    // const handleCreatePost = async () => {
    //     if (!title || !content) {
    //         alert('제목과 내용을 입력해 주세요.');
    //         return;
    //     }
    //
    //     const formData = new FormData();
    //     formData.append('post', new Blob([JSON.stringify({ title, content })], { type: 'application/json' }));
    //     if (file) {
    //         formData.append('file', file);
    //     }
    //
    //     try {
    //         await axios.post(`${process.env.REACT_APP_API_BASE_URL}/posts`, formData, {
    //             headers: {
    //                 'Content-Type': 'multipart/form-data'
    //             }
    //         });
    //         setTitle('');
    //         setContent('');
    //         setFile(null);
    //         fetchPosts(); // 게시물 목록을 다시 가져옵니다.
    //     } catch (error) {
    //         console.error('게시물 생성 오류:', error);
    //         setError('게시물 생성 실패');
    //     }
    // };
    //
    // const handleDeletePost = async (id) => {
    //     try {
    //         await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/posts/${id}`);
    //         fetchPosts(); // 게시물 목록을 다시 가져옵니다.
    //     } catch (error) {
    //         console.error('게시물 삭제 오류:', error);
    //         setError('게시물 삭제 실패');
    //     }
    // };
    //
    // if (loading) return <p>로딩 중...</p>;
    // if (error) return <p style={{ color: 'red' }}>{error}</p>;
    //
    // return (
    //     <div className="App">
    //         <h1>게시물 목록</h1>
    //         <input
    //             type="text"
    //             value={title}
    //             onChange={e => setTitle(e.target.value)}
    //             placeholder="제목"
    //         />
    //         <textarea
    //             value={content}
    //             onChange={e => setContent(e.target.value)}
    //             placeholder="내용"
    //         ></textarea>
    //         <input
    //             type="file"
    //             onChange={e => setFile(e.target.files[0])}
    //         />
    //         <button onClick={handleCreatePost}>게시물 생성</button>
    //
    //         <ul>
    //             {posts.map(post => (
    //                 <li key={post.id}>
    //                     <h2>{post.title}</h2>
    //                     <p>{post.content}</p>
    //                     {post.imageUrl && (
    //                         <img
    //                             src={post.imageUrl}
    //                             alt="게시물 이미지"
    //                             width="200"
    //                             style={{ maxWidth: '100%', height: 'auto' }}
    //                         />
    //                     )}
    //                     <button onClick={() => handleDeletePost(post.id)}>삭제</button>
    //                 </li>
    //             ))}
    //         </ul>
    //     </div>
    // );
}

export default App;
