import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

// Turns Firebase's technical error codes into messages a user can read
export function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/network-request-failed':
      return 'No internet connection. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export async function signUp(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, { displayName: name.trim() });
  return credential.user;
}

export async function logIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export function logOut() {
  return signOut(auth);
}