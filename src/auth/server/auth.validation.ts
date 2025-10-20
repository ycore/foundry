import { email, maxLength, minLength, nonEmpty, object, pipe, string } from 'valibot';

// Base email validation - reused across all auth forms
const emailField = pipe(string(), nonEmpty('Please enter your email.'), email('Please enter a valid email.'), maxLength(254, 'Email exceeds maximum length'));

// Base display name validation
const displayNameField = pipe(string(), nonEmpty('Display name is required'), minLength(1, 'Display name is required'));

export const authFormSchema = object({ email: emailField });

export const signupFormSchema = object({ email: emailField, displayName: displayNameField });

export const signinFormSchema = object({ email: emailField });

export const changeEmailSchema = object({ newEmail: emailField });
