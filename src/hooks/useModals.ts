import { useState } from 'react';

export function useModals() {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  return {
    isLocationModalOpen,
    openLocationModal: () => setIsLocationModalOpen(true),
    closeLocationModal: () => setIsLocationModalOpen(false),

    isStatusModalOpen,
    openStatusModal: () => setIsStatusModalOpen(true),
    closeStatusModal: () => setIsStatusModalOpen(false),

    isCategoryModalOpen,
    openCategoryModal: () => setIsCategoryModalOpen(true),
    closeCategoryModal: () => setIsCategoryModalOpen(false),

    isSettingsModalOpen,
    openSettingsModal: () => setIsSettingsModalOpen(true),
    closeSettingsModal: () => setIsSettingsModalOpen(false),

    isUserModalOpen,
    openUserModal: () => setIsUserModalOpen(true),
    closeUserModal: () => setIsUserModalOpen(false),
  };
}