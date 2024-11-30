import { Outlet, Link } from "react-router-dom";
import { Cookies } from 'react-cookie';

const cookies = new Cookies();

const Layout = () => {
  const handleLogout = () => {
    cookies.remove('auth');
    window.location.reload();
  };

  return (
    <>
      <nav className="bg-[#12acec] text-white font-bold text-right p-5">
        {
        cookies.get('auth') ?
          <button className="border-white text-right" onClick={handleLogout}>Logout</button>
          :
          <Link className="border-white text-right" to="/login">Login</Link>
        }
      </nav>

      <Outlet />
    </>
  )
};

export default Layout;