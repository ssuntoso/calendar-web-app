import { Outlet, Link } from "react-router-dom";
import { Cookies } from 'react-cookie';
import logo from '../images/Animoca_Brands_Logo.png';

const cookies = new Cookies();

const Layout = () => {
  const handleLogout = () => {
    cookies.remove('auth');
    window.location.reload();
  };

  return (
    <>
      <nav className="bg-white text-[#12acec] drop-shadow-md font-bold text-right py-2 px-5 flex justify-between items-center">
        <div>
          <img src={logo} alt="Logo" className="h-12 inline-block" />
        </div>
        <div>
          {
          cookies.get('auth') ?
            <button className="border-white" onClick={handleLogout}>Logout</button>
            :
            <Link className="border-white" to="/login">Login</Link>
          }
        </div>
      </nav>
      <Outlet />
    </>
  )
};

export default Layout;