import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const Logo = ({ className = "size-7 text-primary" }) => (
    <svg className={className} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
    </svg>
);

const GlobalNavigationBar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // 프로필 이미지 URL 생성
    const getProfileImageUrl = () => {
        if (user?.profileImageUrl) {
            // 백엔드에서 제공하는 정적 파일 URL로 변환
            return user.profileImageUrl.startsWith('http') 
                ? user.profileImageUrl 
                : `http://localhost:3000${user.profileImageUrl}`;
        }
        // 기본 아바타 이미지 (닉네임 기반)
        return `https://ui-avatars.com/api/?name=${user?.nickname}&background=3b82f6&color=fff`;
    };

    const activeLinkStyle = {
        color: '#2563eb', // primary-dark
        fontWeight: '700',
    };

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-slate-200 px-6 sm:px-10 py-3 bg-white shadow-sm sticky top-0 z-50">
            <NavLink to="/dashboard" className="flex items-center gap-3 text-slate-900">
                <Logo className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-bold leading-tight tracking-tight hidden sm:block">AI CPX Tutor</h2>
            </NavLink>

            <nav className="flex items-center gap-6">
                {/* '대시보드' 메뉴 추가 */}
                <NavLink to="/dashboard" className="text-gray-600 hover:text-primary text-base font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                    대시보드
                </NavLink>
                <NavLink to="/cases" className="text-gray-600 hover:text-primary text-base font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                    증례 라이브러리
                </NavLink>
                <NavLink to="/mock-exams" className="text-gray-600 hover:text-primary text-base font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                    모의고사
                </NavLink>
                <NavLink to="/my-notes" className="text-gray-600 hover:text-primary text-base font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                    MY 노트
                </NavLink>
            </nav>

            <div className="flex items-center gap-4">
                <NavLink to="/my-page" className="flex items-center gap-2 group">
                    <img 
                        src={getProfileImageUrl()} 
                        alt="Profile" 
                        className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-primary-light transition-all"
                    />
                    <span className="font-semibold text-gray-700 hidden md:block">{user?.nickname} 님</span>
                </NavLink>
                <button onClick={handleLogout} className="btn btn-secondary !py-1.5 !px-3 text-sm">
                    로그아웃
                </button>
            </div>
        </header>
    );
};

export default GlobalNavigationBar;