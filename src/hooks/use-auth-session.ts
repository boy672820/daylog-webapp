import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { useToast } from './use-toast';

interface AuthSession {
  identityId: string;
}

export function useAuthSession() {
  const [authSession, setAuthSession] = useState<AuthSession>({
    identityId: '',
  });
  const [loading, setLoading] = useState<boolean>(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchAuthSession()
      .then((authSession) => {
        if (!authSession?.identityId) {
          toast({ description: '로그인 후 이용해주세요.' });
          setLoading(false);
          return;
        }

        setAuthSession({ identityId: authSession.identityId });
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        toast({ description: '로그인 후 이용해주세요.' });
        setLoading(false);
      });
  }, []);

  return { authSession, loading };
}
