import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-base-100" data-theme="corporate">
      <nav className="navbar bg-base-300 shadow-lg">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">📄 Receiptly</Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><Link to="/">Upload</Link></li>
            <li><Link to="/receipts">Receipts</Link></li>
          </ul>
          
          {/* User Menu */}
          {user && (
            <div className="dropdown dropdown-end ml-4">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
                <li className="menu-title">
                  <span>{user.name}</span>
                  <span className="text-xs text-base-content/60">{user.email}</span>
                </li>
                <li><button onClick={handleLogout}>Logout</button></li>
              </ul>
            </div>
          )}
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;