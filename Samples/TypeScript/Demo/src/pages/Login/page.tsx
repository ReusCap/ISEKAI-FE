import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRedirectPath } from '@/utils/kakaoAuth';
import { getUserInfo as fetchUserInfo } from '@/pages/Login/api/getUserInfo';
import { saveUserInfo } from '@/utils/userStorage';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleLogin = async () => {
      const accessToken = searchParams.get('accessToken');
      
      if (accessToken) {
        try {
          localStorage.setItem('accessToken', accessToken);
          const userInfo = await fetchUserInfo();
          saveUserInfo({
            email: userInfo.email,
            nickname: userInfo.nickname.value,
          });
          
          console.log('로그인 성공', userInfo.nickname.value);
          const redirectPath = getRedirectPath();
          navigate(redirectPath, { replace: true });
        } catch (error) {
          console.error('로그인 실패', error);
          localStorage.removeItem('accessToken');
          alert('로그인에 실패했습니다. 다시 시도해주세요.');
          navigate('/login', { replace: true });
        }
      }
    };

    handleLogin();
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#fff'
    }}>
      로그인 처리 중...
    </div>
  );
};

export default Login;