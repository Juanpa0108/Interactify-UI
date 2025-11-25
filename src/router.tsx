import { useRoutes } from "react-router-dom";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import CreateMeeting from "./pages/Meeting/CreateMeeting";
import Meeting from "./pages/Meeting/Meeting";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EditProfile from "./pages/EditProfile";
import Chat from "./components/Chat/Chat";


const AppRoutes = () => {
  return useRoutes([
    { path: "/", element: <Home /> },
    { path: "/about", element: <About /> },
    { path: "/create", element: <CreateMeeting /> },
    { path: "/meeting/:id", element: <RequireAuth><Meeting /></RequireAuth> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/edit-profile", element: <EditProfile />} ,
    { path: "/chat", element: <Chat /> },
  ]);
};

export default AppRoutes;

        