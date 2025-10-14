import { toast } from 'react-toastify';

export const CustomToast = (message, type = 'success', options = {}) => {
    toast(message, {
        type,
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
        ...options, // 추가 커스텀 옵션
    });
};
