import React, { useEffect } from 'react';
import { PublicDriverRegistrationModal } from './PublicDriverRegistrationModal';

export const PublicDriverRegistrationPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Cadastro público de motorista | Atendo One';
  }, []);

  return <PublicDriverRegistrationModal standalone onClose={() => { window.location.href = '/vitrine-fretes'; }} />;
};
