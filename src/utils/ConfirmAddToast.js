import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * “이미 현재 재생목록에 들어 있는 트랙입니다. 그래도 추가하시겠습니까?”
 * 문구와 예/아니오 버튼을 포함한 커스텀 토스트를 띄우고,
 * “예”를 누르면 onConfirm 콜백을 호출합니다.
 *
 * @param {string} trackTitle   - 트랙 제목 (토스트 메시지에 사용)
 * @param {() => void} onConfirm - “예” 버튼 클릭 시 실행할 콜백
 */
export const ConfirmAddToast = (trackTitle, onConfirm) => {
    const toastId = toast.info(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span>
        “{trackTitle}”은 이미 현재 재생목록에 있습니다.<br/>
        그래도 추가하시겠습니까?
      </span>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                    style={{
                        padding: '6px 12px',
                        background: '#28a745',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                    onClick={() => {
                        toast.dismiss(toastId);
                        onConfirm();
                    }}
                >
                    예
                </button>
                <button
                    style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                    onClick={() => {
                        toast.dismiss(toastId);
                    }}
                >
                    아니오
                </button>
            </div>
        </div>,
        {
            position: 'top-right',
            autoClose: false,      // 자동 닫힘 없이 대기
            hideProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: false,
            theme: 'dark',
        }
    );
};