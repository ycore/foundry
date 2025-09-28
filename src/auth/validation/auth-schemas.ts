import { email, maxLength, minLength, nonEmpty, object, pipe, string } from 'valibot';

export const authFormSchema = object({
  email: pipe(string(), nonEmpty('Please enter your email.'), email(), maxLength(30, 'Email must be at least 3 characters')),
});

export const signupFormSchema = object({
  email: pipe(string(), nonEmpty('Please enter your email.'), email(), maxLength(30, 'Email must be at least 3 characters')),
  displayName: pipe(string(), minLength(1, 'Display name is required')),
});

export const signinFormSchema = object({
  email: pipe(string(), nonEmpty('Please enter your email.'), email(), maxLength(30, 'Email must be at least 3 characters')),
});
