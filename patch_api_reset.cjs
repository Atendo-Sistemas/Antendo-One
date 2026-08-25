const fs = require('fs');
let content = fs.readFileSync('server/api.ts', 'utf-8');

const resetCode = `
// Reset Password Flow
apiRouter.post('/auth/reset-password', async (req: AuthenticatedRequest, res: Response) => {
  const { phone, email, otp, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
  }

  const cleanPhone = (phone || '').replace(/\\D/g, '');
  const searchEmail = (email || '').toLowerCase();
  
  if (!cleanPhone && !searchEmail) {
    return res.status(400).json({ error: 'Telefone ou e-mail é obrigatório' });
  }

  const targetUser = db.users.find(u => 
    (cleanPhone && u.phone && u.phone.replace(/\\D/g, '') === cleanPhone) || 
    (searchEmail && u.email && u.email.toLowerCase() === searchEmail)
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Verificar OTP
  // A variável activeOTPs já existe no arquivo, mas está no escopo do arquivo.
  // Como estamos injetando no fim do arquivo ou perto do login, devemos verificar o código OTP.
  // Para ser simples, já existe um fluxo OTP. Se não usarmos OTP, podemos falhar.
  // Vamos usar o código que procura no activeOTPs.
  // Wait, injetar isso no topo do arquivo vai causar erros.
  // Em vez de injetar uma rota nova, como o usuário pode definir a senha sem OTP se o WhatsApp estiver inativo?
});
`;
// Let's just create a simple route that uses the OTP verification to reset.
