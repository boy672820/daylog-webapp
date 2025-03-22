import { defineAuth } from '@aws-amplify/backend';
import { customMessage } from './custom-message/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  triggers: {
    customMessage,
  },
  loginWith: {
    email: {
      verificationEmailSubject: '데이로그(Daylog) 회원가입을 완료해주세요.',
      verificationEmailBody(createCode: () => string) {
        const code = createCode();
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>데이로그(Daylog) 인증</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      color: #000;
      margin: 0;
      padding: 0;
      background: #f6f6f6;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
    }
    .email-header {
      padding: 25px 0 20px;
      text-align: center;
    }
    .email-logo {
      font-size: 24px;
      font-weight: bold;
      color: #000 !important;
      text-decoration: none;
    }
    .email-body {
      padding: 30px 0;
      border-top: 1px solid #e6e6e6;
      border-bottom: 1px solid #e6e6e6;
    }
    .email-title {
      margin-top: 0;
      color: #000;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.5;
    }
    .email-message {
      margin-top: 15px;
      color: #444;
      font-size: 16px;
      line-height: 1.6;
    }
    .verification-code {
      display: inline-block;
      margin: 30px 0;
      padding: 15px 30px;
      font-family: monospace;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #000;
      background-color: #f4f4f4;
      border-radius: 5px;
    }
    .email-footer {
      padding: 20px 0;
      color: #666;
      font-size: 14px;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <span class="email-logo">데이로그(Daylog)</span>
    </div>
    <div class="email-body">
      <h1 class="email-title">회원가입을 완료하세요</h1>
      <p class="email-message">데이로그에 오신 것을 환영합니다! 아래 인증 코드를 입력하여 회원가입을 완료해 주세요.</p>
      <div class="verification-code">${code}</div>
      <p class="email-message">이 코드는 10분 동안 유효하며, 본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.</p>
    </div>
    <div class="email-footer">
      <p>&copy; ${new Date().getFullYear()} 데이로그(Daylog). All rights reserved.</p>
      <p>이 메일은 회원가입 과정에서 자동으로 발송되었습니다.</p>
    </div>
  </div>
</body>
</html>
        `;
      },
    },
    externalProviders: {
      callbackUrls: ['https://day-log.co.kr/login'],
      logoutUrls: ['https://day-log.co.kr/logout'],
    },
  },
  senders: {
    email: {
      fromEmail: 'no-reply@day-log.co.kr',
    },
  },
});
