import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile, updateUserPassword, deleteUserAccount, uploadProfileImage, deleteProfileImage } from '../../store/slices/authSlice';
import Button from '../../components/common/Button'; // Button 컴포넌트 사용
import Modal from '../../components/common/Modal';   // Modal 컴포넌트 사용
import ProfileImageUpload from '../../components/common/ProfileImageUpload'; // 프로필 이미지 업로드 컴포넌트 추가

// 각 관리 섹션을 위한 재사용 카드 컴포넌트
const InfoCard = ({ title, description, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">{title}</h3>
        {description && <p className="text-sm text-gray-500 mb-6">{description}</p>}
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const AccountManagementTabPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoading } = useSelector(state => state.auth);

    const [nickname, setNickname] = useState('');
    const [passwords, setPasswords] = useState({
        currentPassword: '', newPassword: '', confirmNewPassword: ''
    });
    
    // --- 1. 모달 상태와 비밀번호 확인을 위한 state 추가 ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [passwordForDelete, setPasswordForDelete] = useState('');

    // --- 2. 프로필 이미지 관련 state 추가 ---
    const [selectedImageFile, setSelectedImageFile] = useState(null);

    // --- 3. 커스텀 알림 모달 상태 추가 ---
    const [notificationModal, setNotificationModal] = useState({
        isOpen: false,
        type: 'success', // 'success', 'error', 'confirm'
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
    });

    useEffect(() => {
        if (user) {
            setNickname(user.nickname);
        }
    }, [user]);

    // --- 4. 커스텀 알림 모달 함수들 ---
    const showNotification = (type, title, message, onConfirm = null, onCancel = null) => {
        setNotificationModal({
            isOpen: true,
            type,
            title,
            message,
            onConfirm,
            onCancel
        });
    };

    const closeNotification = () => {
        setNotificationModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleNotificationConfirm = () => {
        if (notificationModal.onConfirm) {
            notificationModal.onConfirm();
        }
        closeNotification();
    };

    const handleNotificationCancel = () => {
        if (notificationModal.onCancel) {
            notificationModal.onCancel();
        }
        closeNotification();
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        // 닉네임 변경을 위한 Redux Thunk를 디스패치합니다.
        dispatch(updateUserProfile({ nickname }))
            .unwrap()
            .then(() => showNotification('success', '성공', '닉네임이 성공적으로 변경되었습니다.'))
            .catch((err) => showNotification('error', '오류', `닉네임 변경 실패: ${err}`));
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            showNotification('error', '오류', '새 비밀번호가 일치하지 않습니다.');
            return;
        }
        const { currentPassword, newPassword } = passwords;
        // 비밀번호 변경을 위한 Redux Thunk를 디스패치합니다.
        dispatch(updateUserPassword({ currentPassword, newPassword }))
            .unwrap()
            .then(() => {
              showNotification('success', '성공', '비밀번호가 성공적으로 변경되었습니다.');
              // 성공 시 입력 필드를 비워줍니다.
              setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            })
            .catch((err) => showNotification('error', '오류', `비밀번호 변경 실패: ${err}`));
    };

    const handleDeleteAccount = () => {
        if (!passwordForDelete) {
            showNotification('error', '오류', '계정을 삭제하려면 비밀번호를 입력해야 합니다.');
            return;
        }
        
        // deleteUserAccount Thunk를 디스패치합니다.
        dispatch(deleteUserAccount({ password: passwordForDelete }))
            .unwrap()
            .then(() => {
                showNotification('success', '성공', '계정이 성공적으로 삭제되었습니다. 이용해주셔서 감사합니다.');
                setTimeout(() => navigate('/'), 2000); // 2초 후 온보딩 페이지로 이동
            })
            .catch((err) => showNotification('error', '오류', `계정 삭제 실패: ${err}`));
    };

    // --- 5. 프로필 이미지 업로드 핸들러 추가 ---
    const handleImageUpload = (file) => {
        setSelectedImageFile(file);
    };

    const handleImageSubmit = async () => {
        if (!selectedImageFile) {
            showNotification('error', '오류', '업로드할 이미지를 선택해주세요.');
            return;
        }

        try {
            await dispatch(uploadProfileImage(selectedImageFile)).unwrap();
            showNotification('success', '성공', '프로필 이미지가 성공적으로 업로드되었습니다.');
            setSelectedImageFile(null);
        } catch (error) {
            showNotification('error', '오류', `프로필 이미지 업로드 실패: ${error}`);
        }
    };

    const handleImageDelete = async () => {
        if (!user?.profileImageUrl) {
            showNotification('error', '오류', '삭제할 프로필 이미지가 없습니다.');
            return;
        }

        showNotification(
            'confirm', 
            '확인', 
            '프로필 이미지를 삭제하시겠습니까?',
            async () => {
                try {
                    await dispatch(deleteProfileImage()).unwrap();
                    showNotification('success', '성공', '프로필 이미지가 성공적으로 삭제되었습니다.');
                } catch (error) {
                    showNotification('error', '오류', `프로필 이미지 삭제 실패: ${error}`);
                }
            }
        );
    };

    if (!user) {
        return <div>사용자 정보를 불러오는 중...</div>;
    }

    return (
        <div className="space-y-8">
            <InfoCard title="프로필 정보" description="닉네임과 프로필 이미지를 변경할 수 있습니다.">
                {/* --- 6. 프로필 이미지 업로드 섹션 추가 --- */}
                <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">프로필 이미지</h4>
                    <ProfileImageUpload 
                        onImageUpload={handleImageUpload}
                        isLoading={isLoading}
                    />
                    {selectedImageFile && (
                        <div className="mt-4 flex justify-center space-x-2">
                            <Button 
                                variant="primary" 
                                onClick={handleImageSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? '업로드 중...' : '이미지 업로드'}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => setSelectedImageFile(null)}
                                disabled={isLoading}
                            >
                                취소
                            </Button>
                        </div>
                    )}
                    {user?.profileImageUrl && !selectedImageFile && (
                        <div className="mt-4 flex justify-center">
                            <Button 
                                variant="danger" 
                                onClick={handleImageDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? '삭제 중...' : '이미지 삭제'}
                            </Button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">이름</label>
                        <input type="text" value={user.fullName} disabled className="input-base bg-gray-100 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">이메일</label>
                        <input type="email" value={user.email} disabled className="input-base bg-gray-100 cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">닉네임</label>
                        <input id="nickname" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="input-base" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isLoading} className="btn btn-primary">
                            {isLoading ? '저장 중...' : '닉네임 저장'}
                        </button>
                    </div>
                </form>
            </InfoCard>

            <InfoCard title="비밀번호 변경">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
                        <input id="currentPassword" name="currentPassword" type="password" value={passwords.currentPassword} onChange={handlePasswordChange} className="input-base" required />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                        <input id="newPassword" name="newPassword" type="password" value={passwords.newPassword} onChange={handlePasswordChange} className="input-base" required />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
                        <input id="confirmNewPassword" name="confirmNewPassword" type="password" value={passwords.confirmNewPassword} onChange={handlePasswordChange} className="input-base" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isLoading} className="btn btn-primary">
                             {isLoading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </div>
                </form>
            </InfoCard>

            {/* --- 7. 계정 탈퇴 카드 UI 추가 --- */}
            <InfoCard 
                title="계정 탈퇴"
                description="계정을 탈퇴하면 모든 학습 기록과 개인 정보가 영구적으로 삭제되며, 복구할 수 없습니다."
            >
                <div className="text-right">
                    <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                        계정 탈퇴하기
                    </Button>
                </div>
            </InfoCard>

            {/* --- 8. 계정 탈퇴 확인 모달 추가 --- */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="계정 탈퇴 확인"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>취소</Button>
                        <Button variant="danger" onClick={handleDeleteAccount}>탈퇴 확인</Button>
                    </>
                }
            >
                <p className="text-gray-700 mb-4">계속하려면 본인 확인을 위해 비밀번호를 입력해주세요.</p>
                <div>
                    <label htmlFor="passwordForDelete" className="block text-sm font-medium text-gray-700">비밀번호</label>
                    <input
                        id="passwordForDelete"
                        type="password"
                        value={passwordForDelete}
                        onChange={(e) => setPasswordForDelete(e.target.value)}
                        className="input-base mt-1"
                        placeholder="비밀번호 입력"
                    />
                </div>
            </Modal>

            {/* --- 9. 커스텀 알림 모달 --- */}
            <Modal
                isOpen={notificationModal.isOpen}
                onClose={closeNotification}
                title={notificationModal.title}
                footer={
                    notificationModal.type === 'confirm' ? (
                        <>
                            <Button variant="secondary" onClick={handleNotificationCancel}>취소</Button>
                            <Button variant="primary" onClick={handleNotificationConfirm}>확인</Button>
                        </>
                    ) : (
                        <Button 
                            variant={notificationModal.type === 'success' ? 'primary' : 'danger'} 
                            onClick={closeNotification}
                        >
                            확인
                        </Button>
                    )
                }
                onEnter={notificationModal.type === 'confirm' ? handleNotificationConfirm : closeNotification}
            >
                <div className="flex items-center space-x-3">
                    {notificationModal.type === 'success' && (
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    )}
                    {notificationModal.type === 'error' && (
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    )}
                    {notificationModal.type === 'confirm' && (
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    )}
                    <p className="text-gray-700">{notificationModal.message}</p>
                </div>
            </Modal>
        </div>
    );
};

export default AccountManagementTabPage;