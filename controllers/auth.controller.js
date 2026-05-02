import { registerService, loginService } from '../services/auth.service.js';

export const Register = async (req, res) => {
  // Delegasi ke service
  const result = await registerService({ ...req.body });
  if (result.error) {
    return res.status(result.status).json({ message: result.error });
  }
  return res.status(result.status).json({ message: 'Registrasi Berhasil!', data: result.data });
};

export const Login = async (req, res) => {
  // Delegasi ke service
  const result = await loginService({ ...req.body });
  if (result.error) {
    return res.status(result.status).json({ message: result.error });
  }
  return res.status(result.status).json({ message: 'Login Berhasil', ...result.data });
};