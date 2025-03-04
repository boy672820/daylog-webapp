import { getCurrentUser } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { useToast } from './use-toast';

interface AuthSession {
  userId: string;
  isInitialized: boolean;
}

export function useAuthSession() {
  const [currentUser, setCurrentUser] = useState<AuthSession>({
    userId: '',
    isInitialized: false,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        if (!currentUser?.userId) {
          toast({ description: '로그인 후 이용해주세요.' });
          setLoading(false);
          return;
        }

        setCurrentUser({ userId: currentUser.userId, isInitialized: true });
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        toast({ description: '로그인 후 이용해주세요.' });
        setLoading(false);
      });
  }, [toast]);

  return { currentUser, loading };
}
