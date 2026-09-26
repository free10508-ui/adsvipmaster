import React from 'react';
import { WithdrawalProofsView } from '../WithdrawalProofsView';

interface WithdrawalProofsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawalProofsModal: React.FC<WithdrawalProofsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
    >
      <div 
        id="withdrawal-proofs-modal-container"
        className="w-full max-w-5xl max-h-[92vh] bg-[#0a0e17] rounded-3xl sm:rounded-[32px] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-y-auto custom-scrollbar flex flex-col relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <WithdrawalProofsView onBack={onClose} isModal />
      </div>
    </div>
  );
};
