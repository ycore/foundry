import { createContext } from 'react-router';
import type { EmailConfig } from './@types/email.types';

export const emailContext = createContext<EmailConfig | null>(null);
