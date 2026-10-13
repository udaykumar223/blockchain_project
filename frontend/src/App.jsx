import { useState, useEffect } from 'react';
import { useToast, useBlockchainStatus } from './hooks/useApp';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import RegisterProperty from './pages/RegisterProperty';
import TransferOwnership from './pages/TransferOwnership';
import VerifyDocument from './pages/VerifyDocument';
import OwnershipHistory from './pages/OwnershipHistory';
import Transactions from './pages/Transactions';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { toasts, addToast, removeToast } = useToast();
  const { status: blockchainStatus, contractAddress, check: checkBlockchain } = useBlockchainStatus();

  useEffect(() => {
    checkBlockchain();
    const interval = setInterval(checkBlockchain, 10000);
    return () => clearInterval(interval);
  }, [checkBlockchain]);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    const props = { addToast, navigateTo };
    switch (currentPage) {
      case 'home':         return <HomePage {...props} />;
      case 'dashboard':    return <Dashboard {...props} />;
      case 'register':     return <RegisterProperty {...props} />;
      case 'transfer':     return <TransferOwnership {...props} />;
      case 'verify':       return <VerifyDocument {...props} />;
      case 'history':      return <OwnershipHistory {...props} />;
      case 'transactions': return <Transactions {...props} />;
      default:             return <HomePage {...props} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentPage={currentPage}
        navigateTo={navigateTo}
        blockchainStatus={blockchainStatus}
        contractAddress={contractAddress}
      />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer navigateTo={navigateTo} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
