import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  me as fetchMe,
  logout as apiLogout,
} from "../utils/api/Authentication";
import { useNavigate } from "react-router";

type User = {
  id: number;
  nama_lengkap: string;
  email: string;
  role: string;
  unit_kerja: { nama: string } | null;
  sub_unit: { nama_sub_unit: string } | null;
  profesi: { nama_profesi: string } | null;
  shift: { nama_shift: string } | null;
  jabatan: { nama_jabatan: string } | null;
};

type Lokasi = {
  lat: number;
  lng: number;
  radius: number;
};

type AuthContextType = {
  user: User | null;
  lokasi: Lokasi | null;
  isAuthenticated: boolean;
  loading: boolean;
  setLokasi: (lokasi: Lokasi | null) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMe()
      .then((res) => {
        if (res.sukses) {
          setUser(res.user);
          setLokasi(res.lokasi);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        lokasi,
        isAuthenticated: !!user,
        loading,
        setLokasi,
        setUser,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
