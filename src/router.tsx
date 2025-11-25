import { useRoutes } from "react-router-dom";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import CreateMeeting from "./pages/Meeting/CreateMeeting";
import Meeting from "./pages/Meeting/Meeting";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EditProfile from "./pages/EditProfile";


const AppRoutes = () => {
  return useRoutes([
    { path: "/", element: <Home /> },
    { path: "/about", element: <About /> },
    { path: "/create", element: <CreateMeeting /> },
    { path: "/meeting/:id", element: <Meeting /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/edit-profile", element: <EditProfile />} ,
  ]);
};

export default AppRoutes;

        