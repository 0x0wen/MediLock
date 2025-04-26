import { ChevronLeft, Home, Menu } from 'lucide-react'
import { Link, useMatches, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserPDA } from '@/utils';
import { web3 } from '@coral-xyz/anchor';

const Sidebar = () => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [hasAccount, setHasAccount] = useState(false);
    const matches = useMatches();
    const currentRoute = matches.length > 0 ? matches[matches.length - 1].pathname : '';
    const {connected, publicKey} = useWallet();
    const toggleSidebar = () => {
      setSidebarCollapsed(prev => !prev);
    };
    
    useEffect(() => {
      if (connected && publicKey) {
        const checkUser = async () => {
          const userPDA = getUserPDA(publicKey);
          if(userPDA) {
              setHasAccount(true);
              navigate({ to: '/dashboard' });
          } else {
              setHasAccount(false);
              navigate({ to: '/register' });
          }
        };
        checkUser();
      }
    }, [connected, publicKey, navigate]);

    if(!connected || !publicKey || !hasAccount) return null;

  return (
    <div className={`${sidebarCollapsed ? 'w-[60px]' : 'w-[232px]'} transition-all duration-300 border-r border-[#e6e7ec] bg-white`}>
          <div className="p-4 border-b border-[#e6e7ec]">
            <div className="flex items-center gap-2 text-[#1a81cd] cursor-pointer justify-between" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium"><ChevronLeft/></span>}
            </div>
          </div>

          <nav className="p-2 space-y-1">
            <Link to="/dashboard" className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#f5f5f5] ${currentRoute === '/dashboard' ? 'bg-[#e8f4fc] text-[#1a81cd]' : 'text-[#5a5a5a]'}`}>
              <Home className="h-5 w-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
            </Link>
            <Link to="/add-record" className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#f5f5f5] ${currentRoute === '/add-record' ? 'bg-[#e8f4fc] text-[#1a81cd]' : 'text-[#5a5a5a]'}`}>
              <div className="h-5 w-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4.375V15.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.375 10H15.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {!sidebarCollapsed && <span className="text-sm font-medium">Create Record</span>}
            </Link>
            <Link to="/access" className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#f5f5f5] ${currentRoute === '/access' ? 'bg-[#e8f4fc] text-[#1a81cd]' : 'text-[#5a5a5a]'}`}>
              <div className="h-5 w-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.75 11.875C10.8211 11.875 12.5 10.1961 12.5 8.125C12.5 6.05393 10.8211 4.375 8.75 4.375C6.67893 4.375 5 6.05393 5 8.125C5 10.1961 6.67893 11.875 8.75 11.875Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 15.625C15 13.8991 12.2713 12.5 8.75 12.5C5.22875 12.5 2.5 13.8991 2.5 15.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 8.125H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.25 6.875V9.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {!sidebarCollapsed && <span className="text-sm font-medium">Access</span>}
            </Link>
          </nav>
        </div>
  )
}

export default Sidebar;