// utils/amplify-utils.ts
import { cookies } from 'next/headers';

import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { getCurrentUser } from 'aws-amplify/auth/server';

import { type Schema } from '@/../amplify/data/resource';
import outputs from '@/../amplify_outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

export const cookiesClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

export async function AuthGetCurrentUserServer(): Promise<{ userId: string }> {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
    if (!currentUser) {
      throw new Error('No user');
    }
    if (!currentUser.userId) {
      throw new Error('No user ID');
    }
    return {
      userId: currentUser.userId,
    };
  } catch (error) {
    console.error(error);
    throw new Error('No user');
  }
}
