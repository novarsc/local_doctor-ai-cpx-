import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    // 저작권 연도를 동적으로 표시
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-800 text-slate-400">
            <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">AI CPX Tutor</h3>
                        <p className="text-sm">의대생 및 의료인들이 임상수행능력시험(CPX)에서 뛰어난 성과를 거둘 수 있도록 돕습니다.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">빠른 링크</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link className="hover:text-white transition-colors" to="/cases">증례 라이브러리</Link></li>
                            <li><Link className="hover:text-white transition-colors" to="/mock-exams">모의고사</Link></li>
                            <li><Link className="hover:text-white transition-colors" to="/my-notes">MY 노트</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">법률 정보</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a className="hover:text-white transition-colors" href="#">서비스 이용약관</a></li>
                            <li><a className="hover:text-white transition-colors" href="#">개인정보 처리방침</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-slate-700 pt-8 text-center text-sm">
                    <p>© {currentYear} Doc_tor AI CPX Tutor. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;