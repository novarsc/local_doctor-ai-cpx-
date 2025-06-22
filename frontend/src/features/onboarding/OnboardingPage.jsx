import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Footer from '../../components/common/Footer';
import SocialLogin from '../../components/common/SocialLogin';
import { getNaverLoginUrl, getKakaoLoginUrl } from '../../utils/socialLogin';

// Helper function to create placeholder image URLs
const placeholderImage = (seed, width = 100, height = 100) => {
    const originalImages = [
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlciUyMHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmVzc2lvbmFsJTIwd29tYW58ZW58MHx8MHx8fDA%3D&w=600&q=60",
        "https://images.unsplash.com/photo-1507915098035-783506774339?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG1lZGljYWwlMjBjYXNlfGVufDB8fDB8fHx8MA%3D%3D&w=600&q=60",
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bWVkaWNhbCUyMHN0dWR5fGVufDB8fDB8fHx8MA%3D%3D&w=600&q=60",
        "https://images.unsplash.com/photo-1530497610675-757064451703?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGhlYWRhY2hlfGVufDB8fDB8fHx8MA%3D%3D&w=600&q=60",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bWVkaWNhbCUyMGRvY3RvcnxlbnwwfHwwfHx8MA%3D%3D&w=800&q=60",
    ];
    return originalImages[seed] || `https://placehold.co/${width}x${height}/E2E8F0/4A5568?text=Img${seed}`;
};

// Shared Logo Component
const Logo = ({ className = "size-7 text-primary" }) => (
    <svg className={className} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
    </svg>
);

// Onboarding Page Component
function OnboardingPage() {
    const navigate = useNavigate();

    const handleNaverLogin = () => {
        const naverUrl = getNaverLoginUrl();
        window.location.href = naverUrl;
    };

    const handleKakaoLogin = () => {
        const kakaoUrl = getKakaoLoginUrl();
        window.location.href = kakaoUrl;
    };

    return (
        <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-slate-50">
            <div className="flex h-full grow flex-col">
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-slate-200 px-6 sm:px-10 py-3 bg-white shadow-sm sticky top-0 z-50">
                    <div className="flex items-center gap-3 text-slate-900 cursor-pointer" onClick={() => navigate('/')}>
                        <Logo className="h-8 w-8 text-primary" />
                        <h2 className="text-xl font-bold leading-tight tracking-tight">AI CPX Tutor</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="primary" onClick={() => navigate('/register')}>
                            회원가입
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/login')}>
                            로그인
                        </Button>
                    </div>
                </header>
                <main className="flex-1">
                    <section className="relative flex min-h-[calc(100vh-73px)] items-center justify-center bg-cover bg-center py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%), url("${placeholderImage(5, 800, 600)}")` }}>
                        <div className="max-w-3xl text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                                <span className="text-primary-light">AI CPX Tutor</span>에 오신 것을 환영합니다
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-slate-100 sm:text-xl">
                                AI 기반 플랫폼으로 임상 수행 시험(CPX)을 준비하세요. 실제 시나리오를 연습하고, 개인별 피드백을 받고, 임상 기술을 향상시키세요.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button onClick={() => navigate('/register')} variant="primary" className="w-full sm:w-auto text-lg !h-12 !px-6 transform hover:scale-105">
                                    지금 가입
                                </Button>
                                <Button onClick={() => navigate('/login')} variant="secondary" className="w-full sm:w-auto text-lg !h-12 !px-6 bg-white !text-primary hover:bg-slate-100 transform hover:scale-105">
                                    로그인
                                </Button>
                            </div>
                            
                            {/* 소셜 로그인 섹션 */}
                            <div className="mt-8 max-w-md mx-auto">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/30" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-transparent text-white/70">또는</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 space-y-3">
                                    <button
                                        onClick={handleNaverLogin}
                                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                                        </svg>
                                        네이버로 시작하기
                                    </button>
                                    
                                    <button
                                        onClick={handleKakaoLogin}
                                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 3C6.48 3 2 6.48 2 12s4.48 9 10 9 10-4.48 10-9S17.52 3 12 3zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
                                            <path d="M12 6c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                                        </svg>
                                        카카오로 시작하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="py-16 sm:py-24 bg-white">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">주요 기능</h2>
                                <p className="mt-4 text-lg text-slate-600">AI CPX Tutor가 시험에서 뛰어난 성과를 거두는 데 어떻게 도움이 되는지 알아보세요.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { icon: "model_training", title: "실제와 같은 시뮬레이션", desc: "실제 CPX 시험 환경을 모방한 현실적인 임상 시나리오에 참여하세요." },
                                    { icon: "feedback", title: "개인별 피드백", desc: "성능에 대한 자세한 피드백을 받고 개선이 필요한 부분을 강조합니다." },
                                    { icon: "trending_up", title: "진행 상황 추적", desc: "시간 경과에 따른 진행 상황을 추적하고 뛰어난 부분이나 더 많은 연습이 필요한 부분을 파악합니다." }
                                ].map(feature => (
                                    <div key={feature.title} className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                                        <div className="flex items-center justify-center size-16 rounded-full bg-primary text-white mb-6">
                                            {/* 아이콘 라이브러리가 없다면, 이 부분은 텍스트나 다른 이미지로 대체될 수 있습니다. */}
                                            <span className="material-icons text-4xl">{feature.icon}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                                        <p className="text-slate-600 text-base leading-relaxed">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </div>
    );
}

export default OnboardingPage;