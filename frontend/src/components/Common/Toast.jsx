import React from 'react';
import { useToast } from '../../contexts/ToastContext';
//import './Toast.css'; // We'll assume we put toast styles here or in global css

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="toast-container" id="toastContainer">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    onClick={() => removeToast(toast.id)}
                    style={{ animation: 'slideInRight 0.3s ease-out' }}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
