import { email, maxLength, minLength, nonEmpty, object, pipe, string } from 'valibot';

export const authFormSchema = object({
  email: pipe(string(), nonEmpty('Please enter your email.'), email('Please enter a valid email.'), maxLength(32, 'Email is too long')),
});

export const signupFormSchema = object({
  email: pipe(string(), nonEmpty('Please enter your email.'), email('Please enter a valid email.'), maxLength(32, 'Email is too long')),
  displayName: pipe(string(), nonEmpty('Display name is required'), minLength(1, 'Display name is required')),
});

export const signinFormSchema = object({
  email: pipe(string(), nonEmpty('Please enter your email.'), email('Please enter a valid email.'), maxLength(32, 'Email is too long')),
});
