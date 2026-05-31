import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import RequestMoney from './pages/RequestMoney';
import AddMoney from './pages/AddMoney';
import CashOut from './pages/CashOut';
import Payment from './pages/Payment';
import Recharge from './pages/Recharge';
import BillPay from './pages/BillPay';
import Financial from './pages/Financial';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';

const authRoutes = ['/login', '/register', '/'];

function AppLayout({ children }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivatePage><Dashboard /></PrivatePage>} />
            <Route path="/send" element={<PrivatePage><SendMoney /></PrivatePage>} />
            <Route path="/request" element={<PrivatePage><RequestMoney /></PrivatePage>} />
            <Route path="/add-money" element={<PrivatePage><AddMoney /></PrivatePage>} />
            <Route path="/cash-out" element={<PrivatePage><CashOut /></PrivatePage>} />
            <Route path="/payment" element={<PrivatePage><Payment /></PrivatePage>} />
            <Route path="/recharge" element={<PrivatePage><Recharge /></PrivatePage>} />
            <Route path="/bills" element={<PrivatePage><BillPay /></PrivatePage>} />
            <Route path="/financial" element={<PrivatePage><Financial /></PrivatePage>} />
            <Route path="/history" element={<PrivatePage><History /></PrivatePage>} />
            <Route path="/notifications" element={<PrivatePage><Notifications /></PrivatePage>} />
            <Route path="/rewards" element={<PrivatePage><Rewards /></PrivatePage>} />
            <Route path="/profile" element={<PrivatePage><Profile /></PrivatePage>} />
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
