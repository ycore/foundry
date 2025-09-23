import { minLength, object, pipe, string } from 'valibot';

export const authFormSchema = object({
  username: pipe(string(), minLength(3, 'Username must be at least 3 characters')),
});

export const signupFormSchema = object({
  username: pipe(string(), minLength(3, 'Username must be at least 3 characters')),
  displayName: pipe(string(), minLength(1, 'Display name is required')),
});

export const signinFormSchema = object({
  username: pipe(string(), minLength(3, 'Username must be at least 3 characters')),
});
