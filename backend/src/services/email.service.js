/**
 * @file email.service.js
 * @description 이메일 발송 서비스
 */

const nodemailer = require('nodemailer');

// 이메일 전송기 설정
const createTransporter = async () => {
  // 개발 환경에서는 Ethereal Email 사용 (테스트용)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    // Ethereal Email 테스트 계정 생성
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Gmail SMTP 사용
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail 앱 비밀번호 사용
      },
    });
  }

  // 프로덕션 환경에서는 다른 SMTP 서비스 사용 가능
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * 아이디 찾기 이메일 발송
 * @param {string} to - 수신자 이메일
 * @param {string} email - 찾은 아이디 (이메일)
 * @returns {Promise<void>}
 */
const sendIdEmail = async (to, email) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@aichpx.com',
      to: to,
      subject: '[AI CPX Tutor] 아이디 찾기 결과',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>AI CPX Tutor</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>아이디 찾기 결과</h2>
            <p>안녕하세요, AI CPX Tutor입니다.</p>
            <p>요청하신 아이디 찾기 결과를 알려드립니다.</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>찾은 아이디:</strong> ${email}</p>
            </div>
            <p>로그인 페이지에서 위 아이디로 로그인하실 수 있습니다.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                로그인하기
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              이 이메일은 요청하신 경우에만 발송되었습니다.<br>
              요청하지 않으셨다면 무시하셔도 됩니다.
            </p>
          </div>
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            © 2024 AI CPX Tutor. All rights reserved.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('아이디 찾기 이메일 발송 완료:', info.messageId);
    
    // Ethereal Email을 사용한 경우 미리보기 URL 출력
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('이메일 미리보기 URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('아이디 찾기 이메일 발송 실패:', error);
    throw new Error('이메일 발송에 실패했습니다.');
  }
};

/**
 * 비밀번호 재설정 이메일 발송
 * @param {string} to - 수신자 이메일
 * @param {string} token - 재설정 토큰
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (to, token) => {
  try {
    const transporter = await createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@aichpx.com',
      to: to,
      subject: '[AI CPX Tutor] 비밀번호 재설정',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>AI CPX Tutor</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>비밀번호 재설정</h2>
            <p>안녕하세요, AI CPX Tutor입니다.</p>
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                비밀번호 재설정하기
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              <strong>주의사항:</strong><br>
              • 이 링크는 24시간 후에 만료됩니다.<br>
              • 요청하지 않으셨다면 이 이메일을 무시하세요.<br>
              • 보안을 위해 링크를 다른 사람과 공유하지 마세요.
            </p>
            <p style="color: #666; font-size: 14px;">
              링크가 작동하지 않는 경우, 아래 URL을 브라우저에 복사하여 붙여넣으세요:<br>
              <a href="${resetUrl}" style="color: #4F46E5;">${resetUrl}</a>
            </p>
          </div>
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            © 2024 AI CPX Tutor. All rights reserved.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('비밀번호 재설정 이메일 발송 완료:', info.messageId);
    
    // Ethereal Email을 사용한 경우 미리보기 URL 출력
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('이메일 미리보기 URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('비밀번호 재설정 이메일 발송 실패:', error);
    throw new Error('이메일 발송에 실패했습니다.');
  }
};

module.exports = {
  sendIdEmail,
  sendPasswordResetEmail,
}; 