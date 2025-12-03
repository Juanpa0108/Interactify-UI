import { Routes, Route } from "react-router-dom";


import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Meeting from "./pages/Meeting/Meeting";
import CreateMeeting from "./pages/Meeting/CreateMeeting";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EditProfile from "./pages/EditProfile";
import Navbar from "./components/Navbar/Navbar";
import RequireAuth from "./components/RequireAuth";
import Footer from "./components/Footer/Footer";
import Recovery from "./pages/Recovery/recovery";
import ResetPassword from "./pages/resetPassword/resetPassword";

const App: React.FC = () => {
  /**
   * Application layout and routing.
   *
   * Notes:
   * - `Home` and `About` are public routes and should be visible even
   *   when the user is not authenticated.
   * - Routes that modify or access protected resources (create meeting,
   *   join meeting, edit profile) are wrapped with `RequireAuth` which
   *   redirects unauthenticated users to `/login`.
   * - A skip link (`#main-content`) is included for keyboard accessibility.
   */
  return (
    <div className="app-container">
      {/* Accessibility skip link: allows keyboard users to jump to main content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      {/* Main region receives focus from the skip link */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />

          {/* Protected routes - require a logged-in Firebase user */}
          <Route
            path="/create"
            element={
              <RequireAuth>
                <CreateMeeting />
              </RequireAuth>
            }
          />

          <Route
            path="/meeting/:id"
            element={
              <RequireAuth>
                <Meeting />
              </RequireAuth>
            }
          />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/edit-profile"
            element={
              <RequireAuth>
                <EditProfile />
              </RequireAuth>
            }
          />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/resetPassword" element={<ResetPassword />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
