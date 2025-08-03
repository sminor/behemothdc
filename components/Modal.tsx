// components/Modal.tsx
import React, { ReactNode, useEffect, useRef } from 'react';
import Button from '@/components/Button';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: ReactNode;
    title?: string;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, content, title, className = '' }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Prevent scrolling of background when modal is open.
        } else {
            document.body.style.overflow = 'auto'; // Re-enable scrolling when the modal closes.
        }

        return () => {
            document.body.style.overflow = 'auto'; // Ensure overflow is re-enabled when component unmounts.
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/70" />

            {/* Modal Content */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                className={`relative z-50 w-full max-w-screen-xl ${className} p-6 rounded-lg shadow-xl bg-[var(--modal-background)] bg-opacity-95 mx-4 mt-4 prose prose-invert scrollbar-custom`}
            >
                {/* Title & Close Button */}
                <div className="flex justify-between">
                    {title && <h2 className="mt-0 mb-5 text-[var(--text-highlight)]">{title}</h2>}
                    
                    {/* Close Button */}
                    <Button
                        onClick={onClose}
                        className="w-8 h-8"
                    >
                        <FaTimes size={16} />
                    </Button>
                </div>

                {/* Render dynamic content */}
                <div className="max-h-[70vh] overflow-y-auto scrollbar-custom px-4">{content}</div>
            </div>
        </div>
    );
};

export default Modal;
