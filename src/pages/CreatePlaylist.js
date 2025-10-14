// import React, { useState } from 'react';
// import { HiOutlinePlusSm } from 'react-icons/hi';
// import axios from 'axios';
// import '../css/PlaylistCreateModal.css'; // 스타일 재사용
//
// const CreatePlaylist = ({ onClose }) => {
//     const [playlistName, setPlaylistName] = useState('');
//     const [playlistDescription, setPlaylistDescription] = useState('');
//     const [playlistCover, setPlaylistCover] = useState(null);
//     const [playlistCoverPreview, setPlaylistCoverPreview] = useState(null);
//     const [error, setError] = useState(null);
//     const [playlist, setPlaylist] = useState(null);
//
//     const handleFileChange = (e) => {
//         const file = e.target.files[0];
//         setPlaylistCover(file);
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setPlaylistCoverPreview(reader.result);
//             };
//             reader.readAsDataURL(file);
//         }
//     };
//
//     const handleCreatePlaylist = async () => {
//         const formData = new FormData();
//         formData.append(
//             'playlistDto',
//             new Blob([JSON.stringify({ playlistName, playlistDescription })], {
//                 type: 'application/json',
//             })
//         );
//         formData.append('playlistCover', playlistCover);
//
//         try {
//             const response = await axios.post(
//                 '/api/playlists/create/playlist',
//                 formData,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//                         'Content-Type': 'multipart/form-data',
//                     },
//                 }
//             );
//             setPlaylist(response.data);
//             onClose(); // 생성 후 모달 닫기
//         } catch (err) {
//             setError(err.message);
//         }
//     };
//
//     return (
//         <div className="playlistCreate-overlay">
//             <div className="playlistCreate-container">
//                 <h2 className="playlistCreate-title">플레이리스트 생성</h2>
//
//                 <div
//                     className="playlistCreate-cover-upload-box"
//                     onClick={() => document.getElementById('playlistCoverInput').click()}
//                 >
//                     {playlistCoverPreview ? (
//                         <img
//                             src={playlistCoverPreview}
//                             alt="커버 미리보기"
//                             className="playlistCreate-cover-preview"
//                         />
//                     ) : (
//                         <div className="playlistCreate-upload-placeholder">
//                             <HiOutlinePlusSm size={40} />
//                             <span>플레이리스트 커버 추가</span>
//                         </div>
//                     )}
//                     <input
//                         type="file"
//                         id="playlistCoverInput"
//                         className="playlistCreate-cover-upload"
//                         style={{ display: 'none' }}
//                         onChange={handleFileChange}
//                     />
//                 </div>
//
//                 <input
//                     type="text"
//                     className="playlistCreate-input"
//                     placeholder="플레이리스트 이름"
//                     value={playlistName}
//                     onChange={(e) => setPlaylistName(e.target.value)}
//                 />
//                 <textarea
//                     className="playlistCreate-textarea"
//                     placeholder="플레이리스트 설명"
//                     value={playlistDescription}
//                     onChange={(e) => setPlaylistDescription(e.target.value)}
//                 />
//
//                 <div className="playlistCreate-buttons">
//                     <button className="playlistCreate-button confirm" onClick={handleCreatePlaylist}>
//                         완료
//                     </button>
//                     <button className="playlistCreate-button cancel" onClick={onClose}>
//                         취소
//                     </button>
//                 </div>
//
//                 {error && <div className="playlistCreate-error">{error}</div>}
//                 {playlist && (
//                     <div className="playlistCreate-success">
//                         Playlist Created: {playlist.playlistName}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };
//
// export default CreatePlaylist;
